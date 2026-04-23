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
  ChevronRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
      "Volunteers upload CSV or Excel files collected from communities in the field. The platform ingests, validates, and sanitizes data automatically.",
  },
  {
    icon: Brain,
    title: "AI Analyzes Needs",
    description:
      "DeepSeek AI processes every survey response, classifying severity levels from Minimal to Critical and identifying the most urgent community needs.",
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
      "Upload CSV and Excel files from any survey tool. The platform normalizes and structures data automatically.",
  },
  {
    icon: Lock,
    title: "Secure & Role-based",
    description:
      "File validation, input sanitization, and role-based access ensure data integrity and security at every layer.",
  },
  {
    icon: Shield,
    title: "Actionable Insights",
    description:
      "Turn raw community data into clear, prioritized action plans with AI-generated summaries and severity tags.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Shield className="size-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight">DigiRAMS</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Digital Resource Allocation Management System
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
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,var(--color-primary)/15,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_100%,var(--color-primary)/8,transparent_50%)]"
        />

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-28 text-center sm:py-36">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
            <Heart className="size-3.5" />
            Built for Social Impact
          </span>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Data-Driven Volunteer
            <br />
            Coordination for{" "}
            <span className="text-primary">Social Impact</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
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
      <section className="border-b border-border/60 bg-muted/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-1 px-6 py-10 ${
                i < stats.length - 1
                  ? "border-r border-border/40 max-sm:nth-2:border-r-0"
                  : ""
              }`}
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
      <section id="how-it-works" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three steps to smarter allocation
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From raw field data to coordinated action — powered by AI.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-8 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="absolute -top-4 right-6 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20">
                  {i + 1}
                </span>
                <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <step.icon className="size-7" />
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-border/60 bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need to coordinate impact
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-7 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-[15px] font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/60 py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="size-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to make an impact?
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Join Taskforce 141 and help transform scattered community data into
            coordinated, life-changing action.
          </p>
          <Link
            href="/login"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Get Started Now
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold">
              Built with{" "}
              <Heart className="inline size-3.5 text-red-500 dark:text-red-400" />{" "}
              by <span className="font-bold">Taskforce 141</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} DigiRAMS.
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
