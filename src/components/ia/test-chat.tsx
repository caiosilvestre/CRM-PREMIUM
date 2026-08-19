"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bot, Send, User as UserIcon, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { sendTestChatMessageAction } from "@/lib/actions/ia-chat";
import type { ChatTurn } from "@/lib/ai/generate-reply";

interface TestMessage extends ChatTurn {
  id: string;
}

export function TestChat() {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    const userMessage: TestMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      const result = await sendTestChatMessageAction(nextMessages.map(({ role, content }) => ({ role, content })));
      if (result.ok) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result.reply }]);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Falha ao gerar resposta da IA.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Chat de teste do agente de IA</p>
            <p className="text-xs text-muted-foreground">
              Simule uma conversa de WhatsApp para testar o script de qualificação e a tabela de preços. Nada aqui é
              enviado a contatos reais — a IA ainda não responde automaticamente no WhatsApp.
            </p>
          </div>
          {messages.length > 0 ? (
            <Button size="sm" variant="outline" onClick={() => setMessages([])} disabled={sending}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          ) : null}
        </div>

        <ScrollArea className="h-[420px] rounded-lg border border-border bg-muted/30 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Digite abaixo como se fosse o lead para ver como a IA responde.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const fromLead = m.role === "user";
                return (
                  <div key={m.id} className={cn("flex", fromLead ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        fromLead ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground",
                      )}
                    >
                      <p className="mb-0.5 flex items-center gap-1 text-[11px] font-medium opacity-80">
                        {fromLead ? (
                          <>
                            <UserIcon className="h-3 w-3" /> Lead (você)
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3" /> IA
                          </>
                        )}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              })}
              {sending ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-primary/60 px-3.5 py-2 text-sm text-primary-foreground">
                    Digitando…
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva como se fosse o lead…"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
