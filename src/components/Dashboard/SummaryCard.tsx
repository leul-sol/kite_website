"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import styles from "./Dashboard.module.css";

interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
}

const SummaryCard = ({ title, value, change, isPositive, icon: Icon }: SummaryCardProps) => (
  <motion.div 
    whileHover={{ translateY: -5 }}
    className="glass-card" 
    style={{ padding: 'var(--space-lg)' }}
  >
    <div className={styles.cardHeader}>
      <div className={styles.iconWrapper}>
        <Icon size={20} className={styles.icon} />
      </div>
      <div className={`${styles.changeBadge} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {change}
      </div>
    </div>
    <div className={styles.cardBody}>
      <span className={styles.cardTitle}>{title}</span>
      <h3 className={styles.cardValue}>{value}</h3>
    </div>
  </motion.div>
);

export default SummaryCard;
