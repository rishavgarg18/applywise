"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Bookmark,
  FileText,
  Home,
  LogOut,
  Mail,
  MessageSquare,
  PenTool,
  Search,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const nav = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/matches", label: "Opportunities", icon: Search },
  { href: "/app/tracker", label: "Pipeline", icon: Bookmark },
  { href: "/app/resume", label: "Resume Studio", icon: PenTool },
  { href: "/app/ats", label: "Health Check", icon: BarChart3 },
  { href: "/app/cover-letter", label: "Letter Craft", icon: FileText },
  { href: "/app/emails", label: "Outreach", icon: Mail },
  { href: "/app/networking", label: "Contacts", icon: Users },
  { href: "/app/interview", label: "AI Interviewer", icon: MessageSquare },
  { href: "/app/copilot", label: "Extension", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-surface h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-0.5">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent-dim text-accent font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        {session?.user?.email && (
          <p className="px-3 py-1 text-xs text-muted truncate">
            {session.user.email}
          </p>
        )}
        <Link
          href="/app/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
            pathname === "/app/settings"
              ? "bg-accent-dim text-accent font-medium"
              : "text-muted hover:text-foreground hover:bg-surface2"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
