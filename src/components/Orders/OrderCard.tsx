"use client";

import { isChangeRequest, orderActions, type Order, type OrderTarget } from "../../services/orders";
import styles from "./Orders.module.css";

export default function OrderCard({ order, busy, onAction, onReview }: {
  order: Order; busy: boolean;
  onAction: (order: Order, target: OrderTarget) => void;
  onReview: (order: Order) => void;
}) {
  return <article className={`glass-card ${styles.card}`}>
    <h4>Booking {order.id.slice(0, 8)}</h4>
    <p className={styles.reference}>Reference: {order.id}</p>
    <p>Status: {order.status.replaceAll("_", " ").toLowerCase()}</p>
    <p>Customer reference: {order.customerId.slice(0, 8)}</p>
    <p>{order.date}</p>
    <strong>{order.total}</strong>
    <div className={styles.actions}>
      {orderActions(order.status).map(action => <button type="button" key={action.target}
        className="btn-secondary" disabled={busy} onClick={() => onAction(order, action.target)}>{action.label}</button>)}
      {isChangeRequest(order.status) && <button type="button" className="btn-secondary" disabled={busy}
        onClick={() => onReview(order)}>Review change request</button>}
    </div>
  </article>;
}
