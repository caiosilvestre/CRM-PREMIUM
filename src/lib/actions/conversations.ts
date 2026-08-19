"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import { getWhatsAppProvider } from "@/lib/providers/whatsapp";

export async function sendHumanMessageAction(conversationId: string, texto: string) {
  const profile = await getCurrentProfile();
  const trimmed = texto.trim();
  if (!profile || !trimmed) return;

  const conversation = await store.getConversationWithLead(conversationId);
  if (conversation?.lead.contato_telefone) {
    const provider = getWhatsAppProvider();
    await provider.sendMessage({ to: conversation.lead.contato_telefone, text: trimmed });
  }

  await store.sendHumanMessage(conversationId, trimmed, profile.id);
  revalidatePath("/atendimento");
}

export async function takeOverConversationAction(conversationId: string) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  await store.setConversationMode(conversationId, "humano", profile.id);
  revalidatePath("/atendimento");
}

export async function returnToAIAction(conversationId: string) {
  const profile = await getCurrentProfile();
  await store.setConversationMode(conversationId, "ia", profile?.id ?? null);
  revalidatePath("/atendimento");
}
