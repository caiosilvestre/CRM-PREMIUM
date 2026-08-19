import { Wallet, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getFinanceSyncLogWithDetails } from "@/lib/data/store";
import { formatBRL, formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pendente_integracao: "Pendente de integração",
  sincronizado: "Sincronizado",
  erro: "Erro",
};

const STATUS_STYLE: Record<string, string> = {
  pendente_integracao: "border-amber-200 bg-amber-50 text-amber-700",
  sincronizado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  erro: "border-red-200 bg-red-50 text-red-700",
};

export default async function FinanceiroPage() {
  const entries = await getFinanceSyncLogWithDetails();
  const pendentes = entries.filter((e) => e.status === "pendente_integracao");
  const valorPendente = pendentes.reduce((sum, e) => sum + (Number((e.payload as { valor?: number } | null)?.valor) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lançamentos gerados ao fechar contratos. Integração com Conta Azul simulada nesta fase.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Lançamentos" value={String(entries.length)} icon={Wallet} />
        <KpiCard label="Pendentes de integração" value={String(pendentes.length)} icon={Clock} />
        <KpiCard label="Valor pendente de integração" value={formatBRL(valorPendente)} icon={Wallet} />
      </div>

      <Card>
        <CardContent className="p-5">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento ainda — feche um contrato para gerar o primeiro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => {
                    const valor = Number((e.payload as { valor?: number } | null)?.valor) || null;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-foreground">
                          {e.lead?.empresa ?? e.lead?.nome ?? "—"}
                        </TableCell>
                        <TableCell>{formatBRL(valor)}</TableCell>
                        <TableCell className="capitalize">{e.provider.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_STYLE[e.status]}>
                            {STATUS_LABEL[e.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(e.criado_em)}</TableCell>
                        <TableCell>
                          {e.status === "pendente_integracao" ? (
                            <Button size="sm" variant="outline" disabled>
                              Sincronizar (fase futura)
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
