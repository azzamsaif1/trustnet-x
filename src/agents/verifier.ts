import type { DeliveryResult, VerificationResult } from '../types/trustnet'

/**
 * Verifier agent: checks delivery quality against requirements.
 * Returns pass/fail; triggers release (pass) or refund (fail).
 *
 * Checks:
 * - Delivery contains risk summary
 * - Delivery contains vulnerabilities list
 * - Delivery contains recommendation
 * - Delivery contains confidence score
 * - Delivery hash is present
 */
export function verifyDelivery(delivery: DeliveryResult | null, taskId: string): VerificationResult {
  if (!delivery) {
    return {
      taskId,
      sellerId: 'unknown',
      passed: false,
      hasRiskSummary: false,
      hasVulnerabilities: false,
      hasRecommendation: false,
      hasConfidenceScore: false,
      hasDeliveryHash: false,
      reason: 'No delivery received (no-show). Triggering refund.',
    }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(delivery.content)
  } catch {
    return {
      taskId,
      sellerId: delivery.sellerId,
      passed: false,
      hasRiskSummary: false,
      hasVulnerabilities: false,
      hasRecommendation: false,
      hasConfidenceScore: false,
      hasDeliveryHash: !!delivery.deliveryHash,
      reason: 'Delivery content is not valid JSON. Failed verification.',
    }
  }

  const hasRiskSummary = 'riskSummary' in parsed && parsed.riskSummary !== null
  const hasVulnerabilities = 'vulnerabilities' in parsed && Array.isArray(parsed.vulnerabilities) && (parsed.vulnerabilities as unknown[]).length > 0
  const hasRecommendation = 'recommendation' in parsed && typeof parsed.recommendation === 'string' && (parsed.recommendation as string).length > 10
  const hasConfidenceScore = 'confidenceScore' in parsed && typeof parsed.confidenceScore === 'number' && (parsed.confidenceScore as number) >= 0 && (parsed.confidenceScore as number) <= 100
  const hasDeliveryHash = !!delivery.deliveryHash && delivery.deliveryHash.length > 0

  const checks = [hasRiskSummary, hasVulnerabilities, hasRecommendation, hasConfidenceScore, hasDeliveryHash]
  const passCount = checks.filter(Boolean).length
  const passed = passCount >= 4 // At least 4 out of 5 checks must pass

  const failures: string[] = []
  if (!hasRiskSummary) failures.push('missing risk summary')
  if (!hasVulnerabilities) failures.push('missing vulnerabilities')
  if (!hasRecommendation) failures.push('missing recommendation')
  if (!hasConfidenceScore) failures.push('missing confidence score')
  if (!hasDeliveryHash) failures.push('missing delivery hash')

  const reason = passed
    ? `Verification passed (${passCount}/5 checks). Delivery meets quality requirements. Triggering escrow release.`
    : `Verification failed (${passCount}/5 checks). Issues: ${failures.join(', ')}. Triggering refund.`

  return {
    taskId,
    sellerId: delivery.sellerId,
    passed,
    hasRiskSummary,
    hasVulnerabilities,
    hasRecommendation,
    hasConfidenceScore,
    hasDeliveryHash,
    reason,
  }
}
