"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../services/api";
import { orderActions, type Order, type OrderTarget, type ChangeRequest } from "../../services/orders";
import { type StaffSchedule } from "../../services/api";
import { addDays, orderRange, today } from "../../services/staff";
import AssignStaffDialog from "../Staff/AssignStaffDialog";
import HandoverDialog from "../Inventory/HandoverDialog";
import OrderBoardView from "./OrderBoardView";

export default function OrderBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ order: Order; changes: ChangeRequest[] } | null>(null);
  const [pending, setPending] = useState<{ order: Order; target: OrderTarget } | null>(null);
  const [note, setNote] = useState("");
  const [staffing, setStaffing] = useState<StaffSchedule | null>(null);
  const [assigning, setAssigning] = useState<{ order: Order; start: string; end: string } | null>(null);
  const [handover, setHandover] = useState<string | null>(null);
  // A notification links here as /orders?booking=<id>.
  const highlighted = useSearchParams().get("booking");
  useEffect(() => {
    if (!highlighted || loading) return;
    document.getElementById(`order-${highlighted}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted, loading, orders]);
  const loadController = useRef<AbortController | null>(null);
  // Who works which booking, for the last month and the next two. Optional: the board works without it.
  const loadStaff = useCallback(() => {
    const now = today();
    api.getStaffSchedule(addDays(now, -30), addDays(now, 61)).then(setStaffing).catch(() => setStaffing(null));
  }, []);
  useEffect(() => { loadStaff(); }, [loadStaff]);
  const mutation = useRef(false);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    loadController.current?.abort();
    const controller = new AbortController(); loadController.current = controller;
    setLoading(true); setOrders([]);
    try {
      const data = await api.getOrders(controller.signal);
      if (!controller.signal.aborted) setOrders(data);
    } catch {
      if (!controller.signal.aborted) setError("Bookings could not be loaded. Refresh to try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; loadController.current?.abort(); };
  }, [load]);

  const run = async (operation: () => Promise<unknown>, changed: boolean) => {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError("");
    try {
      await operation();
      if (mounted.current && changed) { setPending(null); setReview(null); await load(); }
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "The request failed. Refresh and try again.");
        // Never guess a new status after a conflict or an uncertain response.
        if (changed) { setPending(null); setReview(null); await load(); }
      }
    } finally {
      mutation.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const reviewChanges = (order: Order) => void run(async () => {
    const changes = await api.getOrderChanges(order.id);
    if (!Array.isArray(changes)) throw new Error("Invalid change request response");
    if (mounted.current) { setNote(""); setReview({ order, changes: changes.filter(change => change.status === "OPEN") }); }
  }, false);

  const staffFor = (orderId: string) => {
    const booking = staffing?.bookings.find(b => b.id === orderId);
    return booking ? staffing!.staff.filter(member => booking.staff.includes(member.id)) : staffing ? [] : undefined;
  };

  return <>
  {assigning && <AssignStaffDialog bookingId={assigning.order.id} start={assigning.start} end={assigning.end}
    onClose={() => setAssigning(null)} onSaved={loadStaff} />}
  {handover && <HandoverDialog bookingId={handover} onClose={() => setHandover(null)} />}
  <OrderBoardView orders={orders} loading={loading} error={error} busy={busy} highlighted={highlighted}
    refresh={() => { setError(""); void load(); }}
    onAction={(order, target) => {
      if (!orderActions(order.status).some(action => action.target === target)) return;
      setPending({ order, target });
    }} onReview={reviewChanges} pending={pending} review={review} note={note} onNote={setNote}
    onClose={() => { setPending(null); setReview(null); }}
    onConfirm={() => { if (pending) void run(() => api.updateOrderStatus(pending.order.id, pending.target), true); }}
    onResolve={(id, approved) => { if (review) void run(() => api.resolveOrderChange(review.order.id, id, approved, note), true); }}
    staffFor={staffFor} onAssign={order => { const range = orderRange(order.date); if (range) setAssigning({ order, ...range }); }}
    onHandover={order => setHandover(order.id)} />
  </>;
}
