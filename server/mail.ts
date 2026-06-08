import { lookup } from "dns/promises";
import { isIP } from "net";
import tls from "tls";

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type SmtpResponse = {
  code: number;
  message: string;
};

type ConnectionTarget = {
  address: string;
  family: number;
  servername: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} не настроен`);
  }

  return value;
}

function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

function getNumberEnv(name: string, defaultValue: number): number {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function getPreferredFamilies(): number[] {
  const value = process.env.MAIL_FAMILY?.trim();

  if (!value) {
    return [4, 6];
  }

  const families = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((family): family is number => family === 4 || family === 6);

  return families.length > 0 ? families : [4, 6];
}

function encodeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) {
    return value;
  }

  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string): string {
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return encoded.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function formatFromAddress(): string {
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
  const fromName = process.env.MAIL_FROM_NAME || "PDFShare";

  if (!fromAddress) {
    throw new Error("MAIL_FROM_ADDRESS или MAIL_USERNAME не настроен");
  }

  return `${encodeHeader(fromName)} <${fromAddress}>`;
}

function getAppBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }

  if (process.env.DOMAIN) {
    return `https://${process.env.DOMAIN}`;
  }

  return `http://localhost:${process.env.PORT || "5000"}`;
}

function buildMessage(options: MailOptions): string {
  const boundary = `pdfshare-${Date.now()}`;
  const date = new Date().toUTCString();
  const from = formatFromAddress();
  const htmlBody = wrapBase64(options.html);
  const textBody = wrapBase64(options.text);

  return [
    `From: ${from}`,
    `To: <${options.to}>`,
    `Subject: ${encodeHeader(options.subject)}`,
    "MIME-Version: 1.0",
    `Date: ${date}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(16).slice(2)}@pdfshare>`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textBody,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    htmlBody,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function escapeData(value: string): string {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function debugLog(message: string) {
  if (getBooleanEnv("MAIL_DEBUG", false)) {
    console.log(`[mail] ${message}`);
  }
}

async function resolveConnectionTargets(host: string): Promise<ConnectionTarget[]> {
  if (isIP(host)) {
    return [
      {
        address: host,
        family: isIP(host),
        servername: host,
      },
    ];
  }

  const records = await lookup(host, { all: true });
  const preferredFamilies = getPreferredFamilies();
  const uniqueTargets = new Map<string, ConnectionTarget>();

  for (const record of records) {
    const key = `${record.address}|${record.family}`;
    if (!uniqueTargets.has(key)) {
      uniqueTargets.set(key, {
        address: record.address,
        family: record.family,
        servername: host,
      });
    }
  }

  return Array.from(uniqueTargets.values()).sort((left, right) => {
    const leftPriority = preferredFamilies.indexOf(left.family);
    const rightPriority = preferredFamilies.indexOf(right.family);

    return leftPriority - rightPriority;
  });
}

async function sendMailUsingTarget(
  target: ConnectionTarget,
  port: number,
  username: string,
  password: string,
  fromAddress: string,
  timeout: number,
  writeTimeout: number,
  options: MailOptions,
  connectionTimeout: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = tls.connect({
      host: target.address,
      port,
      servername: target.servername,
      rejectUnauthorized: true,
    });
    const connectionTimer = setTimeout(() => {
      fail(
        new Error(
          `SMTP соединение с ${target.address}:${port} (IPv${target.family}) превысило таймаут ${connectionTimeout}мс`
        )
      );
    }, connectionTimeout);
    let buffer = "";
    let currentCode: string | null = null;
    let currentLines: string[] = [];
    const responses: SmtpResponse[] = [];
    const waiters: Array<{
      resolve: (response: SmtpResponse) => void;
      reject: (error: Error) => void;
    }> = [];

    const fail = (error: Error) => {
      clearTimeout(connectionTimer);
      while (waiters.length > 0) {
        waiters.shift()?.reject(error);
      }
      socket.destroy();
      reject(error);
    };

    const deliverResponse = (response: SmtpResponse) => {
      debugLog(`S: ${response.message}`);

      const waiter = waiters.shift();
      if (waiter) {
        waiter.resolve(response);
      } else {
        responses.push(response);
      }
    };

    const finishResponse = () => {
      if (!currentCode || currentLines.length === 0) {
        return;
      }

      const response = {
        code: Number(currentCode),
        message: currentLines.join("\n"),
      };

      currentCode = null;
      currentLines = [];
      deliverResponse(response);
    };

    const nextResponse = () =>
      new Promise<SmtpResponse>((resolveResponse, rejectResponse) => {
        const response = responses.shift();
        if (response) {
          resolveResponse(response);
          return;
        }

        waiters.push({ resolve: resolveResponse, reject: rejectResponse });
      });

    const sendLine = async (line: string, expectedCodes: number[]) => {
      debugLog(`C: ${line}`);
      socket.write(`${line}\r\n`);
      const response = await nextResponse();

      if (!expectedCodes.includes(response.code)) {
        throw new Error(`SMTP ошибка: ${response.message}`);
      }

      return response;
    };

    const sendData = async (message: string) => {
      socket.write(`${escapeData(message)}\r\n.\r\n`);
      const response = await nextResponse();

      if (response.code !== 250) {
        throw new Error(`SMTP ошибка: ${response.message}`);
      }
    };

    socket.setEncoding("utf8");
    socket.setTimeout(timeout, () => {
      fail(new Error("SMTP соединение превысило таймаут"));
    });

    socket.on("data", (chunk: string) => {
      buffer += chunk;

      while (true) {
        const lineBreakIndex = buffer.indexOf("\r\n");
        if (lineBreakIndex === -1) {
          return;
        }

        const line = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 2);

        if (!currentCode) {
          if (!/^\d{3}[- ]/.test(line)) {
            continue;
          }

          currentCode = line.slice(0, 3);
          currentLines = [line];

          if (line[3] === " ") {
            finishResponse();
          }

          continue;
        }

        currentLines.push(line);

        if (line.startsWith(currentCode) && line[3] === " ") {
          finishResponse();
        }
      }
    });

    socket.on("error", (error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

    socket.on("close", (hadError) => {
      clearTimeout(connectionTimer);
      if (!hadError && waiters.length > 0) {
        fail(new Error("SMTP соединение было закрыто"));
      }
    });

    socket.once("secureConnect", async () => {
      try {
        clearTimeout(connectionTimer);
        debugLog(`Connected to ${target.address}:${port} (IPv${target.family})`);

        const greeting = await nextResponse();
        if (greeting.code !== 220) {
          throw new Error(`SMTP ошибка: ${greeting.message}`);
        }

        await sendLine("EHLO pdfshare", [250]);
        await sendLine("AUTH LOGIN", [334]);
        await sendLine(Buffer.from(username, "utf8").toString("base64"), [334]);
        await sendLine(Buffer.from(password, "utf8").toString("base64"), [235]);
        await sendLine(`MAIL FROM:<${fromAddress}>`, [250]);
        await sendLine(`RCPT TO:<${options.to}>`, [250, 251]);
        await sendLine("DATA", [354]);

        socket.setTimeout(writeTimeout);
        await sendData(buildMessage(options));
        socket.setTimeout(timeout);

        await sendLine("QUIT", [221]);
        socket.end();
        resolve();
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD);
}

export async function sendMail(options: MailOptions): Promise<void> {
  const host = getRequiredEnv("MAIL_HOST");
  const port = getNumberEnv("MAIL_PORT", 465);
  const username = getRequiredEnv("MAIL_USERNAME");
  const password = getRequiredEnv("MAIL_PASSWORD");
  const secure = getBooleanEnv("MAIL_SECURE", port === 465);
  const connectionTimeout = getNumberEnv("MAIL_CONNECTION_TIMEOUT", 5000);
  const timeout = getNumberEnv("MAIL_TIMEOUT", 5000);
  const writeTimeout = getNumberEnv("MAIL_WRITE_TIMEOUT", 5000);
  const fromAddress = process.env.MAIL_FROM_ADDRESS || username;

  if (!secure) {
    throw new Error("Поддерживается только SMTP по SSL/TLS");
  }

  const targets = await resolveConnectionTargets(host);
  const errors: string[] = [];

  for (const target of targets) {
    try {
      await sendMailUsingTarget(
        target,
        port,
        username,
        password,
        fromAddress,
        timeout,
        writeTimeout,
        options,
        connectionTimeout
      );
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${target.address} (IPv${target.family}): ${message}`);
      debugLog(`Connection attempt failed: ${message}`);
    }
  }

  throw new Error(
    `Не удалось подключиться к SMTP серверу ${host}:${port}. ` +
      `Проверены адреса: ${errors.join("; ")}. ` +
      `Если локально всё работает, на сервере обычно виноваты блокировка исходящего SMTP-трафика или проблемы с IPv6.`
  );
}

export async function sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
  const verificationUrl = `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

  const subject = "Подтвердите почту в PDFShare";
  const text = [
    `Здравствуйте, ${username}!`,
    "",
    "Спасибо за регистрацию в PDFShare.",
    "Чтобы активировать аккаунт, перейдите по ссылке:",
    verificationUrl,
    "",
    "Ссылка действует 24 часа.",
  ].join("\n");

  const html = [
    `<p>Здравствуйте, <strong>${username}</strong>!</p>`,
    "<p>Спасибо за регистрацию в PDFShare.</p>",
    `<p><a href="${verificationUrl}">Подтвердить email и войти</a></p>`,
    "<p>Ссылка действует 24 часа.</p>",
  ].join("");

  await sendMail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, username: string): Promise<void> {
  const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Сброс пароля в PDFShare";
  const text = [
    `Здравствуйте, ${username}!`,
    "",
    "Мы получили запрос на сброс пароля в PDFShare.",
    "Чтобы задать новый пароль, перейдите по ссылке:",
    resetUrl,
    "",
    "Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.",
  ].join("\n");

  const html = [
    `<p>Здравствуйте, <strong>${username}</strong>!</p>`,
    "<p>Мы получили запрос на сброс пароля в PDFShare.</p>",
    `<p><a href="${resetUrl}">Задать новый пароль</a></p>`,
    "<p>Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>",
  ].join("");

  await sendMail({
    to: email,
    subject,
    text,
    html,
  });
}
