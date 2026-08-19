import { ContractsView } from "@/components/contratos/contracts-view";
import { getContracts, getLeads, getQuotes, getTemplates, getCustomFieldDefinitions } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function ContratosPage() {
  const contracts = await getContracts();
  const leads = await getLeads();
  const quotes = await getQuotes();
  const templates = await getTemplates();
  const profile = await getCurrentProfile();
  const customFields = await getCustomFieldDefinitions("contrato", false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contrato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerado a partir de modelo. Assinatura confirmada manualmente nesta fase.
        </p>
      </div>
      <ContractsView
        contracts={contracts}
        leads={leads}
        quotes={quotes}
        templates={templates}
        customFields={customFields}
        isAdmin={profile?.perfil === "admin"}
      />
    </div>
  );
}
