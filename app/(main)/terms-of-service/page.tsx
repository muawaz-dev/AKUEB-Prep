import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section>
        <div className="max-w-4xl mx-auto w-full px-8 pt-20 pb-12 flex flex-col gap-4">
          <p className="text-sm font-medium text-brand dark:text-blue-400">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-semibold">Terms of Service</h1>
          <p className="text-lg text-black/60 dark:text-white/60 max-w-prose">
            Please read these terms before using AKUEB Prep. By using the site, you agree to
            them.
          </p>
          <p className="text-sm text-black/40 dark:text-white/40">Last updated: 21 August 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="max-w-4xl mx-auto w-full px-8 py-16">
          <div className="prose-content text-black/80 dark:text-white/80">
            <h2>Not an official AKU-EB site</h2>
            <p>
              AKUEB Prep is an independent, free practice resource built by a student for AKU-EB
              students. It is <strong>not affiliated with, endorsed by, or operated on behalf of
              the Aga Khan University Examination Board (AKU-EB)</strong>. Any references to
              AKU-EB, its syllabus, or its past papers are for educational, non-commercial
              identification purposes only. For official information, results, or past papers,
              always refer to the official AKU-EB website.
            </p>

            <h2>Acceptance of these terms</h2>
            <p>
              By creating an account or using AKUEB Prep, you agree to these Terms of Service and
              our <Link href="/privacy-policy">Privacy Policy</Link>. If you don&apos;t agree,
              please don&apos;t use the site.
            </p>

            <h2>What we offer</h2>
            <p>
              AKUEB Prep provides free, chapter-wise practice questions and past papers for
              AKU-EB students, with instant grading and progress tracking. The site is a work in
              progress, maintained on a best-effort basis alongside the developer&apos;s own
              coursework, and features or content may change or be added over time.
            </p>

            <h2>Accounts</h2>
            <ul>
              <li>You must provide accurate information (such as your email) when creating an account.</li>
              <li>You&apos;re responsible for keeping your login credentials secure and for activity that happens under your account.</li>
              <li>Let us know at <a href="mailto:akuebprep@gmail.com">akuebprep@gmail.com</a> if you suspect unauthorized use of your account.</li>
            </ul>

            <h2>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the site for any unlawful purpose or in a way that disrupts it for other students.</li>
              <li>Attempt to gain unauthorized access to accounts, data, or systems not belonging to you.</li>
              <li>Scrape, copy, or redistribute the site&apos;s content or question bank at scale without permission.</li>
              <li>Misrepresent AKUEB Prep as an official AKU-EB product or service.</li>
            </ul>

            <h2>Content accuracy</h2>
            <p>
              Explanations and grading on AKUEB Prep are written and reviewed by hand against the
              AKU-EB syllabus, but the site is provided on an educational, best-effort basis.
              We don&apos;t guarantee that every question, answer, or explanation is free of
              errors, and content here should be used to supplement - not replace - your official
              textbooks, teachers, and AKU-EB&apos;s own past papers and syllabus documents.
            </p>

            <h2>Points and progress</h2>
            <p>
              Points, streaks, and progress shown on your profile are for motivation and
              tracking only. They have no monetary value, cannot be redeemed, transferred, or
              exchanged, and don&apos;t constitute an official AKU-EB grade, credential, or
              record.
            </p>

            <h2>Intellectual property</h2>
            <p>
              Past papers and syllabus content referenced on AKUEB Prep remain the property of
              AKU-EB and are used here for non-commercial, educational practice purposes.
              Explanations, site design, and original content are owned by AKUEB Prep unless
              stated otherwise, and may not be reproduced or redistributed without permission.
            </p>

            <h2>No warranty</h2>
            <p>
              AKUEB Prep is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
              warranties of any kind, whether express or implied, including as to accuracy,
              reliability, or fitness for a particular purpose. We don&apos;t guarantee
              uninterrupted or error-free access to the site.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, AKUEB Prep and its developer are not liable
              for any indirect, incidental, or consequential damages - including exam outcomes or
              results - arising from your use of, or inability to use, the site.
            </p>

            <h2>Termination</h2>
            <p>
              We may suspend or terminate access to AKUEB Prep, for any account, if these terms
              are violated or if we discontinue the service. You may stop using the site or
              request account deletion at any time.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms as the site evolves. Continuing to use AKUEB Prep after
              changes take effect means you accept the updated terms.
            </p>

            <h2>Governing law</h2>
            <p>These terms are governed by the laws of Pakistan, without regard to conflict-of-law principles.</p>

            <h2>Contact us</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:akuebprep@gmail.com">akuebprep@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
