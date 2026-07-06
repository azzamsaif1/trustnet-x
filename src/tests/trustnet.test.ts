import { describe, it, expect } from 'vitest'
import { deliverService } from '../service/index'
import { buyerRequest } from '../config/buyer'
import { sellers } from '../config/sellers'
import { buyerSelectSeller } from '../agents/buyer'
import { deliverAsAgent } from '../agents/seller'
import { verifyDelivery } from '../agents/verifier'
import { increaseReputation, decreaseReputation, resetReputation } from '../engines/reputation-engine'
import { applyLearning, resetLearning } from '../engines/adaptive-learning-engine'
import { analyzeUnderwriting } from '../engines/underwriting-model'
import { analyzeFraud } from '../engines/fraud-engine'
import { explainDecision } from '../engines/explainability-engine'

describe('TrustNet X Core Logic', () => {
  describe('Real Cost Formula: realCost = bid + riskPremium + insuranceFee', () => {
    it('should compute real cost correctly for all sellers', () => {
      const report = deliverService({ buyerRequest, sellers })

      for (const bid of report.bids) {
        const expectedRealCost = bid.bid + bid.riskPremium + bid.insuranceFee
        expect(bid.realCost).toBeCloseTo(expectedRealCost, 2)
      }
    })

    it('should inflate cheap_agent real cost above premium_agent', () => {
      const report = deliverService({ buyerRequest, sellers })
      const cheap = report.bids.find(b => b.sellerId === 'cheap_agent')!
      const premium = report.bids.find(b => b.sellerId === 'premium_agent')!

      expect(cheap.realCost).toBeGreaterThan(premium.realCost)
      expect(cheap.realCost).toBeGreaterThan(0.70)
      expect(premium.realCost).toBeCloseTo(0.51, 1)
    })

    it('should order real costs: CheapBot > SpeedReview > PremiumAudit', () => {
      const report = deliverService({ buyerRequest, sellers })
      const cheap = report.bids.find(b => b.sellerId === 'cheap_agent')!
      const fast = report.bids.find(b => b.sellerId === 'fast_agent')!
      const premium = report.bids.find(b => b.sellerId === 'premium_agent')!

      expect(cheap.realCost).toBeGreaterThan(fast.realCost)
      expect(fast.realCost).toBeGreaterThan(premium.realCost)
    })
  })

  describe('Buyer Selection: premium_agent beats cheap_agent due to risk', () => {
    it('should select premium_agent as winner', () => {
      const report = deliverService({ buyerRequest, sellers })
      const decision = buyerSelectSeller(buyerRequest, report)

      expect(decision.selectedSellerId).toBe('premium_agent')
      expect(decision.selectedSellerName).toBe('PremiumAudit-Pro')
    })

    it('should not select the cheapest bidder', () => {
      const report = deliverService({ buyerRequest, sellers })
      const decision = buyerSelectSeller(buyerRequest, report)

      expect(decision.selectedSellerId).not.toBe('cheap_agent')
    })

    it('should report reason explaining cost inversion', () => {
      const report = deliverService({ buyerRequest, sellers })
      const decision = buyerSelectSeller(buyerRequest, report)

      expect(decision.reason).toContain('CheapBot-9000')
      expect(decision.reason).toContain('real cost')
    })
  })

  describe('Verifier: passes valid delivery', () => {
    it('should pass delivery from premium_agent', () => {
      const delivery = deliverAsAgent('premium_agent', 'test-task')
      const result = verifyDelivery(delivery, 'test-task')

      expect(result.passed).toBe(true)
      expect(result.hasRiskSummary).toBe(true)
      expect(result.hasVulnerabilities).toBe(true)
      expect(result.hasRecommendation).toBe(true)
      expect(result.hasConfidenceScore).toBe(true)
      expect(result.hasDeliveryHash).toBe(true)
    })
  })

  describe('Verifier: fails missing/invalid delivery', () => {
    it('should fail when delivery is null (no-show)', () => {
      const result = verifyDelivery(null, 'test-task')

      expect(result.passed).toBe(false)
    })

    it('should fail delivery from cheap_agent (low quality)', () => {
      const delivery = deliverAsAgent('cheap_agent', 'test-task')
      const result = verifyDelivery(delivery, 'test-task')

      expect(result.passed).toBe(false)
    })
  })

  describe('Reputation: updates after success/failure', () => {
    it('should increase reputation after successful delivery', () => {
      resetReputation('test_seller_success', 50)
      const before = 50
      const after = increaseReputation('test_seller_success', 5)

      expect(after).toBeGreaterThan(before)
      expect(after).toBe(55)
    })

    it('should decrease reputation after failed delivery', () => {
      resetReputation('test_seller_fail', 60)
      const before = 60
      const after = decreaseReputation('test_seller_fail', 10)

      expect(after).toBeLessThan(before)
      expect(after).toBe(50)
    })

    it('should not exceed 100 when increasing', () => {
      resetReputation('test_seller_cap', 98)
      const after = increaseReputation('test_seller_cap', 10)

      expect(after).toBe(100)
    })

    it('should not go below 0 when decreasing', () => {
      resetReputation('test_seller_floor', 5)
      const after = decreaseReputation('test_seller_floor', 20)

      expect(after).toBe(0)
    })
  })

  describe('Adaptive Learning Engine', () => {
    it('should increase trust after verified delivery', () => {
      const seller = sellers.find(s => s.id === 'premium_agent')!
      resetLearning(seller.id)
      const snap = applyLearning(seller, 'verified_delivery')

      expect(snap.after.trustScore).toBeGreaterThan(snap.before.trustScore)
      expect(snap.after.riskMultiplier).toBeLessThan(snap.before.riskMultiplier)
      expect(snap.event).toBe('verified_delivery')
    })

    it('should decrease trust after no-show', () => {
      const seller = sellers.find(s => s.id === 'cheap_agent')!
      resetLearning(seller.id)
      const snap = applyLearning(seller, 'no_show')

      expect(snap.after.trustScore).toBeLessThan(snap.before.trustScore)
      expect(snap.after.fraudProbability).toBeGreaterThan(snap.before.fraudProbability)
      expect(snap.after.riskMultiplier).toBeGreaterThan(snap.before.riskMultiplier)
    })
  })

  describe('Advanced Underwriting Model', () => {
    it('should classify cheap_agent as HIGH or CRITICAL risk', () => {
      const marketAvg = sellers.reduce((s, x) => s + x.bid, 0) / sellers.length
      const analysis = analyzeUnderwriting(sellers.find(s => s.id === 'cheap_agent')!, marketAvg)

      expect(['HIGH', 'CRITICAL']).toContain(analysis.riskClass)
      expect(analysis.probabilityOfFailure).toBeGreaterThan(0.3)
    })

    it('should classify premium_agent as LOW risk', () => {
      const marketAvg = sellers.reduce((s, x) => s + x.bid, 0) / sellers.length
      const analysis = analyzeUnderwriting(sellers.find(s => s.id === 'premium_agent')!, marketAvg)

      expect(analysis.riskClass).toBe('LOW')
      expect(analysis.probabilityOfFailure).toBeLessThan(0.1)
      expect(analysis.rejected).toBe(false)
    })

    it('should require higher collateral ratio for risky sellers', () => {
      const marketAvg = sellers.reduce((s, x) => s + x.bid, 0) / sellers.length
      const cheapSeller = sellers.find(s => s.id === 'cheap_agent')!
      const premiumSeller = sellers.find(s => s.id === 'premium_agent')!
      const cheap = analyzeUnderwriting(cheapSeller, marketAvg)
      const premium = analyzeUnderwriting(premiumSeller, marketAvg)

      const cheapRatio = cheap.dynamicCollateral / cheapSeller.bid
      const premiumRatio = premium.dynamicCollateral / premiumSeller.bid
      expect(cheapRatio).toBeGreaterThan(premiumRatio)
    })
  })

  describe('Fraud Intelligence', () => {
    it('should detect high fraud score for cheap_agent', () => {
      const fraud = analyzeFraud(sellers.find(s => s.id === 'cheap_agent')!)

      expect(fraud.fraudRiskScore).toBeGreaterThan(50)
      expect(fraud.fraudSignals.length).toBeGreaterThan(0)
    })

    it('should trigger veto for very high fraud scores', () => {
      const fraud = analyzeFraud(sellers.find(s => s.id === 'cheap_agent')!)

      expect(fraud.vetoTriggered).toBe(true)
      expect(fraud.fraudExplanation).toContain('VETO')
    })

    it('should not trigger veto for premium_agent', () => {
      const fraud = analyzeFraud(sellers.find(s => s.id === 'premium_agent')!)

      expect(fraud.vetoTriggered).toBe(false)
      expect(fraud.fraudRiskScore).toBeLessThan(10)
    })
  })

  describe('Explainability Engine', () => {
    it('should explain why cheap seller lost', () => {
      const report = deliverService({ buyerRequest, sellers })
      const explanation = explainDecision(report)

      expect(explanation.whyCheapLost).toContain('CheapBot')
      expect(explanation.whyCheapLost).toContain('risk')
      expect(explanation.topRiskFactors.length).toBeGreaterThanOrEqual(2)
    })

    it('should explain why premium seller won', () => {
      const report = deliverService({ buyerRequest, sellers })
      const explanation = explainDecision(report)

      expect(explanation.whyPremiumWon).toContain('PremiumAudit')
      expect(explanation.whyPremiumWon).toContain('cheaper')
    })
  })
})
