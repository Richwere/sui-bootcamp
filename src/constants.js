// ─── Network ──────────────────────────────────────────────────────────────────
export const NETWORK = 'TESTNET'
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const RPC_URL     = 'https://soroban-testnet.stellar.org'
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const EXPLORER    = 'https://stellar.expert/explorer/testnet'

// ─── Contract ─────────────────────────────────────────────────────────────────
//   stellar contract deploy --wasm no_loss_auction.wasm --network testnet
export const CONTRACT_ID =
  'CD2Q2INS6EBQGJH6CQGMBLZR5LXWM3F3W54EM2EF2HDEI6HTS3VG564D'

// ─── Token Decimals ───────────────────────────────────────────────────────────
// Stellar native asset uses 7 decimal places (stroops)
export const TOKEN_DECIMALS = 7
export const STROOP = 10_000_000n // 1 token = 10^7 stroops

// ─── Soroban TX Defaults ─────────────────────────────────────────────────────
export const BASE_FEE    = '100000' // 0.01 XLM
export const TX_TIMEOUT  = 30       // seconds
export const POLL_INTERVAL = 1500   // ms
export const POLL_MAX_TRIES = 20

// ─── Demo / Fallback State ────────────────────────────────────────────────────
export const DEMO_AUCTION = {
  item_name:       'Stellar Genesis NFT #001',
  reserve_price:   BigInt(100 * 1e7),
  highest_bid:     BigInt(350 * 1e7),
  highest_bidder:  'GBID...4XK7',
  deadline:        Math.floor(Date.now() / 1000) + 7_200,
  status:          'Active',
  bid_count:       7,
  creator:         'GCRE...A1B2',
  token:           'CDEMO...TOKEN',
  created_at:      1_000_000,
}