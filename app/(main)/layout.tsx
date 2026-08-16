import { SiteHeader } from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <AppShell>{children}</AppShell>
    </div>
  );
}
