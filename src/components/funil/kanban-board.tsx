"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KanbanCard } from "./kanban-card";
import { LostReasonDialog } from "./lost-reason-dialog";
import { FUNNEL_STAGES } from "@/lib/domain/funnel";
import { moveLeadStageAction, markLeadLostAction } from "@/lib/actions/leads";
import type { FunnelStage, LeadRow } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function KanbanBoard({ leads: initialLeads }: { leads: LeadRow[] }) {
  const [leads, setLeads] = useState(initialLeads);

  // initialLeads is a fresh array on every server render (see getLeads()),
  // so this resyncs local state after a server action revalidates the page —
  // by then the mock store already reflects our own optimistic change.
  // Adjusting state during render (React's documented pattern for this,
  // instead of an Effect) keeps it in sync without an extra render pass.
  const [prevInitialLeads, setPrevInitialLeads] = useState(initialLeads);
  if (initialLeads !== prevInitialLeads) {
    setPrevInitialLeads(initialLeads);
    setLeads(initialLeads);
  }

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<FunnelStage | null>(null);
  const [pendingLost, setPendingLost] = useState<LeadRow | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const byStage = useMemo(() => {
    const map = new Map<FunnelStage, LeadRow[]>();
    for (const stage of FUNNEL_STAGES) map.set(stage.value, []);
    for (const lead of leads) map.get(lead.etapa_funil)?.push(lead);
    return map;
  }, [leads]);

  function moveTo(leadId: string, stage: FunnelStage) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa_funil: stage, etapa_atualizada_em: new Date().toISOString() } : l)));
    startTransition(async () => {
      await moveLeadStageAction(leadId, stage);
    });
  }

  function handleDrop(stage: FunnelStage) {
    setDragOverStage(null);
    if (!draggingId) return;
    const lead = leads.find((l) => l.id === draggingId);
    setDraggingId(null);
    if (!lead || lead.etapa_funil === stage) return;

    if (stage === "perdido") {
      setPendingLost(lead);
      return;
    }
    moveTo(lead.id, stage);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {FUNNEL_STAGES.map((stage) => {
          const stageLeads = byStage.get(stage.value) ?? [];
          const isDragOver = dragOverStage === stage.value;
          return (
            <div
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.value);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.value ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(stage.value);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-secondary/40 p-2 transition-colors",
                isDragOver && "border-primary bg-accent/10",
              )}
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <h3 className="text-sm font-medium text-foreground">{stage.label}</h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {stageLeads.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 px-0.5 py-1">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    <KanbanCard
                      lead={lead}
                      onDragStart={(e) => {
                        setDraggingId(lead.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    />
                  </div>
                ))}
                {stageLeads.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nenhum lead</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <LostReasonDialog
        open={pendingLost !== null}
        leadNome={pendingLost?.empresa ?? pendingLost?.nome ?? null}
        onCancel={() => setPendingLost(null)}
        onConfirm={(motivo, detalhe) => {
          if (!pendingLost) return;
          const leadId = pendingLost.id;
          setLeads((prev) =>
            prev.map((l) =>
              l.id === leadId
                ? { ...l, etapa_funil: "perdido", etapa_atualizada_em: new Date().toISOString(), motivo_perda: motivo, motivo_perda_detalhe: detalhe }
                : l,
            ),
          );
          setPendingLost(null);
          startTransition(async () => {
            await markLeadLostAction(leadId, motivo, detalhe);
          });
        }}
      />
    </>
  );
}
