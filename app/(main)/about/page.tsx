import Link from "next/link";
import { Footer } from "@/components/Footer";
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3.5 6 8.5 7 8.5-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path
        d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.2.9-1.2 1.8v.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HandPenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 11.5h5.5a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2.5" />
      <path d="M5.5 11.5V9a1.4 1.4 0 0 1 2.8 0v2" />
      <path d="M13 12.5 20 5.5l1.5 1.5-7 7" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 12 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 16 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.5 2.5 2.5L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M3 17 9.5 10.5 13.5 14.5 21 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z" strokeLinejoin="round" />
      <path d="M6 10.7v4.3c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.3M22 8.5V15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHeading({
  icon,
  children,
  invert,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  invert?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          invert ? "bg-white/15 text-white" : "bg-brand/10 text-brand dark:bg-blue-400/10 dark:text-blue-400"
        }`}
      >
        {icon}
      </span>
      <h2 className="text-2xl font-semibold">{children}</h2>
    </div>
  );
}

const FEATURES: { icon: React.ReactNode; title: string; text: string }[] = [
  {
    icon: <CheckCircleIcon className="w-5 h-5" />,
    title: "Instant, automatic grading",
    text: "MCQs, numeric answers, true/false, and fill-in-the-blanks are all graded the second you submit - no waiting, no flipping to an answer key at the back of a PDF.",
  },
  {
    icon: <HandPenIcon className="w-5 h-5" />,
    title: "Hand-checked explanations",
    text: "Every explanation is written and reviewed by hand against the AKU-EB syllabus, not auto-generated - so it actually explains the reasoning, not just the answer.",
  },
  {
    icon: <LayersIcon className="w-5 h-5" />,
    title: "All your prep in one place",
    text: "Lessons, chapter-wise practice, and past papers all live on one platform - no juggling scattered PDFs, answer keys, and separate trackers.",
  },
  {
    icon: <TrendingUpIcon className="w-5 h-5" />,
    title: "Progress that carries forward",
    text: "Solved questions and points roll into your profile, so you always know which chapters are strong and which still need work.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section>
        <div className="max-w-4xl mx-auto w-full px-8 pt-24 pb-20 flex flex-col gap-5">
          <p className="text-sm font-medium text-brand dark:text-blue-400">About AKUEB Prep</p>
          <h1 className="text-4xl sm:text-5xl font-semibold">Built to make AKU-EB practice actually work</h1>
          <p className="text-lg text-black/60 dark:text-white/60 max-w-prose">
            A free, student-built question bank for AKU-EB students - solve chapter-wise questions
            and past papers online, get graded instantly, and watch your progress add up.
          </p>
          <Link
            href="/question-bank"
            className="mt-3 w-fit bg-brand text-white rounded px-5 py-2.5 text-base font-medium hover:bg-brand/90"
          >
            Open the Question Bank
          </Link>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="max-w-4xl mx-auto w-full px-8 py-20 flex flex-col gap-5">
          <SectionHeading icon={<CompassIcon className="w-5 h-5" />}>Why we built this</SectionHeading>
          <p className="text-base text-black/70 dark:text-white/70">
            AKU-EB students prepare mostly from scanned past papers and static PDFs. You solve a
            question, flip to the back for the answer, and move on - there&apos;s no feedback on
            why an answer is right, no sense of which chapters are weak, and no record of what
            you&apos;ve already covered.
          </p>
          <div className="rounded-xl border-l-4 border-brand dark:border-blue-400 bg-brand/5 dark:bg-blue-400/5 p-5">
            <p className="text-base text-black/80 dark:text-white/80">
              AKUEB Prep turns that into something you can actually practice with - built
              specifically for the AKU-EB syllabus, free to use, and made by a student sitting the
              same exams.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-brand text-white">
        <div className="max-w-4xl mx-auto w-full px-8 py-20 flex flex-col gap-10">
          <SectionHeading icon={<HelpCircleIcon className="w-5 h-5" />} invert>
            How it works
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/15 bg-white/10 p-6 flex flex-col gap-3"
              >
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/15 text-white">
                  {f.icon}
                </span>
                <div className="text-lg font-medium">{f.title}</div>
                <p className="text-sm text-white/70">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact AKUEB Prep */}
      <section className="max-w-4xl mx-auto w-full px-8 py-20 flex flex-col gap-6">
        <SectionHeading icon={<MessageCircleIcon className="w-5 h-5" />}>Contact AKUEB Prep</SectionHeading>
        <p className="text-base text-black/70 dark:text-white/70 max-w-prose">
          Questions, feedback, or found a mistake in a question? Get in touch.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:akuebprep@gmail.com"
            className="w-fit flex items-center gap-2.5 bg-brand text-white rounded-full pl-3 pr-5 py-2 text-base font-medium hover:bg-brand/90"
          >
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <MailIcon className="w-4 h-4" />
            </span>
            akuebprep@gmail.com
          </a>
          <a
            href="https://www.instagram.com/akuebprep/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit flex items-center gap-2.5 bg-brand text-white rounded-full pl-3 pr-5 py-2 text-base font-medium hover:bg-brand/90"
          >
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <InstagramIcon className="w-4 h-4" />
            </span>
            @akuebprep
          </a>
        </div>
      </section>

      {/* Developer */}
      <section className="border-t border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto w-full px-8 py-20 flex flex-col gap-7">
          <SectionHeading icon={<GraduationCapIcon className="w-5 h-5" />}>The developer</SectionHeading>

          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 flex flex-col sm:flex-row gap-5">
            
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-lg font-medium">Muawaz Ahmad</div>
                <div className="text-sm text-black/50 dark:text-white/50">
                  2nd Year Student, AKU-EB &bull; Developer of AKUEB Prep
                </div>
              </div>
              <p className="text-base text-black/70 dark:text-white/70">
                I&apos;m an AKU-EB student myself, currently in 2nd year. I built AKUEB Prep because
                I wanted the practice tool I couldn&apos;t find. It&apos;s a work in progress, built
                and maintained solo alongside my own coursework.
              </p>
              <div className="flex items-center gap-3 mt-1">
                <a
                  href="https://github.com/muawaz-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-9 h-9 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand dark:hover:text-blue-400"
                >
                  <GitHubIcon className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/muawaz-ahmad/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand dark:hover:text-blue-400"
                >
                  <LinkedInIcon className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://www.instagram.com/muawaz_dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand dark:hover:text-blue-400"
                >
                  <InstagramIcon className="w-4.5 h-4.5" />
                </a>
                <a
                  href="mailto:muawaz8@gmail.com"
                  aria-label="Email"
                  className="w-9 h-9 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand dark:hover:text-blue-400"
                >
                  <MailIcon className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-brand text-white">
        <div className="max-w-4xl mx-auto w-full px-8 py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <Footer/>
    </div>
  );
}
