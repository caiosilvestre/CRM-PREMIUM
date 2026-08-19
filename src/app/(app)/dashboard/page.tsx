import { Users, TrendingUp, Wallet, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PendenciasBlock } from "@/components/dashboard/pendencias-block";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  getLeads,
  getApprovalsWithMeta,
  getFollowupsWithMeta,
  getConversationsWithMeta,
  getRecentActivity,
} from "@/lib/data/store";
import { FUNNEL_STAGES } from "@/lib/domain/funnel";
import type { FunnelStage } from "@/lib/types/database";
import { formatBRL } from "@/lib/format";

export default async function DashboardPage() {
  const leads = await getLeads();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const leadsNoMes = leads.filter((l) => new Date(l.criado_em) >= startOfMonth).length;

  const fechados = leads.filter((l) => l.etapa_funil === "fechado");
  const perdidos = leads.filter((l) => l.etapa_funil === "perdido");
  const totalDecididos = fechados.length + perdidos.length;
  const taxaConversao = totalDecididos > 0 ? Math.round((fechados.length / totalDecididos) * 100) : 0;
  const ticketMedio =
    fechados.length > 0
      ? fechados.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0) / fechados.length
      : 0;

  const followups = await getFollowupsWithMeta();
  const followupsPendentes = followups.filter((f) => f.statusEfetivo !== "concluido").length;
  const followupsAtrasados = followups.filter((f) => f.statusEfetivo === "atrasado").length;

  const approvals = await getApprovalsWithMeta("pendente");
  const conversas = await getConversationsWithMeta();
  const conversasSemResposta = conversas.filter(
    (c) => c.aguardandoRespostaMinutos !== null && c.aguardandoRespostaMinutos > 30,
  ).length;

  const counts = Object.fromEntries(
    FUNNEL_STAGES.map((s) => [s.value, leads.filter((l) => l.etapa_funil === s.value).length]),
  ) as Record<FunnelStage, number>;

  const activity = await getRecentActivity(8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral do funil comercial e das pendências do dia.</p>
      </div>

      <PendenciasBlock
        aprovacoesPendentes={approvals.length}
        followupsAtrasados={followupsAtrasados}
        conversasSemResposta={conversasSemResposta}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Leads no mês" value={String(leadsNoMes)} icon={Users} />
        <KpiCard label="Taxa de conversão" value={`${taxaConversao}%`} icon={TrendingUp} subtitle={`${fechados.length} fechados de ${totalDecididos} decididos`} />
        <KpiCard label="Ticket médio" value={formatBRL(ticketMedio)} icon={Wallet} subtitle="Contratos fechados" />
        <KpiCard label="Follow-ups pendentes" value={String(followupsPendentes)} icon={CheckSquare} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Funil de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart counts={counts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity entries={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
