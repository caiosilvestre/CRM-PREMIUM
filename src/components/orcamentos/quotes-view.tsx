"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewQuoteDialog } from "./new-quote-dialog";
import { ManageFieldsButton } from "@/components/campos-customizados/manage-fields-button";
import { cn } from "@/lib/utils";
import { formatBRL, formatDate } from "@/lib/format";
import type { QuoteWithLead } from "@/lib/data/store";
import type { CustomFieldDefinitionRow, LeadRow, PricingRuleRow, QuoteItem, QuoteStatus } from "@/lib/types/database";
import { updateQuoteDraftAction, submitQuoteForApprovalAction, markQuoteSentAction } from "@/lib/actions/quotes";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  aprovado_com_ajuste: "Aprovado com ajuste",
  reprovado: "Reprovado",
  enviado: "Enviado",
};

const STATUS_STYLE: Record<QuoteStatus, string> = {
  rascunho: "border-border text-muted-foreground",
  aguardando_aprovacao: "border-amber-200 bg-amber-50 text-amber-700",
  aprovado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aprovado_com_ajuste: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reprovado: "border-red-200 bg-red-50 text-red-700",
  enviado: "border-sky-200 bg-sky-50 text-sky-700",
};

export function QuotesView({
  quotes: initialQuotes,
  leads,
  pricingRules,
  customFields = [],
  leadFilterFields = [],
  isAdmin = false,
}: {
  quotes: QuoteWithLead[];
  leads: LeadRow[];
  pricingRules: PricingRuleRow[];
  customFields?: CustomFieldDefinitionRow[];
  leadFilterFields?: CustomFieldDefinitionRow[];
  isAdmin?: boolean;
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [prevInitial, setPrevInitial] = useState(initialQuotes);
  if (initialQuotes !== prevInitial) {
    setPrevInitial(initialQuotes);
    setQuotes(initialQuotes);
  }

  const [filters, setFilters] = useState<Record<string, string>>({});
  const filteredQuotes = quotes.filter((q) =>
    leadFilterFields.every((f) => {
      const wanted = filters[f.chave];
      if (!wanted || wanted === "todos") return true;
      return q.lead?.campos_customizados?.[f.chave] === wanted;
    }),
  );

  const [selectedId, setSelectedId] = useState<string | null>(initialQuotes[0]?.id ?? null);
  const selected = filteredQuotes.find((q) => q.id === selectedId) ?? filteredQuotes[0] ?? null;

  const [itens, setItens] = useState<QuoteItem[]>(selected?.itens ?? []);
  const [condicoes, setCondicoes] = useState(selected?.condicoes ?? "");
  const [motivo, setMotivo] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id ?? null);
  if ((selected?.id ?? null) !== prevSelectedId) {
    setPrevSelectedId(selected?.id ?? null);
    setItens(selected?.itens ?? []);
    setCondicoes(selected?.condicoes ?? "");
    setMotivo("");
    setShowSubmit(false);
  }

  const valorTotal = itens.reduce((sum, i) => sum + i.valor_total, 0);
  const isDraft = selected?.status === "rascunho";
  const leadsForNewQuote = leads.filter((l) => l.etapa_funil !== "fechado" && l.etapa_funil !== "perdido");

  function handleSaveDraft() {
    if (!selected) return;
    startTransition(async () => {
      await updateQuoteDraftAction(selected.id, itens, condicoes);
      toast.success("Rascunho salvo.");
      router.refresh();
    });
  }

  function handleSubmit() {
    if (!selected) return;
    if (!motivo.trim()) {
      toast.error("Informe o motivo da solicitação.");
      return;
    }
    startTransition(async () => {
      try {
        await submitQuoteForApprovalAction(selected.id, motivo);
        toast.success("Enviado para aprovação.");
        setShowSubmit(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
      }
    });
  }

  function handleMarkSent() {
    if (!selected) return;
    startTransition(async () => {
      await markQuoteSentAction(selected.id);
      toast.success("Orçamento marcado como enviado ao cliente.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {leadFilterFields.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {leadFilterFields.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">{f.rotulo}</Label>
                <Select
                  value={filters[f.chave] ?? "todos"}
                  onValueChange={(v) => v && setFilters((prev) => ({ ...prev, [f.chave]: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {(value: string) =>
                        value === "todos" ? "Todos" : f.opcoes.find((o) => o.valor === value)?.rotulo ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {f.opcoes.map((o) => (
                      <SelectItem key={o.valor} value={o.valor}>
                        {o.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <ManageFieldsButton entidade="orcamento" fields={customFields} isAdmin={isAdmin} />
          <NewQuoteDialog
            leads={leadsForNewQuote}
            pricingRules={pricingRules}
            customFields={customFields.filter((f) => f.ativo)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {filteredQuotes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhum orçamento encontrado.
              </CardContent>
            </Card>
          ) : (
            filteredQuotes.map((q) => {
              const active = selected?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active ? "border-primary bg-accent/10" : "border-border bg-card hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {q.lead?.empresa ?? q.lead?.nome ?? "—"}
                    </span>
                    <Badge variant="outline" className={STATUS_STYLE[q.status]}>
                      {STATUS_LABEL[q.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatBRL(q.valor_total)} · v{q.versao}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(q.criado_em)}</p>
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
                    <Badge variant="outline" className={STATUS_STYLE[selected.status]}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">versão {selected.versao}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {selected.lead?.empresa ?? selected.lead?.nome ?? "—"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold text-foreground">{formatBRL(valorTotal)}</p>
                  {selected.lead ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href={`/leads/${selected.lead.id}`} />}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Itens</p>
                {itens.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">{item.descricao}</span>
                    {isDraft ? (
                      <>
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={item.quantidade}
                          onChange={(e) => {
                            const q = Number(e.target.value);
                            setItens((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantidade: q, valor_total: q * it.valor_unitario } : it)),
                            );
                          }}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-28"
                          value={item.valor_unitario}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setItens((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, valor_unitario: v, valor_total: it.quantidade * v } : it)),
                            );
                          }}
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="w-32 text-right text-foreground">{formatBRL(item.valor_total)}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condicoes-view">Condições comerciais</Label>
                <Textarea
                  id="condicoes-view"
                  value={condicoes}
                  onChange={(e) => setCondicoes(e.target.value)}
                  rows={2}
                  disabled={!isDraft}
                />
              </div>

              {isDraft ? (
                <div className="space-y-3 border-t border-border pt-4">
                  {showSubmit ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="motivo-envio">Motivo da solicitação</Label>
                      <Textarea
                        id="motivo-envio"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ex: condições padrão, desconto aplicado, prazo diferenciado…"
                        rows={2}
                      />
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" disabled={pending} onClick={handleSaveDraft}>
                      Salvar rascunho
                    </Button>
                    {showSubmit ? (
                      <Button disabled={pending} onClick={handleSubmit}>
                        <Send className="h-3.5 w-3.5" />
                        Confirmar envio
                      </Button>
                    ) : (
                      <Button disabled={pending} onClick={() => setShowSubmit(true)}>
                        <Send className="h-3.5 w-3.5" />
                        Enviar para aprovação
                      </Button>
                    )}
                  </div>
                </div>
              ) : selected.status === "aprovado" || selected.status === "aprovado_com_ajuste" ? (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button disabled={pending} onClick={handleMarkSent}>
                    Marcar como enviado ao cliente
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Selecione um orçamento para visualizar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
