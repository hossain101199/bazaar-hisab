"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { selectIsAdmin, useAuthStore } from "@/store/auth.store";
import {
  BarChart2,
  Home,
  LogOut,
  Package,
  Ruler,
  Settings,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: Home, label: "হোম" },
  { href: "/purchases", icon: ShoppingCart, label: "ক্রয়" },
  { href: "/products", icon: Package, label: "পণ্য" },
  { href: "/units", icon: Ruler, label: "একক" },
  { href: "/report", icon: BarChart2, label: "রিপোর্ট" },
];

const adminItem = { href: "/admin", icon: Settings, label: "অ্যাডমিন" };

type NavItem = (typeof navItems)[0];

function NavLink({ href, icon: Icon, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore(selectIsAdmin);

  const sidebarItems = [...navItems, ...(isAdmin ? [adminItem] : [])];

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      router.replace("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            ক্যা
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">বাজার হিসাব</p>
            <p className="text-xs text-muted-foreground mt-0.5">বাজার হিসাব</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <Separator />

        {/* User */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            লগআউট
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-40">
          <p className="font-bold">বাজার হিসাব</p>
          <button onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background z-50">
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(5, 1fr)` }}
        >
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
