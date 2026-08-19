import { NextResponse } from "next/server";
import { getWhatsAppProvider } from "@/lib/providers/whatsapp";
import { findOrCreateLeadByPhone, findOrCreateConversation, insertInboundMessage } from "@/lib/data/webhook-store";

// Z-API "on-message-received" webhook. Configure this URL — including the
// secret path segment — in the Z-API dashboard: Webhooks > Ao receber.
// The secret must match ZAPI_WEBHOOK_SECRET in .env.local; there is no
// documented signature header from Z-API, so the URL itself is the auth.

export async function POST(request: Request) {
  const provider = getWhatsAppProvider();

  if (!provider.verifyWebhookSignature(request, "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const inbound = payload ? provider.parseWebhookPayload(payload) : null;
  if (!inbound) {
    // Not a plain inbound text message (e.g. group chat, media, delivery
    // status) — acknowledge so Z-API doesn't retry, nothing else to do.
    return NextResponse.json({ ok: true });
  }

  const lead = await findOrCreateLeadByPhone(inbound.from);
  const conversation = await findOrCreateConversation(lead.id);
  await insertInboundMessage(conversation.id, inbound.text, inbound.receivedAt);

  return NextResponse.json({ ok: true });
}
