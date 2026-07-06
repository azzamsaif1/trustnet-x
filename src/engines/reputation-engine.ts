import type { SellerProfile } from '../types/trustnet'

/** In-memory reputation store (persisted to JSON in Node, localStorage in browser) */
const reputationStore: Record<string, number> = {}

function getStorageKey(sellerId: string): string {
  return `trustnet_reputation_${sellerId}`
}

/** Load reputation for a seller (falls back to profile default) */
export function getReputation(seller: SellerProfile): number {
  if (reputationStore[seller.id] !== undefined) {
    return reputationStore[seller.id]
  }
  // Try localStorage in browser
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(getStorageKey(seller.id))
    if (stored !== null) {
      const val = Number(stored)
      reputationStore[seller.id] = val
      return val
    }
  }
  // Default to profile reputation
  reputationStore[seller.id] = seller.reputation
  return seller.reputation
}

/** Increase reputation on verified delivery */
export function increaseReputation(sellerId: string, amount: number = 5): number {
  const current = reputationStore[sellerId] ?? 50
  const updated = Math.min(100, current + amount)
  reputationStore[sellerId] = updated
  persist(sellerId, updated)
  return updated
}

/** Decrease reputation on no-show or failed verification */
export function decreaseReputation(sellerId: string, amount: number = 10): number {
  const current = reputationStore[sellerId] ?? 50
  const updated = Math.max(0, current - amount)
  reputationStore[sellerId] = updated
  persist(sellerId, updated)
  return updated
}

/** Reset reputation (for testing) */
export function resetReputation(sellerId: string, value: number): void {
  reputationStore[sellerId] = value
  persist(sellerId, value)
}

function persist(sellerId: string, value: number): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(getStorageKey(sellerId), String(value))
  }
}
