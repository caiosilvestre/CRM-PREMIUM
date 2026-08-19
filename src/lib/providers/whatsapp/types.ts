// Abstraction over the WhatsApp provider so the initial choice (Z-API) can be
// swapped later (Meta Cloud API, 360dialog, etc.) without touching the rest
// of the app. Only this interface and its implementation under ./zapi.ts
// should know about the provider's wire format.

export interface OutboundWhatsAppMessage {
  to: string; // E.164 phone number
  text: string;
}

export interface InboundWhatsAppMessage {
  from: string; // E.164 phone number
  text: string;
  externalId: string;
  receivedAt: string; // ISO timestamp
}

export interface WhatsAppProvider {
  /** Sends a text message to a customer. */
  sendMessage(message: OutboundWhatsAppMessage): Promise<{ externalId: string }>;

  /** Parses a provider-specific webhook payload into a normalized inbound message. */
  parseWebhookPayload(payload: unknown): InboundWhatsAppMessage | null;

  /** Verifies the webhook request is authentically from the provider. */
  verifyWebhookSignature(request: Request, rawBody: string): boolean;
}
