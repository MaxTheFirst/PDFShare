import crypto from 'crypto';
import { TelegramAuthData, verifyTelegramAuth, clearNonces } from '../telegramAuth';

const MOCK_BOT_TOKEN = 'test_bot_token_123';

describe('verifyTelegramAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TELEGRAM_BOT_TOKEN: MOCK_BOT_TOKEN };

    clearNonces();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function generateValidAuthData(dataToCheck: Omit<TelegramAuthData, 'hash'>): TelegramAuthData {
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map((key) => `${key}=${(dataToCheck as any)[key]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(MOCK_BOT_TOKEN).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return { ...dataToCheck, hash };
  }

  describe('validation', () => {
    it('should throw error if TELEGRAM_BOT_TOKEN is not set', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const authData = {
        id: '123',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'somehash',
      };
      expect(() => verifyTelegramAuth(authData as any)).toThrow('TELEGRAM_BOT_TOKEN не установлен');
    });

    it('should return false if id is missing', () => {
      const authData = {
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'somehash',
      };
      expect(verifyTelegramAuth(authData as any)).toBe(false);
    });

    it('should return false if hash is missing', () => {
      const authData = {
        id: '123',
        auth_date: Math.floor(Date.now() / 1000),
      };
      expect(verifyTelegramAuth(authData as any)).toBe(false);
    });

    it('should return false if auth_date is not a number', () => {
      const authData = {
        id: '123',
        auth_date: 'invalid' as any,
        hash: 'somehash',
      };
      expect(verifyTelegramAuth(authData)).toBe(false);
    });

    it('should return false if auth_date is not an integer', () => {
      const authData = {
        id: '123',
        auth_date: 123.456,
        hash: 'somehash',
      };
      expect(verifyTelegramAuth(authData)).toBe(false);
    });

    it('should return false if auth_date is negative', () => {
      const authData = {
        id: '123',
        auth_date: -100,
        hash: 'somehash',
      };
      expect(verifyTelegramAuth(authData)).toBe(false);
    });
  });

  describe('replay protection', () => {
    it('should reject duplicate authentication attempts with same nonce', () => {
      const authDate = Math.floor(Date.now() / 1000) - 10;
      const authData = generateValidAuthData({
        id: '123456',
        username: 'johndoe',
        auth_date: authDate,
      });

      const firstResult = verifyTelegramAuth(authData);
      expect(firstResult).toBe(true);

      const secondResult = verifyTelegramAuth(authData);
      expect(secondResult).toBe(false);
    });

    it('should allow authentication with different user id', () => {
      const authDate = Math.floor(Date.now() / 1000) - 10;
      
      const authData1 = generateValidAuthData({
        id: '111',
        username: 'user1',
        auth_date: authDate,
      });
      
      const authData2 = generateValidAuthData({
        id: '222',
        username: 'user2',
        auth_date: authDate,
      });

      expect(verifyTelegramAuth(authData1)).toBe(true);
      expect(verifyTelegramAuth(authData2)).toBe(true);
    });

    it('should allow authentication with same user id but different timestamp', () => {
      const authDate1 = Math.floor(Date.now() / 1000) - 20;
      const authDate2 = Math.floor(Date.now() / 1000) - 10;
      
      const authData1 = generateValidAuthData({
        id: '123',
        username: 'user1',
        auth_date: authDate1,
      });
      
      const authData2 = generateValidAuthData({
        id: '123',
        username: 'user1',
        auth_date: authDate2,
      });

      expect(verifyTelegramAuth(authData1)).toBe(true);
      expect(verifyTelegramAuth(authData2)).toBe(true);
    });
  });
});
