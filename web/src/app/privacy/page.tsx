import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Applywise",
  description:
    "How Applywise collects, uses, stores, and protects your data, including resume information.",
};

const UPDATED = "June 25, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back to Applywise
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-accent [&_strong]:text-foreground">
        <section>
          <p>
            Applywise (&quot;we&quot;, &quot;us&quot;) provides a browser extension and web
            application that help you manage your job search — parsing your resume,
            autofilling application forms, and generating tailored content. This
            policy explains what we collect and how we use it.
          </p>
        </section>

        <section>
          <h2>Information we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account info:</strong> your name, email, and profile picture
              from Google Sign-In, used solely to identify your account.
            </li>
            <li>
              <strong>Resume &amp; profile data:</strong> the resume PDF you upload and
              the structured profile extracted from it (contact details, work
              experience, education, skills, projects, and similar fields you
              provide or edit).
            </li>
            <li>
              <strong>Usage data:</strong> counts of premium AI actions you perform
              each day and your credit balance, used to enforce free limits and
              billing.
            </li>
            <li>
              <strong>Payment data:</strong> when you buy credits, payments are
              processed by Razorpay. We store an order/payment reference and the
              credits granted. We do not store your card or UPI details.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use your information</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To parse your resume and autofill job application forms on your behalf.</li>
            <li>To generate cover letters, referral messages, and other content you request.</li>
            <li>To sync your profile between the extension and the web dashboard.</li>
            <li>To enforce daily free limits and apply purchased credits.</li>
          </ul>
        </section>

        <section>
          <h2>AI processing</h2>
          <p>
            To extract your profile and generate content, relevant resume and job
            text is sent to Google&apos;s Gemini API. This data is processed to
            produce your results and is not used by us to train models.
          </p>
        </section>

        <section>
          <h2>Data sharing</h2>
          <p>
            We do not sell your personal data. We share data only with the service
            providers needed to operate Applywise: Google (sign-in and Gemini AI),
            our database/hosting provider, and Razorpay (payments). The extension
            only sends form data to the website you are actively filling out.
          </p>
        </section>

        <section>
          <h2>Data retention &amp; deletion</h2>
          <p>
            Your data is stored until you delete it. You can remove all of your
            data at any time using <strong>Clear All Data</strong> in the extension
            settings or the web dashboard, which permanently deletes your profile,
            resume, and associated records.
          </p>
        </section>

        <section>
          <h2>Security</h2>
          <p>
            Data is transmitted over HTTPS and stored in access-controlled
            infrastructure. API access from the extension uses a per-device token.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions or data deletion requests, contact us at{" "}
            <a href="mailto:support@applywise.app">support@applywise.app</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
