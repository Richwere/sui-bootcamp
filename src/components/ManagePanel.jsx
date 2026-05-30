import { useState } from 'react'
import { Button, Card, Stat, Divider } from './ui.jsx'
import { finalizeAuction as stellarFinalize, cancelAuction as stellarCancel, formatTokens, shortAddr } from '../stellar.js'
import { EXPLORER, CONTRACT_ID } from '../constants.js'
import { useCopyToClipboard } from '../hooks.js'
import styles from './ManagePanel.module.css'

function StateRow({ label, value, mono = true, link }) {
  return (
    <div className={styles.stateRow}>
      <span className={styles.stateLabel}>{label}</span>
      {link ? (
        <a className={styles.stateLink} href={link} target="_blank" rel="noreferrer">
          {value} ↗
        </a>
      ) : (
        <span className={`${styles.stateVal} ${mono ? styles.mono : ''}`}>{value}</span>
      )}
    </div>
  )
}

export function ManagePanel({ auction, wallet, onAction, toast }) {
  const [finalizing, setFinalizing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { copy, copied } = useCopyToClipboard()

  const now       = Math.floor(Date.now() / 1000)
  const expired   = now >= auction.deadline
  const isActive  = auction.status === 'Active'
  const canFinal  = isActive && expired  && wallet.connected
  const canCancel = isActive && auction.bid_count === 0 && wallet.connected

  const handleFinalize = async () => {
    setFinalizing(true)
    try {
      const { hash } = await stellarFinalize(wallet.publicKey)
      toast('Auction finalized! Funds sent to creator.', 'success')
      onAction({ type: 'finalized', hash })
    } catch (e) {
      toast(e.message ?? 'Finalize failed', 'error')
    } finally {
      setFinalizing(false)
    }
  }

  const handleCancel = async () => {
    if (auction.bid_count > 0) {
      toast('Cannot cancel — bids exist', 'error')
      return
    }
    setCancelling(true)
    try {
      const { hash } = await stellarCancel(wallet.publicKey)
      toast('Auction cancelled.', 'success')
      onAction({ type: 'cancelled', hash })
    } catch (e) {
      toast(e.message ?? 'Cancel failed', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const deadline   = new Date(auction.deadline * 1000).toLocaleString()
  const statusStr  = auction.status === 'Active' && expired ? 'Active (ended)' : auction.status
  const bidAmount  = auction.highest_bid > 0n ? formatTokens(auction.highest_bid) + ' tokens' : 'None'

  return (
    <div className={styles.wrap}>
      {/* Actions */}
      <Card className={styles.actionsCard}>
        <div className={styles.cardHeader}>AUCTION ACTIONS</div>

        <div className={styles.actionGrid}>
          {/* Finalize */}
          <div className={styles.actionCell}>
            <div className={styles.actionInfo}>
              <span className={styles.actionName}>Finalize</span>
              <p className={styles.actionDesc}>
                Transfers winning bid to creator.
                Only callable after the deadline.
                {auction.bid_count === 0 && ' No bids — nothing to transfer.'}
              </p>
            </div>
            <Button
              variant="success"
              size="sm"
              loading={finalizing}
              disabled={!canFinal}
              onClick={handleFinalize}
            >
              {auction.status === 'Finalized' ? '✓ Done' : 'Finalize Auction'}
            </Button>
            {!expired && isActive && (
              <span className={styles.actionHint}>Available after deadline</span>
            )}
          </div>

          <div className={styles.actionDivider} />

          {/* Cancel */}
          <div className={styles.actionCell}>
            <div className={styles.actionInfo}>
              <span className={styles.actionName}>Cancel</span>
              <p className={styles.actionDesc}>
                Permanently cancels the auction.
                Only allowed when <strong>zero bids</strong> have been placed.
                {auction.bid_count > 0 && ` (${auction.bid_count} bid${auction.bid_count > 1 ? 's' : ''} exist — cannot cancel)`}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              disabled={!canCancel}
              onClick={handleCancel}
            >
              {auction.status === 'Cancelled' ? '✓ Done' : 'Cancel Auction'}
            </Button>
            {auction.bid_count > 0 && (
              <span className={`${styles.actionHint} ${styles.hintRed}`}>
                Bids exist — cancellation blocked
              </span>
            )}
          </div>
        </div>

        {!wallet.connected && (
          <div className={styles.noWallet}>
            Connect wallet to perform actions
          </div>
        )}
      </Card>

      {/* Contract state */}
      <Card className={styles.stateCard}>
        <div className={styles.cardHeader}>CONTRACT STATE</div>
        <div className={styles.stateTable}>
          <StateRow label="Status"        value={statusStr} />
          <StateRow label="Item"          value={auction.item_name} mono={false} />
          <StateRow label="Highest Bid"   value={bidAmount} />
          <StateRow label="Winner"
            value={auction.highest_bidder ? shortAddr(auction.highest_bidder, 8) : '—'}
            link={auction.highest_bidder ? `${EXPLORER}/account/${auction.highest_bidder}` : null}
          />
          <StateRow label="Reserve"       value={formatTokens(auction.reserve_price) + ' tokens'} />
          <StateRow label="Bid Count"     value={String(auction.bid_count)} />
          <StateRow label="Deadline"      value={deadline} mono={false} />
          <StateRow label="Creator"
            value={shortAddr(auction.creator, 8)}
            link={`${EXPLORER}/account/${auction.creator}`}
          />
          <StateRow label="Token"
            value={shortAddr(auction.token, 8)}
            link={`${EXPLORER}/contract/${auction.token}`}
          />
          <StateRow label="Contract"
            value={shortAddr(CONTRACT_ID, 8)}
            link={`${EXPLORER}/contract/${CONTRACT_ID}`}
          />
          <StateRow label="Network"       value="Stellar Testnet" mono={false} />
        </div>

        {/* Copy contract ID */}
        <div className={styles.copyRow}>
          <code className={styles.contractFull}>{CONTRACT_ID}</code>
          <button className={styles.copyBtn} onClick={() => copy(CONTRACT_ID)}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </Card>
    </div>
  )
}