"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatBRL, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { STAGE_LABEL } from "@/lib/domain/funnel";
import { CompleteFollowupButton } from "./complete-followup-button";
import type { FollowupWithMeta } from "@/lib/data/store";
import type { ConversationFull } from "@/lib/data/store";

const FILTERS = ["todos", "pendentes", "atrasados"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABEL: Record<Filter, string> = { todos: "Todos", pendentes: "Pendentes", atrasados: "Atrasados" };

export function FollowupsView({
  followups: initialFollowups,
  conversationsByLead,
}: {
  followups: FollowupWithMeta[];
  conversationsByLead: Record<string, ConversationFull | undefined>;
}) {
  const [followups, setFollowups] = useState(initialFollowups);
  const [prevInitial, setPrevInitial] = useState(initialFollowups);
  if (initialFollowups !== prevInitial) {
    setPrevInitial(initialFollowups);
    setFollowups(initialFollowups);
  }

  const [filter, setFilter] = useState<Filter>("pendentes");
  const [search, setSearch] = useState("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const filtered = followups.filter((f) => {
    if (filter === "pendentes" && f.statusEfetivo !== "pendente") return false;
    if (filter === "atrasados" && f.statusEfetivo !== "atrasado") return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (f.lead?.empresa ?? "").toLowerCase().includes(q) || (f.lead?.nome ?? "").toLowerCase().includes(q);
  });

  const openLead = openLeadId ? followups.find((f) => f.lead_id === openLeadId)?.lead ?? null : null;
  const openConversation = openLeadId ? conversationsByLead[openLeadId] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente…" className="pl-8" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">Nenhum follow-up encontrado.</CardContent>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{f.lead?.empresa ?? f.lead?.nome ?? "—"}</p>
                    {f.statusEfetivo === "atrasado" ? (
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Atrasado</Badge>
                    ) : f.statusEfetivo === "concluido" ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Concluído</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{f.descricao}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <RelativeTime iso={f.data} /> · {f.responsavel?.nome ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpenLeadId(f.lead_id)}>
                    Abrir conversa/ficha
                  </Button>
                  {f.statusEfetivo !== "concluido" ? <CompleteFollowupButton id={f.id} /> : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet open={openLead !== null} onOpenChange={(open) => !open && setOpenLeadId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {openLead ? (
            <>
              <SheetHeader>
                <SheetTitle>{openLead.empresa ?? openLead.nome}</SheetTitle>
                <SheetDescription>{openLead.nome}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{STAGE_LABEL[openLead.etapa_funil]}</Badge>
                  {openLead.valor_estimado ? <Badge variant="outline">{formatBRL(openLead.valor_estimado)}</Badge> : null}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {openLead.contato_telefone ? (
                    <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {openLead.contato_telefone}</p>
                  ) : null}
                  {openLead.contato_email ? (
                    <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {openLead.contato_email}</p>
                  ) : null}
                </div>

                {openConversation ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Últimas mensagens
                    </p>
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3">
                      {openConversation.messages.slice(-5).map((m) => (
                        <div key={m.id} className="text-sm">
                          <p className="text-xs text-muted-foreground">
                            {m.remetente === "cliente" ? openLead.nome : m.remetente === "ia" ? "IA" : "Você"} · {formatDateTime(m.criado_em)}
                          </p>
                          <p className="text-foreground">{m.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma conversa de WhatsApp registrada para este lead.</p>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/leads/${openLead.id}`} />}
                >
                  Ver ficha completa
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
