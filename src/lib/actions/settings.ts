"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import { configureWhatsAppWebhook } from "@/lib/providers/whatsapp";
import type { CustomFieldEntity, CustomFieldOption, PricingRuleRow } from "@/lib/types/database";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function saveQualificationScriptAction(
  perguntas: { ordem: number; pergunta: string }[],
) {
  await store.setSetting("script_qualificacao", { perguntas });
  revalidatePath("/ia");
}

export async function saveBusinessHoursAction(valor: unknown) {
  await store.setSetting("horario_atendimento", valor);
  revalidatePath("/ia");
}

export async function saveFollowupTriggersAction(valor: unknown) {
  await store.setSetting("gatilhos_followup", valor);
  revalidatePath("/ia");
}

export async function savePricingRulesAction(rules: PricingRuleRow[]) {
  await store.savePricingRules(rules);
  revalidatePath("/ia");
  revalidatePath("/orcamentos");
}

export async function updateUserPermissionsAction(
  userId: string,
  limiteAprovacaoOrcamento: number,
  podeAprovarContrato: boolean,
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.perfil !== "admin") {
    throw new Error("Apenas o Admin pode alterar permissões de aprovação.");
  }
  await store.updateProfilePermissions(userId, {
    limite_aprovacao_orcamento: limiteAprovacaoOrcamento,
    pode_aprovar_contrato: podeAprovarContrato,
  });
  revalidatePath("/configuracoes");
}

export async function configureWhatsAppWebhookAction(url: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.perfil !== "admin") {
    throw new Error("Apenas o Admin pode configurar a integração de WhatsApp.");
  }
  await configureWhatsAppWebhook(url);
  revalidatePath("/configuracoes");
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.perfil !== "admin") {
    throw new Error("Apenas o Admin pode gerenciar campos customizados.");
  }
}

export async function createCustomFieldAction(input: {
  entidade: CustomFieldEntity;
  rotulo: string;
  opcoes: CustomFieldOption[];
  usarEmRelatorios: boolean;
}) {
  await requireAdmin();
  if (!input.rotulo.trim()) throw new Error("Informe um nome para o campo.");
  if (input.opcoes.length < 2) throw new Error("Adicione ao menos duas opções.");
  if (input.opcoes.some((o) => !o.rotulo.trim())) throw new Error("Toda opção precisa de um nome.");

  const chave = slugify(input.rotulo);
  if (!chave) throw new Error("Nome de campo inválido.");

  await store.createCustomFieldDefinition({
    entidade: input.entidade,
    chave,
    rotulo: input.rotulo.trim(),
    opcoes: input.opcoes.map((o) => ({ valor: slugify(o.rotulo) || o.rotulo, rotulo: o.rotulo.trim() })),
    usarEmRelatorios: input.usarEmRelatorios,
  });
  revalidatePath("/configuracoes");
  revalidatePath("/funil");
  revalidatePath("/orcamentos");
  revalidatePath("/relatorios");
}

export async function updateCustomFieldAction(
  id: string,
  input: { rotulo: string; opcoes: CustomFieldOption[]; usarEmRelatorios: boolean; ativo: boolean },
) {
  await requireAdmin();
  if (!input.rotulo.trim()) throw new Error("Informe um nome para o campo.");
  if (input.opcoes.length < 2) throw new Error("Adicione ao menos duas opções.");
  if (input.opcoes.some((o) => !o.rotulo.trim())) throw new Error("Toda opção precisa de um nome.");

  await store.updateCustomFieldDefinition(id, {
    rotulo: input.rotulo.trim(),
    opcoes: input.opcoes.map((o) => ({ valor: o.valor || slugify(o.rotulo), rotulo: o.rotulo.trim() })),
    usarEmRelatorios: input.usarEmRelatorios,
    ativo: input.ativo,
  });
  revalidatePath("/configuracoes");
  revalidatePath("/funil");
  revalidatePath("/orcamentos");
  revalidatePath("/relatorios");
}

export async function deleteCustomFieldAction(id: string) {
  await requireAdmin();
  await store.deleteCustomFieldDefinition(id);
  revalidatePath("/configuracoes");
  revalidatePath("/funil");
  revalidatePath("/orcamentos");
  revalidatePath("/relatorios");
}
