"use client";

import { useRef, useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLeadAction } from "@/lib/actions/leads";
import type { CustomFieldDefinitionRow } from "@/lib/types/database";

const ORIGEM_LABEL: Record<string, string> = {
  indicacao: "Indicação",
  site: "Site",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export function NewLeadDialog({ customFields = [] }: { customFields?: CustomFieldDefinitionRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createLeadAction(formData);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            Cadastro manual — para leads que não vêm do WhatsApp (indicação, site, etc.).
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do contato</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" name="empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" placeholder="+55 84 9..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="origem">Origem</Label>
              <Select name="origem" defaultValue="indicacao">
                <SelectTrigger id="origem" className="w-full">
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
              <Label htmlFor="valor_estimado">Valor estimado (R$)</Label>
              <Input id="valor_estimado" name="valor_estimado" type="number" min="0" step="0.01" />
            </div>
          </div>
          {customFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`campo_${field.chave}`}>{field.rotulo}</Label>
              <Select name={`campo_${field.chave}`}>
                <SelectTrigger id={`campo_${field.chave}`} className="w-full">
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
              {pending ? "Salvando…" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
