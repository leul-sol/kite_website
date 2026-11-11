import Sidebar from "@/components/Sidebar/Sidebar";
import TopBar from "@/components/TopBar/TopBar";
import styles from "./portal.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  if (!jar.has("kite_access") && !jar.has("kite_refresh")) redirect("/auth/login");
  return (
    <div className={styles.portalWrapper}>
      <Sidebar />
      <main className={styles.mainContent}>
        <TopBar />
        <div className={styles.pageContainer}>
          {children}
        </div>
      </main>
    </div>
  );
}
