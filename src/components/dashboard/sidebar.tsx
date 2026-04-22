"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileSpreadsheet,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/volunteers", label: "Volunteers", icon: Users },
  { href: "/dashboard/uploads", label: "Uploads", icon: FileSpreadsheet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const volunteerLinks = [
  { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/uploads", label: "Uploads", icon: Upload },
  { href: "/dashboard/uploads/new", label: "New Upload", icon: PlusCircle },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role?.toUpperCase() === "ADMIN";
  const links = isAdmin ? adminLinks : volunteerLinks;

  const activeHref = links
    .filter(
      (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  return (
    <aside className="flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20">
          <Shield className="size-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-sidebar-foreground">
            SRA Platform
          </h2>
          <p className="text-[11px] font-medium text-sidebar-foreground/50">
            Taskforce 141
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/35">
          Navigation
        </p>
        {links.map((link) => {
          const isActive = link.href === activeHref;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <link.icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/45 group-hover:text-sidebar-primary",
                )}
              />
              {link.label}
              {isActive && (
                <div className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-bold text-sidebar-primary">
            {user.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              {user.name}
            </p>
            <Badge
              variant="outline"
              className="mt-0.5 border-sidebar-border text-[10px] font-semibold capitalize text-sidebar-foreground/50"
            >
              {user.role}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
