"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { DashboardLoad, ProviderBookingDashboard, ProviderWalletDashboard } from "@/services/provider-dashboard";
import DashboardView from "@/components/Dashboard/DashboardView";

export default function DashboardPage() {
  const [wallet, setWallet] = useState<DashboardLoad<ProviderWalletDashboard>>({ status: "loading" });
  const [bookings, setBookings] = useState<DashboardLoad<ProviderBookingDashboard>>({ status: "loading" });
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(() => {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setWallet({ status: "loading" }); setBookings({ status: "loading" });
    void Promise.allSettled([
      api.getProviderWalletDashboard(controller.signal).then(data => {
        if (!controller.signal.aborted) setWallet({ status: "ready", data });
      }).catch(() => { if (!controller.signal.aborted) setWallet({ status: "error" }); }),
      api.getProviderBookingDashboard(controller.signal).then(data => {
        if (!controller.signal.aborted) setBookings({ status: "ready", data });
      }).catch(() => { if (!controller.signal.aborted) setBookings({ status: "error" }); }),
    ]);
  }, []);
  useEffect(() => { refresh(); return () => active.current?.abort(); }, [refresh]);
  return <DashboardView wallet={wallet} bookings={bookings} refresh={refresh} />;
}
