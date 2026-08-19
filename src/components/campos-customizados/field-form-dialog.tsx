"use client";

import { useState, useTransition } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldDefinitionRow, CustomFieldEntity, CustomFieldOption } from "@/lib/types/database";
import { createCustomFieldAction, updateCustomFieldAction } from "@/lib/actions/settings";

export const ENTIDADE_LABEL: Record<CustomFieldEntity, string> = {
  lead: "Cadastro de lead",
  orcamento: "Orçamento",
  contrato: "Contrato",
  modelo: "Modelo",
};

function emptyOptions(): CustomFieldOption[] {
  return [
    { valor: "", rotulo: "" },
    { valor: "", rotulo: "" },
  ];
}

export function FieldFormDialog({
  field,
  entidade,
  lockEntidade = false,
  trigger,
}: {
  field?: CustomFieldDefinitionRow;
  entidade?: CustomFieldEntity;
  lockEntidade?: boolean;
  trigger: React.ReactElement;
}) {
  const isEdit = Boolean(field);
  const [open, setOpen] = useState(false);
  const [entidadeValue, setEntidadeValue] = useState<CustomFieldEntity>(field?.entidade ?? entidade ?? "lead");
  const [rotulo, setRotulo] = useState(field?.rotulo ?? "");
  const [opcoes, setOpcoes] = useState<CustomFieldOption[]>(field?.opcoes ?? emptyOptions());
  const [usarEmRelatorios, setUsarEmRelatorios] = useState(field?.usar_em_relatorios ?? false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setEntidadeValue(field?.entidade ?? entidade ?? "lead");
    setRotulo(field?.rotulo ?? "");
    setOpcoes(field?.opcoes ?? emptyOptions());
    setUsarEmRelatorios(field?.usar_em_relatorios ?? false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (isEdit && field) {
          await updateCustomFieldAction(field.id, {
            rotulo,
            opcoes,
            usarEmRelatorios,
            ativo: field.ativo,
          });
          toast.success("Campo atualizado.");
        } else {
          await createCustomFieldAction({ entidade: entidadeValue, rotulo, opcoes, usarEmRelatorios });
          toast.success("Campo criado.");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar o campo.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar campo" : "Novo campo customizado"}</DialogTitle>
          <DialogDescription>
            Cria uma lista de opções que aparece como um seletor na tela escolhida.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {lockEntidade ? null : (
            <div className="space-y-1.5">
              <Label>Onde aparece</Label>
              <Select
                value={entidadeValue}
                onValueChange={(v) => v && setEntidadeValue(v as CustomFieldEntity)}
                disabled={isEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => ENTIDADE_LABEL[value as CustomFieldEntity]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENTIDADE_LABEL) as CustomFieldEntity[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTIDADE_LABEL[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="campo-rotulo">Nome do campo</Label>
            <Input
              id="campo-rotulo"
              value={rotulo}
              onChange={(e) => setRotulo(e.target.value)}
              placeholder="Ex: Tipo de serviço"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Opções</Label>
            <div className="space-y-2">
              {opcoes.map((o, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={o.rotulo}
                    onChange={(e) =>
                      setOpcoes((prev) => prev.map((p, i) => (i === idx ? { ...p, rotulo: e.target.value } : p)))
                    }
                    placeholder={`Opção ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={opcoes.length <= 2}
                    onClick={() => setOpcoes((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpcoes((prev) => [...prev, { valor: "", rotulo: "" }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar opção
            </Button>
          </div>
          {entidadeValue === "lead" ? (
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Usar em Orçamentos e Relatórios</p>
                <p className="text-xs text-muted-foreground">
                  Cria um filtro em Orçamentos e um bloco de ticket médio em Relatórios.
                </p>
              </div>
              <Switch checked={usarEmRelatorios} onCheckedChange={(c) => setUsarEmRelatorios(c === true)} />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button disabled={pending} onClick={handleSave}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
