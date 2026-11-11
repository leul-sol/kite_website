"use client";

import { useEffect, useState } from "react";
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import styles from "./Wallet.module.css";
import { api } from "@/services/api";

export default function WalletPage() {
  const [balanceMinor, setBalanceMinor] = useState(0);
  const [transactions, setTransactions] = useState<
    Array<{ id: string; type: string; direction: string; amountMinor: number; createdAt: string }>
  >([]);

  const loadWallet = async () => {
    const { wallet, transactions } = await api.getWallet();
    setBalanceMinor(wallet.balanceMinor);
    setTransactions(transactions);
  };

  useEffect(() => {
    loadWallet().catch(() => undefined);
  }, []);

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="h1">Wallet</h1>
        <p className="text-body">Manage your earnings, payouts, and financial history.</p>
      </header>

      <div className={styles.walletGrid}>
        <div className="glass-card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(0, 242, 234, 0.05))' }}>
          <div>
            <span className="text-small" style={{ color: 'var(--text-secondary)' }}>Available Balance</span>
            <h2 className="h1" style={{ fontSize: '3rem', margin: 'var(--space-xs) 0' }}>ETB {(balanceMinor / 100).toFixed(2)}</h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
              await api.payout(50000);
              await loadWallet();
            }}>Request Payout</button>
            <button className="btn-secondary" style={{ padding: '12px' }}><CreditCard size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
            <span className="text-small">Total Revenue</span>
            <h3 className="h3" style={{ color: 'var(--success)' }}>$42,120.00</h3>
          </div>
          <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
            <span className="text-small">Pending Payouts</span>
            <h3 className="h3" style={{ color: 'var(--warning)' }}>$1,200.00</h3>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <h3 className="h3" style={{ marginBottom: 'var(--space-lg)' }}>Transaction History</h3>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: 'var(--space-lg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>TRANSACTION</th>
                <th style={{ padding: 'var(--space-lg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>DATE</th>
                <th style={{ padding: 'var(--space-lg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>AMOUNT</th>
                <th style={{ padding: 'var(--space-lg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: tx.direction === 'CREDIT' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(123, 97, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.direction === 'CREDIT' ? <ArrowDownLeft size={16} color="var(--success)" /> : <ArrowUpRight size={16} color="var(--accent-premium)" />}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tx.type}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tx.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-lg)', fontSize: '0.875rem', fontWeight: 700, color: tx.direction === 'CREDIT' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {tx.direction === "CREDIT" ? "+" : "-"}ETB {(tx.amountMinor / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-lg)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ width: '100%', padding: 'var(--space-md)', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'rgba(255, 255, 255, 0.02)' }}>
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
}
