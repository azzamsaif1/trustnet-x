import type { SellerProfile } from '../types/trustnet'
import { assessRisk } from './risk-engine'
import { computeFraudScore } from './fraud-engine'

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface UnderwritingAnalysis {
  sellerId: string
  sellerName: string
  probabilityOfFailure: number
  expectedLoss: number
  confidenceInterval: [number, number]
  riskAdjustedPrice: number
  dynamicCollateral: number
  riskClass: RiskClass
  rejected: boolean
  rejectionReason: string | null
}

export function analyzeUnderwriting(
  seller: SellerProfile,
  marketAvgBid: number
): UnderwritingAnalysis {
  const risk = assessRisk(seller, marketAvgBid)
  const fraudScore = computeFraudScore(seller)

  // Probability of failure: derived from no-show rate, fraud score, and inverse trust
  const pFailure = Math.min(0.95, (
    seller.noShowRate * 0.4 +
    (fraudScore / 100) * 0.3 +
    ((100 - risk.trustScore) / 100) * 0.3
  ))

  // Expected loss: probability * bid amount (what buyer loses on failure)
  const expectedLoss = pFailure * seller.bid

  // Risk-adjusted pricing
  const riskMultiplier = 1 + (pFailure * 2.5)
  const confidenceFactor = 1 - (risk.trustScore / 200)
  const riskPremium = expectedLoss * pFailure * riskMultiplier
  const insuranceFee = pFailure * expectedLoss * confidenceFactor
  const riskAdjustedPrice = seller.bid + riskPremium + insuranceFee

  // Confidence interval (95%)
  const spread = pFailure * 0.3
  const ciLow = Math.max(0, pFailure - spread)
  const ciHigh = Math.min(1, pFailure + spread)

  // Dynamic collateral based on risk class
  const riskClass = classifyRisk(pFailure, fraudScore, risk.trustScore)
  const dynamicCollateral = computeCollateral(seller.bid, riskClass)

  // Rejection logic
  const rejected = riskClass === 'CRITICAL'
  const rejectionReason = rejected
    ? `Seller rejected: failure probability ${(pFailure * 100).toFixed(0)}% exceeds safety threshold. Fraud score: ${fraudScore}/100.`
    : null

  return {
    sellerId: seller.id,
    sellerName: seller.name,
    probabilityOfFailure: Math.round(pFailure * 1000) / 1000,
    expectedLoss: Math.round(expectedLoss * 10000) / 10000,
    confidenceInterval: [Math.round(ciLow * 100) / 100, Math.round(ciHigh * 100) / 100],
    riskAdjustedPrice: Math.round(riskAdjustedPrice * 100) / 100,
    dynamicCollateral: Math.round(dynamicCollateral * 10000) / 10000,
    riskClass,
    rejected,
    rejectionReason,
  }
}

function classifyRisk(pFailure: number, fraudScore: number, trustScore: number): RiskClass {
  if (pFailure > 0.60 || fraudScore > 80 || trustScore < 15) return 'CRITICAL'
  if (pFailure > 0.35 || fraudScore > 50 || trustScore < 30) return 'HIGH'
  if (pFailure > 0.15 || fraudScore > 25 || trustScore < 60) return 'MEDIUM'
  return 'LOW'
}

function computeCollateral(bid: number, riskClass: RiskClass): number {
  switch (riskClass) {
    case 'LOW': return bid * 1.0
    case 'MEDIUM': return bid * 1.25
    case 'HIGH': return bid * 1.75
    case 'CRITICAL': return bid * 2.5
  }
}
