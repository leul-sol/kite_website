import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PortalShell from "@/components/shell/PortalShell";
import { sessionRole } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.has("kite_access") && !jar.has("kite_refresh")) redirect("/auth/login");
  // Team members have their own area; the provider portal is for business owners.
  if (sessionRole(jar) === "TEAM") redirect("/my-work");
  return <PortalShell>{children}</PortalShell>;
}
