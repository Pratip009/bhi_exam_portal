"use client";

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-ink/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ kind = "error", children, onClose }) {
  if (!children) return null;
  const styles = kind === "error" ? "border-wrong/30 bg-wrong/5 text-wrong" : "border-right/30 bg-right/5 text-right";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <div>{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-current/70 hover:underline" aria-label="Dismiss">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return <p className="py-10 text-center text-ink/50">{label}</p>;
}

export function Empty({ title, children }) {
  return (
    <div className="panel px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">{children}</p>}
    </div>
  );
}
