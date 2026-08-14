import { SiteHeader } from "@/components/SiteHeader";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
