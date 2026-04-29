"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, LayoutDashboard, LogOut, PanelsTopLeft, UsersRound } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { RoleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/kanban", label: "Kanban", icon: PanelsTopLeft }
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuth();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, router, user]);

  if (!isReady || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <div className="h-10 w-10 animate-pulse rounded-md bg-brand-100" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
                SC
              </span>
              <div>
                <p className="text-sm font-bold text-ink">SCMH</p>
                <p className="text-xs text-muted">Meeting Hub</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                    isActive ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-background hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-md bg-background p-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-sm font-bold text-brand-700">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <Button className="mt-3 w-full" variant="secondary" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700 lg:hidden">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <div className="mt-1">
                  <RoleBadge value={user.role} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-1 md:flex lg:hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      pathname === item.href ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-background"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
};
