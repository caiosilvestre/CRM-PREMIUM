"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import type { CustomFieldValues } from "@/lib/types/database";

export async function createContractDraftAction(
  leadId: string,
  quoteId: string | null,
  templateId: string | null,
  campos: Record<string, unknown>,
  camposCustomizados: CustomFieldValues = {},
) {
  const profile = await getCurrentProfile();
  const contract = await store.createContractDraft({
    leadId,
    quoteId,
    templateId,
    campos,
    criadoPor: profile?.id ?? null,
    camposCustomizados,
  });
  revalidatePath("/contratos");
  revalidatePath("/funil");
  revalidatePath(`/leads/${leadId}`);
  return contract.id;
}

export async function submitContractForApprovalAction(contractId: string, motivo: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sessão expirada.");
  if (!motivo.trim()) throw new Error("Informe o motivo da solicitação.");
  await store.submitContractForApproval(contractId, motivo.trim(), profile.id);
  revalidatePath("/contratos");
  revalidatePath("/aprovacoes");
  revalidatePath("/funil");
  revalidatePath("/dashboard");
}

export async function markContractSignedAction(contractId: string) {
  const profile = await getCurrentProfile();
  await store.markContractSigned(contractId, profile?.id ?? null);
  revalidatePath("/contratos");
  revalidatePath("/funil");
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}
