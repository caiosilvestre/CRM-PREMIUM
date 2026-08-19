import { QuotesView } from "@/components/orcamentos/quotes-view";
import { getQuotes, getLeads, getPricingRules, getCustomFieldDefinitions } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function OrcamentosPage() {
  const quotes = await getQuotes();
  const leads = await getLeads();
  const pricingRules = await getPricingRules();
  const profile = await getCurrentProfile();
  const orcamentoCustomFields = await getCustomFieldDefinitions("orcamento", false);
  const leadFilterFields = (await getCustomFieldDefinitions("lead")).filter((f) => f.usar_em_relatorios);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orçamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite itens e condições antes de enviar para aprovação — nenhum orçamento vai ao cliente sem aprovação humana.
        </p>
      </div>
      <QuotesView
        quotes={quotes}
        leads={leads}
        pricingRules={pricingRules}
        customFields={orcamentoCustomFields}
        leadFilterFields={leadFilterFields}
        isAdmin={profile?.perfil === "admin"}
      />
    </div>
  );
}
