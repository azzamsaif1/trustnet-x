import type { SellerProfile } from '../types/trustnet'

/** Three seller personas for the demo — tuned so risk-adjusted cost inverts naive bid ordering */
export const sellers: SellerProfile[] = [
  {
    id: 'cheap_agent',
    name: 'CheapBot-9000',
    bid: 0.20,
    reputation: 25,
    noShowRate: 0.40,
    deliveryHistory: 12,
    qualityScore: 30,
    disputeHistory: 8,
    fraudSignals: 3,
    avgDeliveryTime: 7200,
  },
  {
    id: 'premium_agent',
    name: 'PremiumAudit-Pro',
    bid: 0.50,
    reputation: 95,
    noShowRate: 0.02,
    deliveryHistory: 340,
    qualityScore: 96,
    disputeHistory: 2,
    fraudSignals: 0,
    avgDeliveryTime: 1800,
  },
  {
    id: 'fast_agent',
    name: 'SpeedReview-X',
    bid: 0.35,
    reputation: 50,
    noShowRate: 0.18,
    deliveryHistory: 85,
    qualityScore: 55,
    disputeHistory: 7,
    fraudSignals: 1,
    avgDeliveryTime: 900,
  },
]
