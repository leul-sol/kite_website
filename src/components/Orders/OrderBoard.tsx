"use client";

import OrderCard from "./OrderCard";
import styles from "./Orders.module.css";

const columns = [
  { id: 'new', title: 'New Requests', color: 'var(--accent-premium)' },
  { id: 'confirmed', title: 'Confirmed', color: 'var(--accent-secondary)' },
  { id: 'progress', title: 'In Progress', color: 'var(--accent-primary)' },
  { id: 'completed', title: 'Completed', color: 'var(--success)' },
];

const mockOrders = [
  { id: 'ORD-7721', item: 'Royal Velvet Sofa', customer: 'Alex Rivera', date: 'Oct 24 - 26', total: '$360', status: 'new' },
  { id: 'ORD-7725', item: 'Golden Candelabra (x4)', customer: 'Sophie Chen', date: 'Oct 25', total: '$180', status: 'new' },
  { id: 'ORD-7718', item: 'Crystal Chandelier', customer: 'Marcus Thorne', date: 'Oct 22 - 23', total: '$700', status: 'confirmed' },
  { id: 'ORD-7712', item: 'Marble Banquet Table', customer: 'Emma Watson', date: 'Oct 20 - 21', total: '$400', status: 'progress' },
];

export default function OrderBoard() {
  return (
    <div className={styles.board}>
      {columns.map((col) => (
        <div key={col.id} className={styles.column}>
          <div className={styles.columnHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
              <h3 className={styles.columnTitle}>{col.title}</h3>
            </div>
            <span className={styles.count}>{mockOrders.filter(o => o.status === col.id).length}</span>
          </div>

          <div className={styles.dropZone}>
            {mockOrders.filter(o => o.status === col.id).map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
