import type { SellerProfile } from '../types/trustnet'

export interface FraudAnalysis {
  fraudRiskScore: number
  fraudSignals: string[]
  fraudExplanation: string
  vetoTriggered: boolean
}

const VETO_THRESHOLD = 70

/**
 * Fraud/collusion signal scoring.
 * Returns a fraud risk score 0–100 (higher = more suspicious).
 * Fed into the risk engine as an input signal.
 */
export function computeFraudScore(seller: SellerProfile): number {
  return analyzeFraud(seller).fraudRiskScore
}

export function analyzeFraud(seller: SellerProfile): FraudAnalysis {
  let score = 0
  const signals: string[] = []

  // Direct fraud signals (strongest indicator)
  if (seller.fraudSignals > 0) {
    score += seller.fraudSignals * 20
    signals.push(`${seller.fraudSignals} prior fraud signal(s) detected`)
  }

  // High dispute rate relative to delivery count
  if (seller.deliveryHistory > 0) {
    const disputeRate = seller.disputeHistory / seller.deliveryHistory
    score += disputeRate * 40
    if (disputeRate > 0.15) {
      signals.push(`Dispute rate ${(disputeRate * 100).toFixed(1)}% exceeds threshold`)
    }
  }

  // Abnormally cheap bid combined with low reputation (potential bait-and-switch)
  if (seller.bid < 0.25 && seller.reputation < 40) {
    score += 15
    signals.push(`Suspiciously low bid (${seller.bid} SOL) with poor reputation (${seller.reputation}/100)`)
  }

  // Unrealistic delivery promises
  if (seller.avgDeliveryTime < 600 && seller.qualityScore < 50) {
    score += 10
    signals.push(`Unrealistic delivery speed (${seller.avgDeliveryTime}s) with low quality (${seller.qualityScore}/100)`)
  }

  // High no-show rate (accepting jobs with no intent to deliver)
  if (seller.noShowRate > 0.30) {
    score += 20
    signals.push(`High no-show rate (${(seller.noShowRate * 100).toFixed(0)}%) indicates potential fraud`)
  } else if (seller.noShowRate > 0.15) {
    score += 8
    signals.push(`Elevated no-show rate (${(seller.noShowRate * 100).toFixed(0)}%)`)
  }

  // Low quality combined with many deliveries (grinding for volume, not quality)
  if (seller.qualityScore < 40 && seller.deliveryHistory > 10) {
    score += 10
    signals.push(`Volume grinding: ${seller.deliveryHistory} deliveries with quality ${seller.qualityScore}/100`)
  }

  // Suspicious reputation pattern: very low rep with some history
  if (seller.reputation < 30 && seller.deliveryHistory > 20) {
    score += 8
    signals.push(`Persistent low reputation despite ${seller.deliveryHistory} deliveries`)
  }

  const finalScore = Math.min(100, Math.round(score))
  const vetoTriggered = finalScore >= VETO_THRESHOLD

  const fraudExplanation = signals.length === 0
    ? `No fraud indicators detected. Seller ${seller.name} passes integrity checks.`
    : vetoTriggered
      ? `FRAUD VETO: Score ${finalScore}/100 exceeds threshold (${VETO_THRESHOLD}). ${signals.join('. ')}.`
      : `Fraud score ${finalScore}/100. Signals: ${signals.join('; ')}.`

  return { fraudRiskScore: finalScore, fraudSignals: signals, fraudExplanation, vetoTriggered }
}

/**
 * Collusion detection: checks if multiple sellers might be the same entity.
 * Detects bid clustering, similar fraud patterns, and suspicious coordination.
 */
export function detectCollusion(sellers: SellerProfile[]): Array<{ pair: [string, string]; reason: string }> {
  const suspicious: Array<{ pair: [string, string]; reason: string }> = []

  for (let i = 0; i < sellers.length; i++) {
    for (let j = i + 1; j < sellers.length; j++) {
      const a = sellers[i]
      const b = sellers[j]

      // Bid clustering: similar bids from sellers with fraud signals
      if (a.fraudSignals > 0 && b.fraudSignals > 0) {
        const bidDiff = Math.abs(a.bid - b.bid)
        if (bidDiff < 0.05) {
          suspicious.push({
            pair: [a.id, b.id],
            reason: `Bid clustering: ${a.name} (${a.bid}) and ${b.name} (${b.bid}) within 0.05 SOL, both with fraud signals`,
          })
        }
      }

      // Similar low-quality patterns
      if (a.qualityScore < 40 && b.qualityScore < 40 && Math.abs(a.noShowRate - b.noShowRate) < 0.1) {
        suspicious.push({
          pair: [a.id, b.id],
          reason: `Similar failure patterns: both low quality with close no-show rates`,
        })
      }
    }
  }

  return suspicious
}
