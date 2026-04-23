"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/admin/volunteers": "Volunteer Management",
  "/dashboard/uploads": "Uploads",
  "/dashboard/uploads/new": "New Upload",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "My Profile",
};

export function Header() {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ??
    pathname
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "Dashboard";

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6 py-3">
      <h1 className="text-[15px] font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <ThemeToggle />
    </header>
  );
}
