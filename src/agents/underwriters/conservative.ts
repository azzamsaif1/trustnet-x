import type { SellerProfile, UnderwriterOpinion } from '../../types/trustnet'
import { getReputation } from '../../engines/reputation-engine'
import { computeFraudScore } from '../../engines/fraud-engine'

/**
 * Conservative underwriter: heavily weights reputation and reliability.
 * Penalizes any seller with dispute history or fraud signals disproportionately.
 * Prefers proven track records over low prices.
 */
export function evaluateConservative(sellers: SellerProfile[]): UnderwriterOpinion {
  const trustScores: Record<string, number> = {}
  const riskPremiums: Record<string, number> = {}

  for (const seller of sellers) {
    const rep = getReputation(seller)
    const fraud = computeFraudScore(seller)

    // Conservative weighting: reputation 40%, reliability 30%, fraud penalty 30%
    const score = Math.round(
      rep * 0.40 +
      (1 - seller.noShowRate) * 100 * 0.30 +
      (100 - fraud) * 0.30
    )
    trustScores[seller.id] = score

    // Conservative premium: high penalties for any risk signal
    const riskFactor = (100 - score) / 100
    riskPremiums[seller.id] = Math.round(riskFactor * riskFactor * 0.70 * 100) / 100
  }

  // Recommend the highest trust score seller
  const recommended = sellers.reduce((best, s) =>
    (trustScores[s.id] > trustScores[best.id]) ? s : best
  )

  return {
    underwriterId: 'conservative-01',
    name: 'Conservative Underwriter',
    recommendedSellerId: recommended.id,
    trustScores,
    riskPremiums,
    reasoning: `Selected ${recommended.name} based on proven track record (reputation ${getReputation(recommended)}/100) and minimal fraud risk. Conservative approach: prioritize reliability over cost savings.`,
    confidence: 0.85,
  }
}
