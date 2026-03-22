"use client";

import { motion } from "framer-motion";
import styles from "./auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authGrid}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.authBrand}
        >
          <div className={styles.logo}>KITE</div>
          <h1>Partner Portal</h1>
          <p>Elevate the event experience by managing your premium inventory and bookings with ease.</p>
          
          <div className={styles.brandFooter}>
            <span>Premium. Reliable. Scalable.</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={styles.authContent}
        >
          <div className="glass-card" style={{ padding: 'var(--space-2xl)', minHeight: '400px' }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
