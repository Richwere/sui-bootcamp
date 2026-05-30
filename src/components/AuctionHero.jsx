import { Badge, Card, Stat } from './ui.jsx'
import { formatTokens, shortAddr } from '../stellar.js'
import { useCountdown } from '../hooks.js'
import { EXPLORER } from '../constants.js'
import styles from './AuctionHero.module.css'

function CountdownUnit({ value, label }) {
  return (
    <div className={styles.cdUnit}>
      <span className={styles.cdNum}>{String(value).padStart(2, '0')}</span>
      <span className={styles.cdLabel}>{label}</span>
    </div>
  )
}

function StatusBadge({ status, expired }) {
  if (status === 'Cancelled')  return <Badge variant="cancelled">Cancelled</Badge>
  if (status === 'Finalized')  return <Badge variant="finalized">Finalized</Badge>
  if (expired)                 return <Badge variant="ended">Ended</Badge>
  return <Badge variant="live" pulse>Live</Badge>
}

export function AuctionHero({ auction, isDemo }) {
  const cd = useCountdown(auction.deadline)

  const hasWinner = auction.highest_bid > 0n
  const topBid    = formatTokens(auction.highest_bid)
  const reserve   = formatTokens(auction.reserve_price)
  const minNext   = hasWinner
    ? formatTokens(auction.highest_bid + 1n)
    : reserve

  return (
    <Card accent className={styles.hero}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.itemMeta}>
          <span className={styles.itemLabel}>ITEM</span>
          <h1 className={styles.itemName}>{auction.item_name}</h1>
        </div>
        <div className={styles.statusGroup}>
          <StatusBadge status={auction.status} expired={cd.expired} />
          {isDemo && (
            <span className={styles.demoNote}>demo data</span>
          )}
        </div>
      </div>

      {/* Decorative ticker */}
      <div className={styles.ticker} aria-hidden>
        <div className={styles.tickerTrack}>
          {Array(6).fill('NO-LOSS AUCTION · STELLAR SOROBAN · SEP-41 TOKEN · AUTOMATIC REFUNDS · ').map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {/* Highest bid — largest */}
        <div className={styles.bidBlock}>
          <span className={styles.bidLabel}>
            {hasWinner ? 'HIGHEST BID' : 'RESERVE PRICE'}
          </span>
          <div className={styles.bidAmount}>
            <span className={styles.bidNum}>
              {hasWinner ? topBid : reserve}
            </span>
            <span className={styles.bidTicker}>tokens</span>
          </div>
          {hasWinner && auction.highest_bidder && (
            <a
              className={styles.bidderLink}
              href={`${EXPLORER}/account/${auction.highest_bidder}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(auction.highest_bidder, 8)} ↗
            </a>
          )}
          {!hasWinner && (
            <span className={styles.bidNone}>No bids placed yet</span>
          )}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Countdown */}
          <div className={styles.cdBlock}>
            <span className={styles.cdBlockLabel}>TIME REMAINING</span>
            {cd.expired ? (
              <span className={styles.cdExpired}>Auction ended</span>
            ) : (
              <div className={styles.cdRow}>
                {cd.days > 0 && <CountdownUnit value={cd.days}    label="days" />}
                <CountdownUnit value={cd.hours}   label="hrs"  />
                <CountdownUnit value={cd.minutes} label="min"  />
                <CountdownUnit value={cd.seconds} label="sec"  />
              </div>
            )}
          </div>

          {/* Sub-stats */}
          <div className={styles.subStats}>
            <Stat
              label="Reserve"
              value={reserve + ' tokens'}
            />
            <Stat
              label="Total Bids"
              value={auction.bid_count}
              sub="prev. bids auto-refunded"
            />
            <Stat
              label="Min Next Bid"
              value={minNext + ' tokens'}
              highlight
            />
          </div>
        </div>
      </div>

      {/* No-loss callout */}
      <div className={styles.noLossBar}>
        <span className={styles.noLossIcon}>◈</span>
        <span>
          <strong>No-Loss Protocol:</strong>{' '}
          When you're outbid, your tokens are returned to your wallet
          in the same on-chain transaction — atomically, with no manual claim needed.
        </span>
      </div>
    </Card>
  )
}