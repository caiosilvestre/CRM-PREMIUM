import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ConversationRow, LeadRow } from "@/lib/types/database";

// Webhook-side data access — runs outside any user session (Z-API calls this
// with no Supabase auth cookie), so every function here uses the service-role
// client and bypasses RLS. Keep this file's surface small and only ever wire
// it from src/app/api/webhooks/**, never from user-facing actions.

export async function findOrCreateLeadByPhone(phone: string, senderName?: string): Promise<LeadRow> {
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from("leads").select("*").eq("contato_telefone", phone).maybeSingle();
  if (existing) return existing as unknown as LeadRow;

  const { data, error } = await supabase
    .from("leads")
    .insert({ nome: senderName ?? phone, contato_telefone: phone, origem: "whatsapp" })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as LeadRow;
}

export async function findOrCreateConversation(leadId: string): Promise<ConversationRow> {
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from("conversations").select("*").eq("lead_id", leadId).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ lead_id: leadId, canal: "whatsapp" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertInboundMessage(conversationId: string, texto: string, criadoEm: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, remetente: "cliente", texto, criado_em: criadoEm });
  if (error) throw error;
  await supabase.from("conversations").update({ ultima_mensagem_em: criadoEm }).eq("id", conversationId);
}
