"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PricingRuleRow } from "@/lib/types/database";
import { savePricingRulesAction } from "@/lib/actions/settings";

let tempSeq = 0;

export function PricingTableEditor({ rules: initial }: { rules: PricingRuleRow[] }) {
  const [rules, setRules] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update(id: string, patch: Partial<PricingRuleRow>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function add() {
    tempSeq += 1;
    setRules((prev) => [
      ...prev,
      { id: `new-${tempSeq}`, servico: "", unidade: "posto/mês", preco: 0, ativo: true, atualizado_em: new Date().toISOString() },
    ]);
  }

  function handleSave() {
    if (rules.some((r) => !r.servico.trim())) {
      toast.error("Todo serviço precisa de um nome.");
      return;
    }
    startTransition(async () => {
      await savePricingRulesAction(rules);
      toast.success("Tabela de preços salva.");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-foreground">Tabela de preços e regras de precificação</p>
          <p className="text-xs text-muted-foreground">
            Usada pela IA para montar o rascunho de orçamento após a qualificação.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Preço (R$)</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Input value={r.servico} onChange={(e) => update(r.id, { servico: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={r.unidade} onChange={(e) => update(r.id, { unidade: e.target.value })} className="w-32" />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={r.preco}
                      onChange={(e) => update(r.id, { preco: Number(e.target.value) })}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch checked={r.ativo} onCheckedChange={(checked) => update(r.id, { ativo: checked === true })} />
                  </TableCell>
                  <TableCell>
                    <Button size="icon-sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar serviço
          </Button>
          <Button size="sm" disabled={pending} onClick={handleSave}>
            {pending ? "Salvando…" : "Salvar tabela de preços"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
