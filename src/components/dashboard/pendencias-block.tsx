import Link from "next/link";
import { ClipboardCheck, AlarmClockOff, MessageCircleWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendenciaItem {
  href: string;
  label: string;
  count: number;
  icon: typeof ClipboardCheck;
}

export function PendenciasBlock({
  aprovacoesPendentes,
  followupsAtrasados,
  conversasSemResposta,
}: {
  aprovacoesPendentes: number;
  followupsAtrasados: number;
  conversasSemResposta: number;
}) {
  const items: PendenciaItem[] = [
    { href: "/aprovacoes", label: "Aprovações pendentes", count: aprovacoesPendentes, icon: ClipboardCheck },
    { href: "/followups", label: "Follow-ups atrasados", count: followupsAtrasados, icon: AlarmClockOff },
    { href: "/atendimento", label: "Conversas sem resposta há mais de 30 min", count: conversasSemResposta, icon: MessageCircleWarning },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const alert = item.count > 0;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 transition-colors",
              alert
                ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                : "border-border bg-card hover:bg-secondary/60",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                alert ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={cn("text-xl font-semibold", alert ? "text-destructive" : "text-foreground")}>
                {item.count}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
