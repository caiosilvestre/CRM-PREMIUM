"use client";

import { useMemo, useState } from "react";
import { Users, TrendingUp, Wallet, Handshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { BarList } from "./bar-list";
import { PeriodSelector } from "./period-selector";
import { getPeriodRange, isWithinRange, type PeriodPreset } from "@/lib/domain/periods";
import { FUNNEL_STAGES } from "@/lib/domain/funnel";
import { formatBRL } from "@/lib/format";
import type { CustomFieldDefinitionRow, LeadRow, FunnelStage, LeadOrigin } from "@/lib/types/database";

const ORIGEM_LABEL: Record<LeadOrigin, string> = {
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  site: "Site",
  outro: "Outro",
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsView({
  leads,
  customFields = [],
}: {
  leads: LeadRow[];
  customFields?: CustomFieldDefinitionRow[];
}) {
  const [preset, setPreset] = useState<PeriodPreset>("este_mes");
  const [customFrom, setCustomFrom] = useState(todayISODate());
  const [customTo, setCustomTo] = useState(todayISODate());

  const range = useMemo(() => getPeriodRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const filtered = useMemo(() => leads.filter((l) => isWithinRange(l.criado_em, range)), [leads, range]);

  const fechados = filtered.filter((l) => l.etapa_funil === "fechado");
  const perdidos = filtered.filter((l) => l.etapa_funil === "perdido");
  const totalDecididos = fechados.length + perdidos.length;
  const taxaConversao = totalDecididos > 0 ? Math.round((fechados.length / totalDecididos) * 100) : 0;
  const ticketMedio =
    fechados.length > 0 ? fechados.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0) / fechados.length : 0;
  const valorTotalFechado = fechados.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0);

  const stageCounts = Object.fromEntries(
    FUNNEL_STAGES.map((s) => [s.value, filtered.filter((l) => l.etapa_funil === s.value).length]),
  ) as Record<FunnelStage, number>;

  const origemCounts = (Object.keys(ORIGEM_LABEL) as LeadOrigin[]).map((o) => ({
    label: ORIGEM_LABEL[o],
    count: filtered.filter((l) => l.origem === o).length,
  }));

  const motivosCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of perdidos) {
      if (!l.motivo_perda) continue;
      counts.set(l.motivo_perda, (counts.get(l.motivo_perda) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [perdidos]);

  const ticketMedioPorCampo = customFields.map((field) => ({
    field,
    linhas: field.opcoes.map((opcao) => {
      const doGrupo = fechados.filter((l) => l.campos_customizados?.[field.chave] === opcao.valor);
      const ticket =
        doGrupo.length > 0 ? doGrupo.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0) / doGrupo.length : 0;
      return { rotulo: opcao.rotulo, count: doGrupo.length, ticket };
    }),
  }));

  return (
    <div className="space-y-6">
      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Leads no período" value={String(filtered.length)} icon={Users} />
        <KpiCard
          label="Taxa de conversão"
          value={`${taxaConversao}%`}
          icon={TrendingUp}
          subtitle={`${fechados.length} fechados de ${totalDecididos} decididos`}
        />
        <KpiCard label="Ticket médio" value={formatBRL(ticketMedio)} icon={Wallet} />
        <KpiCard label="Valor total fechado" value={formatBRL(valorTotalFechado)} icon={Handshake} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart counts={stageCounts} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Origem dos leads</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList items={origemCounts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Motivos de perda</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList items={motivosCounts} />
            </CardContent>
          </Card>

          {ticketMedioPorCampo.map(({ field, linhas }) => (
            <Card key={field.id}>
              <CardHeader>
                <CardTitle className="text-base">Ticket médio por {field.rotulo.toLowerCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                {linhas.every((l) => l.count === 0) ? (
                  <p className="text-sm text-muted-foreground">Sem contratos fechados no período.</p>
                ) : (
                  <div className="space-y-3">
                    {linhas.map((l) => (
                      <div key={l.rotulo} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {l.rotulo} <span className="text-xs">({l.count} fechado{l.count === 1 ? "" : "s"})</span>
                        </span>
                        <span className="font-medium text-foreground">{formatBRL(l.ticket)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
