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
import { api } from "@/services/api";
import { useState } from "react";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'listings', label: 'Listings', icon: Package, href: '/listings' },
  { id: 'setups', label: 'Setups', icon: Store, href: '/setups' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/orders' },
  { id: 'disputes', label: 'Disputes', icon: ShoppingCart, href: '/disputes' },
  { id: 'analytics', label: 'Analytics', icon: LayoutDashboard, href: '/analytics' },
  { id: 'policies', label: 'Policies', icon: Settings, href: '/policies' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/wallet' },
  { id: 'storefront', label: 'Storefront', icon: Store, href: '/storefront' },
  { id: 'verification', label: 'Verification', icon: Store, href: '/verification' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setSigningOut(true); setError("");
    try { await api.auth("logout"); window.location.assign("/auth/login"); }
    catch { setError("Sign out failed. Try again."); setSigningOut(false); }
  }

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
              <Link key={item.id} href={item.href} aria-label={item.label} title={item.label} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
                {isActive && <motion.div layoutId="activeNav" className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </div>

        <div className={styles.navGroup} style={{ marginTop: 'auto' }}>
          <span className={styles.navLabel}>Preferences</span>
          <Link href="/verification" className={styles.navItem} aria-label="Business settings" title="Business settings">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button className={styles.navItem} style={{ color: 'var(--error)' }} onClick={logout} disabled={signingOut} aria-label="Sign out" title="Sign out">
            <LogOut size={20} />
            <span>{signingOut ? "Signing out…" : "Logout"}</span>
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.avatar}>K</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Kite Portal</span>
          <span className={styles.userRole}>Provider account</span>
        </div>
        <ChevronRight size={16} color="var(--text-tertiary)" />
      </div>
    </aside>
  );
}
