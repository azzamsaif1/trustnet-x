import type {
  SellerProfile,
  SellerBidReport,
  UnderwritingReport,
  UnderwriterOpinion,
  BuyerRequest,
} from '../types/trustnet'
import { assessRisk } from '../engines/risk-engine'
import { computeInsuranceFee } from '../engines/insurance-engine'
import { computeWinnerEscrowPolicy } from '../engines/escrow-policy-engine'
import { evaluateConservative } from './underwriters/conservative'
import { evaluateAggressive } from './underwriters/aggressive'
import { evaluateFraudSpecialist } from './underwriters/fraud-specialist'

/**
 * TrustNet Risk Agent — the paid risk assessment service.
 * Orchestrates engines + underwriter personas to produce a final underwriting report.
 *
 * This is the core "deliverService()" for TrustNet X:
 * Accept buyer request + seller bids → run risk evaluation → return structured report.
 */
export function evaluateMarket(
  request: BuyerRequest,
  sellers: SellerProfile[]
): UnderwritingReport {
  const marketAvgBid = sellers.reduce((sum, s) => sum + s.bid, 0) / sellers.length

  // Step 1: Get individual underwriter opinions
  const opinions: UnderwriterOpinion[] = [
    evaluateConservative(sellers),
    evaluateAggressive(sellers),
    evaluateFraudSpecialist(sellers),
  ]

  // Step 2: Compute per-seller risk metrics using the risk engine
  const bids: SellerBidReport[] = sellers.map(seller => {
    const risk = assessRisk(seller, marketAvgBid)
    const insuranceFee = computeInsuranceFee(seller, marketAvgBid)
    const realCost = Math.round((seller.bid + risk.riskPremium + insuranceFee) * 100) / 100

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      bid: seller.bid,
      trustScore: risk.trustScore,
      riskPremium: risk.riskPremium,
      insuranceFee,
      realCost,
      riskLevel: risk.riskLevel,
    }
  })

  // Step 3: Aggregate underwriter opinions (weighted by confidence)
  const aggregatedScores: Record<string, number> = {}
  const totalConfidence = opinions.reduce((sum, o) => sum + o.confidence, 0)

  for (const seller of sellers) {
    let weightedScore = 0
    for (const opinion of opinions) {
      const weight = opinion.confidence / totalConfidence
      weightedScore += (opinion.trustScores[seller.id] ?? 0) * weight
    }
    aggregatedScores[seller.id] = Math.round(weightedScore)
  }

  // Step 4: Select recommended seller (lowest real cost among those within budget)
  const affordableBids = bids.filter(b => b.realCost <= request.budget)
  const sortedByRealCost = (affordableBids.length > 0 ? affordableBids : bids)
    .sort((a, b) => a.realCost - b.realCost)

  // Among affordable options, prefer LOW risk; if tied, lowest real cost
  const recommended = sortedByRealCost.find(b => b.riskLevel === 'LOW')
    ?? sortedByRealCost.find(b => b.riskLevel === 'MEDIUM')
    ?? sortedByRealCost[0]

  const recommendedSeller = sellers.find(s => s.id === recommended.sellerId)!

  // Step 5: Compute escrow policy for the winner
  const escrowPolicy = computeWinnerEscrowPolicy(
    recommendedSeller,
    recommended.realCost,
    marketAvgBid
  )

  // Step 6: Generate reason
  const cheapest = [...bids].sort((a, b) => a.bid - b.bid)[0]
  const reason = recommended.sellerId === cheapest.sellerId
    ? `${recommended.sellerName} offers lowest bid AND lowest risk-adjusted cost.`
    : `${recommended.sellerName} selected over cheaper ${cheapest.sellerName} (bid ${cheapest.bid} SOL) because risk-adjusted cost is lower. ${cheapest.sellerName}'s real cost inflated to ${cheapest.realCost} SOL due to ${cheapest.riskLevel} risk (trust score: ${cheapest.trustScore}/100).`

  return {
    recommendedSeller: recommended.sellerId,
    reason,
    bids,
    escrowPolicy,
    underwriterOpinions: opinions,
    timestamp: new Date().toISOString(),
  }
}
