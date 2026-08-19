import Link from "next/link";
import { FUNNEL_STAGES } from "@/lib/domain/funnel";
import type { FunnelStage } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function FunnelChart({ counts }: { counts: Record<FunnelStage, number> }) {
  const activeStages = FUNNEL_STAGES.filter((s) => s.value !== "fechado" && s.value !== "perdido");
  const max = Math.max(1, ...activeStages.map((s) => counts[s.value] ?? 0));

  return (
    <div className="space-y-2">
      {FUNNEL_STAGES.map((stage) => {
        const count = counts[stage.value] ?? 0;
        const isResolved = stage.value === "fechado" || stage.value === "perdido";
        const pct = isResolved ? 100 : Math.round(((counts[stage.value] ?? 0) / max) * 100);

        return (
          <Link
            key={stage.value}
            href={`/funil?etapa=${stage.value}`}
            className="flex items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-secondary/50"
          >
            <span className="w-56 shrink-0 truncate text-muted-foreground">{stage.label}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className={cn(
                  "block h-full rounded-full",
                  stage.value === "fechado" && "bg-emerald-600",
                  stage.value === "perdido" && "bg-muted-foreground/40",
                  !isResolved && "bg-primary",
                )}
                style={{ width: isResolved ? (count > 0 ? "100%" : "0%") : `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-medium text-foreground">{count}</span>
          </Link>
        );
      })}
    </div>
  );
}
