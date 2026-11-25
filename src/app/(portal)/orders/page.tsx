"use client";
import { PageHeader } from "@/components/shell/PageHeader";
import { Suspense } from "react";
import OrderBoard from "@/components/Orders/OrderBoard";
import { useT } from "@/i18n/I18nProvider";

export default function OrdersPage() {
  const { t } = useT();
  return <div className="fade-in">
    <PageHeader title={t("nav.orders")} description={t("ord.description")} />
    {/* The board reads ?booking= to highlight a booking opened from a notification. */}
    <Suspense><OrderBoard /></Suspense>
  </div>;
}
