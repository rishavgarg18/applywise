import { cn } from "@/lib/cn";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "accent" | "violet" | "success" | "warning";
  className?: string;
}) {
  const variants = {
    default: "bg-surface2 text-muted border-border",
    accent: "bg-accent-dim text-accent border-accent/20",
    violet: "bg-violet-dim text-violet border-violet/20",
    success: "bg-success/15 text-success border-success/20",
    warning: "bg-warning/15 text-warning border-warning/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function MatchScore({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-muted";
  return (
    <div className={cn("flex items-center gap-1.5 font-semibold", color)}>
      <div
        className="h-2 w-2 rounded-full"
        style={{
          background:
            score >= 80
              ? "var(--success)"
              : score >= 60
                ? "var(--warning)"
                : "var(--muted)",
        }}
      />
      {score}% match
    </div>
  );
}
