"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadAction } from "@/lib/actions/leads";
import type { CustomFieldDefinitionRow, LeadRow } from "@/lib/types/database";

const ORIGEM_LABEL: Record<string, string> = {
  indicacao: "Indicação",
  site: "Site",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export function EditLeadDialog({
  lead,
  customFields = [],
}: {
  lead: LeadRow;
  customFields?: CustomFieldDefinitionRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateLeadAction(lead.id, formData);
        toast.success("Lead atualizado.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar as alterações.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
          <DialogDescription>Altere as informações do cadastro.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-nome">Nome do contato</Label>
            <Input id="edit-nome" name="nome" defaultValue={lead.nome} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-empresa">Empresa</Label>
            <Input id="edit-empresa" name="empresa" defaultValue={lead.empresa ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                name="telefone"
                placeholder="+55 84 9..."
                defaultValue={lead.contato_telefone ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" name="email" type="email" defaultValue={lead.contato_email ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-origem">Origem</Label>
              <Select name="origem" defaultValue={lead.origem}>
                <SelectTrigger id="edit-origem" className="w-full">
                  <SelectValue>{(value: string) => ORIGEM_LABEL[value] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-valor_estimado">Valor estimado (R$)</Label>
              <Input
                id="edit-valor_estimado"
                name="valor_estimado"
                type="number"
                min="0"
                step="0.01"
                defaultValue={lead.valor_estimado ?? ""}
              />
            </div>
          </div>
          {customFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`edit-campo_${field.chave}`}>{field.rotulo}</Label>
              <Select name={`campo_${field.chave}`} defaultValue={lead.campos_customizados?.[field.chave] ?? undefined}>
                <SelectTrigger id={`edit-campo_${field.chave}`} className="w-full">
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
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
