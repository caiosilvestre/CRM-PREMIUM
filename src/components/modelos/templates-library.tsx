"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { CustomFieldDefinitionRow, CustomFieldValues, TemplateRow, TemplateType } from "@/lib/types/database";
import { saveTemplateAction, deleteTemplateAction } from "@/lib/actions/templates";
import { ManageFieldsButton } from "@/components/campos-customizados/manage-fields-button";

const FILTERS = ["todos", "orcamento", "contrato"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABEL: Record<Filter, string> = { todos: "Todos", orcamento: "Orçamento", contrato: "Contrato" };

export function TemplatesLibrary({
  templates: initial,
  customFields = [],
  isAdmin = false,
}: {
  templates: TemplateRow[];
  customFields?: CustomFieldDefinitionRow[];
  isAdmin?: boolean;
}) {
  const [templates, setTemplates] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setTemplates(initial);
  }

  const [filter, setFilter] = useState<Filter>("todos");
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = templates.filter((t) => filter === "todos" || t.tipo === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ManageFieldsButton entidade="modelo" fields={customFields} isAdmin={isAdmin} />
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Novo Modelo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Nenhum modelo cadastrado ainda.
            </CardContent>
          </Card>
        ) : (
          filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="gap-1 capitalize">
                    {t.tipo === "orcamento" ? <FileText className="h-3 w-3" /> : <FileSignature className="h-3 w-3" />}
                    {t.tipo}
                  </Badge>
                  <span className="text-xs text-muted-foreground">v{t.versao}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{t.nome}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.conteudo}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Atualizado em {formatDate(t.atualizado_em)}</span>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditing(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeletingId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TemplateFormDialog
        open={creating}
        customFields={customFields.filter((f) => f.ativo)}
        onOpenChange={setCreating}
        onSaved={(t) => setTemplates((prev) => [t, ...prev])}
      />
      <TemplateFormDialog
        open={editing !== null}
        template={editing}
        customFields={customFields.filter((f) => f.ativo)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={(t) => setTemplates((prev) => prev.map((p) => (p.id === t.id ? t : p)))}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deletingId) return;
                await deleteTemplateAction(deletingId);
                setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
                setDeletingId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TemplateFormDialog({
  open,
  template,
  customFields = [],
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  template?: TemplateRow | null;
  customFields?: CustomFieldDefinitionRow[];
  onOpenChange: (open: boolean) => void;
  onSaved: (t: TemplateRow) => void;
}) {
  const [tipo, setTipo] = useState<TemplateType>(template?.tipo ?? "orcamento");
  const [nome, setNome] = useState(template?.nome ?? "");
  const [conteudo, setConteudo] = useState(template?.conteudo ?? "");
  const [camposCustomizados, setCamposCustomizados] = useState<CustomFieldValues>(template?.campos_customizados ?? {});
  const [pending, startTransition] = useTransition();

  const [prevTemplate, setPrevTemplate] = useState(template);
  if (template !== prevTemplate) {
    setPrevTemplate(template);
    setTipo(template?.tipo ?? "orcamento");
    setNome(template?.nome ?? "");
    setConteudo(template?.conteudo ?? "");
    setCamposCustomizados(template?.campos_customizados ?? {});
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveTemplateAction({ id: template?.id, tipo, nome, conteudo, camposCustomizados });
        toast.success(template ? "Modelo atualizado." : "Modelo criado.");
        onSaved({
          id: template?.id ?? `optimistic-${Date.now()}`,
          tipo,
          nome,
          conteudo,
          versao: (template?.versao ?? 0) + 1,
          criado_por: template?.criado_por ?? null,
          atualizado_em: new Date().toISOString(),
          campos_customizados: camposCustomizados,
        });
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar o modelo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? "Editar modelo" : "Novo modelo"}</DialogTitle>
          <DialogDescription>
            {template ? `Editar incrementa a versão (atual: v${template.versao}).` : "Modelos reutilizáveis de orçamento ou contrato."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => v && setTipo(v as TemplateType)} disabled={!!template}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => (value === "orcamento" ? "Orçamento" : "Contrato")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-nome">Nome</Label>
              <Input id="tpl-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-conteudo">Conteúdo</Label>
            <Textarea
              id="tpl-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={8}
              placeholder="Use {{variavel}} para campos preenchidos automaticamente (empresa, valor_total, vigencia...)"
            />
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
