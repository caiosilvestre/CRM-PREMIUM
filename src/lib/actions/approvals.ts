"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";

export async function decideApprovalAction(
  approvalId: string,
  decision: "aprovado" | "aprovado_com_ajuste" | "reprovado",
  motivoDecisao: string,
  ajusteValorTotal?: number,
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sessão expirada.");

  const approvals = await store.getApprovalsWithMeta();
  const approval = approvals.find((a) => a.id === approvalId);
  if (!approval || approval.status !== "pendente") return;

  // Regra crítica: contrato só pode ser aprovado/reprovado pelo Admin.
  if (approval.tipo === "contrato" && profile.perfil !== "admin") {
    throw new Error("Apenas o Admin pode decidir aprovações de contrato.");
  }

  // Limite de valor de aprovação de orçamento por usuário.
  if (approval.tipo === "orcamento" && decision !== "reprovado") {
    const valor = ajusteValorTotal ?? approval.valorTotal ?? 0;
    if (valor > profile.limite_aprovacao_orcamento) {
      throw new Error(
        `Valor (R$ ${valor.toLocaleString("pt-BR")}) acima do seu limite de aprovação (R$ ${profile.limite_aprovacao_orcamento.toLocaleString("pt-BR")}).`,
      );
    }
  }

  if (!motivoDecisao.trim()) {
    throw new Error("Informe o motivo da decisão.");
  }

  await store.decideApproval(approvalId, decision, motivoDecisao.trim(), profile.id, ajusteValorTotal);

  revalidatePath("/aprovacoes");
  revalidatePath("/funil");
  revalidatePath("/dashboard");
  if (approval.lead) revalidatePath(`/leads/${approval.lead.id}`);
}
