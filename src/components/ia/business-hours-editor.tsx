"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DIAS_SEMANA, type BusinessHours } from "@/lib/domain/settings";
import { saveBusinessHoursAction } from "@/lib/actions/settings";

export function BusinessHoursEditor({ horario: initial }: { horario: BusinessHours }) {
  const [horario, setHorario] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggleDay(key: keyof BusinessHours["dias"], atende: boolean) {
    setHorario((prev) => ({
      ...prev,
      dias: { ...prev.dias, [key]: atende ? { inicio: "08:00", fim: "18:00" } : null },
    }));
  }

  function updateTime(key: keyof BusinessHours["dias"], field: "inicio" | "fim", value: string) {
    setHorario((prev) => {
      const current = prev.dias[key];
      if (!current) return prev;
      return { ...prev, dias: { ...prev.dias, [key]: { ...current, [field]: value } } };
    });
  }

  function handleSave() {
    startTransition(async () => {
      await saveBusinessHoursAction(horario);
      toast.success("Horário de atendimento salvo.");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-foreground">Horário de atendimento automático</p>
          <p className="text-xs text-muted-foreground">
            Fuso horário: {horario.timezone}. Fora desse horário, a IA apenas confirma o recebimento e agenda
            retorno humano para o próximo dia útil, sem qualificar.
          </p>
        </div>
        <div className="space-y-2">
          {DIAS_SEMANA.map(({ key, label }) => {
            const day = horario.dias[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <Checkbox checked={day !== null} onCheckedChange={(checked) => toggleDay(key, checked === true)} />
                <span className="w-20 text-sm text-foreground">{label}</span>
                {day ? (
                  <>
                    <Input
                      type="time"
                      value={day.inicio}
                      onChange={(e) => updateTime(key, "inicio", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={day.fim}
                      onChange={(e) => updateTime(key, "fim", e.target.value)}
                      className="w-32"
                    />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={pending} onClick={handleSave}>
            {pending ? "Salvando…" : "Salvar horário"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
