"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  Globe,
  Mail,
  Shield,
  Upload,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  region: string | null;
  availability: boolean;
  createdAt: string;
  totalUploads: number;
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-b-0 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="text-right">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const isAdmin = profile.role.toUpperCase() === "ADMIN";
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your account information
        </p>
      </div>

      {/* Identity card */}
      <Card className="overflow-hidden">
        <div className="bg-primary/5 border-b border-border px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {profile.name}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="ml-auto capitalize font-semibold"
            >
              {profile.role}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">
              {profile.totalUploads}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
              Uploads
            </span>
          </div>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-extrabold tabular-nums text-foreground">
              {profile.skills.length}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
              Skills
            </span>
          </div>
          <div className="flex flex-col items-center py-4">
            {profile.availability ? (
              <CheckCircle2 className="size-6 text-emerald-500" />
            ) : (
              <XCircle className="size-6 text-muted-foreground" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground mt-1">
              {profile.availability ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
            <User className="size-4 text-primary" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InfoRow icon={User} label="Full Name">
            <span className="font-semibold text-sm">{profile.name}</span>
          </InfoRow>
          <InfoRow icon={Mail} label="Email">
            <span className="font-medium font-mono text-sm">
              {profile.email}
            </span>
          </InfoRow>
          <InfoRow icon={Shield} label="Role">
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="capitalize font-semibold"
            >
              {profile.role}
            </Badge>
          </InfoRow>
          <InfoRow icon={Globe} label="Region">
            <span className="text-sm font-medium">
              {profile.region || (
                <span className="text-muted-foreground italic">
                  Not assigned
                </span>
              )}
            </span>
          </InfoRow>
          <InfoRow icon={Wrench} label="Skills">
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-1.5">
                {profile.skills.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                None listed
              </span>
            )}
          </InfoRow>
          <InfoRow icon={Upload} label="Total Uploads">
            <span className="text-sm font-bold tabular-nums">
              {profile.totalUploads}
            </span>
          </InfoRow>
          <InfoRow icon={Calendar} label="Joined">
            <span className="text-sm font-medium">{joined}</span>
          </InfoRow>
        </CardContent>
      </Card>
    </div>
  );
}
