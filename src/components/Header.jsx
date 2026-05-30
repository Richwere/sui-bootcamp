import { Badge, Button } from './ui.jsx'
import { CONTRACT_ID, EXPLORER } from '../constants.js'
import { shortAddr } from '../stellar.js'
import { useCopyToClipboard } from '../hooks.js'
import styles from './Header.module.css'

export function Header({ wallet, onConnect, onDisconnect }) {
  const { copy, copied } = useCopyToClipboard()

  return (
    <header className={styles.header}>
      {/* Left — wordmark */}
      <div className={styles.left}>
        <div className={styles.logoWrap}>
          <svg className={styles.logoMark} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity=".1" />
            <path d="M8 24 L16 8 L24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M11 19 L21 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div className={styles.wordmark}>NOLOSS AUCTION</div>
            <div className={styles.subword}>Stellar · Soroban</div>
          </div>
        </div>
      </div>

      {/* Center — contract pill */}
      <div className={styles.center}>
        <button
          className={styles.contractPill}
          onClick={() => copy(CONTRACT_ID)}
          title={CONTRACT_ID}
        >
          <span className={styles.contractDot} />
          <span className={styles.contractLabel}>CONTRACT</span>
          <span className={styles.contractId}>
            {shortAddr(CONTRACT_ID, 8)}
          </span>
          <span className={styles.contractCopy}>
            {copied ? '✓' : '⎘'}
          </span>
        </button>
      </div>

      {/* Right — network + wallet */}
      <div className={styles.right}>
        <Badge variant="testnet">Testnet</Badge>

        <a
          className={styles.explorerLink}
          href={`${EXPLORER}/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
          title="View on Stellar Expert"
        >
          Explorer ↗
        </a>

        {wallet.connected ? (
          <button className={styles.walletBtn} onClick={onDisconnect}>
            <span className={styles.walletDot} />
            <span className={styles.walletAddr}>{shortAddr(wallet.publicKey, 5)}</span>
          </button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onConnect}
            loading={wallet.connecting}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  )
}