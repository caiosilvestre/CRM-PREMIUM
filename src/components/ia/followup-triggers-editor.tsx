"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FollowupTriggers } from "@/lib/domain/settings";
import { saveFollowupTriggersAction } from "@/lib/actions/settings";

export function FollowupTriggersEditor({ gatilhos: initial }: { gatilhos: FollowupTriggers }) {
  const [gatilhos, setGatilhos] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveFollowupTriggersAction(gatilhos);
      toast.success("Gatilhos de follow-up salvos.");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-foreground">Mensagens-gatilho de follow-up automático</p>
          <p className="text-xs text-muted-foreground">
            Define quando a IA dispara uma mensagem de reengajamento automaticamente.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="trig-qualificacao">Sem resposta após qualificação (horas)</Label>
            <Input
              id="trig-qualificacao"
              type="number"
              min={1}
              value={gatilhos.sem_resposta_qualificacao_horas}
              onChange={(e) =>
                setGatilhos((prev) => ({ ...prev, sem_resposta_qualificacao_horas: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trig-orcamento">Orçamento enviado sem retorno (dias)</Label>
            <Input
              id="trig-orcamento"
              type="number"
              min={1}
              value={gatilhos.orcamento_enviado_sem_retorno_dias}
              onChange={(e) =>
                setGatilhos((prev) => ({ ...prev, orcamento_enviado_sem_retorno_dias: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={pending} onClick={handleSave}>
            {pending ? "Salvando…" : "Salvar gatilhos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
