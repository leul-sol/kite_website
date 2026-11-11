"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import styles from "./Dashboard.module.css";

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

const SummaryCard = ({ title, value, description, icon: Icon }: SummaryCardProps) => (
  <motion.div 
    whileHover={{ translateY: -5 }}
    className="glass-card" 
    style={{ padding: 'var(--space-lg)' }}
  >
    <div className={styles.cardHeader}>
      <div className={styles.iconWrapper}>
        <Icon size={20} className={styles.icon} />
      </div>
    </div>
    <div className={styles.cardBody}>
      <span className={styles.cardTitle}>{title}</span>
      <h3 className={styles.cardValue}>{value}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  </motion.div>
);

export default SummaryCard;
