"use client";

import styles from "@/components/Landing/Landing.module.css";
import Link from "next/link";
import { ArrowRight, Instagram, Twitter, Globe, Award, Sparkles, Shield } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 1000], [0, 300]);

  return (
    <main className={styles.landingWrapper}>
      {/* HEADER */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, mixBlendMode: 'difference' }}>
        <div className="logo" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.4em' }}>KITE</div>
        <nav style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>Portal</Link>
          <Link href="/auth/signup" style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, border: '1px solid #fff', padding: '10px 24px' }}>Join us</Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className={styles.hero} ref={heroRef}>
        <motion.div 
          className={styles.heroBackground} 
          style={{ 
            y: yParallax,
            backgroundImage: `url('/luxury_hero.png')` // I'll rename the generated image
          }} 
        />
        <div className={styles.heroOverlay} />
        
        <div className={styles.heroContent}>
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className={styles.heroSubtitle}
          >
            A New Paradigm in Hosting
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className={styles.heroTitle}
          >
            The Curated <br /> <i>Experience</i>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{ marginTop: '40px' }}
          >
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '20px 48px', borderRadius: 0, fontSize: '0.875rem', letterSpacing: '0.1em' }}>
              RESERVE YOUR SPACE
            </Link>
          </motion.div>
        </div>
      </section>

      {/* GALLERY/CATEGORIES */}
      <section className={styles.section}>
        <span className={styles.sectionLabel}>The Collection</span>
        <h2 className={styles.sectionTitle}>Essential Elements for <br /> Memorable Occasions</h2>
        
        <div className={styles.featuresGrid}>
          {[
            { icon: <Sparkles />, title: "Exquisite Decor", desc: "Hand-selected ornaments and architectural pieces that define atmospheres." },
            { icon: <Award />, title: "Premium Seating", desc: "Couture velvet sofas and bespoke tables from the world's finest craftsmen." },
            { icon: <Shield />, title: "White-Glove Service", desc: "Seamless delivery and installation by our expert logistics partners." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className={styles.featureCard}
            >
              <div style={{ color: 'var(--accent-primary)', display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <h3 className={styles.featureTitle}>{item.title}</h3>
              <p className={styles.featureDesc}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PARTNER PORTAL CTA */}
      <section className={styles.ctaSection}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className={styles.sectionLabel}>For Providers</span>
          <h2 className={styles.serif} style={{ fontSize: '3.5rem', marginBottom: '32px' }}>Empowering the <br /> <i>Creators of Elegance</i></h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 2, marginBottom: '48px' }}>
            Join an elite network of event providers. Manage your premium inventory, track bookings, and grow your brand with Kite's professional suite of tools.
          </p>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '20px 48px', borderRadius: 0 }}>
            ACCESS PARTNER PORTAL
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '120px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5em', marginBottom: '40px' }}>KITE</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '80px', opacity: 0.5, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          <Link href="#">COLLECTION</Link>
          <Link href="#">PARTNERS</Link>
          <Link href="#">INSTITUTION</Link>
          <Link href="#">LEGAL</Link>
        </div>
        <p style={{ opacity: 0.3, fontSize: '0.625rem', letterSpacing: '0.2em' }}>© 2026 KITE MARKETPLACE. ALL RIGHTS RESERVED.</p>
      </footer>
    </main>
  );
}
