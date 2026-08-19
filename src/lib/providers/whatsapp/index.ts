import { UazApiProvider } from "./uazapi";
import type { WhatsAppProvider } from "./types";

function config() {
  return {
    baseUrl: process.env.UAZAPI_BASE_URL,
    token: process.env.UAZAPI_TOKEN,
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
  };
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return new UazApiProvider(config());
}

/** UAZAPI-specific: registers the app's webhook URL directly via the provider's API. */
export async function configureWhatsAppWebhook(url: string): Promise<void> {
  await new UazApiProvider(config()).configureWebhook(url);
}

export { UazApiProvider } from "./uazapi";
export type { WhatsAppProvider, InboundWhatsAppMessage, OutboundWhatsAppMessage } from "./types";
