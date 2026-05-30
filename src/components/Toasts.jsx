import styles from './Toasts.module.css'

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    '◈',
  warn:    '⚠',
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className={styles.container} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[`toast-${t.type}`]} ${t.dying ? styles.dying : ''}`}
          onClick={() => onDismiss(t.id)}
        >
          <span className={styles.icon}>{ICONS[t.type] ?? '◈'}</span>
          <span className={styles.msg}>{t.msg}</span>
          <span className={styles.close}>✕</span>
        </div>
      ))}
    </div>
  )
}