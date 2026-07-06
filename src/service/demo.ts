/**
 * TrustNet X — Full demo script (run with `npm run demo`).
 * Demonstrates the complete flow: WANT → BID → AWARD → DEPOSITED → DELIVERED → VERIFIED → RELEASED
 */
import { deliverService } from './index'
import { buyerRequest } from '../config/buyer'
import { sellers } from '../config/sellers'
import { buyerSelectSeller } from '../agents/buyer'
import { deliverAsAgent } from '../agents/seller'
import { verifyDelivery } from '../agents/verifier'
import { increaseReputation, decreaseReputation } from '../engines/reputation-engine'
import { simulateEscrowFlow } from '../solana/escrow'
import { buildExplorerUrl } from '../solana/explorer'
import { EscrowState } from '../types/trustnet'

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  TrustNet X — Autonomous Underwriting Market for AI Agents  ║')
  console.log('║  "Pricing Trust. Underwriting Agent Economies."             ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  // === WANT ===
  console.log(`[${EscrowState.WANT}] Buyer posts task: "${buyerRequest.description}"`)
  console.log(`  Budget: ${buyerRequest.budget} SOL | Deadline: ${buyerRequest.deadline}s\n`)

  // === BID ===
  console.log(`[${EscrowState.BID}] ${sellers.length} sellers submit bids:`)
  for (const s of sellers) {
    console.log(`  - ${s.name} (${s.id}): ${s.bid} SOL | Rep: ${s.reputation}/100 | No-show: ${(s.noShowRate * 100).toFixed(0)}%`)
  }
  console.log()

  // === AWARD (TrustNet risk evaluation) ===
  console.log(`[${EscrowState.AWARD}] TrustNet Risk Agent evaluating market...\n`)
  const report = deliverService({ buyerRequest, sellers })

  console.log('  Underwriting Report:')
  console.log('  ┌────────────────────┬──────┬───────┬─────────┬───────────┬──────────┬──────┐')
  console.log('  │ Seller             │ Bid  │ Trust │ Premium │ Insurance │ RealCost │ Risk │')
  console.log('  ├────────────────────┼──────┼───────┼─────────┼───────────┼──────────┼──────┤')
  for (const bid of report.bids) {
    const name = bid.sellerName.padEnd(18)
    const bidStr = bid.bid.toFixed(2).padStart(4)
    const trust = String(bid.trustScore).padStart(5)
    const prem = bid.riskPremium.toFixed(2).padStart(7)
    const ins = bid.insuranceFee.toFixed(2).padStart(9)
    const real = bid.realCost.toFixed(2).padStart(8)
    const risk = bid.riskLevel.padStart(4)
    console.log(`  │ ${name} │ ${bidStr} │ ${trust} │ ${prem} │ ${ins} │ ${real} │ ${risk} │`)
  }
  console.log('  └────────────────────┴──────┴───────┴─────────┴───────────┴──────────┴──────┘')
  console.log(`\n  ★ Recommended: ${report.recommendedSeller}`)
  console.log(`  ★ Reason: ${report.reason}\n`)

  // Buyer decision
  const decision = buyerSelectSeller(buyerRequest, report)
  console.log(`  Buyer selects: ${decision.selectedSellerName} (real cost: ${decision.realCost} SOL)`)
  console.log(`  ${decision.reason}\n`)

  // === DEPOSITED ===
  console.log(`[${EscrowState.DEPOSITED}] Escrow deposit: ${report.escrowPolicy.depositRequired.toFixed(4)} SOL locked`)
  console.log(`  Release condition: ${report.escrowPolicy.releaseCondition}`)
  console.log(`  Refund condition: ${report.escrowPolicy.refundCondition}\n`)

  // === DELIVERED ===
  console.log(`[${EscrowState.DELIVERED}] ${decision.selectedSellerName} delivering...`)
  const delivery = deliverAsAgent(decision.selectedSellerId, buyerRequest.taskId)
  if (delivery) {
    console.log(`  ✓ Delivery received (hash: ${delivery.deliveryHash})\n`)
  } else {
    console.log(`  ✗ NO DELIVERY (no-show!)\n`)
  }

  // === VERIFIED ===
  console.log(`[${EscrowState.VERIFIED}] Verifier checking delivery...`)
  const verification = verifyDelivery(delivery, buyerRequest.taskId)
  console.log(`  Result: ${verification.passed ? 'PASSED' : 'FAILED'}`)
  console.log(`  ${verification.reason}\n`)

  // Update reputation
  if (verification.passed) {
    increaseReputation(decision.selectedSellerId)
  } else {
    decreaseReputation(decision.selectedSellerId)
  }

  // === RELEASED ===
  if (verification.passed) {
    console.log(`[${EscrowState.RELEASED}] Escrow releasing ${decision.realCost} SOL to ${decision.selectedSellerName}`)
    const escrowResult = await simulateEscrowFlow(decision.selectedSellerId, decision.realCost)
    const explorerUrl = buildExplorerUrl(escrowResult.txSignature)
    console.log(`  Transaction: ${escrowResult.txSignature}`)
    console.log(`  Explorer: ${explorerUrl}`)
    console.log(`  Status: ${escrowResult.state}\n`)
  } else {
    console.log(`[REFUND] Escrow refunding deposit to buyer (verification failed)\n`)
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log(' Demo complete. The cheapest bid LOST because risk made it')
  console.log(' more expensive. TrustNet X prices trust, not just bids.')
  console.log('═══════════════════════════════════════════════════════════════')
}

runDemo().catch(console.error)
