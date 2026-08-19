"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomFieldDefinitionRow, CustomFieldEntity } from "@/lib/types/database";
import { deleteCustomFieldAction } from "@/lib/actions/settings";
import { FieldFormDialog, ENTIDADE_LABEL } from "./field-form-dialog";

export function ManageFieldsButton({
  entidade,
  fields,
  isAdmin,
}: {
  entidade: CustomFieldEntity;
  fields: CustomFieldDefinitionRow[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!isAdmin) return null;

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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Settings2 className="h-4 w-4" />
        Gerenciar campos
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Campos customizados — {ENTIDADE_LABEL[entidade]}</DialogTitle>
          <DialogDescription>Crie, edite ou remova os seletores extras desta tela.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="rounded-lg bg-secondary/60 p-4 text-center text-sm text-muted-foreground">
              Nenhum campo customizado ainda.
            </p>
          ) : (
            fields.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{f.rotulo}</p>
                    {!f.ativo ? <Badge variant="outline">Inativo</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {f.opcoes.map((o) => o.rotulo).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <FieldFormDialog
                    field={f}
                    lockEntidade
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
              </div>
            ))
          )}
        </div>

        <FieldFormDialog
          entidade={entidade}
          lockEntidade
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Novo campo
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
