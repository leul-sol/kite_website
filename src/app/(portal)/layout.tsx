import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PortalShell from "@/components/shell/PortalShell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.has("kite_access") && !jar.has("kite_refresh")) redirect("/auth/login");
  return <PortalShell>{children}</PortalShell>;
}
