import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
