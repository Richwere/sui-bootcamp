import { useState } from 'react'
import { Button, Input, Card } from './ui.jsx'
import { formatTokens, parseTokens, placeBid as stellarPlaceBid } from '../stellar.js'
import styles from './BidPanel.module.css'

export function BidPanel({ auction, wallet, onBidPlaced, toast }) {
  const [amount,  setAmount]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const hasWinner  = auction.highest_bid > 0n
  const floorBig   = hasWinner ? auction.highest_bid + 1n : auction.reserve_price
  const floor      = formatTokens(floorBig, 7)
  const isActive   = auction.status === 'Active'
  const { expired } = { expired: Math.floor(Date.now() / 1000) >= auction.deadline }

  const canBid = wallet.connected && isActive && !expired

  const validate = (val) => {
    if (!val) return 'Enter an amount'
    let parsed
    try { parsed = parseTokens(val) } catch { return 'Invalid number' }
    if (parsed < floorBig) return `Minimum bid is ${floor} tokens`
    return ''
  }

  const handleChange = (e) => {
    setAmount(e.target.value)
    if (error) setError(validate(e.target.value))
  }

  const handleBid = async () => {
    const err = validate(amount)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const stroops = parseTokens(amount)
      const { hash } = await stellarPlaceBid(wallet.publicKey, stroops)

      toast(`Bid placed! ${formatTokens(stroops)} tokens escrowed.`, 'success')
      onBidPlaced({ stroops, hash })
      setAmount('')
    } catch (e) {
      const msg = e.message ?? 'Transaction failed'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canBid) handleBid()
  }

  return (
    <Card className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>PLACE BID</span>
        <span className={styles.panelSub}>
          via SEP-41 token transfer
        </span>
      </div>

      <div className={styles.panelBody}>
        {/* Not connected */}
        {!wallet.connected && (
          <div className={styles.connectPrompt}>
            <div className={styles.connectIcon}>⬡</div>
            <p className={styles.connectText}>
              Connect your Freighter wallet to place a bid
            </p>
            <Button variant="primary" size="lg" onClick={wallet.connect} loading={wallet.connecting}>
              Connect Freighter
            </Button>
            <a
              className={styles.freighterLink}
              href="https://www.freighter.app/"
              target="_blank"
              rel="noreferrer"
            >
              Don't have Freighter? Get it here ↗
            </a>
          </div>
        )}

        {/* Auction not active */}
        {wallet.connected && (!isActive || expired) && (
          <div className={styles.inactiveNote}>
            <span className={styles.inactiveIcon}>⊘</span>
            <span>
              {auction.status === 'Finalized' && 'This auction has been finalized.'}
              {auction.status === 'Cancelled' && 'This auction was cancelled.'}
              {auction.status === 'Active' && expired && 'The auction deadline has passed.'}
            </span>
          </div>
        )}

        {/* Active + connected */}
        {canBid && (
          <>
            <div className={styles.floorRow}>
              <span className={styles.floorLabel}>Minimum bid</span>
              <span className={styles.floorVal}>{floor} tokens</span>
            </div>

            <Input
              label="Your bid (tokens)"
              type="number"
              min={floor}
              step="0.0000001"
              placeholder={floor}
              value={amount}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={error}
              hint="Token must be pre-approved for this contract address"
            />

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleBid}
              className={styles.bidBtn}
            >
              Place Bid
            </Button>

            {/* Approval reminder */}
            <details className={styles.approvalDetails}>
              <summary className={styles.approvalSummary}>
                ↳ How to approve token spend
              </summary>
              <div className={styles.approvalBody}>
                <p>Before bidding, call <code>approve</code> on your SEP-41 token contract:</p>
                <pre className={styles.approvalCode}>{`stellar contract invoke \\
  --id <TOKEN_CONTRACT_ID> \\
  --source bidder \\
  --network testnet \\
  -- approve \\
  --from <BIDDER_ADDRESS> \\
  --spender <AUCTION_CONTRACT_ID> \\
  --amount <AMOUNT_IN_STROOPS> \\
  --expiration-ledger 9999999`}</pre>
              </div>
            </details>
          </>
        )}
      </div>
    </Card>
  )
}