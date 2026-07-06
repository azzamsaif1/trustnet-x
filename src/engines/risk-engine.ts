import type { SellerProfile } from '../types/trustnet'
import { getReputation } from './reputation-engine'
import { computeFraudScore } from './fraud-engine'

export interface RiskAssessment {
  trustScore: number // 0–100 (higher = more trustworthy)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskPremium: number // SOL to add as risk compensation
  factors: Record<string, number>
}

/**
 * Compute trust score (0–100) from multiple risk factors.
 * Higher score = more trustworthy = lower risk premium.
 *
 * Tuned so that cheap_agent (bid 0.20) gets realCost ~0.70 (HIGH)
 * and premium_agent (bid 0.50) gets realCost ~0.51 (LOW).
 */
export function assessRisk(seller: SellerProfile, marketAvgBid: number): RiskAssessment {
  const reputation = getReputation(seller)
  const fraudScore = computeFraudScore(seller)

  // Factor weights (sum to ~1.0 for normalization)
  const factors: Record<string, number> = {}

  // 1. Reputation (0–100, weight 25%)
  factors.reputation = reputation * 0.25

  // 2. No-show reliability (0–100, weight 20%)
  factors.reliability = (1 - seller.noShowRate) * 100 * 0.20

  // 3. Delivery history depth (more history = more confidence, weight 10%)
  factors.experience = Math.min(100, seller.deliveryHistory / 3) * 0.10

  // 4. Price deviation from market average (underpricing = suspicious, weight 10%)
  const priceRatio = seller.bid / marketAvgBid
  factors.priceSignal = (priceRatio >= 0.7 ? Math.min(100, priceRatio * 80) : priceRatio * 50) * 0.10

  // 5. Quality score (weight 15%)
  factors.quality = seller.qualityScore * 0.15

  // 6. Dispute history penalty (weight 10%)
  const disputePenalty = Math.max(0, 100 - seller.disputeHistory * 12)
  factors.disputes = disputePenalty * 0.10

  // 7. Fraud/collusion signals (weight 10%)
  factors.fraud = Math.max(0, 100 - fraudScore) * 0.10

  // Sum all factors for final trust score
  const trustScore = Math.round(
    Object.values(factors).reduce((sum, v) => sum + v, 0)
  )

  // Map trust score to risk level
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    trustScore >= 75 ? 'LOW' :
    trustScore >= 45 ? 'MEDIUM' : 'HIGH'

  // Risk premium: inverse of trust, scaled to make cheap_agent expensive
  // LOW risk: 0–0.02 SOL premium
  // MEDIUM risk: 0.05–0.15 SOL premium
  // HIGH risk: 0.25–0.50 SOL premium
  const riskPremium = computeRiskPremium(trustScore, seller.bid)

  return { trustScore, riskLevel, riskPremium, factors }
}

function computeRiskPremium(trustScore: number, bid: number): number {
  // Exponential risk premium that makes untrustworthy sellers much more expensive
  const riskFactor = Math.max(0, (100 - trustScore) / 100)
  // Base premium scales with risk^2 for non-linear penalty
  const basePremium = riskFactor * riskFactor * 0.60
  // Additional premium for very low-trust sellers (below 30)
  const lowTrustBonus = trustScore < 30 ? 0.10 : 0
  return Math.round((basePremium + lowTrustBonus) * 100) / 100
}
