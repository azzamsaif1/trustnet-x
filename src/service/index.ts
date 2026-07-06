/**
 * `deliverService()` — TrustNet X paid endpoint.
 * Following the CoralOS starter kit pattern: accepts a request, processes it, returns structured result.
 *
 * This is the core paid service: accept buyer request + seller bids → run risk evaluation →
 * compute risk premium / insurance fee / real cost per seller → select recommended seller →
 * return the structured UnderwritingReport including escrow terms and release conditions.
 */
import type { BuyerRequest, SellerProfile, UnderwritingReport } from '../types/trustnet'
import { evaluateMarket } from '../agents/trustnet-risk-agent'
import { sellers as defaultSellers } from '../config/sellers'
import { buyerRequest as defaultRequest } from '../config/buyer'

export interface ServiceRequest {
  buyerRequest?: BuyerRequest
  sellers?: SellerProfile[]
}

/**
 * The paid endpoint — follows CoralOS deliverService() pattern.
 * Accepts buyer request + seller bids, runs risk evaluation, returns UnderwritingReport.
 */
export function deliverService(input?: ServiceRequest): UnderwritingReport {
  const request = input?.buyerRequest ?? defaultRequest
  const sellerList = input?.sellers ?? defaultSellers

  return evaluateMarket(request, sellerList)
}

/** String-based interface matching CoralOS pattern (request string in, JSON string out) */
export function deliverServiceString(request: string): string {
  try {
    const parsed = request.trim() ? JSON.parse(request) as ServiceRequest : {}
    const report = deliverService(parsed)
    return JSON.stringify(report, null, 2)
  } catch (e) {
    // Fallback: run with defaults if request isn't valid JSON
    const report = deliverService()
    return JSON.stringify(report, null, 2)
  }
}

// CLI entry point (only runs in Node, not in browser)
if (typeof process !== 'undefined' && typeof process.argv !== 'undefined' && process.argv[1]?.includes('service/index')) {
  const report = deliverService()
  console.log('\n=== TrustNet X — Underwriting Report ===\n')
  console.log(JSON.stringify(report, null, 2))
}
