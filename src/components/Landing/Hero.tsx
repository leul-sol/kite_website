"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./Landing.module.css";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} style={{ top: '10%', left: '10%' }} />
      <div className={styles.glow} style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, var(--accent-premium), transparent 70%)' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span className={styles.itemLabel} style={{ marginBottom: 'var(--space-md)', display: 'block' }}>Kite Marketplace</span>
        <h1 className={styles.heroTitle}>
          Elevate Your <br />
          <span style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Event Hosting</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The world's most curated platform for premium event rentals. Connect with high-end decor, furniture, and logistics providers.
        </p>
        
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Get Started <ArrowRight size={20} />
          </Link>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Provider Portal
          </Link>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: 'absolute', bottom: '40px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}
      >
        Scroll to Explore
      </motion.div>
    </section>
  );
}
