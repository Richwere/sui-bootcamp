# No-Loss Auction — Frontend

React + Vite frontend for the Stellar Soroban No-Loss Auction Protocol.

## Project Structure

```
frontend/
├── index.html                  # Vite entry point
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # React root
    ├── App.jsx                 # Root component + tab router
    ├── App.module.css          # Layout + tab styles
    ├── index.css               # Global styles, CSS vars, animations
    ├── constants.js            # CONTRACT_ID, network config
    ├── stellar.js              # All Stellar SDK + Freighter integration
    ├── hooks.js                # useWallet, useAuction, useCountdown, useToasts
    └── components/
        ├── ui.jsx              # Button, Input, Badge, Card, Stat, Modal
        ├── ui.module.css
        ├── Header.jsx          # Nav bar: logo, contract pill, wallet connect
        ├── Header.module.css
        ├── AuctionHero.jsx     # Main auction display: bid, countdown, stats
        ├── AuctionHero.module.css
        ├── BidPanel.jsx        # Bid placement form + token approval guide
        ├── BidPanel.module.css
        ├── CreatePanel.jsx     # Create auction form with duration presets
        ├── CreatePanel.module.css
        ├── ManagePanel.jsx     # Finalize/cancel + full contract state table
        ├── ManagePanel.module.css
        ├── Toasts.jsx          # Toast notification system
        ├── Toasts.module.css
        ├── TxReceipt.jsx       # Transaction hash display with copy + explorer link
        └── TxReceipt.module.css
```

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Update contract ID

Edit `src/constants.js`:

```js
export const CONTRACT_ID = 'YOUR_DEPLOYED_CONTRACT_ID_HERE'
```

### 3. Run development server

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build for production

```bash
npm run build
# Output in dist/
```

### 5. Deploy static build

```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod

# IPFS (via Pinata, Fleek, etc.)
# Upload the dist/ folder

# GitHub Pages
# Push dist/ to gh-pages branch
```

## Key Files

### `src/constants.js`
- `CONTRACT_ID` — your deployed Soroban contract
- `NETWORK`, `RPC_URL`, `HORIZON_URL` — testnet endpoints
- `EXPLORER` — Stellar Expert base URL

### `src/stellar.js`
All blockchain interaction in one file:
- `connectFreighter()` — wallet connect
- `fetchAuctionState()` — read contract state (simulation, free)
- `placeBid(publicKey, stroops)` — submit bid transaction
- `createAuction(publicKey, params)` — create new auction
- `finalizeAuction(publicKey)` — finalize after deadline
- `cancelAuction(publicKey)` — cancel (zero bids only)
- `formatTokens(stroops)` — BigInt → "100.00" string
- `parseTokens(input)` — "100.5" → BigInt stroops
- `shortAddr(addr, chars)` — "GABC…XYZ" display

### `src/hooks.js`
- `useWallet()` — Freighter connect/disconnect state
- `useAuction()` — polls chain every 15s, exposes `patch()` for optimistic updates
- `useCountdown(deadline)` — live days/hours/minutes/seconds
- `useToasts()` — toast queue with auto-dismiss
- `useCopyToClipboard()` — clipboard helper

## Wallet Setup (Freighter)

1. Install [Freighter](https://www.freighter.app/) browser extension
2. Create or import a Stellar account
3. Switch to **Testnet** in Freighter settings
4. Fund with testnet XLM: https://laboratory.stellar.org/#account-creator

## Token Approval (Before Bidding)

Bidders must approve the auction contract to spend their tokens:

```bash
stellar contract invoke \
  --id <TOKEN_CONTRACT_ID> \
  --source bidder \
  --network testnet \
  -- approve \
  --from <BIDDER_ADDRESS> \
  --spender <AUCTION_CONTRACT_ID> \
  --amount <AMOUNT_IN_STROOPS> \
  --expiration-ledger 9999999
```

Or via Stellar Laboratory → Contract Explorer.

## Design

- **Palette**: Near-black (`#0c0b09`) with industrial amber (`#e8a030`) accents
- **Fonts**: Bebas Neue (display) · DM Mono (code/labels) · DM Sans (body)
- **Aesthetic**: Industrial utilitarian — ticker tape, monospace labels, amber-on-black
- **Animations**: CSS keyframes only — no animation library needed
- **CSS Modules**: Scoped styles per component, no global class conflicts

## Environment

Node 18+ required. No other build-time dependencies beyond the `package.json`.