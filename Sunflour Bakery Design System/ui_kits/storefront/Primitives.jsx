// Sunflour storefront — shared primitives.
// Exposed on window for the other babel scripts.
const { useState, useEffect, useRef, useMemo } = React;

// ---- Lucide icon (robust React wrapper) ----
function Icon({ name, size = 18, color, strokeWidth = 1.75, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current;
    if (host && window.lucide) {
      host.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      host.appendChild(i);
      window.lucide.createIcons({
        attrs: { width: size, height: size, "stroke-width": strokeWidth },
      });
    }
  }, [name, size, strokeWidth]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{ display: "inline-flex", width: size, height: size, color, ...style }}
    />
  );
}

// ---- Naira price ----
function formatNaira(kobo) {
  const n = Math.round((kobo || 0) / 100);
  return "₦" + n.toLocaleString("en-NG");
}
function Price({ amount, className, style }) {
  return (
    <span className={"sf-price " + (className || "")} style={style}>
      {formatNaira(amount)}
    </span>
  );
}

// ---- Button ----
function Button({ variant = "primary", size = "md", icon, loading, disabled, children, onClick, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "all 160ms var(--ease-standard)",
    opacity: disabled || loading ? 0.55 : 1, fontFamily: "var(--font-sans)",
  };
  const sizes = {
    sm: { minHeight: 40, padding: "0 14px", fontSize: 14 },
    md: { minHeight: 44, padding: "0 18px", fontSize: 14 },
    lg: { minHeight: 48, padding: "0 22px", fontSize: 16 },
  };
  const variants = {
    primary: { background: "var(--color-primary)", color: "#fff" },
    secondary: { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" },
    ghost: { background: "transparent", color: "var(--color-text)" },
    danger: { background: "var(--color-danger)", color: "#fff" },
  };
  const [hover, setHover] = useState(false);
  const hoverStyle = hover && !disabled && !loading
    ? (variant === "primary" ? { background: "var(--color-primary-hover)" }
      : variant === "secondary" || variant === "ghost" ? { background: "var(--color-surface-soft)" }
      : {})
    : {};
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...hoverStyle, ...style }}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled || loading}
    >
      {loading ? <Icon name="loader-circle" size={16} style={{ animation: "sf-spin 0.8s linear infinite" }} /> : icon}
      <span>{children}</span>
    </button>
  );
}

// ---- Badge / StatusPill ----
const TONES = {
  neutral: { border: "var(--color-border)", bg: "var(--color-surface-soft)", fg: "var(--color-text-muted)" },
  success: { border: "var(--color-success)", bg: "var(--color-success-soft)", fg: "var(--color-success)" },
  warning: { border: "var(--color-warning)", bg: "var(--color-warning-soft)", fg: "var(--color-warning)" },
  danger: { border: "var(--color-danger)", bg: "var(--color-danger-soft)", fg: "var(--color-danger)" },
  info: { border: "var(--color-focus)", bg: "var(--color-surface-soft)", fg: "var(--color-focus)" },
};
function Badge({ tone = "neutral", children, style }) {
  const t = TONES[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", minHeight: 26, gap: 5,
      borderRadius: "var(--radius-pill)", border: "1px solid " + t.border,
      background: t.bg, color: t.fg, padding: "3px 10px", fontSize: 12, fontWeight: 700, ...style,
    }}>{children}</span>
  );
}
const STATUS_META = {
  ACTIVE: { label: "Active", tone: "success" },
  OUT_OF_STOCK: { label: "Out of stock", tone: "warning" },
  HIDDEN: { label: "Hidden", tone: "neutral" },
  PENDING_PAYMENT: { label: "Pending payment", tone: "warning" },
  PAYMENT_UNDER_REVIEW: { label: "Payment under review", tone: "info" },
  PAYMENT_CONFIRMED: { label: "Payment confirmed", tone: "success" },
  PREPARING: { label: "Preparing", tone: "info" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  UNPAID: { label: "Unpaid", tone: "warning" },
};
function StatusPill({ status }) {
  const m = STATUS_META[status] || { label: status, tone: "neutral" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

// ---- Field (input with label) ----
function Field({ label, helpText, error, ...props }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{label}</span>
      {helpText ? <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{helpText}</span> : null}
      <input
        {...props}
        style={{
          minHeight: 44, borderRadius: "var(--radius-sm)",
          border: "1px solid " + (error ? "var(--color-danger)" : "var(--color-border)"),
          background: "var(--color-surface)", padding: "0 12px", font: "inherit",
          color: "var(--color-text)", outline: "none",
        }}
      />
      {error ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-danger)" }}>{error}</span> : null}
    </label>
  );
}

// ---- Quantity stepper ----
function IconBtn({ name, onClick, label, disabled }) {
  return (
    <button aria-label={label} onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      display: "grid", placeItems: "center", width: 44, height: 44, flex: "0 0 auto",
      borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
      background: "var(--color-surface)", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, color: "var(--color-text)",
    }}>
      <Icon name={name} size={16} />
    </button>
  );
}
function QuantityStepper({ value, min = 1, max = 99, onChange }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <IconBtn name="minus" label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} />
      <span style={{
        display: "grid", placeItems: "center", height: 44, minWidth: 48,
        borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
        background: "var(--color-surface)", fontWeight: 700, fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
      <IconBtn name="plus" label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} />
    </div>
  );
}

Object.assign(window, { Icon, Price, formatNaira, Button, Badge, StatusPill, Field, QuantityStepper, IconBtn });
