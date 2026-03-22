"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { Mail, ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate reset logic
    alert('Reset link sent to your email!');
    router.push('/auth/login');
  };

  return (
    <div>
      <Link href="/auth/login" className={styles.authLink} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--space-lg)', fontSize: '0.875rem' }}>
        <ChevronLeft size={16} /> Back to Sign In
      </Link>

      <h2 className="h2" style={{ marginBottom: 'var(--space-sm)' }}>Reset Password</h2>
      <p className="text-body" style={{ marginBottom: 'var(--space-xl)' }}>
        Enter your email address and we'll send you instructions to reset your password.
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

        <button className="btn-primary" style={{ width: '100%' }}>
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
