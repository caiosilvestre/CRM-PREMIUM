import type { FunnelStage } from "@/lib/types/database";

export const FUNNEL_STAGES: { value: FunnelStage; label: string }[] = [
  { value: "novo_lead", label: "Novo Lead" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "orcamento_em_elaboracao", label: "Orçamento em Elaboração" },
  { value: "orcamento_aguardando_aprovacao", label: "Orçamento Aguardando Aprovação" },
  { value: "orcamento_enviado", label: "Orçamento Enviado" },
  { value: "negociacao", label: "Negociação" },
  { value: "contrato_em_elaboracao", label: "Contrato em Elaboração" },
  { value: "contrato_aguardando_aprovacao", label: "Contrato Aguardando Aprovação" },
  { value: "aguardando_assinatura", label: "Aguardando Assinatura" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

export const STAGE_LABEL: Record<FunnelStage, string> = Object.fromEntries(
  FUNNEL_STAGES.map((s) => [s.value, s.label]),
) as Record<FunnelStage, string>;

// Prazo esperado (em dias) para permanência em cada etapa ativa do funil —
// usado para colorir os cards do Kanban (verde/amarelo/vermelho).
export const STAGE_LIMITE_DIAS: Partial<Record<FunnelStage, number>> = {
  novo_lead: 1,
  qualificacao: 2,
  orcamento_em_elaboracao: 2,
  orcamento_aguardando_aprovacao: 1,
  orcamento_enviado: 3,
  negociacao: 5,
  contrato_em_elaboracao: 2,
  contrato_aguardando_aprovacao: 1,
  aguardando_assinatura: 5,
};

export type StageHealth = "ok" | "atencao" | "atrasado";

export function diasNaEtapa(etapaAtualizadaEm: string, reference: Date = new Date()): number {
  const ms = reference.getTime() - new Date(etapaAtualizadaEm).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function stageHealth(stage: FunnelStage, dias: number): StageHealth {
  const limite = STAGE_LIMITE_DIAS[stage];
  if (!limite) return "ok";
  if (dias <= limite) return "ok";
  if (dias <= limite * 2) return "atencao";
  return "atrasado";
}

export const MOTIVOS_PERDA = [
  "Preço acima do orçamento do cliente",
  "Fechou com concorrente",
  "Não teve retorno do cliente",
  "Fora da área de atendimento",
  "Não é o momento / adiado",
  "Outro",
] as const;
