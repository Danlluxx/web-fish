import net from "node:net";
import tls from "node:tls";
import { randomUUID } from "node:crypto";

interface SmtpAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

interface SmtpMailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  attachments?: SmtpAttachment[];
}

export interface SmtpClientConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  ehloHostname?: string;
  useStartTls?: boolean;
}

interface SmtpResponse {
  code: number;
  message: string;
}

function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function wrapBase64(value: Buffer | string): string {
  const encoded = Buffer.isBuffer(value) ? value.toString("base64") : Buffer.from(value, "utf-8").toString("base64");
  return encoded.replace(/.{1,76}/g, "$&\r\n").trim();
}

function normalizeMessageBody(value: string): string {
  return value.replace(/\r?\n/g, "\r\n");
}

function buildMimeMessage(payload: SmtpMailPayload): string {
  const boundary = `----=_AquaMarket_${randomUUID()}`;
  const headers = [
    `From: ${payload.from}`,
    `To: ${payload.to.join(", ")}`,
    `Subject: ${encodeMimeHeader(payload.subject)}`,
    "MIME-Version: 1.0",
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@aquamarket.local>`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ];

  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(normalizeMessageBody(payload.text))
  ];

  for (const attachment of payload.attachments ?? []) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      wrapBase64(attachment.content)
    );
  }

  parts.push(`--${boundary}--`, "");

  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`;
}

class SmtpConnection {
  private socket: net.Socket | tls.TLSSocket;
  private readonly readyResponses: SmtpResponse[] = [];
  private readonly pendingResponses: Array<{
    resolve: (response: SmtpResponse) => void;
    reject: (error: Error) => void;
  }> = [];
  private readonly currentLines: string[] = [];
  private buffer = "";
  private terminalError: Error | null = null;

  constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    this.attach(socket);
  }

  private readonly handleData = (chunk: Buffer | string) => {
    this.buffer += typeof chunk === "string" ? chunk : chunk.toString("utf-8");

    while (this.buffer.includes("\n")) {
      const newlineIndex = this.buffer.indexOf("\n");
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, "");
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length === 0) {
        continue;
      }

      this.currentLines.push(line);
      const match = line.match(/^(\d{3})([ -])/);

      if (match && match[2] === " ") {
        const response: SmtpResponse = {
          code: Number(match[1]),
          message: this.currentLines.join("\n")
        };

        this.currentLines.length = 0;
        const nextWaiter = this.pendingResponses.shift();

        if (nextWaiter) {
          nextWaiter.resolve(response);
        } else {
          this.readyResponses.push(response);
        }
      }
    }
  };

  private readonly handleError = (error: Error) => {
    this.terminalError = error;

    while (this.pendingResponses.length > 0) {
      this.pendingResponses.shift()?.reject(error);
    }
  };

  private readonly handleClose = () => {
    const error = this.terminalError ?? new Error("SMTP connection closed unexpectedly.");
    this.terminalError = error;

    while (this.pendingResponses.length > 0) {
      this.pendingResponses.shift()?.reject(error);
    }
  };

  private attach(socket: net.Socket | tls.TLSSocket) {
    socket.setEncoding("utf-8");
    socket.on("data", this.handleData);
    socket.on("error", this.handleError);
    socket.on("close", this.handleClose);
  }

  private detach() {
    this.socket.off("data", this.handleData);
    this.socket.off("error", this.handleError);
    this.socket.off("close", this.handleClose);
  }

  async nextResponse(): Promise<SmtpResponse> {
    if (this.readyResponses.length > 0) {
      return this.readyResponses.shift() as SmtpResponse;
    }

    if (this.terminalError) {
      throw this.terminalError;
    }

    return new Promise<SmtpResponse>((resolve, reject) => {
      this.pendingResponses.push({ resolve, reject });
    });
  }

  async send(command: string, expectedCodes: number[]): Promise<SmtpResponse> {
    await new Promise<void>((resolve, reject) => {
      this.socket.write(`${command}\r\n`, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const response = await this.nextResponse();

    if (!expectedCodes.includes(response.code)) {
      throw new Error(`SMTP command "${command}" failed: ${response.message}`);
    }

    return response;
  }

  async sendData(message: string): Promise<void> {
    const dataResponse = await this.send("DATA", [354]);
    if (dataResponse.code !== 354) {
      throw new Error(`SMTP DATA rejected: ${dataResponse.message}`);
    }

    const normalized = normalizeMessageBody(message).replace(/^\./gm, "..");

    await new Promise<void>((resolve, reject) => {
      this.socket.write(`${normalized}\r\n.\r\n`, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const response = await this.nextResponse();

    if (response.code !== 250) {
      throw new Error(`SMTP server rejected message body: ${response.message}`);
    }
  }

  async upgradeToTls(host: string): Promise<void> {
    const currentSocket = this.socket;
    this.detach();

    this.socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const secureSocket = tls.connect(
        {
          socket: currentSocket,
          servername: host
        },
        () => resolve(secureSocket)
      );

      secureSocket.once("error", reject);
    });

    this.attach(this.socket);
  }

  async quit(): Promise<void> {
    try {
      await this.send("QUIT", [221]);
    } finally {
      this.detach();
      this.socket.end();
      this.socket.destroy();
    }
  }
}

async function connectSmtp(config: SmtpClientConfig): Promise<SmtpConnection> {
  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port });
  const connection = new SmtpConnection(socket);

  await new Promise<void>((resolve, reject) => {
    const successEvent = config.secure ? "secureConnect" : "connect";

    socket.once(successEvent, () => resolve());
    socket.once("error", reject);
  });
  const greeting = await connection.nextResponse();

  if (greeting.code !== 220) {
    throw new Error(`SMTP greeting rejected: ${greeting.message}`);
  }

  return connection;
}

export async function sendSmtpMail(config: SmtpClientConfig, payload: SmtpMailPayload): Promise<void> {
  const connection = await connectSmtp(config);
  const ehloHostname = config.ehloHostname?.trim() || "localhost";

  try {
    let ehloResponse = await connection.send(`EHLO ${ehloHostname}`, [250]);

    if (!config.secure && config.useStartTls !== false && ehloResponse.message.includes("STARTTLS")) {
      await connection.send("STARTTLS", [220]);
      await connection.upgradeToTls(config.host);
      ehloResponse = await connection.send(`EHLO ${ehloHostname}`, [250]);
    }

    if (config.user && config.pass) {
      await connection.send("AUTH LOGIN", [334]);
      await connection.send(Buffer.from(config.user, "utf-8").toString("base64"), [334]);
      await connection.send(Buffer.from(config.pass, "utf-8").toString("base64"), [235]);
    }

    const fromMatch = payload.from.match(/<([^>]+)>/);
    const fromAddress = fromMatch ? fromMatch[1] : payload.from;
    await connection.send(`MAIL FROM:<${fromAddress}>`, [250]);

    for (const recipient of payload.to) {
      await connection.send(`RCPT TO:<${recipient}>`, [250, 251]);
    }

    await connection.sendData(buildMimeMessage(payload));
    await connection.quit();
  } catch (error) {
    try {
      await connection.quit();
    } catch {
      // ignore secondary close errors
    }

    throw error;
  }
}
