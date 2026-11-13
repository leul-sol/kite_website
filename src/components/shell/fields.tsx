import { cn } from "@/lib/utils";

/** Native form controls styled like shadcn/ui, so FormData-based forms keep working. */
export const controlClass = "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

/** A labelled field. The label wraps the control so it is announced and clickable. */
export function Field({ label, hint, className, children }: {
  label: React.ReactNode; hint?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  // The hint sits outside the label so a field's accessible name is just its label.
  return <div className={cn("grid gap-1.5", className)}>
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>;
}

export function FormError({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{children}</p>;
}
