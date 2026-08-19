import { redirect } from "next/navigation";
import { ApprovalQueue } from "@/components/aprovacoes/approval-queue";
import { getApprovalsWithMeta } from "@/lib/data/store";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function AprovacoesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const all = await getApprovalsWithMeta();
  const pending = all.filter((a) => a.status === "pendente");
  const history = all.filter((a) => a.status !== "pendente");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fila de Aprovação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orçamentos e contratos aguardando decisão, com histórico de aprovações e reprovações.
        </p>
      </div>
      <ApprovalQueue pending={pending} history={history} currentUser={profile} />
    </div>
  );
}
