import { FollowupsView } from "@/components/followups/followups-view";
import { getFollowupsWithMeta, getConversationsFull } from "@/lib/data/store";
import type { ConversationFull } from "@/lib/data/store";

export default async function FollowupsPage() {
  const followups = await getFollowupsWithMeta();
  const conversations = await getConversationsFull();
  const conversationsByLead: Record<string, ConversationFull | undefined> = {};
  for (const c of conversations) conversationsByLead[c.lead_id] = c;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Follow-up / Tarefas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tarefas de acompanhamento comercial por lead.</p>
      </div>
      <FollowupsView followups={followups} conversationsByLead={conversationsByLead} />
    </div>
  );
}
