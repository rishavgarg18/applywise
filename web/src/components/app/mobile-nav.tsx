"use client";

import { cn } from "@/lib/cn";
import { Bookmark, Home, PenTool, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/matches", label: "Jobs", icon: Search },
  { href: "/app/tracker", label: "Pipeline", icon: Bookmark },
  { href: "/app/resume", label: "Resume", icon: PenTool },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl">
      <div className="flex justify-around py-2">
        {nav.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs",
                active ? "text-accent" : "text-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
