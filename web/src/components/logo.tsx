import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };
  return (
    <Link
      href="/"
      className={cn("font-bold tracking-tight", sizes[size], className)}
    >
      Apply<span className="text-accent">wise</span>
    </Link>
  );
}
