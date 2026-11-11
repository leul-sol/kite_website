import { orderColumns, orderColumn, orderActions, type Order, type OrderTarget, type ChangeRequest } from "../../services/orders";
import OrderCard from "./OrderCard";
import styles from "./Orders.module.css";

export default function OrderBoardView(props: {
  orders: Order[]; loading: boolean; error: string; busy: boolean; refresh: () => void;
  onAction: (order: Order, target: OrderTarget) => void; onReview: (order: Order) => void;
  pending: { order: Order; target: OrderTarget } | null;
  review: { order: Order; changes: ChangeRequest[] } | null;
  note: string; onNote: (value: string) => void; onClose: () => void;
  onConfirm: () => void; onResolve: (id: string, approved: boolean) => void;
}) {
  const disabled = props.busy || props.loading;
  return <section aria-label="Provider orders" aria-busy={disabled}>
    <div className={styles.toolbar}>
      <p>Actions depend on payment and booking status. The server checks each change.</p>
      <button type="button" className="btn-secondary" disabled={disabled || !!props.pending || !!props.review} onClick={props.refresh}>Refresh bookings</button>
    </div>
    {props.error && <p role="alert">{props.error}</p>}
    {props.loading && <p role="status">Loading bookings...</p>}
    {!props.loading && !props.error && props.orders.length === 0 && <p>No bookings yet.</p>}
    {props.busy && <p role="status">Processing request...</p>}
    {props.pending && <section className={`glass-card ${styles.review}`} aria-label="Confirm booking action">
      <h3>{orderActions(props.pending.order.status).find(a => a.target === props.pending?.target)?.label}</h3>
      <p>Booking {props.pending.order.id}. This changes the booking for both parties.</p>
      {props.pending.target === "CANCELLED" && <p>Funded cancellations are settled to the customer wallet. Original payment method refunds are not available.</p>}
      {props.pending.target === "COMPLETED" && <p>Completing the rental starts settlement of held funds.</p>}
      <div className={styles.actions}>
        <button className="btn-primary" disabled={disabled} onClick={props.onConfirm}>Confirm action</button>
        <button className="btn-secondary" disabled={disabled} onClick={props.onClose}>Go back</button>
      </div>
    </section>}
    {props.review && <section className={`glass-card ${styles.review}`} aria-label="Review booking change">
      <h3>Change requests for booking {props.review.order.id.slice(0, 8)}</h3>
      <p>Current rental dates: {props.review.order.date}</p>
      {props.review.changes.length === 0 && <p>No open change request found. Refresh the bookings.</p>}
      {props.review.changes.length > 0 && <label>Decision note (optional)
        <textarea maxLength={1000} value={props.note} disabled={disabled} onChange={event => props.onNote(event.target.value)} />
      </label>}
      {props.review.changes.map(change => <div key={change.id} className={styles.review}>
        <p>Request: {change.request_type}</p>
        <p>Reason: {change.reason || "No reason supplied"}</p>
        {change.request_type === "RESCHEDULE" && <p>Requested dates: {change.requested_start_date} - {change.requested_end_date}</p>}
        {change.request_type === "CANCELLATION" && <p>If funded, an approved cancellation returns funds to the customer wallet.</p>}
        {change.requested_role === "PROVIDER" ? <p>Awaiting the customer's decision on your request.</p> : <div className={styles.actions}>
          <button className="btn-primary" disabled={disabled} onClick={() => props.onResolve(change.id, true)}>Approve request</button>
          <button className="btn-secondary" disabled={disabled} onClick={() => props.onResolve(change.id, false)}>Decline request</button>
        </div>}
      </div>)}
      <button className="btn-secondary" disabled={disabled} onClick={props.onClose}>Close review</button>
    </section>}
    {!props.loading && <div className={styles.board}>
      {orderColumns.filter(column => column.id !== "other" || props.orders.some(order => orderColumn(order.status) === "other")).map(column => {
        const orders = props.orders.filter(order => orderColumn(order.status) === column.id);
        return <section key={column.id} className={styles.column} aria-label={column.title}>
          <div className={styles.columnHeader}><h3 className={styles.columnTitle}>{column.title}</h3><span className={styles.count}>{orders.length}</span></div>
          <div className={styles.dropZone}>{orders.map(order => <OrderCard key={order.id} order={order} busy={disabled || !!props.pending || !!props.review}
            onAction={props.onAction} onReview={props.onReview} />)}</div>
        </section>;
      })}
    </div>}
  </section>;
}
