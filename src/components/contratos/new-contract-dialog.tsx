"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldDefinitionRow, CustomFieldValues, LeadRow, TemplateRow } from "@/lib/types/database";
import type { QuoteWithLead } from "@/lib/data/store";
import { formatBRL } from "@/lib/format";
import { createContractDraftAction } from "@/lib/actions/contracts";

export function NewContractDialog({
  leads,
  quotes,
  templates,
  customFields = [],
}: {
  leads: LeadRow[];
  quotes: QuoteWithLead[];
  templates: TemplateRow[];
  customFields?: CustomFieldDefinitionRow[];
}) {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [vigencia, setVigencia] = useState("12 meses");
  const [observacoes, setObservacoes] = useState("");
  const [camposCustomizados, setCamposCustomizados] = useState<CustomFieldValues>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const approvedQuotesForLead = quotes.filter(
    (q) => q.lead_id === leadId && (q.status === "aprovado" || q.status === "aprovado_com_ajuste" || q.status === "enviado"),
  );
  const selectedLead = leads.find((l) => l.id === leadId);

  function reset() {
    setLeadId("");
    setQuoteId("");
    setVigencia("12 meses");
    setObservacoes("");
    setCamposCustomizados({});
  }

  function handleCreate() {
    if (!leadId) {
      toast.error("Selecione o lead.");
      return;
    }
    startTransition(async () => {
      await createContractDraftAction(
        leadId,
        quoteId || null,
        templateId || null,
        {
          empresa: selectedLead?.empresa ?? selectedLead?.nome,
          vigencia,
          ...(observacoes ? { observacoes } : {}),
        },
        camposCustomizados,
      );
      toast.success("Contrato criado como rascunho.");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo contrato</DialogTitle>
          <DialogDescription>Gerado a partir de um modelo — campos principais preenchidos automaticamente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={(v) => { if (v) { setLeadId(v); setQuoteId(""); } }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o lead">
                  {(value: string) => leads.find((l) => l.id === value)?.empresa ?? leads.find((l) => l.id === value)?.nome ?? "Selecione o lead"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.empresa ?? l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {leadId ? (
            <div className="space-y-1.5">
              <Label>Orçamento aprovado (opcional)</Label>
              <Select value={quoteId} onValueChange={(v) => setQuoteId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum">
                    {(value: string) => {
                      const q = approvedQuotesForLead.find((q) => q.id === value);
                      return q ? `v${q.versao} — ${formatBRL(q.valor_total)}` : "Nenhum";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {approvedQuotesForLead.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      v{q.versao} — {formatBRL(q.valor_total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione">
                    {(value: string) => templates.find((t) => t.id === value)?.nome ?? "Selecione"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vigencia">Vigência</Label>
              <Input id="vigencia" value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
            </div>
          </div>

          {customFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label>{field.rotulo}</Label>
              <Select
                value={camposCustomizados[field.chave] ?? ""}
                onValueChange={(v) => v && setCamposCustomizados((prev) => ({ ...prev, [field.chave]: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Selecione ${field.rotulo.toLowerCase()}`}>
                    {(value: string) => field.opcoes.find((o) => o.valor === value)?.rotulo ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.opcoes.map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>
                      {o.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending} onClick={handleCreate}>
            {pending ? "Criando…" : "Criar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
