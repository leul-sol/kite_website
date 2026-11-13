"use client";
import { PageHeader } from "@/components/shell/PageHeader";
import OrderBoard from "@/components/Orders/OrderBoard";

export default function OrdersPage() {
  return <div className="fade-in">
    <PageHeader title="Orders" description="Confirm new bookings, start rentals and complete them when items come back." />
    <OrderBoard />
  </div>;
}
