"use client";

import { MoreVertical, Edit2, Trash2, Eye } from "lucide-react";
import styles from "./Listings.module.css";

const mockListings = [
  { id: '1', name: 'Royal Velvet Sofa', category: 'Furniture', price: '$120/day', status: 'Active', stock: 5, image: '🛋️' },
  { id: '2', name: 'Golden Candelabra', category: 'Decor', price: '$45/day', status: 'Active', stock: 12, image: '🕯️' },
  { id: '3', name: 'Crystal Chandelier', category: 'Lighting', price: '$350/day', status: 'Low Stock', stock: 2, image: '💡' },
  { id: '4', name: 'Marble Banquet Table', category: 'Furniture', price: '$200/day', status: 'Inactive', stock: 0, image: '🍽️' },
];

export default function ListingTable() {
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockListings.map((item) => (
            <tr key={item.id}>
              <td>
                <div className={styles.itemCell}>
                  <div className={styles.itemImage}>{item.image}</div>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
              </td>
              <td>{item.category}</td>
              <td style={{ color: item.stock < 3 ? 'var(--error)' : 'inherit' }}>{item.stock} units</td>
              <td>{item.price}</td>
              <td>
                <span className={`${styles.statusTag} ${styles[item.status.toLowerCase().replace(' ', '')]}`}>
                  {item.status}
                </span>
              </td>
              <td>
                <div className={styles.actions}>
                  <button title="View"><Eye size={16} /></button>
                  <button title="Edit"><Edit2 size={16} /></button>
                  <button title="Delete" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
