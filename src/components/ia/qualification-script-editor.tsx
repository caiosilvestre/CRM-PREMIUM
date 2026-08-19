"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { QualificationQuestion } from "@/lib/domain/settings";
import { saveQualificationScriptAction } from "@/lib/actions/settings";

export function QualificationScriptEditor({ perguntas: initial }: { perguntas: QualificationQuestion[] }) {
  const [perguntas, setPerguntas] = useState(initial);
  const [pending, startTransition] = useTransition();

  function move(index: number, dir: -1 | 1) {
    setPerguntas((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((p, i) => ({ ...p, ordem: i + 1 }));
    });
  }

  function updateText(index: number, texto: string) {
    setPerguntas((prev) => prev.map((p, i) => (i === index ? { ...p, pergunta: texto } : p)));
  }

  function remove(index: number) {
    setPerguntas((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, ordem: i + 1 })));
  }

  function add() {
    setPerguntas((prev) => [...prev, { ordem: prev.length + 1, pergunta: "" }]);
  }

  function handleSave() {
    if (perguntas.some((p) => !p.pergunta.trim())) {
      toast.error("Nenhuma pergunta pode ficar em branco.");
      return;
    }
    startTransition(async () => {
      await saveQualificationScriptAction(perguntas);
      toast.success("Script de qualificação salvo.");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-foreground">Perguntas do script de qualificação</p>
          <p className="text-xs text-muted-foreground">
            A IA faz essas perguntas, em ordem, para qualificar o lead antes de montar o orçamento.
          </p>
        </div>
        <div className="space-y-2">
          {perguntas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <span className="w-5 shrink-0 text-sm text-muted-foreground">{p.ordem}.</span>
              <Input value={p.pergunta} onChange={(e) => updateText(i, e.target.value)} className="flex-1" />
              <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon-sm" variant="ghost" disabled={i === perguntas.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar pergunta
          </Button>
          <Button size="sm" disabled={pending} onClick={handleSave}>
            {pending ? "Salvando…" : "Salvar script"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
