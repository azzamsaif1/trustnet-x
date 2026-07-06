import type { SellerProfile, EscrowPolicy } from '../types/trustnet'
import { assessRisk } from './risk-engine'

/**
 * Escrow policy engine: derives escrow terms from risk assessment.
 * - LOW risk: standard escrow, release after verifier approval
 * - MEDIUM risk: higher deposit, standard verification
 * - HIGH risk: highest deposit + risk premium, strict verification, refund on no-show
 */
export function computeEscrowPolicy(
  seller: SellerProfile,
  realCost: number,
  marketAvgBid: number
): EscrowPolicy {
  const { riskLevel, trustScore } = assessRisk(seller, marketAvgBid)

  switch (riskLevel) {
    case 'LOW':
      return {
        depositRequired: realCost,
        releaseCondition: 'Verifier confirms delivery meets requirements',
        refundCondition: 'Seller fails to deliver within deadline',
        verificationLevel: 'standard',
        deadlineSecs: 3600,
      }
    case 'MEDIUM':
      return {
        depositRequired: realCost * 1.1, // 10% buffer
        releaseCondition: 'Verifier confirms delivery quality meets threshold (score >= 60)',
        refundCondition: 'No-show, failed verification, or deadline exceeded',
        verificationLevel: 'enhanced',
        deadlineSecs: 2700,
      }
    case 'HIGH':
      return {
        depositRequired: realCost * 1.25, // 25% buffer for high risk
        releaseCondition: 'Strict verification: all deliverables present, quality score >= 75, delivery hash verified',
        refundCondition: 'Any verification failure, no-show, deadline miss, or quality below threshold',
        verificationLevel: 'strict',
        deadlineSecs: 1800,
      }
  }
}

/** Compute the escrow policy for the recommended (winning) seller */
export function computeWinnerEscrowPolicy(
  seller: SellerProfile,
  realCost: number,
  marketAvgBid: number
): EscrowPolicy {
  return computeEscrowPolicy(seller, realCost, marketAvgBid)
}
