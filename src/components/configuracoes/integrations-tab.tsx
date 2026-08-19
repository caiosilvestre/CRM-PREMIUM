"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, Wallet, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { configureWhatsAppWebhookAction } from "@/lib/actions/settings";

export function IntegrationsTab({
  whatsappConfigured,
  webhookUrl,
  appUrlIsPublic,
  isAdmin,
}: {
  whatsappConfigured: boolean;
  webhookUrl: string | null;
  appUrlIsPublic: boolean;
  isAdmin: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function copyWebhookUrl() {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfigureWebhook() {
    if (!webhookUrl) return;
    startTransition(async () => {
      try {
        await configureWhatsAppWebhookAction(webhookUrl);
        toast.success("Webhook configurado na UAZAPI.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível configurar o webhook.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">WhatsApp (UAZAPI)</p>
              {whatsappConfigured ? (
                <Badge variant="outline" className="mt-0.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-0.5 border-amber-200 bg-amber-50 text-amber-700">
                  Credenciais pendentes
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Provedor de WhatsApp usado pela Central de Atendimento para enviar e receber mensagens.
          </p>
          {whatsappConfigured ? null : (
            <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              Preencha <code className="text-foreground">UAZAPI_BASE_URL</code> e{" "}
              <code className="text-foreground">UAZAPI_TOKEN</code> no <code className="text-foreground">.env.local</code>{" "}
              com os dados da sua instância.
            </p>
          )}
          {webhookUrl ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">URL de webhook</p>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs text-foreground">
                  {webhookUrl}
                </code>
                <Button size="icon-sm" variant="outline" onClick={copyWebhookUrl}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {!appUrlIsPublic ? (
                <p className="text-xs text-amber-700">
                  NEXT_PUBLIC_APP_URL ainda aponta para localhost — a UAZAPI não vai conseguir alcançar essa URL até o
                  app estar publicado (ou com um túnel como ngrok).
                </p>
              ) : null}
              {isAdmin && whatsappConfigured ? (
                <Button size="sm" variant="outline" disabled={pending} onClick={handleConfigureWebhook}>
                  {pending ? "Configurando…" : "Configurar webhook na UAZAPI"}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              Defina <code className="text-foreground">WHATSAPP_WEBHOOK_SECRET</code> no{" "}
              <code className="text-foreground">.env.local</code> (qualquer texto aleatório) para gerar a URL de
              webhook.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Conta Azul</p>
              <Badge variant="outline" className="mt-0.5 border-border text-muted-foreground">
                Não conectado
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Lançamento financeiro automático ao fechar um contrato.</p>
          <Button variant="outline" size="sm" disabled className="w-full">
            Conectar (disponível em fase futura)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
