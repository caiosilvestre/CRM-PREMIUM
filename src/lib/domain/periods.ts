export type PeriodPreset = "este_mes" | "mes_passado" | "trimestre" | "personalizado";

export const PERIOD_LABEL: Record<PeriodPreset, string> = {
  este_mes: "Este mês",
  mes_passado: "Mês passado",
  trimestre: "Trimestre",
  personalizado: "Personalizado",
};

export interface DateRange {
  from: Date;
  to: Date;
}

export function getPeriodRange(preset: PeriodPreset, customFrom?: string, customTo?: string): DateRange {
  const now = new Date();

  if (preset === "este_mes") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (preset === "mes_passado") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { from, to };
  }
  if (preset === "trimestre") {
    return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };
  }
  // personalizado
  return {
    from: customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1),
    to: customTo ? new Date(`${customTo}T23:59:59`) : now,
  };
}

export function isWithinRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}
