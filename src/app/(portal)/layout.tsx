import Sidebar from "@/components/Sidebar/Sidebar";
import TopBar from "@/components/TopBar/TopBar";
import styles from "./portal.module.css";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
