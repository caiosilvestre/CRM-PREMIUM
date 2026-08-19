import type { InboundWhatsAppMessage, OutboundWhatsAppMessage, WhatsAppProvider } from "./types";

// Concrete WhatsAppProvider backed by UAZAPI (uazapi.dev) — each customer
// gets a dedicated instance subdomain (e.g. https://crmpremium.uazapi.com).
// Wire format below was confirmed empirically against the live instance
// (docs.uazapi.com is a client-rendered SPA that couldn't be scraped):
//   - auth: `token: <instance token>` header on regular endpoints
//   - POST /send/text  { number, text }  ->  { messageid, chatid, status, ... }
//   - GET/POST /webhook  { action, url, events, enabled }
// The exact webhook delivery envelope (raw message object vs. wrapped) could
// not be captured live without routing real WhatsApp data through a
// third-party inspection service, so parseWebhookPayload checks a few
// plausible shapes defensively and logs unrecognized payloads for follow-up.

export interface UazApiConfig {
  baseUrl?: string;
  token?: string;
  webhookSecret?: string;
}

interface UazApiMessage {
  chatid?: string;
  text?: string;
  content?: { text?: string };
  fromMe?: boolean;
  isGroup?: boolean;
  messageid?: string;
  messageTimestamp?: number;
  sender?: string;
}

function extractMessage(payload: Record<string, unknown>): UazApiMessage | null {
  if (typeof payload.messageid === "string" || typeof payload.chatid === "string") {
    return payload as UazApiMessage;
  }
  for (const key of ["message", "data", "body"]) {
    const nested = payload[key];
    if (nested && typeof nested === "object") {
      const candidate = nested as Record<string, unknown>;
      if (typeof candidate.messageid === "string" || typeof candidate.chatid === "string") {
        return candidate as UazApiMessage;
      }
    }
  }
  return null;
}

export class UazApiProvider implements WhatsAppProvider {
  constructor(private readonly config: UazApiConfig) {}

  async sendMessage({ to, text }: OutboundWhatsAppMessage): Promise<{ externalId: string }> {
    const { baseUrl, token } = this.config;
    if (!baseUrl || !token) {
      throw new Error("UAZAPI não configurado — preencha UAZAPI_BASE_URL e UAZAPI_TOKEN no .env.local.");
    }

    const response = await fetch(`${baseUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify({ number: to, text }),
    });

    const data = (await response.json().catch(() => null)) as { messageid?: string; error?: string } | null;

    if (!response.ok || !data || data.error) {
      throw new Error(`Falha ao enviar mensagem via UAZAPI: ${data?.error ?? `HTTP ${response.status}`}`);
    }
    if (!data.messageid) throw new Error("UAZAPI não retornou um messageid para a mensagem enviada.");
    return { externalId: data.messageid };
  }

  parseWebhookPayload(payload: unknown): InboundWhatsAppMessage | null {
    if (!payload || typeof payload !== "object") return null;
    const message = extractMessage(payload as Record<string, unknown>);
    if (!message) {
      console.warn("UAZAPI webhook: unrecognized payload shape", JSON.stringify(payload).slice(0, 500));
      return null;
    }

    if (message.fromMe === true) return null; // sent from the connected number itself
    if (message.isGroup === true) return null; // group chats aren't customer conversations

    const text = message.text ?? message.content?.text;
    if (typeof text !== "string" || !text.trim()) return null; // non-text message — unsupported for now

    const phone = message.chatid?.split("@")[0] ?? message.sender?.split("@")[0];
    if (!phone || typeof message.messageid !== "string") return null;

    return {
      from: phone,
      text,
      externalId: message.messageid,
      receivedAt:
        typeof message.messageTimestamp === "number"
          ? new Date(message.messageTimestamp).toISOString()
          : new Date().toISOString(),
    };
  }

  verifyWebhookSignature(request: Request): boolean {
    const expected = this.config.webhookSecret;
    if (!expected) return false;
    const segments = new URL(request.url).pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] === expected;
  }

  /** UAZAPI-specific: registers our webhook URL directly via its API (no manual dashboard step needed). */
  async configureWebhook(url: string): Promise<void> {
    const { baseUrl, token } = this.config;
    if (!baseUrl || !token) {
      throw new Error("UAZAPI não configurado — preencha UAZAPI_BASE_URL e UAZAPI_TOKEN no .env.local.");
    }
    const response = await fetch(`${baseUrl}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ action: "update", url, events: ["messages"], enabled: true }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Falha ao configurar o webhook na UAZAPI (HTTP ${response.status}): ${body}`);
    }
  }
}
