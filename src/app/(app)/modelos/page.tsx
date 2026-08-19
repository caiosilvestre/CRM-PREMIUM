import { TemplatesLibrary } from "@/components/modelos/templates-library";
import { getTemplates, getCustomFieldDefinitions } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function ModelosPage() {
  const templates = await getTemplates();
  const profile = await getCurrentProfile();
  const customFields = await getCustomFieldDefinitions("modelo", false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Biblioteca de Propostas/Contratos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Modelos reutilizáveis — crie, edite e versione.</p>
      </div>
      <TemplatesLibrary templates={templates} customFields={customFields} isAdmin={profile?.perfil === "admin"} />
    </div>
  );
}
