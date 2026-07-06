/** TrustNet X — Shared type definitions for the autonomous underwriting market */

/** 7-step escrow state machine (CoralOS pattern) */
export enum EscrowState {
  WANT = 'WANT',
  BID = 'BID',
  AWARD = 'AWARD',
  DEPOSITED = 'DEPOSITED',
  DELIVERED = 'DELIVERED',
  VERIFIED = 'VERIFIED',
  RELEASED = 'RELEASED',
}

/** Buyer's request for a service */
export interface BuyerRequest {
  taskId: string
  description: string
  budget: number // max SOL willing to pay (inclusive of risk costs)
  requirements: string[]
  deadline: number // seconds from now
}

/** Seller profile with full risk-relevant history */
export interface SellerProfile {
  id: string
  name: string
  bid: number // SOL asking price
  reputation: number // 0–100
  noShowRate: number // 0–1
  deliveryHistory: number // total deliveries completed
  qualityScore: number // 0–100
  disputeHistory: number // number of disputes
  fraudSignals: number // fraud/collusion signal count
  avgDeliveryTime: number // seconds
}

/** Per-seller risk analysis report */
export interface SellerBidReport {
  sellerId: string
  sellerName: string
  bid: number
  trustScore: number // 0–100
  riskPremium: number // SOL added for risk
  insuranceFee: number // SOL for insurance pool
  realCost: number // bid + riskPremium + insuranceFee
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

/** Escrow policy derived from risk assessment */
export interface EscrowPolicy {
  depositRequired: number // SOL
  releaseCondition: string
  refundCondition: string
  verificationLevel: 'standard' | 'enhanced' | 'strict'
  deadlineSecs: number
}

/** Individual underwriter opinion */
export interface UnderwriterOpinion {
  underwriterId: string
  name: string
  recommendedSellerId: string
  trustScores: Record<string, number> // sellerId -> score
  riskPremiums: Record<string, number> // sellerId -> premium
  reasoning: string
  confidence: number // 0–1
}

/** Final underwriting report returned by the paid service */
export interface UnderwritingReport {
  recommendedSeller: string
  reason: string
  bids: SellerBidReport[]
  escrowPolicy: EscrowPolicy
  underwriterOpinions: UnderwriterOpinion[]
  timestamp: string
}

/** Delivery result from a seller */
export interface DeliveryResult {
  sellerId: string
  taskId: string
  content: string
  deliveryHash: string
  deliveredAt: string
}

/** Verification result from the verifier agent */
export interface VerificationResult {
  taskId: string
  sellerId: string
  passed: boolean
  hasRiskSummary: boolean
  hasVulnerabilities: boolean
  hasRecommendation: boolean
  hasConfidenceScore: boolean
  hasDeliveryHash: boolean
  reason: string
}
