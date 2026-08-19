"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomFieldDefinitionRow } from "@/lib/types/database";
import { deleteCustomFieldAction } from "@/lib/actions/settings";
import { FieldFormDialog, ENTIDADE_LABEL } from "@/components/campos-customizados/field-form-dialog";

export function CustomFieldsTab({ fields, isAdmin }: { fields: CustomFieldDefinitionRow[]; isAdmin: boolean }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteCustomFieldAction(id);
        toast.success("Campo removido.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível remover o campo.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Campos customizados</p>
            <p className="text-xs text-muted-foreground">
              Adicione seletores próprios ao cadastro de lead, orçamento, contrato ou modelo — sem precisar de
              código. O mesmo gerenciador também aparece ao lado do botão de cadastro em cada uma dessas telas.
            </p>
          </div>
          {isAdmin ? (
            <FieldFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Novo campo
                </Button>
              }
            />
          ) : null}
        </div>

        {fields.length === 0 ? (
          <p className="rounded-lg bg-secondary/60 p-4 text-center text-sm text-muted-foreground">
            Nenhum campo customizado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{f.rotulo}</p>
                    <Badge variant="outline">{ENTIDADE_LABEL[f.entidade]}</Badge>
                    {f.usar_em_relatorios ? <Badge variant="outline">Filtro/Relatórios</Badge> : null}
                    {!f.ativo ? <Badge variant="outline">Inativo</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {f.opcoes.map((o) => o.rotulo).join(" · ")}
                  </p>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <FieldFormDialog
                      field={f}
                      trigger={
                        <Button size="icon-sm" variant="ghost">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pendingId === f.id}
                      onClick={() => handleDelete(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
