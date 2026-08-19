import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsTab } from "@/components/configuracoes/integrations-tab";
import { UsersTab } from "@/components/configuracoes/users-tab";
import { CustomFieldsTab } from "@/components/configuracoes/custom-fields-tab";
import { getProfiles, getCustomFieldDefinitions } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const profiles = await getProfiles();
  const customFields = await getCustomFieldDefinitions(undefined, false);
  const whatsappConfigured = Boolean(process.env.UAZAPI_BASE_URL && process.env.UAZAPI_TOKEN);
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_SECRET
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhooks/whatsapp/${process.env.WHATSAPP_WEBHOOK_SECRET}`
    : null;
  const appUrlIsPublic = Boolean(
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações e Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">Integrações externas e permissões de aprovação por usuário.</p>
      </div>

      <Tabs defaultValue="integracoes">
        <TabsList>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="campos">Campos customizados</TabsTrigger>
        </TabsList>
        <TabsContent value="integracoes" className="mt-4">
          <IntegrationsTab
            whatsappConfigured={whatsappConfigured}
            webhookUrl={webhookUrl}
            appUrlIsPublic={appUrlIsPublic}
            isAdmin={profile.perfil === "admin"}
          />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <UsersTab profiles={profiles} currentUser={profile} />
        </TabsContent>
        <TabsContent value="campos" className="mt-4">
          <CustomFieldsTab fields={customFields} isAdmin={profile.perfil === "admin"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
