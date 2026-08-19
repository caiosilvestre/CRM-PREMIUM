import { ReportsView } from "@/components/relatorios/reports-view";
import { getLeads, getCustomFieldDefinitions } from "@/lib/data/store";

export default async function RelatoriosPage() {
  const leads = await getLeads();
  const customFields = (await getCustomFieldDefinitions("lead")).filter((f) => f.usar_em_relatorios);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Funil por etapa, origem dos leads, motivos de perda e desempenho por período.
        </p>
      </div>
      <ReportsView leads={leads} customFields={customFields} />
    </div>
  );
}
