import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classLevelToSlug, slugify } from "@/lib/slugs";
import Image from "next/image";
// Site-wide, so it's the one link Google can rely on finding from any page
// to reach /question-bank/[classLevel]/[subject] - see the sibling
// SubjectQuestionBankPage for why that page needs a real, indexable entry
// point besides the sitemap.
export async function Footer() {
  const combos = await prisma.question.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["classId", "subjectId"],
    select: { class: { select: { level: true } }, subject: { select: { name: true } } },
    orderBy: { class: { level: "asc" } },
  });

  return (
    <footer className="bg-brand text-white mt-auto">
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col sm:flex-row gap-8 text-sm text-white/70">
        <div className="flex-1">
           <Link href="/courses" className="text-lg font-semibold">
          <Image
          src="/logo.png" 
          alt="Logo"
          width={400}
          height={400}
          className="h-24 w-auto"
          />
        </Link>
          <p className="mt-1 max-w-xs">Free AKU-EB question bank - chapter-wise practice and past papers with instant grading.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-white/50 uppercase tracking-wide text-xs">Site</span>
          <Link href="/question-bank" className="hover:underline hover:text-white w-fit">
            Question Bank
          </Link>
          <Link href="/courses" className="hover:underline hover:text-white w-fit">
            Courses
          </Link>
          <Link href="/about" className="hover:underline hover:text-white w-fit">
            About
          </Link>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-white/50 uppercase tracking-wide text-xs">Legal</span>
          <Link href="/privacy-policy" className="hover:underline hover:text-white w-fit">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:underline hover:text-white w-fit">
            Terms of Service
          </Link>
        </div>

        {combos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-white/50 uppercase tracking-wide text-xs">Browse by subject</span>
            {combos.map(({ class: cls, subject }) => (
              <Link
                key={`${cls.level}-${subject.name}`}
                href={`/question-bank/${classLevelToSlug(cls.level)}/${slugify(subject.name)}`}
                className="hover:underline hover:text-white w-fit"
              >
                {classLevelToSlug(cls.level).toUpperCase()} {subject.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
