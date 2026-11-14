"use client";
import { PageHeader } from "@/components/shell/PageHeader";
import { Suspense } from "react";
import OrderBoard from "@/components/Orders/OrderBoard";

export default function OrdersPage() {
  return <div className="fade-in">
    <PageHeader title="Orders" description="Confirm new bookings, start rentals and complete them when items come back." />
    {/* The board reads ?booking= to highlight a booking opened from a notification. */}
    <Suspense><OrderBoard /></Suspense>
  </div>;
}
