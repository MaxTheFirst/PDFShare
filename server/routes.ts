import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { storage } from "./storage";
import {
  objectStorageService,
} from "./objectStorage";
import { sendNotificationToSubscribers } from "./telegramBot";
import { insertFolderSchema, File as FileObject } from "@shared/schema";
import { verifyTelegramAuth } from "./telegramAuth";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 512 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Только PDF файлы разрешены'));
    }
  }
});

function isAuthenticated(req: any, res: any, next: any) {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Не авторизован" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        pool: db.$client as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.userId = undefined;
      return res.json({ user: null });
    }

    res.json({ user });
  });

  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const isValid = verifyTelegramAuth(req.body);
      
      if (!isValid) {
        return res.status(401).json({ error: "Недействительные данные авторизации" });
      }

      const { id: telegramId, username, first_name: firstName, last_name: lastName } = req.body;

      let user = await storage.getUserByTelegramId(telegramId);

      if (!user) {
        user = await storage.createUser({
          telegramId,
          username: username || `user_${telegramId}`,
          firstName,
          lastName,
        });

        await storage.ensureRecentFolder(user.id);
      }

      req.session.userId = user.id;

      res.json({ user });
    } catch (error) {
      console.error("Ошибка Telegram авторизации:", error);
      res.status(500).json({ error: "Ошибка авторизации" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Ошибка выхода" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/telegram-login/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: "Токен не предоставлен" });
      }

      const user = await storage.validateLoginToken(token);

      if (!user) {
        return res.status(401).json({ error: "Недействительный или истёкший токен" });
      }

      req.session.userId = user.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ user, success: true });
    } catch (error) {
      console.error("Ошибка авторизации по токену:", error);
      res.status(500).json({ error: "Ошибка авторизации" });
    }
  });

  if (process.env.NODE_ENV === "development" && process.env.ENABLE_TEST_LOGIN === "true") {
    app.post("/api/auth/test-login", async (req, res) => {
      const { telegramId, username, firstName } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ error: "telegramId обязателен" });
      }

      let user = await storage.getUserByTelegramId(telegramId);

      if (!user) {
        user = await storage.createUser({
          telegramId,
          username: username || `id${telegramId}`,
          firstName: firstName || "Test",
          lastName: "User",
        });

        await storage.ensureRecentFolder(user.id);
      }

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ user, sessionId: req.sessionID });
    });

    app.post("/api/auth/test-create-token", async (req, res) => {
      const { userId, expiresInMinutes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId обязателен" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const loginToken = await storage.createLoginToken(userId, expiresInMinutes || 5);
      res.json({ token: loginToken.token, expiresAt: loginToken.expiresAt });
    });
  }

  app.get("/api/folders", isAuthenticated, async (req, res) => {
    const folders = await storage.getFoldersByUserId(req.session.userId!);
    res.json(folders);
  });

  app.get("/api/folders/:id", isAuthenticated, async (req, res) => {
    const folder = await storage.getFolderByIdWithFiles(req.params.id);

    if (!folder) {
      return res.status(404).json({ error: "Папка не найдена" });
    }

    if (folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    res.json(folder);
  });

  app.post("/api/folders", isAuthenticated, async (req, res) => {
    const validation = insertFolderSchema.safeParse({
      ...req.body,
      ownerId: req.session.userId,
    });

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.message });
    }

    const folder = await storage.createFolder(validation.data);
    res.json(folder);
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req, res) => {
    const folder = await storage.getFolderById(req.params.id);

    if (!folder) {
      return res.status(404).json({ error: "Папка не найдена" });
    }

    if (folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    if (folder.isRecent) {
      return res.status(400).json({ error: 'Нельзя удалить папку "Недавние"' });
    }

    await storage.deleteFolder(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/folders/:id/share", isAuthenticated, async (req, res) => {
    const folder = await storage.getFolderByIdWithFiles(req.params.id);

    if (!folder) {
      return res.status(404).json({ error: "Папка не найдена" });
    }

    if (folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const shareToken = await storage.getFolderShareToken(req.params.id);

    res.json({ shareToken });
  });

  app.get("/api/shared/folder/:token", async (req, res) => {
    const folder = await storage.getFolderByShareToken(req.params.token);

    if (!folder) {
      return res.status(404).json({ error: "Папка не найдена" });
    }

    res.json(folder);
  });

  app.get("/api/folders/:folderId/files/check", isAuthenticated, async (req, res) => {
    const { folderId } = req.params;
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: "Имя файла обязательно" });
    }

    const folder = await storage.getFolderById(folderId);
    if (!folder) {
      return res.status(404).json({ error: "Папка не найдена" });
    }

    if (folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const exists = await storage.checkFileExistsByName(folderId, name);
    res.json({ exists });
  });

  app.post("/api/folders/:folderId/files", isAuthenticated, upload.single('file'), async (req, res) => {
    const { folderId } = req.params;
    const { name } = req.body;

    const folder = await storage.getFolderById(folderId);
    if (!name || !folder || folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const file = req.file;

    if (!file || file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        error: "Только PDF файлы разрешены" 
      });
    }

    try {
      const existingFile = await storage.getFileByName(folderId, name);
      let fileObject: FileObject;
      if (existingFile) {
        fileObject = await storage.updateFile(existingFile.id, {
          version: existingFile.version + 1,
          size: file.size,
        });
      } else {
        fileObject = await storage.createFile({
          name,
          folderId,
          ownerId: req.session.userId!,
          size: file.size
        });
      }

      await objectStorageService.uploadPdfFile(file.buffer, fileObject.id);

      if (existingFile) {
        sendNotificationToSubscribers(
          fileObject.id,
          folderId,
          `🔄 Файл "${name}" обновлён!\n\nНовая версия: ${fileObject.version}`
        );
      } else {
        sendNotificationToSubscribers(
          fileObject.id,
          folderId,
          `📄 Новый файл "${name}" добавлен в папку "${folder.name}"!`
        );
      }
      res.json(file);
    } catch (error) {
      console.error("Ошибка создания файла:", error);
      res.status(500).json({ error: "Ошибка создания файла" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    const file = await storage.getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "Файл не найден" });
    }

    await objectStorageService.downloadObject(file.id, res)
  });

  app.get("/api/files/:id/metadata", async (req, res) => {
    const file = await storage.getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "Файл не найден" });
    }

    res.json(file);
  });

  app.delete("/api/files/:id", async (req, res) => {
    const file = await storage.getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "Файл не найден" });
    }

    const folder = await storage.getFolderById(file.folderId);
    if (!folder || folder.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    await objectStorageService.deletFile(file.id)
    await storage.deleteFile(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    const subscriptions = await storage.getSubscriptionsByUserId(req.session.userId!);
    res.json(subscriptions);
  });

  app.post("/api/subscriptions", isAuthenticated, async (req, res) => {
    const { fileId, folderId } = req.body;

    if (!fileId && !folderId) {
      return res.status(400).json({ error: "fileId или folderId обязателен" });
    }

    const existing = await storage.checkSubscription(
      req.session.userId!,
      fileId,
      folderId
    );

    if (existing) {
      return res.status(400).json({ error: "Подписка уже существует" });
    }

    const subscription = await storage.createSubscription({
      userId: req.session.userId!,
      fileId: fileId || null,
      folderId: folderId || null,
    });

    res.json(subscription);
  });

  app.delete("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    await storage.deleteSubscription(req.params.id);
    res.json({ success: true });
  });

  const httpServer = createServer(app);

  return httpServer;
}
