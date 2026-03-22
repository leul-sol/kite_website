"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth logic
    router.push('/dashboard');
  };

  return (
    <div>
      <h2 className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Welcome Back</h2>
      <p className="text-body" style={{ marginBottom: 'var(--space-xl)' }}>
        Sign in to manage your inventory and bookings.
      </p>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="email" 
              className={styles.input} 
              placeholder="name@business.com" 
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="password" 
              className={styles.input} 
              placeholder="••••••••" 
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)' }}>
          <Link href="/auth/forgot-password" className={styles.authLink} style={{ fontSize: '0.875rem' }}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Sign In <ArrowRight size={18} />
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        Don't have an account? <Link href="/auth/signup" className={styles.authLink}>Request Access</Link>
      </div>
    </div>
  );
}
