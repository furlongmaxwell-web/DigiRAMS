"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Mail, MapPin, Key } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Account information and platform settings
        </p>
      </div>

      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Name
            </div>
            <span className="font-semibold text-foreground">{session.user.name}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <span className="font-medium font-mono text-sm text-foreground">{session.user.email}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4" />
              Role
            </div>
            <Badge variant={isAdmin ? "default" : "secondary"} className="font-semibold capitalize">
              {session.user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Key className="h-5 w-5 text-primary" />
              Platform Configuration
            </CardTitle>
            <CardDescription>
              Admin-only platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                DeepSeek API
              </div>
              <Badge variant="secondary" className="font-semibold">
                {process.env.NEXT_PUBLIC_DEEPSEEK_CONFIGURED === "true"
                  ? "Connected"
                  : "Configure in .env"}
              </Badge>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium text-muted-foreground">Database</span>
              <Badge variant="secondary" className="font-semibold">SQLite (Development)</Badge>
            </div>
            <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium text-muted-foreground">Version</span>
              <span className="font-bold text-sm text-foreground">SRA v1.0.0</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
