import type { SellerProfile, UnderwriterOpinion } from '../../types/trustnet'
import { getReputation } from '../../engines/reputation-engine'
import { computeFraudScore } from '../../engines/fraud-engine'

/**
 * Aggressive underwriter: optimizes for value — willing to accept moderate risk
 * if the cost savings justify it. Still won't recommend high-fraud sellers.
 * Weights cost efficiency more heavily.
 */
export function evaluateAggressive(sellers: SellerProfile[]): UnderwriterOpinion {
  const trustScores: Record<string, number> = {}
  const riskPremiums: Record<string, number> = {}
  const marketAvg = sellers.reduce((sum, s) => sum + s.bid, 0) / sellers.length

  for (const seller of sellers) {
    const rep = getReputation(seller)
    const fraud = computeFraudScore(seller)

    // Aggressive weighting: reputation 20%, quality 25%, cost-efficiency 25%, fraud penalty 30%
    const costEfficiency = Math.min(100, (marketAvg / seller.bid) * 60)
    const score = Math.round(
      rep * 0.20 +
      seller.qualityScore * 0.25 +
      costEfficiency * 0.25 +
      (100 - fraud) * 0.30
    )
    trustScores[seller.id] = score

    // Aggressive premium: lower penalties, but still penalizes fraud
    const riskFactor = (100 - score) / 100
    riskPremiums[seller.id] = Math.round(riskFactor * 0.45 * 100) / 100
  }

  // Recommend best value (highest score considering cost)
  const recommended = sellers.reduce((best, s) =>
    (trustScores[s.id] > trustScores[best.id]) ? s : best
  )

  return {
    underwriterId: 'aggressive-01',
    name: 'Aggressive Underwriter',
    recommendedSellerId: recommended.id,
    trustScores,
    riskPremiums,
    reasoning: `Selected ${recommended.name} as best risk-adjusted value. Aggressive stance: willing to accept moderate risk for better pricing, but fraud signals remain a hard gate.`,
    confidence: 0.72,
  }
}
