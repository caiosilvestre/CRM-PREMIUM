"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileRow } from "@/lib/types/database";
import { updateUserPermissionsAction } from "@/lib/actions/settings";

export function UsersTab({ profiles, currentUser }: { profiles: ProfileRow[]; currentUser: ProfileRow }) {
  const isAdmin = currentUser.perfil === "admin";
  const [edits, setEdits] = useState<Record<string, { limite: number; podeContrato: boolean }>>(
    Object.fromEntries(
      profiles.map((p) => [p.id, { limite: p.limite_aprovacao_orcamento, podeContrato: p.pode_aprovar_contrato }]),
    ),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save(id: string) {
    const edit = edits[id];
    setPendingId(id);
    startTransition(async () => {
      try {
        await updateUserPermissionsAction(id, edit.limite, edit.podeContrato);
        toast.success("Permissões atualizadas.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        {!isAdmin ? (
          <p className="mb-4 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
            Apenas o Admin pode alterar permissões de aprovação. Você pode visualizar os valores atuais.
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Limite p/ aprovar orçamento (R$)</TableHead>
                <TableHead>Pode aprovar contrato</TableHead>
                {isAdmin ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {p.perfil === "admin" ? "Admin" : "Comercial/Financeiro"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-32"
                      disabled={!isAdmin || p.perfil === "admin"}
                      value={edits[p.id].limite}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], limite: Number(e.target.value) } }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      disabled={!isAdmin || p.perfil === "admin"}
                      checked={edits[p.id].podeContrato}
                      onCheckedChange={(checked) =>
                        setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], podeContrato: checked === true } }))
                      }
                    />
                  </TableCell>
                  {isAdmin ? (
                    <TableCell>
                      {p.perfil !== "admin" ? (
                        <Button size="sm" variant="outline" disabled={pendingId === p.id} onClick={() => save(p.id)}>
                          Salvar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Acesso total</span>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
