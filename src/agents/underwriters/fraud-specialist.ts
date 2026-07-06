import type { SellerProfile, UnderwriterOpinion } from '../../types/trustnet'
import { computeFraudScore, analyzeFraud, detectCollusion } from '../../engines/fraud-engine'
import { getReputation } from '../../engines/reputation-engine'

/**
 * Fraud specialist underwriter: focuses exclusively on fraud/collusion detection.
 * Has VETO POWER: if fraudRiskScore > threshold, can override consensus.
 * Acts as a safety gate in the underwriting consortium.
 */
export function evaluateFraudSpecialist(sellers: SellerProfile[]): UnderwriterOpinion {
  const trustScores: Record<string, number> = {}
  const riskPremiums: Record<string, number> = {}
  const collusionResults = detectCollusion(sellers)

  const collusionInvolved = new Set<string>()
  for (const result of collusionResults) {
    collusionInvolved.add(result.pair[0])
    collusionInvolved.add(result.pair[1])
  }

  const vetoedSellers: string[] = []

  for (const seller of sellers) {
    const fraud = analyzeFraud(seller)
    const rep = getReputation(seller)
    const isColluding = collusionInvolved.has(seller.id)

    if (fraud.vetoTriggered) {
      vetoedSellers.push(seller.id)
    }

    // Fraud-focused scoring: fraud signals 50%, dispute pattern 20%, reputation 20%, collusion 10%
    const fraudPenalty = (100 - fraud.fraudRiskScore) * 0.50
    const disputePattern = Math.max(0, 100 - seller.disputeHistory * 15) * 0.20
    const repScore = rep * 0.20
    const collusionPenalty = isColluding ? 0 : 100 * 0.10

    const score = Math.round(fraudPenalty + disputePattern + repScore + collusionPenalty)
    trustScores[seller.id] = fraud.vetoTriggered ? 0 : score

    // Fraud premium: extreme penalties for any fraud signal
    const riskFactor = (100 - score) / 100
    riskPremiums[seller.id] = Math.round((riskFactor * 0.80 + (isColluding ? 0.20 : 0) + (fraud.vetoTriggered ? 0.50 : 0)) * 100) / 100
  }

  // Recommend the least fraudulent non-vetoed seller
  const eligible = sellers.filter(s => !vetoedSellers.includes(s.id))
  const candidates = eligible.length > 0 ? eligible : sellers
  const recommended = candidates.reduce((best, s) =>
    (trustScores[s.id] > trustScores[best.id]) ? s : best
  )

  const vetoWarning = vetoedSellers.length > 0
    ? ` VETO: ${vetoedSellers.length} seller(s) flagged for fraud override.`
    : ''
  const collusionWarning = collusionResults.length > 0
    ? ` WARNING: Detected ${collusionResults.length} potential collusion pair(s).`
    : ''

  return {
    underwriterId: 'fraud-specialist-01',
    name: 'Fraud Specialist',
    recommendedSellerId: recommended.id,
    trustScores,
    riskPremiums,
    reasoning: `Fraud analysis complete. ${recommended.name} shows minimal fraud indicators (score: ${computeFraudScore(sellers.find(s => s.id === recommended.id)!)}/100 fraud risk).${vetoWarning}${collusionWarning} Recommending based on integrity assessment.`,
    confidence: 0.90,
  }
}
