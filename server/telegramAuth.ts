import crypto from "crypto";

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const usedNonces = new Map<string, number>();

function cleanupExpiredNonces() {
  const now = Date.now() / 1000;
  usedNonces.forEach((timestamp, nonce) => {
    if (now - timestamp > 300) {
      usedNonces.delete(nonce);
    }
  });
}

setInterval(cleanupExpiredNonces, 60000);

export function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN не установлен");
  }

  if (!authData.id || !authData.hash || typeof authData.auth_date !== 'number') {
    return false;
  }

  const authTimestamp = Number(authData.auth_date);
  if (!Number.isInteger(authTimestamp) || authTimestamp <= 0) {
    return false;
  }

  const authDate = new Date(authTimestamp * 1000);
  const now = new Date();
  const timeDiff = (now.getTime() - authDate.getTime()) / 1000;

  if (timeDiff > 300 || timeDiff < 0) {
    return false;
  }

  const nonce = `${authData.id}:${authTimestamp}`;
  if (usedNonces.has(nonce)) {
    return false;
  }

  const { hash, ...dataToCheck } = authData;

  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const isValid = hmac === hash;
  
  if (isValid) {
    usedNonces.set(nonce, authData.auth_date);
  }

  return isValid;
}

export function clearNonces() {
  usedNonces.clear();
}