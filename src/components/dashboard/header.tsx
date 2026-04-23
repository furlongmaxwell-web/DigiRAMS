"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  user: { name: string; email: string; role: string };
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/admin/volunteers": "Volunteer Management",
  "/dashboard/uploads": "Uploads",
  "/dashboard/uploads/new": "New Upload",
  "/dashboard/settings": "Settings",
};

export function Header({ user }: HeaderProps) {
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

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 outline-none transition-all duration-200 hover:bg-accent hover:shadow-sm">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-semibold leading-none text-foreground">
                {user.name}
              </p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge
                    variant="outline"
                    className="mt-1 w-fit capitalize text-[10px] font-semibold"
                  >
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async (e) => {
                e.preventDefault();
                await signOut({ redirect: false });
                window.location.href = "/";
              }}
              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
