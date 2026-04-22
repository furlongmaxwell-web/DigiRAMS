"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  Search,
  UserCheck,
  UserX,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  region: string | null;
  availability: boolean;
  createdAt: string;
  uploadsCount: number;
}

interface VolunteerFormData {
  name: string;
  email: string;
  password: string;
  skills: string;
  region: string;
}

const emptyForm: VolunteerFormData = {
  name: "",
  email: "",
  password: "",
  skills: "",
  region: "",
};

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 7 }).map((_, j) => (
            <div
              key={j}
              className="h-10 flex-1 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VolunteerFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchVolunteers = useCallback(async () => {
    try {
      const res = await fetch("/api/volunteers");
      if (!res.ok) throw new Error("Failed to fetch volunteers");
      const data = await res.json();
      setVolunteers(data);
    } catch {
      toast.error("Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/volunteers")
      .then((r) => r.json())
      .then((data) => { if (active) setVolunteers(data); })
      .catch(() => { if (active) toast.error("Failed to load volunteers"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(v: Volunteer) {
    setEditingId(v.id);
    setForm({
      name: v.name,
      email: v.email,
      password: "",
      skills: v.skills.join(", "),
      region: v.region ?? "",
    });
    setEditOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          skills,
          region: form.region || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create volunteer");
      }
      toast.success("Volunteer created successfully");
      setCreateOpen(false);
      setForm(emptyForm);
      fetchVolunteers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        skills,
        region: form.region || null,
      };
      if (form.password) payload.password = form.password;
      const res = await fetch(`/api/volunteers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update volunteer");
      }
      toast.success("Volunteer updated successfully");
      setEditOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchVolunteers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/volunteers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete volunteer");
      toast.success("Volunteer deleted");
      fetchVolunteers();
    } catch {
      toast.error("Failed to delete volunteer");
    }
  }

  function updateField(field: keyof VolunteerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const filtered = volunteers.filter(
    (v) =>
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.region?.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = volunteers.filter((v) => v.availability).length;
  const totalUploads = volunteers.reduce((s, v) => s + v.uploadsCount, 0);

  function renderForm(
    onSubmit: (e: React.FormEvent) => void,
    isEdit: boolean
  ) {
    return (
      <form onSubmit={onSubmit} className="space-y-5 pt-2">
        <div className="space-y-2">
          <Label htmlFor="vol-name" className="text-[13px] font-semibold">
            Full Name
          </Label>
          <Input
            id="vol-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="John Doe"
            required
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vol-email" className="text-[13px] font-semibold">
            Email Address
          </Label>
          <Input
            id="vol-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="volunteer@example.com"
            required
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vol-password" className="text-[13px] font-semibold">
            Password{isEdit && " (leave blank to keep current)"}
          </Label>
          <Input
            id="vol-password"
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder={isEdit ? "••••••••" : "Minimum 8 characters"}
            required={!isEdit}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vol-skills" className="text-[13px] font-semibold">
            Skills
          </Label>
          <Input
            id="vol-skills"
            value={form.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            placeholder="e.g. First Aid, Logistics, Translation"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            Separate multiple skills with commas
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vol-region" className="text-[13px] font-semibold">
            Region
          </Label>
          <Input
            id="vol-region"
            value={form.region}
            onChange={(e) => updateField("region", e.target.value)}
            placeholder="e.g. North District"
            className="h-10"
          />
        </div>
        <Button type="submit" className="w-full h-10" disabled={submitting}>
          {submitting
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
              ? "Update Volunteer"
              : "Create Volunteer"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Volunteer Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Create, manage, and monitor your team members
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-1">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight">
                {loading ? "—" : volunteers.length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Total Members
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-1">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
              <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight">
                {loading ? "—" : availableCount}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Available Now
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-1">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15">
              <Upload className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight">
                {loading ? "—" : totalUploads}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Total Uploads
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            className="cursor-pointer inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 gap-2 px-5 shadow-sm shadow-primary/25 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 active:scale-[0.98]"
            onClick={openCreate}
          >
            <PlusCircle className="size-4" />
            Add Volunteer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Volunteer</DialogTitle>
            </DialogHeader>
            {renderForm(handleCreate, false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 dark:bg-muted/15">
          <CardTitle className="text-[15px] font-bold">
            All Volunteers
            {!loading && (
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                ({filtered.length}
                {search && ` of ${volunteers.length}`})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 dark:bg-muted/40 mb-4">
                {search ? (
                  <Search className="size-7 text-muted-foreground/60" />
                ) : (
                  <UserX className="size-7 text-muted-foreground/60" />
                )}
              </div>
              <p className="text-base font-semibold text-foreground">
                {search ? "No matches found" : "No volunteers yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
                {search
                  ? `No volunteers match "${search}". Try a different search.`
                  : "Click the Add Volunteer button to get started."}
              </p>
            </div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-center">Uploads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/15">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        {v.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {v.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {v.skills.length > 0 ? (
                          v.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="bg-primary/8 text-primary font-medium dark:bg-primary/15 dark:text-primary"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No skills listed
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground/80">
                      {v.region ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-bold text-foreground">
                        {v.uploadsCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={v.availability ? "default" : "outline"}
                        className={
                          v.availability
                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-semibold dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25"
                            : "text-muted-foreground border-border"
                        }
                      >
                        {v.availability ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEdit(v)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {v.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(v.id, v.name)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete {v.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Volunteer</DialogTitle>
          </DialogHeader>
          {renderForm(handleEdit, true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
