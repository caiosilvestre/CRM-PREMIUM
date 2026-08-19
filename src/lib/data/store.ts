import { createClient } from "@/lib/supabase/server";
import type {
  Json,
  ProfileRow,
  LeadRow,
  ConversationRow,
  MessageRow,
  TemplateRow,
  TemplateType,
  PricingRuleRow,
  QuoteRow,
  QuoteItem,
  ContractRow,
  ApprovalRow,
  FollowupRow,
  ActivityLogRow,
  FinanceSyncLogRow,
  FunnelStage,
  ApprovalStatus,
  ConversationMode,
  FollowupStatus,
  CustomFieldEntity,
  CustomFieldOption,
  CustomFieldDefinitionRow,
  CustomFieldValues,
} from "@/lib/types/database";

// Supabase-backed data layer (Fase 5 of TASKS.md) — replaces the in-memory
// mock store that used to live at src/lib/mock/store.ts. Every function opens
// its own request-scoped server client (via @/lib/supabase/server), so reads
// and writes run as the signed-in user and are subject to the RLS policies in
// supabase/migrations/0002_rls_policies.sql.

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("nome");
  if (error) throw error;
  return data;
}

export async function getProfileById(id: string | null): Promise<ProfileRow | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateProfilePermissions(
  id: string,
  input: { limite_aprovacao_orcamento: number; pode_aprovar_contrato: boolean },
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      limite_aprovacao_orcamento: input.limite_aprovacao_orcamento,
      pode_aprovar_contrato: input.pode_aprovar_contrato,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data as unknown as LeadRow[];
}

export async function getLeadById(id: string): Promise<LeadRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  return data as unknown as LeadRow | null;
}

export async function createLead(input: {
  nome: string;
  empresa: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  origem: LeadRow["origem"];
  valor_estimado: number | null;
  responsavel_id: string | null;
  camposCustomizados?: CustomFieldValues;
}): Promise<LeadRow> {
  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      nome: input.nome,
      empresa: input.empresa,
      contato_telefone: input.contato_telefone,
      contato_email: input.contato_email,
      origem: input.origem,
      valor_estimado: input.valor_estimado,
      responsavel_id: input.responsavel_id,
      campos_customizados: (input.camposCustomizados ?? {}) as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(null, "Lead criado manualmente", "lead", lead.id);
  return lead as unknown as LeadRow;
}

export async function updateLead(
  leadId: string,
  input: {
    nome: string;
    empresa: string | null;
    contato_telefone: string | null;
    contato_email: string | null;
    origem: LeadRow["origem"];
    valor_estimado: number | null;
    camposCustomizados?: CustomFieldValues;
  },
  autorId: string | null,
): Promise<LeadRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({
      nome: input.nome,
      empresa: input.empresa,
      contato_telefone: input.contato_telefone,
      contato_email: input.contato_email,
      origem: input.origem,
      valor_estimado: input.valor_estimado,
      ...(input.camposCustomizados ? { campos_customizados: input.camposCustomizados as unknown as Json } : {}),
    })
    .eq("id", leadId)
    .select()
    .single();
  if (error) throw error;
  await logActivity(autorId, "Informações do lead editadas", "lead", leadId);
  return data as unknown as LeadRow;
}

export async function deleteLead(leadId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) throw error;
}

export async function moveLeadStage(
  leadId: string,
  stage: FunnelStage,
  autorId: string | null,
): Promise<LeadRow | null> {
  const supabase = await createClient();
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  const anterior = lead.etapa_funil;
  const { data, error } = await supabase
    .from("leads")
    .update({ etapa_funil: stage })
    .eq("id", leadId)
    .select()
    .single();
  if (error) throw error;
  await logActivity(autorId, `Etapa alterada: ${anterior} → ${stage}`, "lead", leadId);
  return data as unknown as LeadRow;
}

export async function markLeadLost(
  leadId: string,
  motivo: string,
  detalhe: string | null,
  autorId: string | null,
): Promise<LeadRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ etapa_funil: "perdido", motivo_perda: motivo, motivo_perda_detalhe: detalhe })
    .eq("id", leadId)
    .select()
    .single();
  if (error) throw error;
  await logActivity(autorId, `Lead marcado como perdido: ${motivo}`, "lead", leadId);
  return data as unknown as LeadRow;
}

// ---------------------------------------------------------------------------
// Conversations & messages
// ---------------------------------------------------------------------------

export interface ConversationWithMeta extends ConversationRow {
  lead: LeadRow;
  ultimaMensagem: MessageRow | null;
  aguardandoRespostaMinutos: number | null; // set only when last msg is from cliente
}

export interface ConversationFull extends ConversationWithMeta {
  messages: MessageRow[];
}

export async function getConversationsFull(): Promise<ConversationFull[]> {
  const supabase = await createClient();
  const [{ data: convs, error: convErr }, { data: leads, error: leadErr }, { data: msgs, error: msgErr }] =
    await Promise.all([
      supabase.from("conversations").select("*"),
      supabase.from("leads").select("*"),
      supabase.from("messages").select("*").order("criado_em", { ascending: true }),
    ]);
  if (convErr) throw convErr;
  if (leadErr) throw leadErr;
  if (msgErr) throw msgErr;

  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));
  const messagesByConv = new Map<string, MessageRow[]>();
  for (const m of msgs ?? []) {
    const arr = messagesByConv.get(m.conversation_id) ?? [];
    arr.push(m);
    messagesByConv.set(m.conversation_id, arr);
  }

  const result: ConversationFull[] = [];
  for (const c of convs ?? []) {
    const lead = leadById.get(c.lead_id);
    if (!lead) continue;
    const convMessages = messagesByConv.get(c.id) ?? [];
    const ultimaMensagem = convMessages[convMessages.length - 1] ?? null;
    const aguardandoRespostaMinutos =
      ultimaMensagem && ultimaMensagem.remetente === "cliente"
        ? Math.floor((Date.now() - new Date(ultimaMensagem.criado_em).getTime()) / 60000)
        : null;
    result.push({ ...c, lead, ultimaMensagem, aguardandoRespostaMinutos, messages: convMessages });
  }
  return result.sort((a, b) => (b.ultima_mensagem_em ?? "").localeCompare(a.ultima_mensagem_em ?? ""));
}

export async function getConversationsWithMeta(): Promise<ConversationWithMeta[]> {
  return getConversationsFull();
}

export async function getConversationWithLead(
  conversationId: string,
): Promise<(ConversationRow & { lead: LeadRow }) | null> {
  const supabase = await createClient();
  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  if (!conversation) return null;
  const lead = await getLeadById(conversation.lead_id);
  if (!lead) return null;
  return { ...conversation, lead };
}

export async function sendHumanMessage(conversationId: string, texto: string, autorId: string): Promise<MessageRow> {
  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, remetente: "humano", autor_id: autorId, texto })
    .select()
    .single();
  if (error) throw error;
  await supabase.from("conversations").update({ ultima_mensagem_em: message.criado_em }).eq("id", conversationId);
  return message;
}

export async function setConversationMode(
  conversationId: string,
  modo: ConversationMode,
  userId: string | null,
): Promise<ConversationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ modo, assumida_por: modo === "humano" ? userId : null })
    .eq("id", conversationId)
    .select()
    .single();
  if (error) throw error;
  await logActivity(
    userId,
    modo === "humano" ? "Conversa assumida por humano" : "Conversa devolvida para a IA",
    "conversation",
    conversationId,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Quotes & contracts — basic lookups
// ---------------------------------------------------------------------------

export async function getQuoteById(id: string): Promise<QuoteRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  return data as unknown as QuoteRow | null;
}

export async function getContractById(id: string): Promise<ContractRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  return data as unknown as ContractRow | null;
}

export async function getQuotesForLead(leadId: string): Promise<QuoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("*").eq("lead_id", leadId);
  if (error) throw error;
  return data as unknown as QuoteRow[];
}

export async function getContractsForLead(leadId: string): Promise<ContractRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contracts").select("*").eq("lead_id", leadId);
  if (error) throw error;
  return data as unknown as ContractRow[];
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export interface ApprovalWithMeta extends ApprovalRow {
  lead: LeadRow | null;
  valorTotal: number | null;
  solicitante: ProfileRow | null;
  decididoPorProfile: ProfileRow | null;
  quote: QuoteRow | null;
  contract: ContractRow | null;
}

export async function getApprovalsWithMeta(status?: ApprovalStatus): Promise<ApprovalWithMeta[]> {
  const supabase = await createClient();
  let query = supabase.from("approvals").select("*").order("criado_em", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: approvals, error } = await query;
  if (error) throw error;
  if (!approvals || approvals.length === 0) return [];

  const quoteIds = approvals.filter((a) => a.tipo === "orcamento").map((a) => a.referencia_id);
  const contractIds = approvals.filter((a) => a.tipo === "contrato").map((a) => a.referencia_id);
  const profileIds = [
    ...new Set(
      approvals.flatMap((a) => [a.solicitante_id, a.decidido_por]).filter((id): id is string => Boolean(id)),
    ),
  ];

  const [{ data: quotes }, { data: contracts }, { data: profiles }] = await Promise.all([
    quoteIds.length ? supabase.from("quotes").select("*").in("id", quoteIds) : Promise.resolve({ data: [] }),
    contractIds.length
      ? supabase.from("contracts").select("*").in("id", contractIds)
      : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from("profiles").select("*").in("id", profileIds) : Promise.resolve({ data: [] }),
  ]);

  const quoteById = new Map(((quotes ?? []) as unknown as QuoteRow[]).map((q) => [q.id, q]));
  const contractById = new Map(((contracts ?? []) as unknown as ContractRow[]).map((c) => [c.id, c]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const extraQuoteIds = [...contractById.values()]
    .map((c) => c.quote_id)
    .filter((id): id is string => id !== null && !quoteById.has(id));
  if (extraQuoteIds.length) {
    const { data: extraQuotes } = await supabase.from("quotes").select("*").in("id", extraQuoteIds);
    (extraQuotes as unknown as QuoteRow[] | null)?.forEach((q) => quoteById.set(q.id, q));
  }

  const leadIds = [
    ...new Set([...quoteById.values()].map((q) => q.lead_id).concat([...contractById.values()].map((c) => c.lead_id))),
  ];
  const { data: leads } = leadIds.length ? await supabase.from("leads").select("*").in("id", leadIds) : { data: [] };
  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));

  return approvals.map((a) => {
    const quote = a.tipo === "orcamento" ? quoteById.get(a.referencia_id) ?? null : null;
    const contract = a.tipo === "contrato" ? contractById.get(a.referencia_id) ?? null : null;
    const lead = quote ? leadById.get(quote.lead_id) ?? null : contract ? leadById.get(contract.lead_id) ?? null : null;
    const valorTotal =
      a.tipo === "orcamento" ? quote?.valor_total ?? null : contract?.quote_id ? quoteById.get(contract.quote_id)?.valor_total ?? null : null;
    return {
      ...a,
      lead,
      valorTotal,
      solicitante: a.solicitante_id ? profileById.get(a.solicitante_id) ?? null : null,
      decididoPorProfile: a.decidido_por ? profileById.get(a.decidido_por) ?? null : null,
      quote,
      contract,
    };
  });
}

export async function decideApproval(
  approvalId: string,
  decision: "aprovado" | "aprovado_com_ajuste" | "reprovado",
  motivoDecisao: string,
  decididoPor: string,
  ajusteValorTotal?: number,
): Promise<ApprovalRow | null> {
  const supabase = await createClient();
  const { data: approval } = await supabase.from("approvals").select("*").eq("id", approvalId).maybeSingle();
  if (!approval) return null;

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("approvals")
    .update({ status: decision, decidido_por: decididoPor, decidido_em: now, motivo_decisao: motivoDecisao })
    .eq("id", approvalId)
    .select()
    .single();
  if (error) throw error;

  if (approval.tipo === "orcamento") {
    const quote = await getQuoteById(approval.referencia_id);
    if (quote) {
      if (decision === "reprovado") {
        await supabase.from("quotes").update({ status: "reprovado" }).eq("id", quote.id);
      } else {
        const patch: { status: QuoteRow["status"]; valor_total?: number; versao?: number } = {
          status: decision === "aprovado_com_ajuste" ? "aprovado_com_ajuste" : "aprovado",
        };
        if (decision === "aprovado_com_ajuste" && ajusteValorTotal !== undefined) {
          patch.valor_total = ajusteValorTotal;
          patch.versao = quote.versao + 1;
        }
        await supabase.from("quotes").update(patch).eq("id", quote.id);
      }
    }
  } else {
    await supabase
      .from("contracts")
      .update({ status_assinatura: decision === "reprovado" ? "rascunho" : "aprovado" })
      .eq("id", approval.referencia_id);
  }

  await logActivity(
    decididoPor,
    `${approval.tipo === "orcamento" ? "Orçamento" : "Contrato"} ${decision.replace("_", " ")}`,
    approval.tipo,
    approval.referencia_id,
    { motivo: motivoDecisao },
  );

  return updated;
}

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export interface FollowupWithMeta extends FollowupRow {
  lead: LeadRow | null;
  responsavel: ProfileRow | null;
  statusEfetivo: FollowupStatus;
}

function effectiveFollowupStatus(f: FollowupRow): FollowupStatus {
  if (f.status === "concluido") return "concluido";
  return new Date(f.data) < new Date() ? "atrasado" : "pendente";
}

export async function getFollowupsWithMeta(): Promise<FollowupWithMeta[]> {
  const supabase = await createClient();
  const { data: followups, error } = await supabase.from("followups").select("*").order("data", { ascending: true });
  if (error) throw error;
  if (!followups || followups.length === 0) return [];

  const leadIds = [...new Set(followups.map((f) => f.lead_id))];
  const profileIds = [...new Set(followups.map((f) => f.responsavel_id).filter((id): id is string => Boolean(id)))];
  const [{ data: leads }, { data: profiles }] = await Promise.all([
    leadIds.length ? supabase.from("leads").select("*").in("id", leadIds) : Promise.resolve({ data: [] }),
    profileIds.length ? supabase.from("profiles").select("*").in("id", profileIds) : Promise.resolve({ data: [] }),
  ]);
  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return followups.map((f) => ({
    ...f,
    lead: leadById.get(f.lead_id) ?? null,
    responsavel: f.responsavel_id ? profileById.get(f.responsavel_id) ?? null : null,
    statusEfetivo: effectiveFollowupStatus(f),
  }));
}

export async function completeFollowup(id: string): Promise<FollowupRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followups")
    .update({ status: "concluido", concluido_em: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export interface ActivityLogWithAuthor extends ActivityLogRow {
  autor: ProfileRow | null;
}

export async function logActivity(
  autorId: string | null,
  acao: string,
  referenciaTipo: string | null,
  referenciaId: string | null,
  detalhe: Record<string, unknown> | null = null,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("activity_log").insert({
    autor_id: autorId,
    acao,
    referencia_tipo: referenciaTipo,
    referencia_id: referenciaId,
    detalhe: detalhe as Json | null,
  });
}

async function joinAuthors(entries: ActivityLogRow[]): Promise<ActivityLogWithAuthor[]> {
  const supabase = await createClient();
  const ids = [...new Set(entries.map((e) => e.autor_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return entries.map((e) => ({ ...e, autor: e.autor_id ? byId.get(e.autor_id) ?? null : null }));
}

export async function getRecentActivity(limit = 8): Promise<ActivityLogWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return joinAuthors((data ?? []) as ActivityLogRow[]);
}

export async function getActivityLogForLead(leadId: string): Promise<ActivityLogWithAuthor[]> {
  const supabase = await createClient();
  const [{ data: quotes }, { data: contracts }] = await Promise.all([
    supabase.from("quotes").select("id").eq("lead_id", leadId),
    supabase.from("contracts").select("id").eq("lead_id", leadId),
  ]);
  const relatedIds = [leadId, ...(quotes ?? []).map((q) => q.id), ...(contracts ?? []).map((c) => c.id)];
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .in("referencia_id", relatedIds)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return joinAuthors((data ?? []) as ActivityLogRow[]);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function getTemplates(): Promise<TemplateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("*").order("nome");
  if (error) throw error;
  return data as unknown as TemplateRow[];
}

export async function upsertTemplate(input: {
  id?: string;
  tipo: TemplateType;
  nome: string;
  conteudo: string;
  criadoPor: string | null;
  camposCustomizados?: CustomFieldValues;
}): Promise<TemplateRow> {
  const supabase = await createClient();
  if (input.id) {
    const { data: existing } = await supabase.from("templates").select("versao").eq("id", input.id).maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("templates")
        .update({
          nome: input.nome,
          conteudo: input.conteudo,
          versao: existing.versao + 1,
          ...(input.camposCustomizados ? { campos_customizados: input.camposCustomizados as unknown as Json } : {}),
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TemplateRow;
    }
  }
  const { data, error } = await supabase
    .from("templates")
    .insert({
      tipo: input.tipo,
      nome: input.nome,
      conteudo: input.conteudo,
      criado_por: input.criadoPor,
      campos_customizados: (input.camposCustomizados ?? {}) as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TemplateRow;
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("templates").delete().eq("id", id);
}

// ---------------------------------------------------------------------------
// Pricing rules
// ---------------------------------------------------------------------------

export async function getPricingRules(): Promise<PricingRuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_rules").select("*").order("servico");
  if (error) throw error;
  return data;
}

export async function savePricingRules(rules: PricingRuleRow[]): Promise<void> {
  const supabase = await createClient();
  const toInsert = rules.filter((r) => r.id.startsWith("new-"));
  const toUpdate = rules.filter((r) => !r.id.startsWith("new-"));

  await Promise.all([
    ...toUpdate.map((r) =>
      supabase
        .from("pricing_rules")
        .update({ servico: r.servico, unidade: r.unidade, preco: r.preco, ativo: r.ativo })
        .eq("id", r.id),
    ),
    toInsert.length
      ? supabase
          .from("pricing_rules")
          .insert(toInsert.map((r) => ({ servico: r.servico, unidade: r.unidade, preco: r.preco, ativo: r.ativo })))
      : Promise.resolve(),
  ]);

  const keepIds = new Set(toUpdate.map((r) => r.id));
  const { data: existing } = await supabase.from("pricing_rules").select("id");
  const idsToDelete = (existing ?? []).map((e) => e.id).filter((id) => !keepIds.has(id));
  if (idsToDelete.length) {
    await supabase.from("pricing_rules").delete().in("id", idsToDelete);
  }
}

// ---------------------------------------------------------------------------
// Finance sync log
// ---------------------------------------------------------------------------

export interface FinanceSyncLogWithDetails extends FinanceSyncLogRow {
  lead: LeadRow | null;
}

export async function getFinanceSyncLogWithDetails(): Promise<FinanceSyncLogWithDetails[]> {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("finance_sync_log")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  if (!entries || entries.length === 0) return [];

  const contractIds = [...new Set(entries.map((e) => e.contract_id))];
  const { data: contracts } = await supabase.from("contracts").select("*").in("id", contractIds);
  const leadIds = [...new Set((contracts ?? []).map((c) => c.lead_id))];
  const { data: leads } = leadIds.length ? await supabase.from("leads").select("*").in("id", leadIds) : { data: [] };
  const contractById = new Map(((contracts ?? []) as unknown as ContractRow[]).map((c) => [c.id, c]));
  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));

  return (entries as FinanceSyncLogRow[]).map((e) => {
    const contract = contractById.get(e.contract_id);
    return { ...e, lead: contract ? leadById.get(contract.lead_id) ?? null : null };
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSetting(chave: string): Promise<unknown> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("valor").eq("chave", chave).maybeSingle();
  return data?.valor ?? null;
}

export async function setSetting(chave: string, valor: unknown): Promise<void> {
  const supabase = await createClient();
  await supabase.from("settings").upsert({ chave, valor: valor as Json });
}

// ---------------------------------------------------------------------------
// Quotes (extra mutators — creation/edit/submission for the Orçamento screen)
// ---------------------------------------------------------------------------

export interface QuoteWithLead extends QuoteRow {
  lead: LeadRow | null;
}

export async function getQuotes(): Promise<QuoteWithLead[]> {
  const supabase = await createClient();
  const { data: quotes, error } = await supabase.from("quotes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  if (!quotes || quotes.length === 0) return [];
  const leadIds = [...new Set(quotes.map((q) => q.lead_id))];
  const { data: leads } = await supabase.from("leads").select("*").in("id", leadIds);
  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));
  return (quotes as unknown as QuoteRow[]).map((q) => ({ ...q, lead: leadById.get(q.lead_id) ?? null }));
}

function sumItens(itens: QuoteItem[]): number {
  return itens.reduce((sum, i) => sum + i.valor_total, 0);
}

export async function createQuoteDraft(input: {
  leadId: string;
  itens: QuoteItem[];
  condicoes: string;
  criadoPor: string | null;
  camposCustomizados?: CustomFieldValues;
}): Promise<QuoteRow> {
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      lead_id: input.leadId,
      itens: input.itens as unknown as Json,
      condicoes: input.condicoes,
      valor_total: sumItens(input.itens),
      status: "rascunho",
      criado_por: input.criadoPor,
      campos_customizados: (input.camposCustomizados ?? {}) as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;

  const lead = await getLeadById(input.leadId);
  if (lead && (lead.etapa_funil === "novo_lead" || lead.etapa_funil === "qualificacao")) {
    await moveLeadStage(input.leadId, "orcamento_em_elaboracao", input.criadoPor);
  }
  await logActivity(input.criadoPor, "Orçamento criado", "orcamento", quote.id);
  return quote as unknown as QuoteRow;
}

export async function updateQuoteDraft(quoteId: string, itens: QuoteItem[], condicoes: string): Promise<QuoteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .update({ itens: itens as unknown as Json, condicoes, valor_total: sumItens(itens) })
    .eq("id", quoteId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as QuoteRow;
}

export async function submitQuoteForApproval(
  quoteId: string,
  motivo: string,
  solicitanteId: string,
): Promise<ApprovalRow | null> {
  const supabase = await createClient();
  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .update({ status: "aguardando_aprovacao" })
    .eq("id", quoteId)
    .select()
    .single();
  if (qErr) throw qErr;
  if (!quote) return null;

  const { data: approval, error } = await supabase
    .from("approvals")
    .insert({
      tipo: "orcamento",
      referencia_id: quote.id,
      solicitante_id: solicitanteId,
      motivo,
      exclusivo_admin: false,
      status: "pendente",
    })
    .select()
    .single();
  if (error) throw error;

  await moveLeadStage(quote.lead_id, "orcamento_aguardando_aprovacao", solicitanteId);
  await logActivity(solicitanteId, "Orçamento enviado para aprovação", "orcamento", quote.id, { motivo });
  return approval;
}

export async function markQuoteSent(quoteId: string, autorId: string | null): Promise<QuoteRow | null> {
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .update({ status: "enviado" })
    .eq("id", quoteId)
    .select()
    .single();
  if (error) throw error;
  if (!quote) return null;
  await moveLeadStage(quote.lead_id, "orcamento_enviado", autorId);
  await logActivity(autorId, "Orçamento enviado ao cliente", "orcamento", quote.id);
  return quote as unknown as QuoteRow;
}

// ---------------------------------------------------------------------------
// Contracts (extra mutators — creation/submission/signature for the Contrato
// screen)
// ---------------------------------------------------------------------------

export interface ContractWithLead extends ContractRow {
  lead: LeadRow | null;
  quote: QuoteRow | null;
}

export async function getContracts(): Promise<ContractWithLead[]> {
  const supabase = await createClient();
  const { data: contracts, error } = await supabase
    .from("contracts")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  if (!contracts || contracts.length === 0) return [];

  const leadIds = [...new Set(contracts.map((c) => c.lead_id))];
  const quoteIds = [...new Set(contracts.map((c) => c.quote_id).filter((id): id is string => Boolean(id)))];
  const [{ data: leads }, { data: quotes }] = await Promise.all([
    supabase.from("leads").select("*").in("id", leadIds),
    quoteIds.length ? supabase.from("quotes").select("*").in("id", quoteIds) : Promise.resolve({ data: [] }),
  ]);
  const leadById = new Map(((leads ?? []) as unknown as LeadRow[]).map((l) => [l.id, l]));
  const quoteById = new Map(((quotes ?? []) as unknown as QuoteRow[]).map((q) => [q.id, q]));

  return (contracts as unknown as ContractRow[]).map((c) => ({
    ...c,
    lead: leadById.get(c.lead_id) ?? null,
    quote: c.quote_id ? quoteById.get(c.quote_id) ?? null : null,
  }));
}

export async function createContractDraft(input: {
  leadId: string;
  quoteId: string | null;
  templateId: string | null;
  campos: Record<string, unknown>;
  criadoPor: string | null;
  camposCustomizados?: CustomFieldValues;
}): Promise<ContractRow> {
  const supabase = await createClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      lead_id: input.leadId,
      quote_id: input.quoteId,
      template_id: input.templateId,
      campos: input.campos as unknown as Json,
      campos_customizados: (input.camposCustomizados ?? {}) as unknown as Json,
      status_assinatura: "rascunho",
      criado_por: input.criadoPor,
    })
    .select()
    .single();
  if (error) throw error;
  await moveLeadStage(input.leadId, "contrato_em_elaboracao", input.criadoPor);
  await logActivity(input.criadoPor, "Contrato criado", "contrato", contract.id);
  return contract as unknown as ContractRow;
}

export async function submitContractForApproval(
  contractId: string,
  motivo: string,
  solicitanteId: string,
): Promise<ApprovalRow | null> {
  const supabase = await createClient();
  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .update({ status_assinatura: "aguardando_aprovacao" })
    .eq("id", contractId)
    .select()
    .single();
  if (cErr) throw cErr;
  if (!contract) return null;

  const { data: approval, error } = await supabase
    .from("approvals")
    .insert({
      tipo: "contrato",
      referencia_id: contract.id,
      solicitante_id: solicitanteId,
      motivo,
      exclusivo_admin: true,
      status: "pendente",
    })
    .select()
    .single();
  if (error) throw error;

  await moveLeadStage(contract.lead_id, "contrato_aguardando_aprovacao", solicitanteId);
  await logActivity(solicitanteId, "Contrato enviado para aprovação", "contrato", contract.id, { motivo });
  return approval;
}

export async function markContractSigned(contractId: string, autorId: string | null): Promise<ContractRow | null> {
  const supabase = await createClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .update({ status_assinatura: "assinado", assinado_em: new Date().toISOString() })
    .eq("id", contractId)
    .select()
    .single();
  if (error) throw error;
  if (!contract) return null;

  await moveLeadStage(contract.lead_id, "fechado", autorId);
  await logActivity(autorId, "Contrato assinado", "contrato", contract.id);

  const lead = await getLeadById(contract.lead_id);
  const quote = contract.quote_id ? await getQuoteById(contract.quote_id) : null;
  const valor = quote?.valor_total ?? lead?.valor_estimado ?? null;
  await supabase.from("finance_sync_log").insert({
    contract_id: contract.id,
    provider: "conta_azul",
    status: "pendente_integracao",
    payload: { valor, cliente: lead?.empresa ?? lead?.nome } as unknown as Json,
  });

  return contract as unknown as ContractRow;
}

// ---------------------------------------------------------------------------
// Custom fields — admin-defined select fields attached to an entity (lead or
// orçamento) from Configurações > Campos customizados. Values are stored
// directly on the entity row (leads.campos_customizados /
// quotes.campos_customizados) as a { chave: valor } map.
// ---------------------------------------------------------------------------

export async function getCustomFieldDefinitions(
  entidade?: CustomFieldEntity,
  onlyActive = true,
): Promise<CustomFieldDefinitionRow[]> {
  const supabase = await createClient();
  let query = supabase.from("custom_field_definitions").select("*").order("ordem");
  if (entidade) query = query.eq("entidade", entidade);
  if (onlyActive) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as CustomFieldDefinitionRow[];
}

export async function createCustomFieldDefinition(input: {
  entidade: CustomFieldEntity;
  chave: string;
  rotulo: string;
  opcoes: CustomFieldOption[];
  usarEmRelatorios: boolean;
}): Promise<CustomFieldDefinitionRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .insert({
      entidade: input.entidade,
      chave: input.chave,
      rotulo: input.rotulo,
      opcoes: input.opcoes as unknown as Json,
      usar_em_relatorios: input.usarEmRelatorios,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CustomFieldDefinitionRow;
}

export async function updateCustomFieldDefinition(
  id: string,
  input: { rotulo: string; opcoes: CustomFieldOption[]; usarEmRelatorios: boolean; ativo: boolean },
): Promise<CustomFieldDefinitionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .update({
      rotulo: input.rotulo,
      opcoes: input.opcoes as unknown as Json,
      usar_em_relatorios: input.usarEmRelatorios,
      ativo: input.ativo,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CustomFieldDefinitionRow;
}

export async function deleteCustomFieldDefinition(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("custom_field_definitions").delete().eq("id", id);
}
