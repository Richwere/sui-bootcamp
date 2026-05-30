import { useCopyToClipboard } from '../hooks.js'
import { EXPLORER } from '../constants.js'
import styles from './TxReceipt.module.css'

export function TxReceipt({ hash, label = 'Transaction' }) {
  const { copy, copied } = useCopyToClipboard()
  if (!hash) return null

  return (
    <div className={styles.receipt}>
      <div className={styles.left}>
        <span className={styles.check}>✓</span>
        <div>
          <span className={styles.label}>{label}</span>
          <code className={styles.hash}>{hash}</code>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => copy(hash)}>
          {copied ? '✓' : '⎘'}
        </button>
        <a
          className={styles.actionBtn}
          href={`${EXPLORER}/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          title="View on Stellar Expert"
        >
          ↗
        </a>
      </div>
    </div>
  )
}