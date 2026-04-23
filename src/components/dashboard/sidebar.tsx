"use client";

import { cn } from "@/lib/utils";
import {
  Bell,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ScrollText,
  Settings,
  Shield,
  Upload,
  User,
  Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  linkUrl: string | null;
  createdAt: string;
}

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/volunteers", label: "Volunteers", icon: Users },
  { href: "/dashboard/uploads", label: "Uploads", icon: FileSpreadsheet },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const volunteerLinks = [
  { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "My Tasks", icon: ClipboardList },
  { href: "/dashboard/uploads", label: "Uploads", icon: Upload },
  { href: "/dashboard/uploads/new", label: "New Upload", icon: PlusCircle },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role?.toUpperCase() === "ADMIN";
  const links = isAdmin ? adminLinks : volunteerLinks;

  const activeHref =
    links
      .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const prevCount = useRef(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      if (data.unreadCount > prevCount.current && prevCount.current > 0) {
        /* a new notification arrived */
      }
      prevCount.current = data.unreadCount;
      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <aside className="flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20">
          <Shield className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-sidebar-foreground">
            DigiRAMS
          </h2>
          <p className="text-[11px] font-medium text-sidebar-foreground/50">
            by Taskforce 141
          </p>
        </div>
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent/50 cursor-pointer"
          >
            <Bell className="size-4 text-sidebar-foreground/60" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-sidebar-border bg-sidebar shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
                <p className="text-xs font-bold text-sidebar-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold text-sidebar-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-sidebar-foreground/40">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.linkUrl || "#"}
                      onClick={() => setShowNotif(false)}
                      className={`block px-4 py-3 border-b border-sidebar-border/50 transition-colors hover:bg-sidebar-accent/30 ${
                        !n.read ? "bg-sidebar-primary/5" : ""
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-sidebar-foreground">
                        {!n.read && <span className="inline-block size-1.5 rounded-full bg-blue-500 mr-1.5 align-middle" />}
                        {n.title}
                      </p>
                      <p className="text-[11px] text-sidebar-foreground/50 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
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

      {/* User + Sign out */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-bold text-sidebar-primary shrink-0">
            {user.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/40">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="size-[18px] shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
