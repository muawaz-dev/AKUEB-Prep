import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UPDATES } from "@/lib/updates";
import { WHATS_NEXT } from "@/lib/whatsNext";

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
      <div className="text-lg font-medium mb-1.5">{title}</div>
      <p className="text-base text-black/60 dark:text-white/60">{text}</p>
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-8 pt-20 pb-16 flex flex-col gap-4">
        <p className="text-sm font-medium text-brand dark:text-blue-400">
          {user ? `Welcome back${user.name ? `, ${user.name}` : ""}` : "AKU-EB Maths"}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold">Resources For Agha Khan Board Students</h1>
        <p className="text-lg text-black/60 dark:text-white/60 max-w-prose">
          AKU-EB Maths is a free learning platform built for students studying the Agha Khan
          Board syllabus - structured lessons, practice questions, and progress tracking, all
          in one place.
        </p>
        <Link
          href="/courses"
          className="mt-3 w-fit bg-brand text-white rounded px-5 py-2.5 text-base font-medium hover:bg-brand/90"
        >
          Browse Courses
        </Link>
      </section>

      {/* Features */}
      <section className="border-t border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto w-full px-8 py-16">
          <h2 className="text-2xl font-semibold mb-8">What you&apos;ll find here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeatureCard
              title="Lesson-by-lesson courses"
              text="Structured units and topics that follow the AKU-EB syllabus."
            />
            <FeatureCard
              title="Practice questions"
              text="Check your understanding as you go, with instant feedback."
            />
            <FeatureCard
              title="Progress tracking"
              text="See what you've completed and pick up right where you left off."
            />
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className="max-w-6xl mx-auto w-full px-8 py-16 flex flex-col gap-8">
        <h2 className="text-2xl font-semibold">Updates</h2>
        <div className="flex flex-col gap-6">
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
        <div className="max-w-6xl mx-auto w-full px-8 py-16">
          <h2 className="text-2xl font-semibold mb-2">What&apos;s Next?</h2>
          <p className="text-base text-black/60 dark:text-white/60 mb-8 max-w-prose">
            Here&apos;s what&apos;s coming to AKU-EB Maths.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        <div className="max-w-6xl mx-auto w-full px-8 py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Ready to start?</h2>
            <p className="text-base text-white/70 mt-1">Jump into your courses and pick up where you left off.</p>
          </div>
          <Link
            href="/courses"
            className="w-fit bg-white text-brand rounded px-5 py-2.5 text-base font-medium hover:bg-white/90"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    </div>
  );
}
