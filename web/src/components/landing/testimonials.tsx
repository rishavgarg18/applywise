import { Card } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "I found roles at startups I'd never heard of. Signed an offer within a week of applying!",
    role: "Operations Intern",
    name: "Winston K.",
    company: "FYPM",
  },
  {
    quote:
      "The pipeline board kept me organized through 40+ applications and 12 interviews.",
    role: "Banking Analyst",
    name: "Cameron L.",
    company: "Goldman Sachs",
  },
  {
    quote:
      "Resume Health Check showed me exactly which keywords I was missing. Game changer.",
    role: "Software Engineer",
    name: "Emmanuel R.",
    company: "Polydelta",
  },
  {
    quote:
      "Autofill saved me hours re-typing the same info on every application form.",
    role: "Business Analyst",
    name: "Rio M.",
    company: "Deloitte",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Real results from real job seekers
          </h2>
          <p className="mt-4 text-muted">
            Join thousands who landed roles faster with Applywise
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <p className="text-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-dim flex items-center justify-center text-violet font-semibold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.role} → {t.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
