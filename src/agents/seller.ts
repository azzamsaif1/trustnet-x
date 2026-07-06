import type { DeliveryResult } from '../types/trustnet'
import { demoTask } from '../config/demo-task'

/**
 * Seller agent behaviors.
 * - premium_agent: returns a thorough smart-contract audit report
 * - cheap_agent: simulated as no-show / low-quality delivery
 * - fast_agent: returns a quick but shallow review
 */
export function deliverAsAgent(sellerId: string, taskId: string): DeliveryResult | null {
  switch (sellerId) {
    case 'premium_agent':
      return deliverPremium(taskId)
    case 'cheap_agent':
      return deliverCheap(taskId)
    case 'fast_agent':
      return deliverFast(taskId)
    default:
      return null
  }
}

function deliverPremium(taskId: string): DeliveryResult {
  const content = JSON.stringify({
    riskSummary: {
      severity: 'MEDIUM',
      overview: 'PaymentSplitter contract has reentrancy vulnerability in release() and lacks access control. Integer division truncation may cause fund loss.',
    },
    vulnerabilities: [
      {
        id: 'V-001',
        severity: 'HIGH',
        title: 'Reentrancy in release()',
        description: 'The release() function sends ETH via transfer() in a loop without following checks-effects-interactions. While transfer() has a 2300 gas stipend limiting reentrancy, using call{} would be vulnerable.',
        recommendation: 'Use ReentrancyGuard or restructure to pull pattern.',
      },
      {
        id: 'V-002',
        severity: 'MEDIUM',
        title: 'No access control on release()',
        description: 'Anyone can call release() and trigger fund distribution. This could be weaponized for gas griefing or timing attacks.',
        recommendation: 'Add onlyOwner modifier or time-lock mechanism.',
      },
      {
        id: 'V-003',
        severity: 'LOW',
        title: 'Integer division truncation',
        description: 'balance * shares[i] / totalShares may lose dust due to integer division. Residual wei stays locked in contract forever.',
        recommendation: 'Track remainders or add a sweep function for dust.',
      },
    ],
    recommendation: 'Do NOT deploy without fixing V-001 and V-002. Add OpenZeppelin ReentrancyGuard, implement access control, and consider using a pull-based payment pattern instead of push.',
    confidenceScore: 87,
    deliveryHash: generateHash(`premium-${taskId}-${Date.now()}`),
  })

  return {
    sellerId: 'premium_agent',
    taskId,
    content,
    deliveryHash: generateHash(`premium-${taskId}-${Date.now()}`),
    deliveredAt: new Date().toISOString(),
  }
}

function deliverCheap(_taskId: string): DeliveryResult | null {
  // cheap_agent simulates a no-show (40% no-show rate)
  // For demo purposes, always returns null to demonstrate the risk
  return null
}

function deliverFast(taskId: string): DeliveryResult {
  const content = JSON.stringify({
    riskSummary: {
      severity: 'LOW',
      overview: 'Quick scan complete. Some minor issues found.',
    },
    vulnerabilities: [
      {
        id: 'V-001',
        severity: 'MEDIUM',
        title: 'Missing access control',
        description: 'release() is public.',
        recommendation: 'Add modifier.',
      },
    ],
    recommendation: 'Looks mostly fine. Consider adding access control.',
    confidenceScore: 52,
    deliveryHash: generateHash(`fast-${taskId}-${Date.now()}`),
  })

  return {
    sellerId: 'fast_agent',
    taskId,
    content,
    deliveryHash: generateHash(`fast-${taskId}-${Date.now()}`),
    deliveredAt: new Date().toISOString(),
  }
}

function generateHash(input: string): string {
  // Simple deterministic hash for demo (not cryptographic)
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`
}
