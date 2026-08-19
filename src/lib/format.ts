import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const isFuture = date.getTime() > Date.now();
  const distance = formatDistanceToNowStrict(date, { locale: ptBR });
  return isFuture ? `em ${distance}` : `há ${distance}`;
}

export function formatDate(iso: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!iso) return "—";
  return format(new Date(iso), pattern, { locale: ptBR });
}

export function formatDateTime(iso: string | null | undefined): string {
  return formatDate(iso, "dd/MM/yyyy 'às' HH:mm");
}
