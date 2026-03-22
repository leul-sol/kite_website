"use client";

import { Bell, Search, Moon, Sun } from "lucide-react";
import styles from "./TopBar.module.css";

export default function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.searchBox}>
        <Search size={18} color="var(--text-tertiary)" />
        <input type="text" placeholder="Search orders, listings, or customers..." className={styles.searchInput} />
        <span className={styles.searchShortcut}>⌘K</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn}>
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>
        <button className={styles.actionBtn}>
          <Moon size={20} />
        </button>
        <div className={styles.divider} />
        <div className={styles.statusBadge}>
          <div className={styles.statusDot} />
          Live Status: Active
        </div>
      </div>
    </header>
  );
}
