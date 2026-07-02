const testimonials = [
  {
    quote:
      "Autofill saved me hours re-typing the same details on Naukri and LinkedIn applications.",
    role: "Software Developer",
    name: "Arjun M.",
    company: "Bangalore",
  },
  {
    quote:
      "The pipeline board kept me organized through 30+ applications. No more spreadsheet chaos.",
    role: "Product Analyst",
    name: "Priya S.",
    company: "Mumbai",
  },
  {
    quote:
      "Resume parsing got my profile right on the first upload. I just fixed a few fields and started applying.",
    role: "Full Stack Engineer",
    name: "Rohan K.",
    company: "Gurgaon",
  },
  {
    quote:
      "ATS score check showed exactly which keywords I was missing before I hit submit.",
    role: "Backend Developer",
    name: "Neha T.",
    company: "Hyderabad",
  },
  {
    quote:
      "Cover letter generator gave me a solid first draft I could tweak in minutes.",
    role: "Data Analyst",
    name: "Vikram P.",
    company: "Pune",
  },
  {
    quote:
      "One profile synced between the website and extension — that's what sold me.",
    role: "DevOps Engineer",
    name: "Ananya R.",
    company: "Remote",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Built for serious job seekers
        </h2>
        <p className="mt-4 text-muted">
          Faster applications, better organization, smarter prep
        </p>
      </div>

      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="flex animate-marquee gap-5 w-max">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="w-[320px] shrink-0 rounded-2xl border border-border bg-surface p-6"
            >
              <p className="text-foreground leading-relaxed text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-dim flex items-center justify-center text-accent font-semibold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
