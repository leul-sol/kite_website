"use client";

import OrderBoard from "@/components/Orders/OrderBoard";

export default function OrdersPage() {
  return (
    <div className="fade-in">
      <header style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="h1">Orders & Fulfillment</h1>
        <p className="text-body">Track, manage, and confirm your upcoming rentals.</p>
      </header>

      <OrderBoard />
    </div>
  );
}
