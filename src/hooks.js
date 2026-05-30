import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAuctionState, connectFreighter, freighterAvailable } from './stellar.js'
import { DEMO_AUCTION } from './constants.js'

// ─── useCountdown ─────────────────────────────────────────────────────────────
export function useCountdown(deadline) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000)
      setRemaining(Math.max(0, (deadline ?? 0) - now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return {
    days:    Math.floor(remaining / 86400),
    hours:   Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    total:   remaining,
    expired: remaining === 0,
  }
}

// ─── useWallet ────────────────────────────────────────────────────────────────
export function useWallet() {
  const [publicKey, setPublicKey] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  const connect = useCallback(async () => {
    if (!freighterAvailable()) {
      setError('Freighter wallet not found. Install it at freighter.app')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const key = await connectFreighter()
      setPublicKey(key)
    } catch (e) {
      setError(e.message)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
    setError(null)
  }, [])

  return { publicKey, connecting, error, connect, disconnect, connected: !!publicKey }
}

// ─── useAuction ───────────────────────────────────────────────────────────────
export function useAuction() {
  const [auction, setAuction]   = useState(DEMO_AUCTION)
  const [loading, setLoading]   = useState(false)
  const [isDemo,  setIsDemo]    = useState(true)
  const intervalRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const state = await fetchAuctionState()
      if (state) {
        setAuction(state)
        setIsDemo(false)
      }
    } catch {
      // Leave demo data in place — chain or RPC not reachable
    }
  }, [])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 15_000)
    return () => clearInterval(intervalRef.current)
  }, [refresh])

  // Optimistic update — caller can patch local state immediately
  const patch = useCallback((partial) => {
    setAuction((prev) => ({ ...prev, ...partial }))
    setIsDemo(false)
  }, [])

  return { auction, loading, isDemo, refresh, patch }
}

// ─── useToasts ────────────────────────────────────────────────────────────────
export function useToasts() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, msg, type, dying: false }])
    setTimeout(() => {
      setToasts((p) => p.map((t) => t.id === id ? { ...t, dying: true } : t))
      setTimeout(() => {
        setToasts((p) => p.filter((t) => t.id !== id))
      }, 350)
    }, duration)
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts((p) => p.map((t) => t.id === id ? { ...t, dying: true } : t))
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350)
  }, [])

  return { toasts, toast: add, dismiss: remove }
}

// ─── useCopyToClipboard ───────────────────────────────────────────────────────
export function useCopyToClipboard(timeout = 1800) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    }
  }, [timeout])

  return { copy, copied }
}