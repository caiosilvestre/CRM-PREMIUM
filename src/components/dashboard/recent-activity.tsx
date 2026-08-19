import { History } from "lucide-react";
import type { ActivityLogWithAuthor } from "@/lib/data/store";
import { formatRelative } from "@/lib/format";

export function RecentActivity({ entries }: { entries: ActivityLogWithAuthor[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>;
  }

  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">{entry.autor?.nome ?? "Sistema"}</span> — {entry.acao}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(entry.criado_em)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
