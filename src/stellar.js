/**
 * stellar.js
 * All Stellar SDK + Freighter wallet integration.
 * Pure functions — no React state.
 */

import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk'
import {
  isConnected,
  requestAccess,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api'

import {
  CONTRACT_ID,
  RPC_URL,
  NETWORK_PASSPHRASE,
  TX_TIMEOUT,
  POLL_INTERVAL,
  POLL_MAX_TRIES,
} from './constants.js'

// ─── Singleton RPC server ─────────────────────────────────────────────────────
let _server = null
const server = () => {
  if (!_server) _server = new SorobanRpc.Server(RPC_URL, { allowHttp: false })
  return _server
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

/** Returns true if Freighter is installed in the browser. */
export const freighterAvailable = () =>
  typeof window !== 'undefined' && Boolean(window.freighter)

/** Connects Freighter and returns the public key, or throws. */
export async function connectFreighter() {
  const connected = await isConnected()
  if (!connected?.isConnected) {
    await requestAccess()
  }
  const key = await getPublicKey()
  if (!key) throw new Error('Could not retrieve public key from Freighter')
  return key
}

// ─── Soroban helpers ──────────────────────────────────────────────────────────

/** Simulate a read-only call and return the decoded JS value. */
export async function simulateCall(method, args = []) {
  const contract = new Contract(CONTRACT_ID)
  // Use a dummy account for simulation (no auth needed for views)
  const DUMMY = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
  const account = await server().getAccount(DUMMY).catch(() => ({
    accountId: () => DUMMY,
    sequenceNumber: () => '0',
    incrementSequenceNumber: () => {},
  }))

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT)
    .build()

  const sim = await server().simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`)
  }
  if (!sim.result) return null
  return scValToNative(sim.result.retval)
}

/**
 * Build, sign (via Freighter), submit, and poll a Soroban transaction.
 * Returns { hash, result }.
 */
export async function invokeContract(publicKey, method, args = []) {
  const contract = new Contract(CONTRACT_ID)
  const account  = await server().getAccount(publicKey)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT)
    .build()

  // Prepare (simulate + add Soroban data)
  const prepared = await server().prepareTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(prepared)) {
    throw new Error(`Prepare error: ${prepared.error}`)
  }

  // Sign with Freighter
  const { signedTxXdr, error: signError } = await signTransaction(
    prepared.toXDR(),
    { network: 'TESTNET', networkPassphrase: NETWORK_PASSPHRASE }
  )
  if (signError) throw new Error(`Sign error: ${signError}`)
  if (!signedTxXdr) throw new Error('Freighter returned no signed XDR')

  // Submit
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  const send = await server().sendTransaction(signedTx)
  if (send.status === 'ERROR') {
    throw new Error(`Submit error: ${JSON.stringify(send.errorResult)}`)
  }

  // Poll for finality
  const hash = send.hash
  let response
  for (let i = 0; i < POLL_MAX_TRIES; i++) {
    await sleep(POLL_INTERVAL)
    response = await server().getTransaction(hash)
    if (response.status !== 'NOT_FOUND') break
  }
  if (!response || response.status === 'NOT_FOUND') {
    throw new Error('Transaction timed out waiting for confirmation')
  }
  if (response.status === 'FAILED') {
    throw new Error('Transaction failed on-chain')
  }

  return { hash, response }
}

// ─── Contract-specific helpers ────────────────────────────────────────────────

/** Fetch and decode AuctionState from chain. */
export async function fetchAuctionState() {
  const raw = await simulateCall('get_auction')
  return decodeAuctionState(raw)
}

/** Place a bid. amount is BigInt in stroops. */
export async function placeBid(publicKey, amount) {
  const args = [
    nativeToScVal(publicKey, { type: 'address' }),
    nativeToScVal(amount,    { type: 'i128' }),
  ]
  return invokeContract(publicKey, 'place_bid', args)
}

/** Create a new auction. reservePrice and durationSeconds are BigInt/number. */
export async function createAuction(publicKey, {
  tokenAddress,
  itemName,
  reservePrice,    // BigInt stroops
  durationSeconds, // number
}) {
  const args = [
    nativeToScVal(publicKey,      { type: 'address' }),
    nativeToScVal(tokenAddress,   { type: 'address' }),
    nativeToScVal(itemName,       { type: 'string' }),
    nativeToScVal(reservePrice,   { type: 'i128' }),
    nativeToScVal(BigInt(durationSeconds), { type: 'u64' }),
  ]
  return invokeContract(publicKey, 'create_auction', args)
}

/** Finalize the auction (after deadline). */
export async function finalizeAuction(publicKey) {
  const args = [nativeToScVal(publicKey, { type: 'address' })]
  return invokeContract(publicKey, 'finalize_auction', args)
}

/** Cancel the auction (only if no bids). */
export async function cancelAuction(publicKey) {
  const args = [nativeToScVal(publicKey, { type: 'address' })]
  return invokeContract(publicKey, 'cancel_auction', args)
}

/** Initialize the contract (admin setup, one-time). */
export async function initializeContract(publicKey) {
  const args = [nativeToScVal(publicKey, { type: 'address' })]
  return invokeContract(publicKey, 'initialize', args)
}

// ─── Decode helpers ───────────────────────────────────────────────────────────

/**
 * Converts raw scValToNative output (a Map or object) into a clean AuctionState.
 * scValToNative returns a Map<string, any> for structs.
 */
function decodeAuctionState(raw) {
  if (!raw) return null

  // scValToNative returns a plain JS object or Map depending on SDK version
  const get = (key) =>
    raw instanceof Map ? raw.get(key) : raw[key]

  const statusRaw = get('status')
  let status = 'Active'
  if (statusRaw === 1 || statusRaw?.tag === 'Finalized' || statusRaw === 'Finalized') status = 'Finalized'
  if (statusRaw === 2 || statusRaw?.tag === 'Cancelled' || statusRaw === 'Cancelled') status = 'Cancelled'

  return {
    creator:        String(get('creator') ?? ''),
    token:          String(get('token') ?? ''),
    item_name:      String(get('item_name') ?? ''),
    reserve_price:  BigInt(get('reserve_price') ?? 0),
    highest_bid:    BigInt(get('highest_bid') ?? 0),
    highest_bidder: get('highest_bidder') ? String(get('highest_bidder')) : null,
    deadline:       Number(get('deadline') ?? 0),
    status,
    bid_count:      Number(get('bid_count') ?? 0),
    created_at:     Number(get('created_at') ?? 0),
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Format stroops → human-readable token string (7 decimal places). */
export function formatTokens(stroops, decimals = 2) {
  if (stroops === undefined || stroops === null) return '0'
  const n = Number(BigInt(stroops)) / 1e7
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Parse human token input → BigInt stroops. */
export function parseTokens(input) {
  const n = parseFloat(input)
  if (isNaN(n) || n <= 0) throw new Error('Invalid token amount')
  return BigInt(Math.round(n * 1e7))
}

/** Shorten a Stellar address for display. */
export function shortAddr(addr, chars = 6) {
  if (!addr || addr.length < chars * 2) return addr ?? ''
  return `${addr.slice(0, chars)}…${addr.slice(-4)}`
}