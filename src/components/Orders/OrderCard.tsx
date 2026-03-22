"use client";

import { motion } from "framer-motion";
import { User, Calendar, MapPin, MoreHorizontal } from "lucide-react";
import styles from "./Orders.module.css";

interface OrderCardProps {
  order: any;
}

const OrderCard = ({ order }: OrderCardProps) => (
  <motion.div 
    layout
    whileHover={{ scale: 1.02 }}
    className="glass-card" 
    style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', cursor: 'grab' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{order.id}</span>
      <MoreHorizontal size={14} color="var(--text-tertiary)" />
    </div>
    
    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>{order.item}</h4>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <User size={12} /> {order.customer}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <Calendar size={12} /> {order.date}
      </div>
    </div>

    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{order.total}</span>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
        {order.customer.split(' ').map((n: string) => n[0]).join('')}
      </div>
    </div>
  </motion.div>
);

export default OrderCard;
