import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, Calendar, User as UserIcon, History, FileText, Files } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompleteFollowupButton } from "@/components/followups/complete-followup-button";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { DeleteLeadButton } from "@/components/leads/delete-lead-button";
import {
  getLeadById,
  getActivityLogForLead,
  getQuotesForLead,
  getContractsForLead,
  getFollowupsWithMeta,
  getProfileById,
  getCustomFieldDefinitions,
} from "@/lib/data/store";
import { STAGE_LABEL } from "@/lib/domain/funnel";
import { formatBRL, formatDate, formatDateTime, formatRelative } from "@/lib/format";

const QUOTE_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  aprovado_com_ajuste: "Aprovado com ajuste",
  reprovado: "Reprovado",
  enviado: "Enviado",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const activity = await getActivityLogForLead(id);
  const quotes = await getQuotesForLead(id);
  const contracts = await getContractsForLead(id);
  const followups = (await getFollowupsWithMeta()).filter((f) => f.lead_id === id);
  const responsavel = await getProfileById(lead.responsavel_id);
  const proximaAcaoResponsavel = await getProfileById(lead.proxima_acao_responsavel_id);
  const customFields = await getCustomFieldDefinitions("lead");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/funil" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao funil
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{lead.empresa ?? lead.nome}</h1>
            <p className="text-sm text-muted-foreground">{lead.nome}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{STAGE_LABEL[lead.etapa_funil]}</Badge>
            <Badge variant="outline" className="capitalize">{lead.origem}</Badge>
            {responsavel ? <Badge variant="outline">Responsável: {responsavel.nome}</Badge> : null}
            <EditLeadDialog lead={lead} customFields={customFields} />
            <DeleteLeadButton leadId={lead.id} leadNome={lead.empresa ?? lead.nome} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {lead.contato_telefone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {lead.contato_telefone}
            </span>
          ) : null}
          {lead.contato_email ? (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {lead.contato_email}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> lead desde {formatDate(lead.criado_em)}
          </span>
          {lead.valor_estimado ? (
            <span className="font-medium text-foreground">{formatBRL(lead.valor_estimado)}</span>
          ) : null}
        </div>
      </div>

      {/* Bloco fixo — Próxima ação */}
      <Card className="border-primary/30 bg-accent/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próxima ação</p>
            {lead.proxima_acao_descricao ? (
              <p className="mt-1 text-sm font-medium text-foreground">{lead.proxima_acao_descricao}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Nenhuma ação agendada.</p>
            )}
          </div>
          {lead.proxima_acao_data ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatRelative(lead.proxima_acao_data)}
              </span>
              {proximaAcaoResponsavel ? (
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> {proximaAcaoResponsavel.nome}
                </span>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {lead.etapa_funil === "perdido" && lead.motivo_perda ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-destructive">Motivo da perda</p>
            <p className="mt-1 text-sm text-foreground">{lead.motivo_perda}</p>
            {lead.motivo_perda_detalhe ? (
              <p className="mt-1 text-sm text-muted-foreground">{lead.motivo_perda_detalhe}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos/Contratos</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Lead criado ({lead.origem})</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(lead.criado_em)}</p>
                  </div>
                </li>
                {activity.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{entry.autor?.nome ?? "Sistema"}</span> — {entry.acao}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.criado_em)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
              <Files className="h-8 w-8 text-muted-foreground/60" />
              Nenhum documento anexado ainda.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-4 space-y-3">
          {quotes.length === 0 && contracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
                <FileText className="h-8 w-8 text-muted-foreground/60" />
                Nenhum orçamento ou contrato vinculado ainda.
              </CardContent>
            </Card>
          ) : null}
          {quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Orçamento v{q.versao}</p>
                  <p className="text-xs text-muted-foreground">Criado em {formatDate(q.criado_em)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatBRL(q.valor_total)}</span>
                  <Badge variant="outline">{QUOTE_STATUS_LABEL[q.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {contracts.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Contrato</p>
                  <p className="text-xs text-muted-foreground">Criado em {formatDate(c.criado_em)}</p>
                </div>
                <Badge variant="outline">{CONTRACT_STATUS_LABEL[c.status_assinatura]}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-2">
          {followups.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Nenhum follow-up cadastrado para este lead.
              </CardContent>
            </Card>
          ) : (
            followups.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-foreground">{f.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(f.data)} · {f.responsavel?.nome ?? "—"}
                    </p>
                  </div>
                  {f.statusEfetivo === "concluido" ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Concluído
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      {f.statusEfetivo === "atrasado" ? (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                          Atrasado
                        </Badge>
                      ) : null}
                      <CompleteFollowupButton id={f.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
