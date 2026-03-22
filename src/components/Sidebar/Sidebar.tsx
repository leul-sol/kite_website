"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Store, 
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { motion } from "framer-motion";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'listings', label: 'Listings', icon: Package, href: '/listings' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/orders' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/wallet' },
  { id: 'storefront', label: 'Storefront', icon: Store, href: '/storefront' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>KITE</div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Main Menu</span>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.id} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
                {isActive && <motion.div layoutId="activeNav" className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </div>

        <div className={styles.navGroup} style={{ marginTop: 'auto' }}>
          <span className={styles.navLabel}>Preferences</span>
          <Link href="/settings" className={styles.navItem}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button className={styles.navItem} style={{ color: 'var(--error)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.avatar}>EV</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Elite Venue</span>
          <span className={styles.userRole}>Premium Partner</span>
        </div>
        <ChevronRight size={16} color="var(--text-tertiary)" />
      </div>
    </aside>
  );
}
