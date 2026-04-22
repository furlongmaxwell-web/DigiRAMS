import Link from "next/link";
import {
  Shield,
  Upload,
  Brain,
  Users,
  BarChart3,
  FileSpreadsheet,
  Lock,
  Zap,
  ArrowRight,
  Heart,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const stats = [
  { value: "10,000+", label: "Surveys Processed" },
  { value: "50+", label: "Regions Covered" },
  { value: "500+", label: "Volunteers Active" },
  { value: "95%", label: "Faster Response" },
];

const steps = [
  {
    icon: Upload,
    title: "Upload Survey Data",
    description:
      "Volunteers upload CSV files collected from communities in the field. The platform ingests and validates data automatically.",
  },
  {
    icon: Brain,
    title: "AI Analyzes Needs",
    description:
      "DeepSeek AI processes every survey response, classifying severity levels and identifying the most critical community needs.",
  },
  {
    icon: Users,
    title: "Smart Allocation",
    description:
      "Volunteers are intelligently matched to the most urgent needs based on skill, proximity, and resource availability.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Real-time Analysis",
    description:
      "Survey data is processed and classified the moment it's uploaded — no waiting, no manual review.",
  },
  {
    icon: Users,
    title: "Smart Matching",
    description:
      "AI-driven allocation ensures the right volunteers reach the right communities at the right time.",
  },
  {
    icon: BarChart3,
    title: "Severity Tracking",
    description:
      "Monitor need severity across regions with clear dashboards and filterable priority levels.",
  },
  {
    icon: FileSpreadsheet,
    title: "Multi-format Support",
    description:
      "Upload CSV files from any survey tool. The platform normalizes and structures data automatically.",
  },
  {
    icon: Lock,
    title: "Role-based Access",
    description:
      "Admins, coordinators, and volunteers each see exactly what they need — nothing more, nothing less.",
  },
  {
    icon: Shield,
    title: "Actionable Insights",
    description:
      "Turn raw community data into clear, prioritized action plans that drive measurable social impact.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-foreground">
                SRA
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Smart Resource Allocation
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(99,102,241,.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(79,70,229,.3) 0%, transparent 50%)",
          }}
        />

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-28 text-center sm:py-36">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground/80">
            <Heart className="size-3.5" />
            Built for Social Impact
          </span>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Data-Driven Volunteer
            <br />
            Coordination for{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Social Impact
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Transform scattered community survey data into actionable insights.
            Let AI prioritize needs, match volunteers, and accelerate response
            times — so help reaches those who need it most.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border bg-muted">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 px-6 py-10"
            >
              <span className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                {s.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="scroll-mt-20 bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Three steps to smarter allocation
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From raw field data to coordinated action — powered by AI.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="size-7" />
                </div>
                <span className="absolute -top-2 right-4 text-6xl font-black text-muted-foreground/10 select-none sm:right-auto sm:-left-2">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Everything you need to coordinate impact
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Built with <Heart className="inline size-3.5 text-red-500" /> by{" "}
              <span className="font-bold">Taskforce 141</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} Smart Resource Allocation.
              Empowering communities through data.
            </p>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            GitHub &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}
