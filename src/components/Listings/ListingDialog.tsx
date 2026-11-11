"use client";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Modal used by listing editors. Closing is blocked while a save is running. */
export default function ListingDialog({ label, busy = false, onClose, children }: {
  label: string; busy?: boolean; onClose: () => void; children: ReactNode;
}) {
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent aria-label={label} aria-busy={busy} showCloseButton={!busy}
      className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-2xl"
      onInteractOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogTitle className="sr-only">{label}</DialogTitle>
      {children}
    </DialogContent>
  </Dialog>;
}
