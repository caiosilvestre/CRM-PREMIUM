"use server";

import { getCurrentProfile } from "@/lib/auth/current-user";
import { getSetting, getPricingRules } from "@/lib/data/store";
import { buildSystemPrompt, generateAiReply, type ChatTurn } from "@/lib/ai/generate-reply";
import type { QualificationScript } from "@/lib/domain/settings";

// Powers only the "Chat de Teste" tab in Configuração do Agente de IA — lets
// the team try out the qualification script + pricing table against the real
// OpenAI model before the agent is ever wired to answer real WhatsApp leads.
export async function sendTestChatMessageAction(history: ChatTurn[]): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Sessão expirada — faça login novamente.");

  const [script, pricingRules] = await Promise.all([
    getSetting("script_qualificacao") as Promise<QualificationScript>,
    getPricingRules(),
  ]);

  const systemPrompt = buildSystemPrompt({ qualificationScript: script, pricingRules });
  return generateAiReply(systemPrompt, history);
}
