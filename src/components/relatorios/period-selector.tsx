"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PERIOD_LABEL, type PeriodPreset } from "@/lib/domain/periods";

const PRESETS: PeriodPreset[] = ["este_mes", "mes_passado", "trimestre", "personalizado"];

export function PeriodSelector({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  preset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onPresetChange(p)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              preset === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
      {preset === "personalizado" ? (
        <div className="flex items-center gap-2">
          <Input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="w-40" />
          <span className="text-sm text-muted-foreground">até</span>
          <Input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="w-40" />
        </div>
      ) : null}
    </div>
  );
}
