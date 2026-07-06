/**
 * Build Solana Explorer devnet URLs from transaction signatures.
 * Always targets devnet cluster via ?cluster=devnet query parameter.
 */

const EXPLORER_BASE = 'https://explorer.solana.com'

/** Build a Solana Explorer URL for a transaction on devnet */
export function buildExplorerUrl(txSignature: string): string {
  return `${EXPLORER_BASE}/tx/${txSignature}?cluster=devnet`
}

/** Build a Solana Explorer URL for an account on devnet */
export function buildAccountUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}?cluster=devnet`
}

/** Build a Solana Explorer URL for a block on devnet */
export function buildBlockUrl(slot: number): string {
  return `${EXPLORER_BASE}/block/${slot}?cluster=devnet`
}
