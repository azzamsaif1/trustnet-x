import type { SellerProfile } from '../types/trustnet'
import { increaseReputation, decreaseReputation } from './reputation-engine'

export interface LearningSnapshot {
  sellerId: string
  sellerName: string
  before: LearningState
  after: LearningState
  event: 'verified_delivery' | 'failed_delivery' | 'no_show'
  timestamp: string
}

export interface LearningState {
  trustScore: number
  riskMultiplier: number
  fraudProbability: number
  insuranceMultiplier: number
  reputation: number
  underwritingConfidence: number
}

const learningStore: Record<string, LearningState> = {}

function getState(seller: SellerProfile): LearningState {
  if (learningStore[seller.id]) return { ...learningStore[seller.id] }
  return {
    trustScore: seller.reputation,
    riskMultiplier: 1.0,
    fraudProbability: Math.min(1, seller.fraudSignals * 0.15),
    insuranceMultiplier: 1.0,
    reputation: seller.reputation,
    underwritingConfidence: 0.5,
  }
}

function saveState(sellerId: string, state: LearningState): void {
  learningStore[sellerId] = { ...state }
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(`trustnet_learning_${sellerId}`, JSON.stringify(state))
  }
}

export function applyLearning(
  seller: SellerProfile,
  event: 'verified_delivery' | 'failed_delivery' | 'no_show'
): LearningSnapshot {
  const before = getState(seller)
  const after = { ...before }

  switch (event) {
    case 'verified_delivery':
      after.trustScore = Math.min(100, before.trustScore + 8)
      after.riskMultiplier = Math.max(0.5, before.riskMultiplier * 0.92)
      after.fraudProbability = Math.max(0, before.fraudProbability - 0.05)
      after.insuranceMultiplier = Math.max(0.3, before.insuranceMultiplier * 0.90)
      after.reputation = increaseReputation(seller.id, 5)
      after.underwritingConfidence = Math.min(1, before.underwritingConfidence + 0.08)
      break
    case 'failed_delivery':
      after.trustScore = Math.max(0, before.trustScore - 15)
      after.riskMultiplier = Math.min(3.0, before.riskMultiplier * 1.35)
      after.fraudProbability = Math.min(1, before.fraudProbability + 0.12)
      after.insuranceMultiplier = Math.min(3.0, before.insuranceMultiplier * 1.40)
      after.reputation = decreaseReputation(seller.id, 12)
      after.underwritingConfidence = Math.max(0.1, before.underwritingConfidence - 0.10)
      break
    case 'no_show':
      after.trustScore = Math.max(0, before.trustScore - 25)
      after.riskMultiplier = Math.min(4.0, before.riskMultiplier * 1.6)
      after.fraudProbability = Math.min(1, before.fraudProbability + 0.20)
      after.insuranceMultiplier = Math.min(4.0, before.insuranceMultiplier * 1.8)
      after.reputation = decreaseReputation(seller.id, 20)
      after.underwritingConfidence = Math.max(0.1, before.underwritingConfidence - 0.15)
      break
  }

  saveState(seller.id, after)

  return {
    sellerId: seller.id,
    sellerName: seller.name,
    before,
    after,
    event,
    timestamp: new Date().toISOString(),
  }
}

export function getLearningState(seller: SellerProfile): LearningState {
  return getState(seller)
}

export function resetLearning(sellerId: string): void {
  delete learningStore[sellerId]
}
