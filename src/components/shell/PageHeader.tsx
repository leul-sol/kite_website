import { cn } from "@/lib/utils";

/** Title row used at the top of every portal page. */
export function PageHeader({ title, description, actions, className }: {
  title: string; description?: React.ReactNode; actions?: React.ReactNode; className?: string;
}) {
  return <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
    <div className="min-w-0 space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>;
}

/** Small "label + value" figure used in summary rows. */
export function Stat({ label, value, hint, icon, tone = "default" }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const toneClass = { default: "bg-muted text-muted-foreground", primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" }[tone];
  return <div className="rounded-xl border bg-card p-5 shadow-xs">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      {icon && <span className={cn("grid size-8 place-items-center rounded-lg", toneClass)}>{icon}</span>}
    </div>
    <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>;
}

/** Friendly placeholder for empty lists and failed loads. */
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: React.ReactNode; action?: React.ReactNode;
}) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
    <div className="mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">{icon}</div>
    <p className="font-medium">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>;
}
