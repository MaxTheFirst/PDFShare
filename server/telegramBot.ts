import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";
import { buildUniqueUsername } from "./usernames";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN не установлен. Telegram бот не будет работать.");
}

export const bot = BOT_TOKEN
  ? new TelegramBot(BOT_TOKEN, {
      polling: {
        autoStart: false,
        interval: 300,
        params: {
          timeout: 10,
        }
      },
    })
  : null;

let isTelegramBotStarted = false;
let areTelegramBotHandlersRegistered = false;

export async function setupTelegramLongPolling() {
  if (!bot || !BOT_TOKEN) {
    console.warn("Telegram бот не инициализирован из-за отсутствия токена");
    return;
  }

  if (isTelegramBotStarted) {
    return;
  }

  try {
    await bot.deleteWebHook();
    console.log("✅ Telegram webhook удален");
  } catch (error) {
    console.error("❌ Ошибка удаления Telegram webhook:", error);
  }

  if (!areTelegramBotHandlersRegistered) {
    bot.on("polling_error", (error) => {
      console.error("❌ Ошибка Telegram long-polling:", error);
    });

    bot.on("message", async (msg) => {
      console.log("💬 Получено сообщение от пользователя:", {
        chatId: msg.chat.id,
        from: msg.from,
        text: msg.text
      });
      
      const text = msg.text;

      if (!text) {
        console.log("⚠️ Сообщение без текста, игнорируем");
        return;
      }

      if (text.startsWith("/start")) {
        console.log("🚀 Обработка команды /start");
        await handleStart(msg);
      } else if (text === "/subscriptions") {
        console.log("📋 Обработка команды /subscriptions");
        await handleSubscriptions(msg);
      } else if (text === "/help") {
        console.log("❓ Обработка команды /help");
        await handleHelp(msg);
      } else {
        console.log("⚠️ Неизвестная команда:", text);
      }
    });

    areTelegramBotHandlersRegistered = true;
  }

  await bot.startPolling({
    restart: true,
  });

  isTelegramBotStarted = true;
  console.log("✅ Telegram бот успешно запущен (long-polling режим)");
}

async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId || !bot) {
    await bot?.sendMessage(chatId, "❌ Не удалось получить ваш Telegram ID");
    return;
  }

  let user = await storage.getUserByTelegramId(telegramId);
  
  if (!user) {
    const uniqueUsername = await buildUniqueUsername(
      msg.from?.username || `user_${telegramId}`,
      `user_${telegramId}`
    );

    user = await storage.createUser({
      telegramId,
      username: uniqueUsername,
      email: null,
      firstName: msg.from?.first_name,
      lastName: msg.from?.last_name,
    });
    
    await storage.ensureRecentFolder(user.id);
  }

  const loginToken = await storage.createLoginToken(user.id, 5);
  
  const domain = process.env.DOMAIN;
  const baseUrl = `https://${domain}`;
  const loginUrl = `${baseUrl}/auth/telegram-login?token=${loginToken.token}`;

  if (!user.createdAt || Date.now() - new Date(user.createdAt).getTime() < 60000) {
    await bot.sendMessage(
      chatId,
      `👋 Добро пожаловать в PDFShare!\n\n` +
      `Вы успешно зарегистрированы.\n\n` +
      `Теперь вы можете:\n` +
      `📂 Загружать и организовывать PDF файлы\n` +
      `🔗 Делиться файлами и папками по ссылкам\n` +
      `🔔 Подписываться на обновления файлов\n\n` +
      `Нажмите кнопку ниже для входа в веб-приложение.\n` +
      `⏱ Ссылка действительна 5 минут.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔐 Войти', url: loginUrl }
            ]
          ]
        }
      }
    );
  } else {
    await bot.sendMessage(
      chatId,
      `👋 С возвращением, ${user.firstName || user.username}!\n\n` +
      `Нажмите кнопку ниже для входа в веб-приложение.\n` +
      `⏱ Ссылка действительна 5 минут.\n\n` +
      `Доступные команды:\n` +
      `/subscriptions - Управление подписками\n` +
      `/help - Справка`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔐 Войти', url: loginUrl }
            ]
          ]
        }
      }
    );
  }
}

async function handleSubscriptions(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId || !bot) {
    await bot?.sendMessage(chatId, "❌ Ошибка авторизации");
    return;
  }

  const user = await storage.getUserByTelegramId(telegramId);
  if (!user) {
    await bot.sendMessage(
      chatId,
      "❌ Вы не зарегистрированы. Используйте /start для регистрации."
    );
    return;
  }

  const subscriptions = await storage.getSubscriptionsByUserId(user.id);

  if (subscriptions.length === 0) {
    await bot.sendMessage(
      chatId,
      "📭 У вас пока нет активных подписок.\n\n" +
      "Подпишитесь на файлы или папки на сайте, чтобы получать уведомления об обновлениях."
    );
    return;
  }

  let message = "📬 Ваши подписки:\n\n";
  
  for (const sub of subscriptions) {
    if (sub.fileId) {
      const file = await storage.getFileById(sub.fileId);
      if (file) {
        message += `📄 Файл: ${file.name}\n`;
      }
    } else if (sub.folderId) {
      const folder = await storage.getFolderById(sub.folderId);
      if (folder) {
        message += `📂 Папка: ${folder.name}\n`;
      }
    }
  }

  message += `\nДля управления подписками используйте веб-интерфейс.`;

  await bot.sendMessage(chatId, message);
}

async function handleHelp(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  
  if (!bot) return;

  await bot.sendMessage(
    chatId,
    `📚 Справка PDFShare\n\n` +
    `Доступные команды:\n` +
    `/start - Регистрация и авторизация\n` +
    `/subscriptions - Просмотр ваших подписок\n` +
    `/help - Эта справка\n\n` +
    `PDFShare - это сервис для хранения и обмена PDF файлами.\n\n` +
    `Основные возможности:\n` +
    `📂 Организация файлов в папках\n` +
    `🔗 Публичные ссылки для обмена\n` +
    `🔔 Уведомления об обновлениях\n` +
    `📱 Telegram интеграция\n\n` +
    `Используйте веб-интерфейс для полного доступа ко всем функциям.`
  );
}

export async function sendNotificationToSubscribers(
  fileId: string | null,
  folderId: string | null,
  message: string
) {
  if (!bot) {
    console.warn("Telegram бот недоступен для отправки уведомлений");
    return;
  }
  const domain = process.env.DOMAIN;
  const baseUrl = `https://${domain}`;
  const fileUrl = `${baseUrl}/shared/file/${fileId}`;

  const messageData = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Файл', url: fileUrl }
        ]
      ]
    }
  };

  try {
    const fileSubscriptions = fileId 
      ? await storage.getSubscriptionsByFileId(fileId) 
      : [];
    const folderSubscriptions = folderId 
      ? await storage.getSubscriptionsByFolderId(folderId) 
      : [];

    const subscriptions = Array.from(new Set([
      ...fileSubscriptions,
      ...folderSubscriptions
    ]));

    for (const sub of subscriptions) {
      const user = await storage.getUser(sub.userId);
      if (user?.telegramId) {
        try {
          await bot.sendMessage(user.telegramId, message, messageData);
        } catch (error) {
          console.error(`Ошибка отправки уведомления пользователю ${user.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Ошибка отправки уведомлений:", error);
  }
}
