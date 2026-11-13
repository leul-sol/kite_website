import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TeamShell from "@/components/shell/TeamShell";
import { sessionRole } from "@/lib/session";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.has("kite_access") && !jar.has("kite_refresh")) redirect("/auth/login");
  const role = sessionRole(jar);
  if (role && role !== "TEAM") redirect("/dashboard");
  return <TeamShell>{children}</TeamShell>;
}
