"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOTIVOS_PERDA } from "@/lib/domain/funnel";

export function LostReasonDialog({
  open,
  leadNome,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  leadNome: string | null;
  onCancel: () => void;
  onConfirm: (motivo: string, detalhe: string | null) => void;
}) {
  const [motivo, setMotivo] = useState<string>(MOTIVOS_PERDA[0]);
  const [detalhe, setDetalhe] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            {leadNome ? `${leadNome} — ` : ""}informe o motivo da perda antes de mover para essa etapa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="motivo-perda">Motivo</Label>
            <Select value={motivo} onValueChange={(value) => value && setMotivo(value)}>
              <SelectTrigger id="motivo-perda" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_PERDA.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-detalhe">Detalhes (opcional)</Label>
            <Textarea
              id="motivo-detalhe"
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              placeholder="Algum detalhe adicional sobre a perda…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(motivo, detalhe.trim() || null);
              setMotivo(MOTIVOS_PERDA[0]);
              setDetalhe("");
            }}
          >
            Confirmar perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
