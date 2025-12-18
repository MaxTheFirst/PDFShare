import {
  users,
  folders,
  files,
  subscriptions,
  loginTokens,
  type User,
  type InsertUser,
  type Folder,
  type InsertFolder,
  type File,
  type InsertFile,
  type Subscription,
  type InsertSubscription,
  type LoginToken,
  type FolderWithFiles,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Folders
  getFoldersByUserId(userId: string): Promise<Folder[]>;
  getFolderById(id: string): Promise<Folder | undefined>;
  getFolderByIdWithFiles(id: string): Promise<FolderWithFiles | undefined>;
  getFolderByShareToken(token: string): Promise<FolderWithFiles | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  ensureRecentFolder(userId: string): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;
  getFolderShareToken(id: string): Promise<string>;

  // Files
  getFileById(id: string): Promise<File | undefined>;
  getFilesByFolderId(folderId: string): Promise<File[]>;
  getFileByName(folderId: string, name: string): Promise<File | undefined>;
  checkFileExistsByName(folderId: string, name: string): Promise<boolean>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, updates: Partial<File>): Promise<File>;
  deleteFile(id: string): Promise<void>;
  getFileShareToken(id: string): Promise<string>;

  // Subscriptions
  getSubscriptionsByUserId(userId: string): Promise<Subscription[]>;
  getSubscriptionsByFileId(fileId: string): Promise<Subscription[]>;
  getSubscriptionsByFolderId(folderId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  deleteSubscription(id: string): Promise<void>;
  checkSubscription(userId: string, fileId?: string, folderId?: string): Promise<Subscription | undefined>;

  // Login Tokens
  createLoginToken(userId: string, expiresInMinutes?: number): Promise<LoginToken>;
  validateLoginToken(token: string): Promise<User | null>;
  markLoginTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Folders
  async getFoldersByUserId(userId: string): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(eq(folders.ownerId, userId))
      .orderBy(desc(folders.createdAt));
  }

  async getFolderById(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFolderByIdWithFiles(id: string): Promise<FolderWithFiles | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    if (!folder) return undefined;

    const folderFiles = await db
      .select()
      .from(files)
      .where(eq(files.folderId, id))
      .orderBy(desc(files.createdAt));

    return { ...folder, files: folderFiles };
  }

  async getFolderByShareToken(token: string): Promise<FolderWithFiles | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.shareToken, token));
    if (!folder) return undefined;

    const folderFiles = await db
      .select()
      .from(files)
      .where(eq(files.folderId, folder.id))
      .orderBy(desc(files.createdAt));

    return { ...folder, files: folderFiles };
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db.insert(folders).values(insertFolder).returning();
    return folder;
  }

  async ensureRecentFolder(userId: string): Promise<Folder> {
    const [existing] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.ownerId, userId), eq(folders.isRecent, true)));

    if (existing) return existing;

    const [newFolder] = await db
      .insert(folders)
      .values({
        name: "Недавние",
        ownerId: userId,
        isRecent: true,
      })
      .returning();

    return newFolder;
  }

  async deleteFolder(id: string): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  async getFolderShareToken(id: string): Promise<string> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));

    if (!folder) {
      throw new Error(`Folder with id ${id} not found`);
    }

    if (folder.shareToken) {
      return folder.shareToken;
    }

    const token = randomUUID();

    await db
      .update(folders)
      .set({ shareToken: token })
      .where(eq(folders.id, id));

    return token;
  }

  // Files
  async getFileById(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByFolderId(folderId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(desc(files.createdAt));
  }

  async getFileByName(folderId: string, name: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.folderId, folderId), eq(files.name, name)));
    return file || undefined;
  }

  async checkFileExistsByName(folderId: string, name: string): Promise<boolean> {
    const file = await this.getFileByName(folderId, name);
    return !!file;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const token = randomUUID();
    const fileData = {
      ...insertFile,
      shareToken: token,
    };
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File> {
    const [file] = await db
      .update(files)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async getFileShareToken(id: string): Promise<string> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));

    if (!file) throw new Error(`File with id ${id} not found`);
    return file.shareToken;
  }

  // Subscriptions
  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  }

  async getSubscriptionsByFileId(fileId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.fileId, fileId));
  }

  async getSubscriptionsByFolderId(folderId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.folderId, folderId));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async deleteSubscription(id: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }

  async checkSubscription(
    userId: string,
    fileId?: string,
    folderId?: string
  ): Promise<Subscription | undefined> {
    if (!fileId && !folderId) {
      return undefined;
    }
    
    if (fileId && folderId) {
      throw new Error("Only one of fileId or folderId should be provided");
    }
    
    if (fileId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(eq(subscriptions.userId, userId), eq(subscriptions.fileId, fileId))
        );
      return sub || undefined;
    }
    if (folderId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.folderId, folderId)
          )
        );
      return sub || undefined;
    }
    return undefined;
  }

  // Login Tokens
  async createLoginToken(userId: string, expiresInMinutes: number = 5): Promise<LoginToken> {
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const [loginToken] = await db
      .insert(loginTokens)
      .values({
        token,
        userId,
        expiresAt,
      })
      .returning();
    
    return loginToken;
  }

  async validateLoginToken(token: string): Promise<User | null> {
    const updatedTokens = await db
      .update(loginTokens)
      .set({ used: true })
      .where(
        and(
          eq(loginTokens.token, token),
          eq(loginTokens.used, false),
          gt(loginTokens.expiresAt, new Date())
        )
      )
      .returning();

    if (updatedTokens.length === 0) {
      return null;
    }

    const [updatedToken] = updatedTokens;
    const user = await this.getUser(updatedToken.userId);
    return user || null;
  }

  async markLoginTokenAsUsed(token: string): Promise<void> {
    await db
      .update(loginTokens)
      .set({ used: true })
      .where(eq(loginTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(loginTokens)
      .where(lt(loginTokens.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
