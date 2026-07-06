/**
 * Solana devnet escrow integration — wraps the CoralOS starter kit's escrow pattern.
 * Drives the DEPOSITED → RELEASED states on devnet.
 *
 * Supports two modes:
 *   LIVE      — real devnet transaction via wallet JSON or Base58 keypair
 *   SIMULATED — deterministic demo signature (no Explorer link)
 */
import { EscrowState } from '../types/trustnet'

const DEVNET_RPC = 'https://api.devnet.solana.com'

export interface EscrowFlowResult {
  state: EscrowState
  txSignature: string
  depositAmount: number
  sellerId: string
  timestamp: string
  simulated: boolean
  fallbackReason?: string
}

export async function simulateEscrowFlow(
  sellerId: string,
  amount: number
): Promise<EscrowFlowResult> {
  const settlementMode = getSettlementMode()
  const rpcUrl = getEnvSafe('VITE_SOLANA_RPC_URL') ?? getEnvSafe('SOLANA_RPC_URL') ?? DEVNET_RPC

  if (settlementMode === 'live') {
    const keypairB58 = getEnvSafe('VITE_BUYER_KEYPAIR_B58') ?? getEnvSafe('BUYER_KEYPAIR_B58')
    const walletPath = getEnvSafe('VITE_WALLET_PATH')

    if (!keypairB58 && !walletPath) {
      return simulateFlow(sellerId, amount, 'No wallet configured (set VITE_BUYER_KEYPAIR_B58 or VITE_WALLET_PATH)')
    }

    try {
      if (walletPath) {
        return await executeRealEscrowFromWalletFile(sellerId, amount, walletPath, rpcUrl)
      }

      if (keypairB58) {
        return await executeRealEscrow(sellerId, amount, keypairB58, rpcUrl)
      }
    } catch (e) {
      const reason = (e as Error).message
      console.warn(`Live escrow failed: ${reason}. Falling back to simulation.`)
      return simulateFlow(sellerId, amount, reason)
    }
  }

  return simulateFlow(sellerId, amount)
}

async function executeRealEscrowFromWalletFile(
  sellerId: string,
  amount: number,
  walletPath: string,
  rpcUrl: string
): Promise<EscrowFlowResult> {
  if (typeof window !== 'undefined') {
    throw new Error('Wallet JSON files cannot be read in browser. Use VITE_BUYER_KEYPAIR_B58 instead.')
  }

  const fs = await import('fs')
  const resolvedPath = expandUserPath(walletPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Wallet file not found: ${resolvedPath}`)
  }

  const keyData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
  if (!Array.isArray(keyData) || keyData.length !== 64) {
    throw new Error('Invalid wallet JSON — expected array of 64 bytes')
  }

  const { Keypair } = await import('@solana/web3.js')
  const buyerKeypair = Keypair.fromSecretKey(new Uint8Array(keyData))

  return executeRealEscrowWithKeypair(sellerId, amount, buyerKeypair, rpcUrl)
}

async function executeRealEscrow(
  sellerId: string,
  amount: number,
  keypairB58: string,
  rpcUrl: string
): Promise<EscrowFlowResult> {
  const { Keypair } = await import('@solana/web3.js')
  const buyerKeypair = Keypair.fromSecretKey(loadKeypairFromB58(keypairB58))

  return executeRealEscrowWithKeypair(sellerId, amount, buyerKeypair, rpcUrl)
}

async function executeRealEscrowWithKeypair(
  sellerId: string,
  amount: number,
  buyerKeypair: any,
  rpcUrl: string
): Promise<EscrowFlowResult> {
  const {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
  } = await import('@solana/web3.js')

  if (/mainnet/i.test(rpcUrl)) {
    throw new Error('Refusing mainnet RPC — TrustNet X is devnet-only.')
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid settlement amount: ${amount}`)
  }

  const connection = new Connection(rpcUrl, 'confirmed')

  const sellerPublicKey = new PublicKey(
    getEnvSafe('VITE_SELLER_PUBLIC_KEY') ?? buyerKeypair.publicKey.toBase58()
  )

  const lamports = Math.round(amount * LAMPORTS_PER_SOL)
  const balance = await connection.getBalance(buyerKeypair.publicKey)
  const feeBuffer = Math.round(0.01 * LAMPORTS_PER_SOL)

  if (balance < lamports + feeBuffer) {
    throw new Error(
      `Insufficient devnet balance. Need ${(lamports + feeBuffer) / LAMPORTS_PER_SOL} SOL, ` +
      `wallet has ${balance / LAMPORTS_PER_SOL} SOL.`
    )
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: buyerKeypair.publicKey,
      toPubkey: sellerPublicKey,
      lamports,
    })
  )

  const signature = await sendAndConfirmTransaction(connection, tx, [buyerKeypair], {
    commitment: 'confirmed',
  })

  return {
    state: EscrowState.RELEASED,
    txSignature: signature,
    depositAmount: amount,
    sellerId,
    timestamp: new Date().toISOString(),
    simulated: false,
  }
}

function simulateFlow(sellerId: string, amount: number, fallbackReason?: string): EscrowFlowResult {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let sig = ''
  const seed = `${sellerId}-${amount}`
  let hash = 0

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }

  for (let i = 0; i < 88; i++) {
    sig += chars[Math.abs((hash * (i + 1) * 31) % chars.length)]
  }

  return {
    state: EscrowState.RELEASED,
    txSignature: sig,
    depositAmount: amount,
    sellerId,
    timestamp: new Date().toISOString(),
    simulated: true,
    fallbackReason,
  }
}

function loadKeypairFromB58(b58: string) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let n = BigInt(0)

  for (const c of b58) {
    const idx = ALPHABET.indexOf(c)
    if (idx < 0) throw new Error('Invalid base58 character in keypair')
    n = n * BigInt(58) + BigInt(idx)
  }

  const hex = n.toString(16).padStart(128, '0')
  const bytes = new Uint8Array(64)

  for (let i = 0; i < 64; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return bytes
}

function getSettlementMode(): 'live' | 'simulated' {
  const mode = getEnvSafe('VITE_SETTLEMENT_MODE') ?? getEnvSafe('SETTLEMENT_MODE') ?? 'simulated'
  return mode === 'live' ? 'live' : 'simulated'
}

function getEnvSafe(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = (import.meta.env as Record<string, string | undefined>)[key]
    if (val) return val
  }

  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || undefined
  }

  return undefined
}

function expandUserPath(path: string): string {
  if (!path.startsWith('~')) return path

  const homeDir = getEnvSafe('HOME') ?? getEnvSafe('USERPROFILE')

  if (!homeDir) {
    throw new Error('Cannot resolve "~" in wallet path: HOME/USERPROFILE is not set.')
  }

  return path.replace(/^~/, homeDir)
}
