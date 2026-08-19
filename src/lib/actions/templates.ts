"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import * as store from "@/lib/data/store";
import type { CustomFieldValues, TemplateType } from "@/lib/types/database";

export async function saveTemplateAction(input: {
  id?: string;
  tipo: TemplateType;
  nome: string;
  conteudo: string;
  camposCustomizados?: CustomFieldValues;
}) {
  const profile = await getCurrentProfile();
  if (!input.nome.trim() || !input.conteudo.trim()) {
    throw new Error("Nome e conteúdo são obrigatórios.");
  }
  await store.upsertTemplate({ ...input, criadoPor: profile?.id ?? null });
  revalidatePath("/modelos");
}

export async function deleteTemplateAction(id: string) {
  await store.deleteTemplate(id);
  revalidatePath("/modelos");
}
