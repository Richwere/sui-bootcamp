import styles from './ui.module.css'

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',   // primary | ghost | danger | success
  size    = 'md',        // sm | md | lg
  loading = false,
  disabled,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <span className={styles.spinner} aria-hidden />
        : children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.inputWrap} ${className}`}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div className={styles.inputRow}>
        {prefix && <span className={styles.inputAddon}>{prefix}</span>}
        <input className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
        {suffix && <span className={`${styles.inputAddon} ${styles.inputSuffix}`}>{suffix}</span>}
      </div>
      {error && <span className={styles.inputHintError}>{error}</span>}
      {hint && !error && <span className={styles.inputHint}>{hint}</span>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', pulse = false }) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${variant}`]}`}>
      {pulse && <span className={styles.pulseDot} />}
      {children}
    </span>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr className={styles.divider} />
  return (
    <div className={styles.dividerLabeled}>
      <hr className={styles.divider} />
      <span className={styles.dividerLabel}>{label}</span>
      <hr className={styles.divider} />
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', accent = false, ...props }) {
  return (
    <div
      className={`${styles.card} ${accent ? styles.cardAccent : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
export function Stat({ label, value, sub, highlight = false }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${highlight ? styles.statHighlight : ''}`}>
        {value}
      </span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

// ─── Kbd ──────────────────────────────────────────────────────────────────────
export function Kbd({ children }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}