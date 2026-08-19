"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  KanbanSquare,
  Bot,
  Library,
  FileText,
  ClipboardCheck,
  FileSignature,
  CheckSquare,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import type { ProfileRow } from "@/lib/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atendimento", label: "Central de Atendimento", icon: MessageCircle },
  { href: "/funil", label: "Funil", icon: KanbanSquare },
  { href: "/ia", label: "Agente de IA", icon: Bot },
  { href: "/modelos", label: "Propostas/Contratos", icon: Library },
  { href: "/orcamentos", label: "Orçamento", icon: FileText },
  { href: "/aprovacoes", label: "Fila de Aprovação", icon: ClipboardCheck },
  { href: "/contratos", label: "Contrato", icon: FileSignature },
  { href: "/followups", label: "Follow-up/Tarefas", icon: CheckSquare },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar({ profile }: { profile: ProfileRow }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          PS
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Premium Services</p>
          <p className="text-xs text-sidebar-foreground/60">CRM Comercial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{profile.nome}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {profile.perfil === "admin" ? "Admin" : "Comercial/Financeiro"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
