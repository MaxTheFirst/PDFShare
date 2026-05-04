import { storage } from "./storage";

const MAX_USERNAME_LENGTH = 32;

function sanitizeUsernamePart(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.slice(0, MAX_USERNAME_LENGTH);
}

export async function buildUniqueUsername(preferredUsername: string, fallbackSeed: string): Promise<string> {
  const fallbackBase = sanitizeUsernamePart(fallbackSeed) || "user";
  const base = sanitizeUsernamePart(preferredUsername) || fallbackBase;

  let candidate = base;
  let suffix = 1;

  while (await storage.getUserByUsername(candidate)) {
    const suffixValue = `_${suffix}`;
    candidate = `${base.slice(0, MAX_USERNAME_LENGTH - suffixValue.length)}${suffixValue}`;
    suffix += 1;
  }

  return candidate;
}
