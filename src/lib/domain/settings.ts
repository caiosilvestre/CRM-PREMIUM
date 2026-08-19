export interface QualificationQuestion {
  ordem: number;
  pergunta: string;
}

export interface QualificationScript {
  perguntas: QualificationQuestion[];
}

export interface DayHours {
  inicio: string;
  fim: string;
}

export interface BusinessHours {
  timezone: string;
  dias: Record<
    "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo",
    DayHours | null
  >;
}

export interface FollowupTriggers {
  sem_resposta_qualificacao_horas: number;
  orcamento_enviado_sem_retorno_dias: number;
}

export const DIAS_SEMANA: { key: keyof BusinessHours["dias"]; label: string }[] = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terça" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];
