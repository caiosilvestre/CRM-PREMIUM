"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock, ShieldAlert, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatBRL, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import type { ApprovalWithMeta } from "@/lib/data/store";
import type { ProfileRow, QuoteItem } from "@/lib/types/database";
import { decideApprovalAction } from "@/lib/actions/approvals";

function horasAguardando(criadoEm: string): number {
  return (Date.now() - new Date(criadoEm).getTime()) / (1000 * 60 * 60);
}

function sumItens(itens: QuoteItem[]): number {
  return itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0);
}

export function ApprovalQueue({
  pending: initialPending,
  history,
  currentUser,
}: {
  pending: ApprovalWithMeta[];
  history: ApprovalWithMeta[];
  currentUser: ProfileRow;
}) {
  const [pending, setPending] = useState(initialPending);
  const [prevInitialPending, setPrevInitialPending] = useState(initialPending);
  if (initialPending !== prevInitialPending) {
    setPrevInitialPending(initialPending);
    setPending(initialPending);
  }

  const [tab, setTab] = useState<"pendentes" | "historico">("pendentes");
  const [selectedId, setSelectedId] = useState<string | null>(initialPending[0]?.id ?? null);
  const selected = pending.find((a) => a.id === selectedId) ?? pending[0] ?? null;

  const [itens, setItens] = useState<QuoteItem[]>(selected?.quote?.itens ?? []);
  const [condicoes, setCondicoes] = useState(selected?.quote?.condicoes ?? "");
  const [motivoDecisao, setMotivoDecisao] = useState("");
  const [pendingAction, startTransition] = useTransition();

  // Reset the edit form when the selected approval changes — adjusted
  // during render (React's documented alternative to an Effect here) so the
  // fields never flash stale data from the previous selection.
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id ?? null);
  if ((selected?.id ?? null) !== prevSelectedId) {
    setPrevSelectedId(selected?.id ?? null);
    setItens(selected?.quote?.itens ?? []);
    setCondicoes(selected?.quote?.condicoes ?? "");
    setMotivoDecisao("");
  }

  const originalValor = selected?.valorTotal ?? 0;
  const editedValor = selected?.tipo === "orcamento" ? sumItens(itens) : originalValor;
  const isDirty =
    selected?.tipo === "orcamento" &&
    (editedValor !== originalValor || condicoes !== (selected?.quote?.condicoes ?? ""));

  const isContrato = selected?.tipo === "contrato";
  const podeDecidirContrato = currentUser.perfil === "admin";
  const excedeLimite = selected?.tipo === "orcamento" && editedValor > currentUser.limite_aprovacao_orcamento;
  const podeDecidir = isContrato ? podeDecidirContrato : !excedeLimite;

  async function handleDecide(decision: "aprovado" | "reprovado") {
    if (!selected) return;
    if (!motivoDecisao.trim()) {
      toast.error("Informe o motivo da decisão.");
      return;
    }
    const finalDecision = decision === "aprovado" && isDirty ? "aprovado_com_ajuste" : decision;
    startTransition(async () => {
      try {
        await decideApprovalAction(
          selected.id,
          finalDecision,
          motivoDecisao,
          selected.tipo === "orcamento" && isDirty ? editedValor : undefined,
        );
        toast.success(
          finalDecision === "reprovado"
            ? "Reprovado."
            : finalDecision === "aprovado_com_ajuste"
              ? "Aprovado com ajuste."
              : "Aprovado.",
        );
        setPending((prev) => prev.filter((a) => a.id !== selected.id));
        setSelectedId(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível concluir a decisão.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        <button
          onClick={() => setTab("pendentes")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "pendentes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Pendentes ({pending.length})
        </button>
        <button
          onClick={() => setTab("historico")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "historico" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Histórico
        </button>
      </div>

      {tab === "historico" ? (
        <div className="space-y-2">
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma decisão registrada ainda.
              </CardContent>
            </Card>
          ) : (
            history.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{a.tipo}</Badge>
                      <span className="text-sm font-medium text-foreground">{a.lead?.empresa ?? a.lead?.nome ?? "—"}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.motivo_decisao}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{a.decididoPorProfile?.nome ?? "—"}</p>
                    <p>{formatDateTime(a.decidido_em)}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-2">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Fila de aprovação vazia.
                </CardContent>
              </Card>
            ) : (
              pending.map((a) => {
                const horas = horasAguardando(a.criado_em);
                const alerta = horas >= 4;
                const active = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-accent/10" : "border-border bg-card hover:bg-secondary/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="capitalize">{a.tipo}</Badge>
                      <Badge
                        variant="outline"
                        className={cn(alerta ? "border-red-200 bg-red-50 text-red-700" : "border-border text-muted-foreground")}
                      >
                        <Clock className="h-3 w-3" />
                        <RelativeTime iso={a.criado_em} />
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{a.lead?.empresa ?? a.lead?.nome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatBRL(a.valorTotal)} · {a.solicitante?.nome}</p>
                    {a.exclusivo_admin ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        <ShieldAlert className="h-3 w-3" /> Aprovação exclusiva do Admin
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {selected ? (
            <Card>
              <CardContent className="space-y-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{selected.tipo}</Badge>
                      {selected.exclusivo_admin ? (
                        <Badge variant="outline" className="gap-1 text-primary">
                          <ShieldAlert className="h-3 w-3" /> Exclusivo do Admin
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      {selected.lead?.empresa ?? selected.lead?.nome ?? "—"}
                    </h2>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <UserIcon className="h-3 w-3" /> Solicitado por {selected.solicitante?.nome} · <RelativeTime iso={selected.criado_em} />
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{formatBRL(editedValor)}</p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Motivo da solicitação</p>
                  <p className="mt-1 text-sm text-foreground">{selected.motivo}</p>
                </div>

                {selected.tipo === "orcamento" && selected.quote ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Itens (edite valores se necessário)</p>
                    <div className="space-y-2">
                      {itens.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate text-muted-foreground">
                            {item.descricao} ({item.quantidade} {item.unidade})
                          </span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-32"
                            value={item.valor_unitario}
                            onChange={(e) => {
                              const valor = Number(e.target.value);
                              setItens((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, valor_unitario: valor, valor_total: valor * it.quantidade } : it,
                                ),
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="condicoes">Condições comerciais</Label>
                      <Textarea id="condicoes" value={condicoes} onChange={(e) => setCondicoes(e.target.value)} rows={2} />
                    </div>
                    {isDirty ? (
                      <p className="text-xs font-medium text-amber-700">
                        Valores ajustados — a decisão será registrada como &quot;Aprovado com ajuste&quot;.
                      </p>
                    ) : null}
                  </div>
                ) : selected.contract ? (
                  <div className="space-y-1.5 text-sm">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Vigência: </span>
                      {String(selected.contract.campos.vigencia ?? "—")}
                    </p>
                    {Object.entries(selected.contract.campos)
                      .filter(([k]) => k !== "vigencia" && k !== "empresa")
                      .map(([k, v]) => (
                        <p key={k} className="text-foreground">
                          <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}: </span>
                          {String(v)}
                        </p>
                      ))}
                  </div>
                ) : null}

                {!podeDecidir ? (
                  <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {isContrato
                      ? "Apenas o Admin pode aprovar ou reprovar contratos."
                      : `Valor acima do seu limite de aprovação (${formatBRL(currentUser.limite_aprovacao_orcamento)}).`}
                  </p>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="motivo-decisao">Motivo da decisão</Label>
                  <Textarea
                    id="motivo-decisao"
                    value={motivoDecisao}
                    onChange={(e) => setMotivoDecisao(e.target.value)}
                    placeholder="Justifique a aprovação, ajuste ou reprovação…"
                    rows={2}
                    disabled={!podeDecidir}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={!podeDecidir || pendingAction}
                    onClick={() => handleDecide("reprovado")}
                  >
                    Reprovar
                  </Button>
                  <Button disabled={!podeDecidir || pendingAction} onClick={() => handleDecide("aprovado")}>
                    {isDirty ? "Aprovar com ajuste" : "Aprovar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Selecione um item da fila para revisar.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalWithMeta["status"] }) {
  const map: Record<string, string> = {
    aprovado: "border-emerald-200 bg-emerald-50 text-emerald-700",
    aprovado_com_ajuste: "border-amber-200 bg-amber-50 text-amber-700",
    reprovado: "border-red-200 bg-red-50 text-red-700",
    pendente: "border-border text-muted-foreground",
  };
  const label: Record<string, string> = {
    aprovado: "Aprovado",
    aprovado_com_ajuste: "Aprovado com ajuste",
    reprovado: "Reprovado",
    pendente: "Pendente",
  };
  return <Badge variant="outline" className={map[status]}>{label[status]}</Badge>;
}
