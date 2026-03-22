"use client";

import { Camera, ShieldCheck, Star, MapPin, Globe, Instagram } from "lucide-react";
import styles from "./Storefront.module.css";

export default function StorefrontPage() {
  return (
    <div className="fade-in">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="h1">Storefront Management</h1>
        <p className="text-body">Control how your brand appears to customers on the Kite marketplace.</p>
      </header>

      <div className={styles.storefrontGrid}>
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className={styles.coverImage}>
            <button className={styles.editBtn}><Camera size={18} /> Edit Cover</button>
          </div>
          <div style={{ padding: 'var(--space-xl)', position: 'relative', marginTop: '-40px' }}>
            <div className={styles.logoBadge}>
              EV
              <button className={styles.logoEdit}><Camera size={14} /></button>
            </div>
            
            <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="h2" style={{ marginBottom: '4px' }}>Elite Venue Rentals</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} color="#ffb300" fill="#ffb300" /> 4.9 (128 reviews)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Beverly Hills, CA</span>
                </div>
              </div>
              <button className="btn-primary">View Public Storefront</button>
            </div>

            <p className="text-body" style={{ marginTop: 'var(--space-xl)', maxWidth: '800px' }}>
              Specializing in ultra-premium event furniture and Bespoke decor solutions. We bring timeless elegance to every occasion, from high-society weddings to corporate galas.
            </p>

            <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-xl)' }}>
              <div className={styles.infoItem}>
                <Globe size={18} color="var(--text-tertiary)" />
                <span>www.elitevenue.com</span>
              </div>
              <div className={styles.infoItem}>
                <Instagram size={18} color="var(--text-tertiary)" />
                <span>@elitevenue_rentals</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 230, 118, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="var(--success)" />
            </div>
            <div>
              <h3 className="h3" style={{ fontSize: '1.25rem' }}>Business Verification</h3>
              <p className="text-small">Status: Verified Partner</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className={styles.docItem}>
              <span>Business License</span>
              <span className={styles.statusSuccess}>Approved</span>
            </div>
            <div className={styles.docItem}>
              <span>Insurance Certificate</span>
              <span className={styles.statusSuccess}>Approved</span>
            </div>
            <div className={styles.docItem}>
              <span>Identity Verification</span>
              <span className={styles.statusSuccess}>Approved</span>
            </div>
          </div>
          
          <button className="btn-secondary" style={{ width: '100%', marginTop: 'var(--space-xl)' }}>Update Documents</button>
        </div>
      </div>
    </div>
  );
}
