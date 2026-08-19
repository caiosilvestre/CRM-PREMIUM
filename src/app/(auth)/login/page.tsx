import Link from "next/link";
import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; redirectTo?: string }>;
}) {
  const { error, notice, redirectTo } = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sidebar text-sidebar-primary font-semibold text-lg">
          PS
        </div>
        <CardTitle className="text-xl">Premium Services CRM</CardTitle>
        <CardDescription>Entre com sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@premiumservices.com.br" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-medium underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
