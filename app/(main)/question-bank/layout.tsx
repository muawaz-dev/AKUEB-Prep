// Exists so revalidatePath("/question-bank", "layout") (see
// app/admin/questions/actions.ts and app/admin/chapters/actions.ts) actually
// cascades to every nested page beneath it - class, subject, chapter, and
// past-paper pages all live under this segment. Per Next.js's own docs, the
// "layout" revalidation type only reaches nested pages if a real layout.tsx
// file exists at the matched segment; without one here, those admin actions
// were silently no-ops for anything but the /question-bank page itself,
// leaving nested pages stuck showing stale content until their hourly
// `revalidate` window expired on its own.
export default function QuestionBankLayout({ children }: { children: React.ReactNode }) {
  return children;
}
