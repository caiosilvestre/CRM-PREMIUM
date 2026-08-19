import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sidebar text-sidebar-primary font-semibold text-lg">
          PS
        </div>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>Premium Services CRM</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" type="text" placeholder="Seu nome" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@premiumservices.com.br" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Criar conta
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium underline">
            Entrar
          </Link>
          . Novas contas entram como perfil comercial/financeiro por padrão —
          permissões de admin são promovidas depois em Configurações.
        </p>
      </CardContent>
    </Card>
  );
}
