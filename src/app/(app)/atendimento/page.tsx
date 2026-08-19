import { AtendimentoView } from "@/components/atendimento/atendimento-view";
import { getConversationsFull, getProfiles } from "@/lib/data/store";

export default async function AtendimentoPage() {
  const conversations = await getConversationsFull();
  const profiles = await getProfiles();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Central de Atendimento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conversas do WhatsApp — IA e humano.</p>
      </div>
      <AtendimentoView conversations={conversations} profiles={profiles} />
    </div>
  );
}
