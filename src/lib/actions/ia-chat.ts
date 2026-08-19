"use server";

import { getCurrentProfile } from "@/lib/auth/current-user";
import { getSetting, getPricingRules } from "@/lib/data/store";
import { buildSystemPrompt, generateAiReply, type ChatTurn } from "@/lib/ai/generate-reply";
import type { QualificationScript } from "@/lib/domain/settings";

export type SendTestChatMessageResult = { ok: true; reply: string } | { ok: false; error: string };

// Powers only the "Chat de Teste" tab in Configuração do Agente de IA — lets
// the team try out the qualification script + pricing table against the real
// OpenAI model before the agent is ever wired to answer real WhatsApp leads.
//
// Returns failures instead of throwing: Next.js replaces any error *thrown*
// out of a Server Action with a generic, digest-only message in production
// builds (React error #441) to avoid leaking details client-side. Since
// "missing API key" / "no OpenAI credits" are expected, user-facing failures
// here, returning them keeps the real message visible in the UI instead of
// only in the Vercel function logs.
export async function sendTestChatMessageAction(history: ChatTurn[]): Promise<SendTestChatMessageResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Sessão expirada — faça login novamente." };

  try {
    const [script, pricingRules] = await Promise.all([
      getSetting("script_qualificacao") as Promise<QualificationScript>,
      getPricingRules(),
    ]);

    const systemPrompt = buildSystemPrompt({ qualificationScript: script, pricingRules });
    const reply = await generateAiReply(systemPrompt, history);
    return { ok: true, reply };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao gerar resposta da IA." };
  }
}
