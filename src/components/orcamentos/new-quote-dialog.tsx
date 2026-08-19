"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { formatBRL } from "@/lib/format";
import type { CustomFieldDefinitionRow, CustomFieldValues, LeadRow, PricingRuleRow, QuoteItem } from "@/lib/types/database";
import { createQuoteDraftAction } from "@/lib/actions/quotes";

export function NewQuoteDialog({
  leads,
  pricingRules,
  customFields = [],
}: {
  leads: LeadRow[];
  pricingRules: PricingRuleRow[];
  customFields?: CustomFieldDefinitionRow[];
}) {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState<string>("");
  const [itens, setItens] = useState<QuoteItem[]>([]);
  const [condicoes, setCondicoes] = useState("Pagamento em 30 dias corridos.");
  const [servicoId, setServicoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [camposCustomizados, setCamposCustomizados] = useState<CustomFieldValues>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const ativos = pricingRules.filter((p) => p.ativo);
  const valorTotal = itens.reduce((sum, i) => sum + i.valor_total, 0);

  function addItem() {
    const rule = ativos.find((p) => p.id === servicoId);
    if (!rule) return;
    setItens((prev) => [
      ...prev,
      {
        descricao: rule.servico,
        quantidade,
        unidade: rule.unidade,
        valor_unitario: rule.preco,
        valor_total: rule.preco * quantidade,
      },
    ]);
    setServicoId("");
    setQuantidade(1);
  }

  function reset() {
    setLeadId("");
    setItens([]);
    setCondicoes("Pagamento em 30 dias corridos.");
    setServicoId("");
    setQuantidade(1);
    setCamposCustomizados({});
  }

  function handleCreate() {
    if (!leadId) {
      toast.error("Selecione o lead.");
      return;
    }
    if (itens.length === 0) {
      toast.error("Adicione ao menos um item.");
      return;
    }
    startTransition(async () => {
      try {
        const quoteId = await createQuoteDraftAction(leadId, itens, condicoes, camposCustomizados);
        toast.success("Orçamento criado como rascunho.");
        reset();
        setOpen(false);
        router.refresh();
        void quoteId;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível criar o orçamento.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo orçamento</DialogTitle>
          <DialogDescription>Monte o rascunho a partir da tabela de preços — o mesmo formato que a IA usa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={(v) => v && setLeadId(v)}>
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

          <div className="space-y-1.5">
            <Label>Itens</Label>
            <div className="flex gap-2">
              <Select value={servicoId} onValueChange={(v) => v && setServicoId(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Serviço">
                    {(value: string) => {
                      const rule = ativos.find((p) => p.id === value);
                      return rule ? `${rule.servico} (${formatBRL(rule.preco)}/${rule.unidade})` : "Serviço";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.servico} ({formatBRL(p.preco)}/{p.unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-20"
              />
              <Button type="button" variant="outline" size="icon" aria-label="Adicionar item" onClick={addItem} disabled={!servicoId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {itens.length > 0 ? (
              <div className="mt-2 space-y-1.5 rounded-lg border border-border p-2">
                {itens.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {item.descricao} × {item.quantidade}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatBRL(item.valor_total)}</span>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-medium text-foreground">
                  <span>Total</span>
                  <span>{formatBRL(valorTotal)}</span>
                </div>
              </div>
            ) : null}
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
            <Label htmlFor="condicoes-novo">Condições comerciais</Label>
            <Textarea id="condicoes-novo" value={condicoes} onChange={(e) => setCondicoes(e.target.value)} rows={2} />
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
