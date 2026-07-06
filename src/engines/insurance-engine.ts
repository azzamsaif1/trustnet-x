import type { SellerProfile } from '../types/trustnet'
import { assessRisk } from './risk-engine'

/**
 * Insurance fee computation.
 * Higher fee for risky sellers (to cover potential losses from no-shows/failures).
 * Low/zero for trusted sellers.
 *
 * The insurance fee represents the cost of insuring the buyer against seller failure.
 */
export function computeInsuranceFee(
  seller: SellerProfile,
  marketAvgBid: number
): number {
  const { trustScore, riskLevel } = assessRisk(seller, marketAvgBid)

  // Base insurance rate by risk level
  let baseRate: number
  switch (riskLevel) {
    case 'LOW':
      baseRate = 0.01 // 1% — trusted sellers barely need insurance
      break
    case 'MEDIUM':
      baseRate = 0.08 // 8% — moderate coverage needed
      break
    case 'HIGH':
      baseRate = 0.20 // 20% — significant risk requires substantial coverage
      break
  }

  // Scale by bid amount and inverse trust
  const riskMultiplier = (100 - trustScore) / 100
  const fee = seller.bid * baseRate + riskMultiplier * 0.15

  // Cap at reasonable maximum
  return Math.round(Math.min(fee, 0.25) * 100) / 100
}
