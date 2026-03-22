"use client";

import { motion } from "framer-motion";
import styles from "./Landing.module.css";
import FadeIn from "./FadeIn";
import { CheckCircle2 } from "lucide-react";

export default function FeatureShowcase() {
  return (
    <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
      <div className={styles.sectionContent}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', alignItems: 'center' }}>
          <FadeIn direction="right">
            <div className="glass-card" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              [Interactive Showcase]
            </div>
          </FadeIn>
          
          <FadeIn direction="left">
            <div>
              <span className={styles.itemLabel}>For Providers</span>
              <h2 className="h2" style={{ fontSize: '3rem', margin: 'var(--space-md) 0' }}>The Partner <br />Portal Engine</h2>
              <p className="text-body" style={{ marginBottom: 'var(--space-xl)' }}>
                Built for precision. Our suite of professional tools helps you scale your rental business with ease and elegance.
              </p>
              
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {[
                  "Advanced Inventory Management",
                  "Real-time Order Tracking (Kanban Board)",
                  "Financial Analytics & Seamless Payouts",
                  "Storefront Identity & Custom Curation"
                ].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontWeight: 500 }}>
                    <CheckCircle2 size={20} color="var(--accent-primary)" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
