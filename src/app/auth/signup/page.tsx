"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { User, Mail, Lock, Building, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate request partnership logic
    router.push('/dashboard');
  };

  return (
    <div>
      <h2 className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Join Kite</h2>
      <p className="text-body" style={{ marginBottom: 'var(--space-xl)' }}>
        Partner with us to grow your event rental brand.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" className={styles.input} placeholder="John Doe" style={{ paddingLeft: '40px' }} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Business Name</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" className={styles.input} placeholder="Elite Rentals" style={{ paddingLeft: '40px' }} />
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="email" className={styles.input} placeholder="name@business.com" style={{ paddingLeft: '40px' }} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Create Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="password" className={styles.input} placeholder="••••••••" style={{ paddingLeft: '40px' }} />
          </div>
        </div>

        <p className="text-small" style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
          By signing up, you agree to our <Link href="/terms" className={styles.authLink}>Terms of Service</Link>.
        </p>

        <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Request Partnership <ArrowRight size={18} />
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        Already have an account? <Link href="/auth/login" className={styles.authLink}>Sign In</Link>
      </div>
    </div>
  );
}
