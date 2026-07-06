import type { BuyerRequest } from '../types/trustnet'

/** Buyer configuration for the demo */
export const buyerConfig = {
  budget: 1.0, // max SOL the buyer will spend (inclusive of risk costs)
  requirements: [
    'Smart contract security audit',
    'Payment-splitting risk analysis',
    'Vulnerability identification',
    'Confidence score included',
  ],
}

export const buyerRequest: BuyerRequest = {
  taskId: 'audit-001',
  description: 'Audit this smart contract for security and payment-splitting risks.',
  budget: buyerConfig.budget,
  requirements: buyerConfig.requirements,
  deadline: 3600, // 1 hour
}
