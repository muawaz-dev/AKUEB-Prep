import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UPDATES } from "@/lib/updates";
import { WHATS_NEXT } from "@/lib/whatsNext";
import { Footer } from "@/components/Footer";
function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-6">
      <div className="text-lg font-medium mb-1.5">{title}</div>
      <p className="text-base text-white/70">{text}</p>
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div>

    <div className="flex flex-col">
      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-8 pt-24 pb-20 flex flex-col gap-5">
        <p className="text-sm font-medium text-brand dark:text-blue-400">
          {user ? `Welcome back${user.name ? `, ${user.name}` : ""}` : "AKUEB Prep"}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold">AKUEB Past Papers & Practice Questions</h1>
        <p className="text-lg text-black/60 dark:text-white/60 max-w-prose">
          AKUEB Prep is a free question bank built for AKU-EB students - chapter-wise MCQs and
          past papers you can practice online, graded instantly, with progress tracking built in.
        </p>
        <p className="text-sm text-black/40 dark:text-white/40 max-w-prose">
          AKUEB Prep is an independent, student-built site and is not an official AKU-EB service.
        </p>
        <Link
          href="/question-bank"
          className="mt-3 w-fit bg-brand text-white rounded px-5 py-2.5 text-base font-medium hover:bg-brand/90"
        >
          Open the Question Bank
        </Link>
      </section>

      {/* Features */}
      <section className="bg-brand text-white">
        <div className="max-w-6xl mx-auto w-full px-8 py-20">
          <h2 className="text-2xl font-semibold mb-10">What you&apos;ll find here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FeatureCard
              title="Chapter-wise practice"
              text="MCQs and other question types for every chapter, filterable by topic and difficulty."
            />
            <FeatureCard
              title="Past papers"
              text="Work through real AKU-EB past papers online, with instant grading instead of a plain PDF."
            />
            <FeatureCard
              title="Progress tracking"
              text="See what you've solved and pick up right where you left off."
            />
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className="max-w-6xl mx-auto w-full px-8 py-20 flex flex-col gap-10">
        <h2 className="text-2xl font-semibold">Updates</h2>
        <div className="flex flex-col gap-7">
          {UPDATES.map((update) => (
            <div key={update.title} className="flex gap-4">
              <span className="shrink-0 w-24 pt-0.5 text-xs font-medium text-black/40 dark:text-white/40">
                {update.date}
              </span>
              <div>
                <div className="text-lg font-medium">{update.title}</div>
                <p className="text-base text-black/60 dark:text-white/60 mt-0.5">{update.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Next */}
      <section className="border-t border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto w-full px-8 py-20">
          <h2 className="text-2xl font-semibold mb-2">What&apos;s Next?</h2>
          <p className="text-base text-black/60 dark:text-white/60 mb-10 max-w-prose">
            Here&apos;s what&apos;s coming to AKU-EB Maths.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {WHATS_NEXT.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6"
              >
                <div className="text-lg font-medium mb-1.5">{item.title}</div>
                <p className="text-base text-black/60 dark:text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-black/10 dark:border-white/10 bg-brand text-white">
        <div className="max-w-6xl mx-auto w-full px-8 py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Ready to practice?</h2>
            <p className="text-base text-white/70 mt-1">Jump into the question bank and pick up where you left off.</p>
          </div>
          <Link
            href="/question-bank"
            className="w-fit bg-white text-brand rounded px-5 py-2.5 text-base font-medium hover:bg-white/90"
          >
            Open the Question Bank
          </Link>
        </div>
      </section>
    </div>
      <Footer/>
    </div>
  );
}
