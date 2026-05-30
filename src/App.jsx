import { useState, useCallback } from 'react'
import { Header }       from './components/Header.jsx'
import { AuctionHero }  from './components/AuctionHero.jsx'
import { BidPanel }     from './components/BidPanel.jsx'
import { CreatePanel }  from './components/CreatePanel.jsx'
import { ManagePanel }  from './components/ManagePanel.jsx'
import { TxReceipt }    from './components/TxReceipt.jsx'
import { Toasts }       from './components/Toasts.jsx'
import { useWallet, useAuction, useToasts } from './hooks.js'
import { formatTokens } from './stellar.js'
import styles from './App.module.css'

const TABS = [
  { id: 'bid',    label: 'Live Auction' },
  { id: 'create', label: 'Create'       },
  { id: 'manage', label: 'Manage'       },
]

export default function App() {
  const [tab,     setTab]     = useState('bid')
  const [lastTx,  setLastTx]  = useState(null)

  const wallet           = useWallet()
  const { auction, isDemo, patch, refresh } = useAuction()
  const { toasts, toast, dismiss }          = useToasts()

  // ── Bid placed ─────────────────────────────────────────────────────────────
  const handleBidPlaced = useCallback(({ stroops, hash }) => {
    setLastTx({ hash, label: `Bid placed — ${formatTokens(stroops)} tokens` })
    patch({
      highest_bid:    stroops,
      highest_bidder: wallet.publicKey,
      bid_count:      auction.bid_count + 1,
    })
  }, [wallet.publicKey, auction.bid_count, patch])

  // ── Auction created ────────────────────────────────────────────────────────
  const handleCreated = useCallback(({ hash, form }) => {
    setLastTx({ hash, label: 'Auction created' })
    setTab('bid')
    refresh()
  }, [refresh])

  // ── Admin action (finalize / cancel) ───────────────────────────────────────
  const handleAction = useCallback(({ type, hash }) => {
    setLastTx({ hash, label: type === 'finalized' ? 'Auction finalized' : 'Auction cancelled' })
    patch({ status: type === 'finalized' ? 'Finalized' : 'Cancelled' })
  }, [patch])

  return (
    <div className={styles.app}>
      <Header
        wallet={{ ...wallet }}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      <main className={styles.main}>
        {/* ── Tab bar ── */}
        <nav className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => { setTab(t.id); setLastTx(null) }}
            >
              {t.label}
              {t.id === 'bid' && auction.status === 'Active' && (
                <span className={styles.liveDot} aria-hidden />
              )}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className={styles.content}>
          {/* Always show AuctionHero on bid tab */}
          {tab === 'bid' && (
            <>
              <AuctionHero auction={auction} isDemo={isDemo} />
              <BidPanel
                auction={auction}
                wallet={wallet}
                onBidPlaced={handleBidPlaced}
                toast={toast}
              />
            </>
          )}

          {tab === 'create' && (
            <CreatePanel
              wallet={wallet}
              onCreated={handleCreated}
              toast={toast}
            />
          )}

          {tab === 'manage' && (
            <ManagePanel
              auction={auction}
              wallet={wallet}
              onAction={handleAction}
              toast={toast}
            />
          )}

          {/* Latest TX receipt */}
          {lastTx && (
            <TxReceipt hash={lastTx.hash} label={lastTx.label} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>No-Loss Auction Protocol · Stellar Soroban · Testnet</span>
        <span>All bids auto-refunded atomically · Zero custody risk</span>
      </footer>

      {/* Toasts */}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}