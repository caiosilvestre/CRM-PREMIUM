import { KanbanBoard } from "@/components/funil/kanban-board";
import { NewLeadDialog } from "@/components/funil/new-lead-dialog";
import { ManageFieldsButton } from "@/components/campos-customizados/manage-fields-button";
import { getLeads, getCustomFieldDefinitions } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function FunilPage() {
  const leads = await getLeads();
  const profile = await getCurrentProfile();
  const allCustomFields = await getCustomFieldDefinitions("lead", false);
  const activeCustomFields = allCustomFields.filter((f) => f.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Funil / Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste os cards entre as etapas. Clique em um card para abrir a ficha do lead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManageFieldsButton entidade="lead" fields={allCustomFields} isAdmin={profile?.perfil === "admin"} />
          <NewLeadDialog customFields={activeCustomFields} />
        </div>
      </div>

      <KanbanBoard leads={leads} />
    </div>
  );
}
