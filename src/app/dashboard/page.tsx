import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VolunteerDashboard } from "@/components/dashboard/volunteer-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role?.toUpperCase() === "ADMIN") {
    redirect("/dashboard/admin");
  }

  return <VolunteerDashboard userName={session.user.name} />;
}
