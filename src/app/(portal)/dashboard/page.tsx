"use client";

import SummaryCard from "@/components/Dashboard/SummaryCard";
import { DollarSign, ShoppingBag, Clock, Eye } from "lucide-react";
import styles from "@/components/Dashboard/Dashboard.module.css";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="fade-in">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="h1">Overview</h1>
        <p className="text-body">Here's what's happening with your business today.</p>
      </header>

      <div className={styles.dashboardGrid}>
        <SummaryCard 
          title="Total Earnings" 
          value="$12,840.00" 
          change="+12.5%" 
          isPositive={true} 
          icon={DollarSign} 
        />
        <SummaryCard 
          title="Active Bookings" 
          value="24" 
          change="+4.2%" 
          isPositive={true} 
          icon={ShoppingBag} 
        />
        <SummaryCard 
          title="Pending Requests" 
          value="8" 
          change="-2.1%" 
          isPositive={false} 
          icon={Clock} 
        />
        <SummaryCard 
          title="Profile Visits" 
          value="1,420" 
          change="+18.7%" 
          isPositive={true} 
          icon={Eye} 
        />
      </div>

      <div className={styles.chartSection}>
        <div className="glass-card" style={{ padding: 'var(--space-xl)', height: '400px' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-lg)' }}>Revenue Performance</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            [Revenue Chart Placeholder]
          </div>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '6px' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>New booking request for "Royal Velvet Set"</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
