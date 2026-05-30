import { useState } from 'react'
import { Button, Input, Card, Divider } from './ui.jsx'
import { createAuction as stellarCreate, parseTokens } from '../stellar.js'
import styles from './CreatePanel.module.css'

const DURATION_PRESETS = [
  { label: '1h',  seconds: 3_600 },
  { label: '6h',  seconds: 21_600 },
  { label: '24h', seconds: 86_400 },
  { label: '3d',  seconds: 259_200 },
  { label: '7d',  seconds: 604_800 },
]

export function CreatePanel({ wallet, onCreated, toast }) {
  const [form, setForm] = useState({
    itemName:       '',
    tokenAddress:   '',
    reservePrice:   '',
    durationPreset: 86_400,
    customDuration: '',
    useCustom:      false,
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.itemName.trim())     e.itemName = 'Required'
    if (!form.tokenAddress.trim()) e.tokenAddress = 'Required'
    if (form.tokenAddress && !form.tokenAddress.match(/^C[A-Z2-7]{55}$/))
      e.tokenAddress = 'Invalid Stellar contract address (must start with C)'
    if (!form.reservePrice)        e.reservePrice = 'Required'
    try { parseTokens(form.reservePrice) } catch { e.reservePrice = 'Invalid number' }
    const dur = form.useCustom ? parseInt(form.customDuration) : form.durationPreset
    if (!dur || dur <= 0) e.customDuration = 'Invalid duration'
    return e
  }

  const handleCreate = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const durationSeconds = form.useCustom
        ? parseInt(form.customDuration) * 3600
        : form.durationPreset

      const { hash } = await stellarCreate(wallet.publicKey, {
        tokenAddress:   form.tokenAddress.trim(),
        itemName:       form.itemName.trim(),
        reservePrice:   parseTokens(form.reservePrice),
        durationSeconds,
      })

      toast('Auction created successfully!', 'success')
      onCreated({ hash, form })
      setForm({ itemName:'', tokenAddress:'', reservePrice:'', durationPreset:86_400, customDuration:'', useCustom:false })
    } catch (e) {
      toast(e.message ?? 'Create failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>CREATE AUCTION</span>
        <span className={styles.sub}>Deploy a new auction to this contract</span>
      </div>

      <div className={styles.body}>
        {!wallet.connected ? (
          <div className={styles.connectNote}>
            Connect your wallet to create an auction.
          </div>
        ) : (
          <>
            <Input
              label="Item Name"
              placeholder="e.g. Stellar Genesis NFT #001"
              value={form.itemName}
              onChange={(e) => set('itemName', e.target.value)}
              error={errors.itemName}
              hint="Name displayed to all bidders"
            />

            <Input
              label="SEP-41 Token Contract Address"
              placeholder="CXXXXXXXX..."
              value={form.tokenAddress}
              onChange={(e) => set('tokenAddress', e.target.value)}
              error={errors.tokenAddress}
              hint="The token bidders must use"
            />

            <Input
              label="Reserve Price (tokens)"
              type="number"
              placeholder="100"
              min="0.0000001"
              step="0.0000001"
              value={form.reservePrice}
              onChange={(e) => set('reservePrice', e.target.value)}
              error={errors.reservePrice}
              hint="Minimum opening bid"
            />

            {/* Duration */}
            <div className={styles.durationBlock}>
              <span className={styles.durationLabel}>DURATION</span>
              <div className={styles.presets}>
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.seconds}
                    className={`${styles.preset} ${
                      !form.useCustom && form.durationPreset === p.seconds
                        ? styles.presetActive
                        : ''
                    }`}
                    onClick={() => set('durationPreset', p.seconds) || set('useCustom', false)}
                    type="button"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  className={`${styles.preset} ${form.useCustom ? styles.presetActive : ''}`}
                  onClick={() => set('useCustom', true)}
                  type="button"
                >
                  Custom
                </button>
              </div>
              {form.useCustom && (
                <Input
                  placeholder="Duration in hours"
                  type="number"
                  min="1"
                  value={form.customDuration}
                  onChange={(e) => set('customDuration', e.target.value)}
                  error={errors.customDuration}
                  suffix="hours"
                />
              )}
            </div>

            <Divider />

            <div className={styles.warnBox}>
              <span className={styles.warnIcon}>⚠</span>
              <p>
                Only one auction can exist per contract instance.
                This will fail if an auction already exists.
                Deploy a separate contract for each independent auction.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleCreate}
              className={styles.createBtn}
            >
              Create Auction
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}