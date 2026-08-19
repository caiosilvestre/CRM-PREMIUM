import type { QualificationScript } from "@/lib/domain/settings";
import type { PricingRuleRow } from "@/lib/types/database";

// Reusable core for the IA agent's replies — used today only by the test chat
// in Configuração do Agente de IA (Chat de Teste). Not wired to the real
// WhatsApp webhook yet; kept provider-agnostic (plain system prompt + turn
// history in, reply text out) so it can be reused there later without
// rewriting the prompt-building logic.

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function buildSystemPrompt({
  qualificationScript,
  pricingRules,
}: {
  qualificationScript: QualificationScript;
  pricingRules: PricingRuleRow[];
}): string {
  const perguntas = [...qualificationScript.perguntas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((p, i) => `${i + 1}. ${p.pergunta}`)
    .join("\n");

  const precos = pricingRules
    .filter((r) => r.ativo)
    .map((r) => `- ${r.servico} (${r.unidade}): R$ ${r.preco.toFixed(2)}`)
    .join("\n");

  return [
    "Você é o atendente virtual de uma empresa de serviços premium, conversando pelo WhatsApp com um lead.",
    "Seja cordial, direto e profissional. Escreva mensagens curtas, como quem digita num celular — sem markdown, sem listas numeradas longas, no máximo 2-3 frases por resposta.",
    "Seu objetivo é qualificar o lead. Faça uma pergunta por vez, seguindo este roteiro (não repita perguntas já respondidas na conversa):",
    perguntas || "(nenhum roteiro de qualificação configurado ainda)",
    precos ? `Tabela de preços de referência — use só se o cliente perguntar valores:\n${precos}` : "",
    "Nunca prometa prazos, descontos ou condições que não foram definidos aqui. Se não souber algo, diga que um atendente humano vai confirmar em breve.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function generateAiReply(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada no .env.local.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  const data = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  } | null;

  if (!response.ok || !data) {
    throw new Error(`Falha ao chamar a OpenAI: ${data?.error?.message ?? `HTTP ${response.status}`}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("A OpenAI não retornou texto na resposta.");
  return text.trim();
}
