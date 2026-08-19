"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Send, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NewContractDialog } from "./new-contract-dialog";
import { ManageFieldsButton } from "@/components/campos-customizados/manage-fields-button";
import { cn } from "@/lib/utils";
import { formatBRL, formatDate } from "@/lib/format";
import type { ContractWithLead } from "@/lib/data/store";
import type { QuoteWithLead } from "@/lib/data/store";
import type { ContractSignatureStatus, CustomFieldDefinitionRow, LeadRow, TemplateRow } from "@/lib/types/database";
import { submitContractForApprovalAction, markContractSignedAction } from "@/lib/actions/contracts";

const STATUS_LABEL: Record<ContractSignatureStatus, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
};

const STATUS_STYLE: Record<ContractSignatureStatus, string> = {
  rascunho: "border-border text-muted-foreground",
  aguardando_aprovacao: "border-amber-200 bg-amber-50 text-amber-700",
  aprovado: "border-sky-200 bg-sky-50 text-sky-700",
  aguardando_assinatura: "border-sky-200 bg-sky-50 text-sky-700",
  assinado: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ContractsView({
  contracts: initialContracts,
  leads,
  quotes,
  templates,
  customFields = [],
  isAdmin = false,
}: {
  contracts: ContractWithLead[];
  leads: LeadRow[];
  quotes: QuoteWithLead[];
  templates: TemplateRow[];
  customFields?: CustomFieldDefinitionRow[];
  isAdmin?: boolean;
}) {
  const [contracts, setContracts] = useState(initialContracts);
  const [prevInitial, setPrevInitial] = useState(initialContracts);
  if (initialContracts !== prevInitial) {
    setPrevInitial(initialContracts);
    setContracts(initialContracts);
  }

  const [selectedId, setSelectedId] = useState<string | null>(initialContracts[0]?.id ?? null);
  const selected = contracts.find((c) => c.id === selectedId) ?? contracts[0] ?? null;

  const [motivo, setMotivo] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id ?? null);
  if ((selected?.id ?? null) !== prevSelectedId) {
    setPrevSelectedId(selected?.id ?? null);
    setMotivo("");
    setShowSubmit(false);
  }

  const contractTemplates = templates.filter((t) => t.tipo === "contrato");
  const leadsForNewContract = leads.filter((l) => l.etapa_funil !== "fechado" && l.etapa_funil !== "perdido");

  function handleSubmit() {
    if (!selected) return;
    if (!motivo.trim()) {
      toast.error("Informe o motivo da solicitação.");
      return;
    }
    startTransition(async () => {
      try {
        await submitContractForApprovalAction(selected.id, motivo);
        toast.success("Enviado para aprovação do Admin.");
        setShowSubmit(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
      }
    });
  }

  function handleMarkSigned() {
    if (!selected) return;
    startTransition(async () => {
      await markContractSignedAction(selected.id);
      toast.success("Contrato marcado como assinado. Lead movido para Fechado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <ManageFieldsButton entidade="contrato" fields={customFields} isAdmin={isAdmin} />
        <NewContractDialog
          leads={leadsForNewContract}
          quotes={quotes}
          templates={contractTemplates}
          customFields={customFields.filter((f) => f.ativo)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhum contrato cadastrado.
              </CardContent>
            </Card>
          ) : (
            contracts.map((c) => {
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active ? "border-primary bg-accent/10" : "border-border bg-card hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {c.lead?.empresa ?? c.lead?.nome ?? "—"}
                    </span>
                    <Badge variant="outline" className={STATUS_STYLE[c.status_assinatura]}>
                      {STATUS_LABEL[c.status_assinatura]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(c.criado_em)}</p>
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
                  <Badge variant="outline" className={STATUS_STYLE[selected.status_assinatura]}>
                    {STATUS_LABEL[selected.status_assinatura]}
                  </Badge>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {selected.lead?.empresa ?? selected.lead?.nome ?? "—"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {selected.quote ? (
                    <p className="text-xl font-semibold text-foreground">{formatBRL(selected.quote.valor_total)}</p>
                  ) : null}
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

              <div className="space-y-1.5 text-sm">
                {Object.entries(selected.campos).map(([k, v]) => (
                  <p key={k} className="text-foreground">
                    <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}: </span>
                    {String(v)}
                  </p>
                ))}
              </div>

              {selected.status_assinatura === "assinado" ? (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Assinado em {formatDate(selected.assinado_em)} — lançamento financeiro simulado gerado.
                </p>
              ) : null}

              {selected.status_assinatura === "rascunho" ? (
                <div className="space-y-3 border-t border-border pt-4">
                  {showSubmit ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="motivo-contrato">Motivo da solicitação</Label>
                      <Textarea
                        id="motivo-contrato"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ex: cláusula ajustada, prazo diferenciado…"
                        rows={2}
                      />
                    </div>
                  ) : null}
                  <div className="flex justify-end">
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
              ) : null}

              {selected.status_assinatura === "aprovado" || selected.status_assinatura === "aguardando_assinatura" ? (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button disabled={pending} onClick={handleMarkSigned}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Marcar como assinado
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Selecione um contrato para visualizar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
