export function StatsBar() {
  const stats = [
    { value: "1", label: "Profile powers everything" },
    { value: "50+", label: "Job boards supported" },
    { value: "AI", label: "Resume parsing & tailoring" },
    { value: "Free", label: "Core platform forever" },
  ];

  return (
    <section className="py-14 bg-surface/50 border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-muted mb-8 max-w-2xl mx-auto">
          Join job seekers using Applywise to apply faster, stay organized, and
          land roles that fit their skills.
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold gradient-text sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
