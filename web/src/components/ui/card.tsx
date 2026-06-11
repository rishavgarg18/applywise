import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 card-glow transition-all",
        className
      )}
      {...props}
    />
  );
}
