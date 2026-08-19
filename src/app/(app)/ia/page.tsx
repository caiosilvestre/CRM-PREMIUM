import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualificationScriptEditor } from "@/components/ia/qualification-script-editor";
import { BusinessHoursEditor } from "@/components/ia/business-hours-editor";
import { FollowupTriggersEditor } from "@/components/ia/followup-triggers-editor";
import { PricingTableEditor } from "@/components/ia/pricing-table-editor";
import { TestChat } from "@/components/ia/test-chat";
import { getSetting, getPricingRules } from "@/lib/data/store";
import type { QualificationScript, BusinessHours, FollowupTriggers } from "@/lib/domain/settings";

export default async function AgenteIAPage() {
  const script = (await getSetting("script_qualificacao")) as QualificationScript;
  const horario = (await getSetting("horario_atendimento")) as BusinessHours;
  const gatilhos = (await getSetting("gatilhos_followup")) as FollowupTriggers;
  const pricingRules = await getPricingRules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuração do Agente de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Script de qualificação, horário de atendimento, gatilhos de follow-up e tabela de preços usados pela IA no
          WhatsApp.
        </p>
      </div>

      <Tabs defaultValue="script">
        <TabsList>
          <TabsTrigger value="script">Script de Qualificação</TabsTrigger>
          <TabsTrigger value="horario">Horário de Atendimento</TabsTrigger>
          <TabsTrigger value="gatilhos">Gatilhos de Follow-up</TabsTrigger>
          <TabsTrigger value="precos">Tabela de Preços</TabsTrigger>
          <TabsTrigger value="teste">Chat de Teste</TabsTrigger>
        </TabsList>
        <TabsContent value="script" className="mt-4">
          <QualificationScriptEditor perguntas={script.perguntas} />
        </TabsContent>
        <TabsContent value="horario" className="mt-4">
          <BusinessHoursEditor horario={horario} />
        </TabsContent>
        <TabsContent value="gatilhos" className="mt-4">
          <FollowupTriggersEditor gatilhos={gatilhos} />
        </TabsContent>
        <TabsContent value="precos" className="mt-4">
          <PricingTableEditor rules={pricingRules} />
        </TabsContent>
        <TabsContent value="teste" className="mt-4">
          <TestChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
