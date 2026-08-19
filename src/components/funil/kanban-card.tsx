"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { diasNaEtapa, stageHealth } from "@/lib/domain/funnel";
import type { LeadRow } from "@/lib/types/database";

const HEALTH_STYLES: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  atrasado: "bg-red-50 text-red-700 border-red-200",
};

export function KanbanCard({
  lead,
  onDragStart,
  onClick,
}: {
  lead: LeadRow;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  const dias = diasNaEtapa(lead.etapa_atualizada_em);
  const isTerminal = lead.etapa_funil === "fechado" || lead.etapa_funil === "perdido";
  const health = stageHealth(lead.etapa_funil, dias);

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer gap-2 p-3 transition-shadow hover:shadow-md"
    >
      <p className="truncate text-sm font-medium text-foreground">{lead.empresa ?? lead.nome}</p>
      <p className="truncate text-xs text-muted-foreground">{lead.nome}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-foreground">{formatBRL(lead.valor_estimado)}</span>
        {lead.etapa_funil === "perdido" ? (
          <Badge variant="outline" className="border-border text-muted-foreground">
            Perdido
          </Badge>
        ) : lead.etapa_funil === "fechado" ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Fechado
          </Badge>
        ) : (
          <Badge variant="outline" className={cn(HEALTH_STYLES[health])}>
            {dias === 0 ? "hoje" : `${dias}d`}
          </Badge>
        )}
      </div>
      {!isTerminal ? null : lead.etapa_funil === "perdido" && lead.motivo_perda ? (
        <p className="truncate text-xs text-muted-foreground">{lead.motivo_perda}</p>
      ) : null}
    </Card>
  );
}
