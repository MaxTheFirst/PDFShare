import "dotenv/config";
import { Client as MinioClient } from "minio";
import { Response } from "express";
import { pool } from "./db";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_LABEL } from "@shared/uploadLimits";

const BUCKET_NAME: string = process.env.MINIO_BUCKET || "uploads";
const STORAGE_LIMIT_BYTES = 10_000_000_000;

export class StorageQuotaExceededError extends Error {
  constructor() {
    super("Хранилище заполнено: лимит 10 ГБ");
    this.name = "StorageQuotaExceededError";
  }
}

export class FileTooLargeError extends Error {
  constructor() {
    super(`Размер файла не должен превышать ${MAX_UPLOAD_SIZE_LABEL}`);
    this.name = "FileTooLargeError";
  }
}

export const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || "minio",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export async function createMinioBucket() {
  try {
    const exists = await minio.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minio.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`Bucket created: ${BUCKET_NAME}`);
    }
  } catch (err) {
    console.error("Error ensuring bucket exists:", err);
    throw err;
  }
}

async function getBucketUsage(replacedObjectName: string): Promise<{ totalBytes: number; replacedBytes: number }> {
  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    let replacedBytes = 0;
    const stream = minio.listObjectsV2(BUCKET_NAME, "", true);

    stream.on("data", (object) => {
      const size = object.size ?? 0;
      totalBytes += size;
      if (object.name === replacedObjectName) replacedBytes = size;
    });
    stream.on("error", reject);
    stream.on("end", () => resolve({ totalBytes, replacedBytes }));
  });
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

class MinioFile {
  constructor(public objectName: string) {}

  async exists(): Promise<[boolean]> {
    try {
      await minio.statObject(BUCKET_NAME, this.objectName);
      return [true];
    } catch (_) {
      return [false];
    }
  }

  async getMetadata(): Promise<[any]> {
    const stat = await minio.statObject(BUCKET_NAME, this.objectName);
    return [
      {
        contentType: stat.metaData?.["content-type"] || "application/octet-stream",
        size: stat.size,
      },
    ];
  }

  createReadStream() {
    return minio.getObject(BUCKET_NAME, this.objectName);
  }
}

export class ObjectStorageService {
  async downloadObject(
    objectName: string,
    res: Response
  ) {
    try {
      const file = await this.getObjectEntityFile(objectName);
      const [metadata] = await file.getMetadata();

      res.set({
        "Content-Type": metadata.contentType,
        "Content-Length": metadata.size
      });

      const stream = await file.createReadStream();

      stream.on("error", (err: any) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async uploadPdfFile(fileBuffer: Buffer, fileId: string) {
    if (fileBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
      throw new FileTooLargeError();
    }
    const fileName = `${fileId}.pdf`;
    const connection = await pool.connect();
    let locked = false;

    try {
      // Serialize uploads across app instances so concurrent requests cannot pass the limit together.
      await connection.query("SELECT pg_advisory_lock(50186, 10)");
      locked = true;

      const { totalBytes, replacedBytes } = await getBucketUsage(fileName);
      if (totalBytes - replacedBytes + fileBuffer.length > STORAGE_LIMIT_BYTES) {
        throw new StorageQuotaExceededError();
      }

      try {
        await minio.putObject(
          BUCKET_NAME,
          fileName,
          fileBuffer,
          fileBuffer.length,
          {
            'Content-Type': 'application/pdf',
            'original-filename': fileName,
            'uploaded-at': new Date().toISOString(),
          }
        );
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "XMinioAdminBucketQuotaExceeded") {
          throw new StorageQuotaExceededError();
        }
        throw error;
      }
    } finally {
      try {
        if (locked) await connection.query("SELECT pg_advisory_unlock(50186, 10)");
      } catch (error) {
        connection.release(error as Error);
        throw error;
      }
      connection.release();
    }
  }

  async getObjectEntityFile(objectName: string): Promise<MinioFile> {
    const file = new MinioFile(`${objectName}.pdf`);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();

    return file;
  }

  async deleteFile(fileId: string) {
    await minio.removeObject(BUCKET_NAME, `${fileId}.pdf`);
  }
}

export const objectStorageService = new ObjectStorageService();
