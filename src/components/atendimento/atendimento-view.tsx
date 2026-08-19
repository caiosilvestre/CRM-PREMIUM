"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Bot, User as UserIcon, Send, ArrowRightLeft, ExternalLink, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatBRL, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { STAGE_LABEL } from "@/lib/domain/funnel";
import type { ConversationFull } from "@/lib/data/store";
import type { ProfileRow } from "@/lib/types/database";
import { sendHumanMessageAction, takeOverConversationAction, returnToAIAction } from "@/lib/actions/conversations";
import { createClient } from "@/lib/supabase/client";

export function AtendimentoView({
  conversations: initialConversations,
  profiles,
}: {
  conversations: ConversationFull[];
  profiles: ProfileRow[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [prevInitial, setPrevInitial] = useState(initialConversations);
  if (initialConversations !== prevInitial) {
    setPrevInitial(initialConversations);
    setConversations(initialConversations);
  }

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), 300);
    };
    const channel = supabase
      .channel("atendimento-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, scheduleRefresh)
      .subscribe();
    return () => {
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [router]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.lead.empresa ?? "").toLowerCase().includes(q) || c.lead.nome.toLowerCase().includes(q);
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  function handleSend() {
    if (!selected || !draft.trim()) return;
    const texto = draft.trim();
    setDraft("");
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              ultima_mensagem_em: new Date().toISOString(),
              aguardandoRespostaMinutos: null,
              messages: [
                ...c.messages,
                {
                  id: `optimistic-${Date.now()}`,
                  conversation_id: c.id,
                  remetente: "humano" as const,
                  autor_id: null,
                  texto,
                  criado_em: new Date().toISOString(),
                },
              ],
            }
          : c,
      ),
    );
    startTransition(async () => {
      try {
        await sendHumanMessageAction(selected.id, texto);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível enviar a mensagem pelo WhatsApp.");
      }
    });
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_280px]">
      {/* Lista de conversas */}
      <Card className="flex flex-col overflow-hidden py-0">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome…"
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {filtered.map((c) => {
              const highlighted = (c.aguardandoRespostaMinutos ?? 0) > 30;
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 p-3 text-left transition-colors hover:bg-secondary/60",
                    active && "bg-secondary",
                    highlighted && !active && "bg-destructive/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{c.lead.empresa ?? c.lead.nome}</span>
                    {c.modo === "ia" ? (
                      <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <UserIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.ultimaMensagem?.texto ?? "Sem mensagens"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px]", highlighted ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {highlighted ? (
                        `Sem resposta há ${c.aguardandoRespostaMinutos} min`
                      ) : (
                        <RelativeTime iso={c.ultima_mensagem_em} />
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
            ) : null}
          </div>
        </ScrollArea>
      </Card>

      {/* Painel de chat */}
      <Card className="flex flex-col overflow-hidden py-0">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{selected.lead.empresa ?? selected.lead.nome}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  {selected.modo === "ia" ? (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Bot className="h-3 w-3" /> Atendido pela IA
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <UserIcon className="h-3 w-3" />
                      {profileById.get(selected.assumida_por ?? "")?.nome ?? "Humano"}
                    </Badge>
                  )}
                </div>
              </div>
              {selected.modo === "ia" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(() => takeOverConversationAction(selected.id))}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Assumir conversa
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(() => returnToAIAction(selected.id))}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Devolver para IA
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {selected.messages.map((m) => {
                  const fromCliente = m.remetente === "cliente";
                  const author = m.autor_id ? profileById.get(m.autor_id) : null;
                  return (
                    <div key={m.id} className={cn("flex", fromCliente ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          fromCliente ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground",
                        )}
                      >
                        {!fromCliente ? (
                          <p className="mb-0.5 text-[11px] font-medium opacity-80">
                            {m.remetente === "ia" ? "IA" : author?.nome ?? "Humano"}
                          </p>
                        ) : null}
                        <p>{m.texto}</p>
                        <p className={cn("mt-1 text-[10px] opacity-70")}>{formatDateTime(m.criado_em)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-3">
              {selected.modo === "ia" ? (
                <p className="text-center text-xs text-muted-foreground">
                  Assuma a conversa para responder manualmente.
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escreva uma mensagem…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa
          </div>
        )}
      </Card>

      {/* Ficha resumida do lead */}
      {selected ? (
        <Card className="overflow-hidden py-0">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{selected.lead.empresa ?? selected.lead.nome}</p>
              <p className="text-xs text-muted-foreground">{selected.lead.nome}</p>
            </div>
            <div className="space-y-1.5 text-sm">
              {selected.lead.contato_telefone ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {selected.lead.contato_telefone}
                </p>
              ) : null}
              {selected.lead.contato_email ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {selected.lead.contato_email}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{STAGE_LABEL[selected.lead.etapa_funil]}</Badge>
              {selected.lead.valor_estimado ? (
                <Badge variant="outline">{formatBRL(selected.lead.valor_estimado)}</Badge>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              nativeButton={false}
              render={<Link href={`/leads/${selected.lead.id}`} />}
            >
              Ver ficha completa
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div />
      )}
    </div>
  );
}
