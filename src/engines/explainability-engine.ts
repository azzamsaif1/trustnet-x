import type { SellerBidReport, UnderwritingReport, VerificationResult } from '../types/trustnet'

export interface DecisionExplanation {
  whyCheapLost: string
  whyPremiumWon: string
  topRiskFactors: string[]
  escrowRationale: string
  settlementReason: string
}

export function explainDecision(
  report: UnderwritingReport,
  verification?: VerificationResult | null
): DecisionExplanation {
  const winner = report.bids.find(b => b.sellerId === report.recommendedSeller)!
  const cheapest = [...report.bids].sort((a, b) => a.bid - b.bid)[0]
  const costDiff = cheapest.realCost - winner.realCost

  const whyCheapLost = cheapest.sellerId === winner.sellerId
    ? `${cheapest.sellerName} had both the lowest bid AND lowest real cost.`
    : `${cheapest.sellerName} bid ${cheapest.bid.toFixed(2)} SOL but risk inflated real cost to ${cheapest.realCost.toFixed(2)} SOL (+${(cheapest.realCost - cheapest.bid).toFixed(2)} SOL in risk charges). Trust score: ${cheapest.trustScore}/100 (${cheapest.riskLevel} risk).`

  const whyPremiumWon = `${winner.sellerName} wins with ${winner.realCost.toFixed(2)} SOL real cost — ${costDiff.toFixed(2)} SOL cheaper than ${cheapest.sellerName} after risk adjustment. Trust: ${winner.trustScore}/100, risk premium: ${winner.riskPremium.toFixed(2)} SOL, insurance: ${winner.insuranceFee.toFixed(2)} SOL.`

  const topRiskFactors = deriveTopFactors(cheapest, winner)

  const escrowRationale = `${report.escrowPolicy.verificationLevel} verification chosen for ${winner.riskLevel}-risk winner. Deposit: ${report.escrowPolicy.depositRequired.toFixed(4)} SOL. Deadline: ${report.escrowPolicy.deadlineSecs}s.`

  let settlementReason: string
  if (!verification) {
    settlementReason = 'Awaiting delivery and verification.'
  } else if (verification.passed) {
    settlementReason = `Release triggered: ${verification.reason}`
  } else {
    settlementReason = `Refund triggered: ${verification.reason}`
  }

  return { whyCheapLost, whyPremiumWon, topRiskFactors, escrowRationale, settlementReason }
}

function deriveTopFactors(cheap: SellerBidReport, winner: SellerBidReport): string[] {
  const factors: string[] = []

  if (cheap.trustScore < 30) {
    factors.push(`Low trust score (${cheap.trustScore}/100) indicates unreliable delivery history`)
  }
  if (cheap.riskPremium > 0.20) {
    factors.push(`High risk premium (+${cheap.riskPremium.toFixed(2)} SOL) from poor track record`)
  }
  if (cheap.insuranceFee > 0.10) {
    factors.push(`Elevated insurance cost (+${cheap.insuranceFee.toFixed(2)} SOL) due to failure probability`)
  }
  if (winner.trustScore > 80) {
    factors.push(`Winner has proven reliability (trust: ${winner.trustScore}/100)`)
  }
  if (cheap.riskLevel === 'HIGH') {
    factors.push(`${cheap.sellerName} classified HIGH risk — price deviation + fraud signals`)
  }

  return factors.slice(0, 3)
}
