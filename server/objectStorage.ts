import "dotenv/config";
import { Client as MinioClient } from "minio";
import { Response } from "express";

const BUCKET_NAME: string = process.env.MINIO_BUCKET || "uploads";

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
    const fileName = `${fileId}.pdf`
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
  }

  async getObjectEntityFile(objectName: string): Promise<MinioFile> {
    const file = new MinioFile(`${objectName}.pdf`);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();

    return file;
  }

  async deletFile(objectName: string) {
    try {
      await minio.removeObject(BUCKET_NAME, objectName);
      console.log(`Deleted object: ${objectName}`);
    } catch (err) {
      console.error("Error deleting object:", err);
    }
  }
}

export const objectStorageService = new ObjectStorageService();