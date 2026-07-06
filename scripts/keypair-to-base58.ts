#!/usr/bin/env npx ts-node
/**
 * Convert a Solana keypair JSON file to a Base58-encoded secret key.
 *
 * Usage:
 *   npx ts-node scripts/keypair-to-base58.ts ~/.config/solana/devnet-wallet.json
 *
 * Output:
 *   VITE_BUYER_KEYPAIR_B58=<base58-encoded-secret-key>
 *
 * SECURITY:
 *   - Never commit the output to the repo.
 *   - Paste the value into your .env file only.
 *   - This script never writes to any file.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function bytesToBase58(bytes: Uint8Array): string {
  let n = BigInt(0)
  for (const b of bytes) n = n * BigInt(256) + BigInt(b)

  let result = ''
  while (n > BigInt(0)) {
    result = ALPHABET[Number(n % BigInt(58))] + result
    n = n / BigInt(58)
  }

  // Preserve leading zeros
  for (const b of bytes) {
    if (b === 0) result = '1' + result
    else break
  }

  return result
}

function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx ts-node scripts/keypair-to-base58.ts <path-to-keypair.json>')
    console.error('')
    console.error('Example:')
    console.error('  npx ts-node scripts/keypair-to-base58.ts ~/.config/solana/devnet-wallet.json')
    process.exit(1)
  }

  const resolved = resolve(filePath.replace(/^~/, process.env.HOME ?? ''))

  let keyData: number[]
  try {
    keyData = JSON.parse(readFileSync(resolved, 'utf8'))
  } catch (err) {
    console.error(`Error reading keypair file: ${(err as Error).message}`)
    process.exit(1)
  }

  if (!Array.isArray(keyData) || keyData.length !== 64) {
    console.error('Invalid keypair JSON — expected an array of 64 bytes.')
    process.exit(1)
  }

  const b58 = bytesToBase58(new Uint8Array(keyData))

  console.log('')
  console.log('Add this to your .env file:')
  console.log('')
  console.log(`VITE_BUYER_KEYPAIR_B58=${b58}`)
  console.log('')
  console.log('WARNING: Do NOT commit .env or share this value publicly.')
}

main()
