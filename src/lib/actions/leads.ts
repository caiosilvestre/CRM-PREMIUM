"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import type { FunnelStage, LeadOrigin } from "@/lib/types/database";

function parseCamposCustomizados(formData: FormData): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("campo_") && typeof value === "string" && value) {
      campos[key.slice("campo_".length)] = value;
    }
  }
  return campos;
}

export async function moveLeadStageAction(leadId: string, stage: FunnelStage) {
  const profile = await getCurrentProfile();
  await store.moveLeadStage(leadId, stage, profile?.id ?? null);
  revalidatePath("/funil");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function markLeadLostAction(leadId: string, motivo: string, detalhe: string | null) {
  const profile = await getCurrentProfile();
  await store.markLeadLost(leadId, motivo, detalhe, profile?.id ?? null);
  revalidatePath("/funil");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function createLeadAction(formData: FormData) {
  const profile = await getCurrentProfile();

  const nome = String(formData.get("nome") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const origem = (String(formData.get("origem") ?? "indicacao") || "indicacao") as LeadOrigin;
  const valorRaw = String(formData.get("valor_estimado") ?? "").trim();
  const valor_estimado = valorRaw ? Number(valorRaw) : null;

  if (!nome) return;

  await store.createLead({
    nome,
    empresa,
    contato_telefone: telefone,
    contato_email: email,
    origem,
    valor_estimado,
    responsavel_id: profile?.id ?? null,
    camposCustomizados: parseCamposCustomizados(formData),
  });

  revalidatePath("/funil");
  revalidatePath("/dashboard");
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const profile = await getCurrentProfile();

  const nome = String(formData.get("nome") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const telefone = String(formData.get("telefone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const origem = (String(formData.get("origem") ?? "indicacao") || "indicacao") as LeadOrigin;
  const valorRaw = String(formData.get("valor_estimado") ?? "").trim();
  const valor_estimado = valorRaw ? Number(valorRaw) : null;

  if (!nome) throw new Error("Informe o nome do contato.");

  await store.updateLead(
    leadId,
    {
      nome,
      empresa,
      contato_telefone: telefone,
      contato_email: email,
      origem,
      valor_estimado,
      camposCustomizados: parseCamposCustomizados(formData),
    },
    profile?.id ?? null,
  );

  revalidatePath("/funil");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadAction(leadId: string) {
  await store.deleteLead(leadId);
  revalidatePath("/funil");
  revalidatePath("/dashboard");
}
