"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import type { CustomFieldValues, QuoteItem } from "@/lib/types/database";

export async function createQuoteDraftAction(
  leadId: string,
  itens: QuoteItem[],
  condicoes: string,
  camposCustomizados: CustomFieldValues = {},
) {
  const profile = await getCurrentProfile();
  if (itens.length === 0) throw new Error("Adicione ao menos um item ao orçamento.");
  const quote = await store.createQuoteDraft({
    leadId,
    itens,
    condicoes,
    criadoPor: profile?.id ?? null,
    camposCustomizados,
  });
  revalidatePath("/orcamentos");
  revalidatePath("/funil");
  revalidatePath(`/leads/${leadId}`);
  return quote.id;
}

export async function updateQuoteDraftAction(quoteId: string, itens: QuoteItem[], condicoes: string) {
  if (itens.length === 0) throw new Error("O orçamento precisa de ao menos um item.");
  await store.updateQuoteDraft(quoteId, itens, condicoes);
  revalidatePath("/orcamentos");
}

export async function submitQuoteForApprovalAction(quoteId: string, motivo: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sessão expirada.");
  if (!motivo.trim()) throw new Error("Informe o motivo da solicitação (ex: desconto aplicado, prazo diferenciado).");
  await store.submitQuoteForApproval(quoteId, motivo.trim(), profile.id);
  revalidatePath("/orcamentos");
  revalidatePath("/aprovacoes");
  revalidatePath("/funil");
  revalidatePath("/dashboard");
}

export async function markQuoteSentAction(quoteId: string) {
  const profile = await getCurrentProfile();
  await store.markQuoteSent(quoteId, profile?.id ?? null);
  revalidatePath("/orcamentos");
  revalidatePath("/funil");
}
