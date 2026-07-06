import React, { useState, useCallback } from 'react'
import { deliverService } from '../service/index'
import { buyerRequest } from '../config/buyer'
import { sellers } from '../config/sellers'
import { buyerSelectSeller } from '../agents/buyer'
import type { BuyerDecision } from '../agents/buyer'
import { deliverAsAgent } from '../agents/seller'
import { verifyDelivery } from '../agents/verifier'
import { simulateEscrowFlow } from '../solana/escrow'
import { buildExplorerUrl } from '../solana/explorer'
import { EscrowState } from '../types/trustnet'
import type { UnderwritingReport, VerificationResult } from '../types/trustnet'
import { applyLearning } from '../engines/adaptive-learning-engine'
import type { LearningSnapshot } from '../engines/adaptive-learning-engine'
import { analyzeUnderwriting } from '../engines/underwriting-model'
import type { UnderwritingAnalysis } from '../engines/underwriting-model'
import { analyzeFraud } from '../engines/fraud-engine'
import type { FraudAnalysis } from '../engines/fraud-engine'
import { explainDecision } from '../engines/explainability-engine'
import type { DecisionExplanation } from '../engines/explainability-engine'
import { BidTable } from './BidTable'
import { RiskReportCard } from './RiskReportCard'
import { EscrowTimeline } from './EscrowTimeline'
import { SettlementProof } from './SettlementProof'

interface DemoStep {
  label: string
  detail: string
  icon: string
}

export function TrustNetDashboard() {
  const [report, setReport] = useState<UnderwritingReport | null>(null)
  const [currentState, setCurrentState] = useState<EscrowState>(EscrowState.WANT)
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [txSignature, setTxSignature] = useState<string>('')
  const [isSimulated, setIsSimulated] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [decision, setDecision] = useState<BuyerDecision | null>(null)
  const [demoLog, setDemoLog] = useState<DemoStep[]>([])
  const [learningSnapshots, setLearningSnapshots] = useState<LearningSnapshot[]>([])
  const [underwritingAnalyses, setUnderwritingAnalyses] = useState<UnderwritingAnalysis[]>([])
  const [fraudAnalyses, setFraudAnalyses] = useState<FraudAnalysis[]>([])
  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null)
  const [activeEngine, setActiveEngine] = useState<string>('')
  const [fallbackReason, setFallbackReason] = useState<string | undefined>(undefined)

  const settlementMode = (import.meta.env.VITE_SETTLEMENT_MODE as string) ?? 'simulated'
  const isDemoMode = settlementMode !== 'live'

  const addLog = useCallback((label: string, detail: string, icon: string = '') => {
    setDemoLog(prev => [...prev, { label, detail, icon }])
  }, [])

  async function runDemo() {
    setIsRunning(true)
    setHasRun(true)
    setDemoLog([])
    setReport(null)
    setVerification(null)
    setTxSignature('')
    setDecision(null)
    setLearningSnapshots([])
    setUnderwritingAnalyses([])
    setFraudAnalyses([])
    setExplanation(null)
    setIsSimulated(true)

    // Step 1: WANT
    setCurrentState(EscrowState.WANT)
    addLog('WANT', `Buyer posts: "${buyerRequest.description}" | Budget: ${buyerRequest.budget} SOL`, 'TASK')
    await delay(600)

    // Step 2: BID
    setCurrentState(EscrowState.BID)
    addLog('BID', `3 sellers bid: CheapBot (0.20), PremiumAudit (0.50), SpeedReview (0.35) SOL`, 'BID')
    await delay(500)

    // Step 3: Risk Engine
    setActiveEngine('risk')
    addLog('ENGINE', 'Risk Engine evaluating seller risk profiles...', 'RISK')
    await delay(400)

    // Step 4: Fraud Engine
    setActiveEngine('fraud')
    addLog('ENGINE', 'Fraud Engine detecting anomalies and collusion...', 'FRAUD')
    const fraudResults = sellers.map(s => analyzeFraud(s))
    setFraudAnalyses(fraudResults)
    await delay(400)

    // Step 5: Underwriting Model
    setActiveEngine('underwriting')
    addLog('ENGINE', 'Underwriting Model computing risk-adjusted pricing...', 'UNDERWRITE')
    const marketAvg = sellers.reduce((s, x) => s + x.bid, 0) / sellers.length
    const uwAnalyses = sellers.map(s => analyzeUnderwriting(s, marketAvg))
    setUnderwritingAnalyses(uwAnalyses)
    await delay(400)

    // Step 6: Underwriter Panel
    setActiveEngine('panel')
    addLog('ENGINE', 'Underwriter Panel aggregating opinions (Conservative + Aggressive + Fraud Specialist)...', 'PANEL')
    await delay(400)

    // Step 7: AWARD
    setActiveEngine('')
    setCurrentState(EscrowState.AWARD)
    const underwritingReport = deliverService({ buyerRequest, sellers })
    setReport(underwritingReport)
    addLog('AWARD', `TrustNet consensus: ${underwritingReport.recommendedSeller} recommended`, 'AWARD')
    await delay(500)

    // Step 8: Explainability
    const buyerDecision = buyerSelectSeller(buyerRequest, underwritingReport)
    setDecision(buyerDecision)
    const expl = explainDecision(underwritingReport)
    setExplanation(expl)
    addLog('SELECT', `Buyer picks ${buyerDecision.selectedSellerName} (real cost: ${buyerDecision.realCost.toFixed(2)} SOL). Cheapest bid LOST.`, 'SELECT')
    await delay(600)

    // Step 9: DEPOSITED
    setCurrentState(EscrowState.DEPOSITED)
    const depositAmount = underwritingReport.escrowPolicy.depositRequired
    addLog('DEPOSITED', `${depositAmount.toFixed(4)} SOL locked in escrow`, 'DEPOSIT')
    await delay(500)

    // Step 10: DELIVERED
    setCurrentState(EscrowState.DELIVERED)
    const delivery = deliverAsAgent(buyerDecision.selectedSellerId, buyerRequest.taskId)
    addLog('DELIVERED', delivery
      ? `${buyerDecision.selectedSellerName} submitted delivery (hash: ${delivery.deliveryHash.slice(0, 16)}...)`
      : `Seller failed to deliver (no-show)`, 'DELIVER')
    await delay(500)

    // Step 11: VERIFIED
    setCurrentState(EscrowState.VERIFIED)
    const verResult = verifyDelivery(delivery, buyerRequest.taskId)
    setVerification(verResult)
    const checksCount = [verResult.hasRiskSummary, verResult.hasVulnerabilities, verResult.hasRecommendation, verResult.hasConfidenceScore, verResult.hasDeliveryHash].filter(Boolean).length
    addLog('VERIFIED', verResult.passed
      ? `Verification PASSED (${checksCount}/5 checks). Quality gate cleared.`
      : `Verification FAILED. Triggering refund.`, 'VERIFY')
    await delay(500)

    // Step 12: Adaptive Learning
    const snapshots: LearningSnapshot[] = []
    for (const seller of sellers) {
      const event = seller.id === buyerDecision.selectedSellerId
        ? (verResult.passed ? 'verified_delivery' : 'failed_delivery')
        : (seller.id === 'cheap_agent' ? 'no_show' : 'verified_delivery')
      if (seller.id === buyerDecision.selectedSellerId || seller.id === 'cheap_agent') {
        snapshots.push(applyLearning(seller, event as 'verified_delivery' | 'failed_delivery' | 'no_show'))
      }
    }
    setLearningSnapshots(snapshots)
    addLog('LEARN', `Adaptive learning: ${snapshots.length} seller profiles updated`, 'LEARN')
    await delay(400)

    // Step 13: RELEASED / REFUND with real Solana
    if (verResult.passed) {
      setCurrentState(EscrowState.RELEASED)
      try {
        const escrowResult = await simulateEscrowFlow(buyerDecision.selectedSellerId, buyerDecision.realCost)
        setTxSignature(escrowResult.txSignature)
        setIsSimulated(escrowResult.simulated)
        setFallbackReason(escrowResult.fallbackReason)
        if (escrowResult.simulated) {
          addLog(
            'RELEASED',
            'Simulated escrow released successfully. No on-chain transaction executed.',
            'RELEASE'
          )
        } else {
          addLog(
            'RELEASED',
            `Live devnet escrow released. TX: ${escrowResult.txSignature.slice(0, 20)}...`,
            'RELEASE'
          )
        }
      } catch (err) {
        const sig = generateDemoSignature()
        // setTxSignature(sig)
        setTxSignature('')
        setIsSimulated(true)
        setFallbackReason((err as Error).message)
        addLog(
          'RELEASED',
          'Fallback simulated escrow released. No on-chain transaction executed.',
          'RELEASE'
        )
      }

      // Update explanation with verification
      const finalExpl = explainDecision(underwritingReport, verResult)
      setExplanation(finalExpl)
    } else {
      addLog('REFUND', `Escrow refunded to buyer. Seller reputation decreased.`, 'REFUND')
    }

    setIsRunning(false)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerBadge}>SOLANA x CORALOS</div>
        <h1 style={styles.title}>TrustNet X</h1>
        <p style={styles.subtitle}>Autonomous Underwriting Market for AI Agents</p>
        <p style={styles.tagline}>Pricing Trust. Underwriting Agent Economies.</p>
      </header>

      {/* One-Click Demo */}
      {!hasRun && (
        <section style={styles.demoLaunch} className="animate-in">
          <button onClick={runDemo} disabled={isRunning} style={styles.bigDemoBtn}>
            <span style={styles.btnIcon}>&#9654;</span>
            Run TrustNet Demo
          </button>
          <p style={styles.demoHint}>
            Full flow: WANT &#8594; BID &#8594; AWARD &#8594; DEPOSITED &#8594; DELIVERED &#8594; VERIFIED &#8594; RELEASED
          </p>
        </section>
      )}

      {/* Buyer Task */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>&#9733;</span> Buyer Task
        </h2>
        <div style={styles.taskCard} className="card">
          <p style={styles.taskDesc}>{buyerRequest.description}</p>
          <div style={styles.taskMeta}>
            <MetricChip label="Budget" value={`${buyerRequest.budget} SOL`} />
            <MetricChip label="Deadline" value={`${buyerRequest.deadline}s`} />
            <MetricChip label="Task ID" value={buyerRequest.taskId} />
          </div>
        </div>
      </section>

      {/* Escrow Timeline */}
      <EscrowTimeline currentState={currentState} />

      {/* Live Engine Visualization */}
      {activeEngine && (
        <section style={styles.engineViz} className="animate-fade">
          <div style={styles.engineHeader}>
            <span style={styles.engineDot} />
            <span style={styles.engineLabel}>
              {activeEngine === 'risk' && 'Risk Engine — Evaluating seller trust scores...'}
              {activeEngine === 'fraud' && 'Fraud Engine — Detecting anomalies and collusion signals...'}
              {activeEngine === 'underwriting' && 'Underwriting Model — Computing probability of failure, expected loss...'}
              {activeEngine === 'panel' && 'Underwriter Panel — Aggregating 3 opinions into consensus...'}
            </span>
          </div>
          <div style={styles.engineProgress}>
            <div style={{ ...styles.engineBar, width: activeEngine === 'panel' ? '100%' : '75%' }} />
          </div>
        </section>
      )}

      {/* Demo Log */}
      {demoLog.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>&#8801;</span> Live Progress
          </h2>
          <div style={styles.logContainer}>
            {demoLog.map((step, i) => (
              <div key={i} style={styles.logEntry} className="animate-slide">
                <span style={{
                  ...styles.logLabel,
                  color: step.label === 'ENGINE' ? '#a5b4fc' :
                    step.label === 'REFUND' ? '#ef4444' :
                      step.label === 'LEARN' ? '#fbbf24' : '#4ade80'
                }}>[{step.label}]</span>
                <span style={styles.logDetail}>{step.detail}</span>
              </div>
            ))}
            {isRunning && <span style={styles.spinner}>Processing...</span>}
          </div>
        </section>
      )}

      {/* Bid Table + Risk Report */}
      {report && (
        <div className="animate-in">
          <BidTable bids={report.bids} recommendedSeller={report.recommendedSeller} />
          <RiskReportCard
            report={report}
            fraudAnalyses={fraudAnalyses}
            underwritingAnalyses={underwritingAnalyses}
            explanation={explanation}
          />
        </div>
      )}

      {/* WOW Moment — Cost Inversion */}
      {decision && report && (
        <section style={styles.section} className="animate-in">
          <div style={styles.wowCard}>
            <div style={styles.wowBadge}>COST INVERSION</div>
            <h2 style={styles.wowTitle}>Cheapest Bid Lost Because Risk Made It More Expensive</h2>
            <div style={styles.wowComparison}>
              {report.bids.map(bid => {
                const isWinner = bid.sellerId === decision.selectedSellerId
                const isCheapest = bid.bid === Math.min(...report.bids.map(b => b.bid))
                return (
                  <div key={bid.sellerId} style={{
                    ...styles.wowSeller,
                    borderColor: isWinner ? '#4ade80' : isCheapest ? '#ef4444' : '#2d2d50',
                    background: isWinner ? 'rgba(4,120,87,0.15)' : isCheapest ? 'rgba(153,27,27,0.15)' : 'rgba(15,15,26,0.5)',
                  }}>
                    <div style={styles.wowSellerName}>
                      {bid.sellerName}
                      {isWinner && <span style={styles.wowWinnerBadge}>WINNER</span>}
                      {isCheapest && !isWinner && <span style={styles.wowLoserBadge}>CHEAPEST BID</span>}
                    </div>
                    <div style={styles.wowPriceRow}>
                      <div style={styles.wowBidPrice}>Bid: {bid.bid.toFixed(2)} SOL</div>
                      <div style={styles.wowArrow}>&#8594;</div>
                      <div style={{
                        ...styles.wowRealCost,
                        color: isWinner ? '#4ade80' : isCheapest ? '#ef4444' : '#e0e0e0',
                        fontSize: isWinner || isCheapest ? 28 : 22,
                      }}>
                        {bid.realCost.toFixed(2)} SOL
                      </div>
                    </div>
                    <div style={styles.wowDetails}>
                      Trust: {bid.trustScore}/100 | Premium: +{bid.riskPremium.toFixed(2)} | Insurance: +{bid.insuranceFee.toFixed(2)}
                    </div>
                    <div style={styles.wowRiskBar}>
                      <div style={{
                        ...styles.wowRiskFill,
                        width: `${100 - bid.trustScore}%`,
                        background: bid.riskLevel === 'HIGH' ? '#ef4444' : bid.riskLevel === 'MEDIUM' ? '#fbbf24' : '#4ade80',
                      }} />
                    </div>
                    <div style={styles.wowRiskLabel}>
                      <span className={`badge badge-${bid.riskLevel.toLowerCase()}`}>{bid.riskLevel}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Explainability */}
      {explanation && (
        <section style={styles.section} className="animate-in">
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>&#128270;</span> Decision Explainability
          </h2>
          <div style={styles.explainCard} className="card">
            <div style={styles.explainRow}>
              <div style={styles.explainLabel}>Why cheap lost:</div>
              <div style={styles.explainValue}>{explanation.whyCheapLost}</div>
            </div>
            <div style={styles.explainRow}>
              <div style={styles.explainLabel}>Why premium won:</div>
              <div style={styles.explainValue}>{explanation.whyPremiumWon}</div>
            </div>
            <div style={styles.explainRow}>
              <div style={styles.explainLabel}>Top risk factors:</div>
              <div style={styles.explainFactors}>
                {explanation.topRiskFactors.map((f, i) => (
                  <div key={i} style={styles.explainFactor}>
                    <span style={styles.factorBullet}>{i + 1}</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.explainRow}>
              <div style={styles.explainLabel}>Escrow rationale:</div>
              <div style={styles.explainValue}>{explanation.escrowRationale}</div>
            </div>
            <div style={styles.explainRow}>
              <div style={styles.explainLabel}>Settlement:</div>
              <div style={styles.explainValue}>{explanation.settlementReason}</div>
            </div>
          </div>
        </section>
      )}

      {/* Adaptive Learning */}
      {learningSnapshots.length > 0 && (
        <section style={styles.section} className="animate-in">
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>&#9889;</span> Adaptive Learning — Before vs After
          </h2>
          <div style={styles.learningGrid}>
            {learningSnapshots.map(snap => (
              <div key={snap.sellerId} style={styles.learningCard} className="card">
                <div style={styles.learningHeader}>
                  <span style={styles.learningName}>{snap.sellerName}</span>
                  <span style={{
                    ...styles.learningEvent,
                    color: snap.event === 'verified_delivery' ? '#4ade80' : '#ef4444',
                  }}>{snap.event.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div style={styles.learningMetrics}>
                  <LearningMetric label="Trust" before={snap.before.trustScore} after={snap.after.trustScore} />
                  <LearningMetric label="Reputation" before={snap.before.reputation} after={snap.after.reputation} />
                  <LearningMetric label="Risk Mult" before={snap.before.riskMultiplier} after={snap.after.riskMultiplier} precision={2} inverted />
                  <LearningMetric label="Fraud Prob" before={snap.before.fraudProbability} after={snap.after.fraudProbability} precision={2} inverted />
                  <LearningMetric label="Insurance Mult" before={snap.before.insuranceMultiplier} after={snap.after.insuranceMultiplier} precision={2} inverted />
                  <LearningMetric label="Confidence" before={snap.before.underwritingConfidence} after={snap.after.underwritingConfidence} precision={2} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Advanced Underwriting */}
      {underwritingAnalyses.length > 0 && (
        <section style={styles.section} className="animate-in">
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>&#128200;</span> Advanced Underwriting Model
          </h2>
          <div style={styles.uwGrid}>
            {underwritingAnalyses.map(uw => (
              <div key={uw.sellerId} style={{
                ...styles.uwCard,
                borderColor: uw.rejected ? '#ef4444' : uw.riskClass === 'LOW' ? '#065f46' : '#2d2d50',
              }} className="card">
                <div style={styles.uwHeader}>
                  <span style={styles.uwName}>{uw.sellerName}</span>
                  <span className={`badge badge-${uw.riskClass.toLowerCase()}`}>{uw.riskClass}</span>
                </div>
                {uw.rejected && (
                  <div style={styles.uwRejected}>REJECTED: {uw.rejectionReason}</div>
                )}
                <div style={styles.uwMetrics}>
                  <div style={styles.uwMetric}>
                    <span style={styles.uwMetricLabel}>P(Failure)</span>
                    <span style={styles.uwMetricValue}>{(uw.probabilityOfFailure * 100).toFixed(1)}%</span>
                  </div>
                  <div style={styles.uwMetric}>
                    <span style={styles.uwMetricLabel}>Expected Loss</span>
                    <span style={styles.uwMetricValue}>{uw.expectedLoss.toFixed(4)} SOL</span>
                  </div>
                  <div style={styles.uwMetric}>
                    <span style={styles.uwMetricLabel}>95% CI</span>
                    <span style={styles.uwMetricValue}>[{uw.confidenceInterval[0].toFixed(2)}, {uw.confidenceInterval[1].toFixed(2)}]</span>
                  </div>
                  <div style={styles.uwMetric}>
                    <span style={styles.uwMetricLabel}>Collateral</span>
                    <span style={styles.uwMetricValue}>{uw.dynamicCollateral.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Settlement Proof */}
      {verification && txSignature && (
        <SettlementProof
          verification={verification}
          txSignature={txSignature}
          explorerUrl={
            !isSimulated && txSignature
              ? buildExplorerUrl(txSignature)
              : undefined
          }
          isSimulated={isSimulated}
          fallbackReason={fallbackReason}
        />
      )}

      {/* Settlement Mode Banner */}
      {hasRun && (
        <section style={styles.fallbackBanner}>
          <h3 style={styles.fallbackTitle}>
            {isSimulated ? 'Demo Mode (Simulated Settlement)' : 'Live Devnet Settlement Active'}
          </h3>
          <p style={styles.fallbackText}>
            {isSimulated
              ? <>Transactions are simulated. For live devnet settlement, set <code style={styles.code}>VITE_SETTLEMENT_MODE=live</code> and <code style={styles.code}>VITE_BUYER_KEYPAIR_B58</code> in <code style={styles.code}>.env</code>, then fund via <a href="https://faucet.solana.com" style={styles.link}>faucet.solana.com</a>.</>
              : 'Connected to Solana devnet. Real transactions confirmed on-chain.'
            }
          </p>
        </section>
      )}

      {/* Judge Mode */}
      <section style={styles.judgeSection}>
        <h2 style={styles.judgeSectionTitle}>For Judges</h2>
        <div style={styles.judgeCard}>
          <JudgeItem
            label="One-Line Pitch"
            value="TrustNet X adds an underwriting layer to AI agent markets — the cheapest bid is NOT the cheapest real cost when risk is priced in."
          />
          <JudgeItem
            label="What to Click"
            value='Click "Run TrustNet Demo" above. Watch 7 engines evaluate, 3 underwriters deliberate, and the cheapest bid lose.'
          />
          <JudgeItem
            label="Expected Outcome"
            value={`CheapBot-9000 (bid 0.20 SOL) inflates to ~0.84 SOL (HIGH risk). PremiumAudit-Pro (bid 0.50) stays at ~0.51 SOL (LOW). SpeedReview-X (bid 0.35) hits ~0.56 SOL (MEDIUM). Buyer picks PremiumAudit — lowest real cost.`}
          />



          <JudgeItem
            label="Explorer Proof"
            value={
              isSimulated
                ? 'Available only in Live Devnet Mode.'
                : txSignature
                  ? undefined
                  : 'Run the demo to generate a live devnet transaction.'
            }
            link={!isSimulated && txSignature ? buildExplorerUrl(txSignature) : undefined}
            linkText="View real Solana Devnet transaction"
          />
          <JudgeItem
            label="Why Not Another Marketplace"
            value="This is infrastructure, not a marketplace. 7 deterministic engines + 3 underwriter personas form an autonomous risk panel. Zero LLM dependency. Formula: Real Cost = Bid + Risk Premium + Insurance Fee."
          />
          <JudgeItem
            label="Key Innovation"
            value="Adaptive learning updates trust after every transaction. Advanced underwriting computes probability of failure, expected loss, and dynamic collateral. Fraud specialist has veto power. Every decision is explainable."
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <button
          onClick={runDemo}
          disabled={isRunning}
          style={{ ...styles.rerunBtn, opacity: isRunning ? 0.5 : 1 }}
        >
          {isRunning ? 'Running...' : hasRun ? 'Re-run Demo' : 'Run TrustNet Demo'}
        </button>
        <p style={styles.footerText}>
          Built on <a href="https://github.com/trilltino/solana_coralOS" style={styles.link}>Solana x CoralOS</a> | Devnet Only | 7 Engines | 3 Underwriters | Zero LLM
        </p>
      </footer>
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricChip}>
      <span style={styles.metricChipLabel}>{label}</span>
      <span style={styles.metricChipValue}>{value}</span>
    </div>
  )
}

function LearningMetric({ label, before, after, precision = 0, inverted = false }: {
  label: string; before: number; after: number; precision?: number; inverted?: boolean
}) {
  const improved = inverted ? after < before : after > before
  const unchanged = Math.abs(after - before) < 0.001
  const color = unchanged ? '#6b7280' : improved ? '#4ade80' : '#ef4444'
  const arrow = unchanged ? '=' : improved ? '\u2191' : '\u2193'

  return (
    <div style={styles.learningMetric}>
      <span style={styles.learningMetricLabel}>{label}</span>
      <div style={styles.learningMetricValues}>
        <span style={styles.learningBefore}>{before.toFixed(precision)}</span>
        <span style={{ ...styles.learningArrow, color }}>{arrow}</span>
        <span style={{ ...styles.learningAfter, color }}>{after.toFixed(precision)}</span>
      </div>
    </div>
  )
}

function JudgeItem({ label, value, link, linkText }: {
  label: string; value?: string; link?: string; linkText?: string
}) {
  return (
    <div style={styles.judgeItem}>
      <strong style={styles.judgeItemLabel}>{label}:</strong>
      {value && <span style={styles.judgeItemValue}> {value}</span>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" style={styles.judgeLink}>
          {linkText || link}
        </a>
      )}
    </div>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// function generateDemoSignature(): string {
//   const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
//   let sig = ''
//   for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)]
//   return sig
// }
function generateDemoSignature(): string {
  // In simulation mode we intentionally do not generate
  // a fake blockchain transaction signature.
  return ''
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 24px',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
    paddingBottom: 32,
    borderBottom: '1px solid #1e1e35',
    position: 'relative',
  },
  headerBadge: {
    display: 'inline-block',
    padding: '4px 16px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    marginBottom: 16,
  },
  title: {
    fontSize: 56,
    fontWeight: 900,
    background: 'linear-gradient(135deg, #00d4ff, #7c3aed, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0b8',
    marginTop: 8,
    fontWeight: 400,
  },
  tagline: {
    fontSize: 14,
    color: '#6366f1',
    fontStyle: 'italic',
    marginTop: 6,
    fontWeight: 500,
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 14,
    color: '#e0e0e8',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  demoLaunch: {
    textAlign: 'center',
    marginBottom: 40,
    padding: '40px 24px',
    background: 'linear-gradient(135deg, #0f0f1a, #1a1a30)',
    borderRadius: 20,
    border: '2px solid #6366f1',
    boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)',
  },
  bigDemoBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed, #a855f7)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '20px 56px',
    fontSize: 22,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 30px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    letterSpacing: '-0.01em',
  },
  btnIcon: { fontSize: 18 },
  demoHint: {
    marginTop: 14,
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 24,
  },
  taskDesc: {
    fontSize: 16,
    color: '#f0f0f5',
    marginBottom: 16,
    lineHeight: 1.6,
  },
  taskMeta: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  metricChip: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 16px',
    background: '#0a0a14',
    borderRadius: 8,
    border: '1px solid #1e1e35',
  },
  metricChipLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  metricChipValue: {
    fontSize: 14,
    color: '#e0e0e8',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  engineViz: {
    margin: '16px 0',
    padding: '16px 20px',
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
  },
  engineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  engineDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6366f1',
    boxShadow: '0 0 8px rgba(99,102,241,0.6)',
    animation: 'dotPulse 1s ease-in-out infinite',
  },
  engineLabel: {
    fontSize: 13,
    color: '#a5b4fc',
    fontFamily: "'JetBrains Mono', monospace",
  },
  engineProgress: {
    height: 3,
    background: '#1e1e35',
    borderRadius: 2,
    overflow: 'hidden',
  },
  engineBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    borderRadius: 2,
    transition: 'width 0.5s ease',
  },
  logContainer: {
    background: '#0a0a12',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 20,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    maxHeight: 280,
    overflowY: 'auto',
  },
  logEntry: {
    marginBottom: 6,
    lineHeight: 1.7,
    display: 'flex',
    gap: 8,
  },
  logLabel: {
    color: '#4ade80',
    fontWeight: 700,
    minWidth: 80,
    flexShrink: 0,
  },
  logDetail: { color: '#d1d5db' },
  spinner: {
    color: '#6366f1',
    fontSize: 12,
    fontStyle: 'italic',
  },
  // WOW Card
  wowCard: {
    background: 'linear-gradient(135deg, #0f0f1a, #1a0a2e)',
    border: '2px solid #7c3aed',
    borderRadius: 20,
    padding: 32,
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(124, 58, 237, 0.15)',
  },
  wowBadge: {
    display: 'inline-block',
    padding: '4px 16px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.15em',
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.15)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    marginBottom: 16,
  },
  wowTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f0f0f5',
    marginBottom: 28,
    letterSpacing: '-0.01em',
  },
  wowComparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  wowSeller: {
    padding: 24,
    borderRadius: 16,
    border: '2px solid',
    textAlign: 'left',
    transition: 'all 0.3s ease',
  },
  wowSellerName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  wowWinnerBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    color: '#4ade80',
    background: 'rgba(4,120,87,0.4)',
    border: '1px solid rgba(74,222,128,0.3)',
  },
  wowLoserBadge: {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    color: '#fca5a5',
    background: 'rgba(153,27,27,0.4)',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  wowPriceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  wowBidPrice: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: "'JetBrains Mono', monospace",
  },
  wowArrow: {
    fontSize: 16,
    color: '#6b7280',
  },
  wowRealCost: {
    fontWeight: 800,
    fontFamily: "'JetBrains Mono', monospace",
  },
  wowDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  wowRiskBar: {
    height: 6,
    background: '#1e1e35',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  wowRiskFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 1s ease-out',
  },
  wowRiskLabel: {
    textAlign: 'right',
  },
  // Explainability
  explainCard: {
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  explainRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  explainLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    minWidth: 140,
    flexShrink: 0,
  },
  explainValue: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 1.6,
  },
  explainFactors: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  explainFactor: {
    fontSize: 13,
    color: '#d1d5db',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  factorBullet: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'rgba(99,102,241,0.2)',
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Adaptive Learning
  learningGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  learningCard: {
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 20,
  },
  learningHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  learningName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e0e8',
  },
  learningEvent: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  learningMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  learningMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learningMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  learningMetricValues: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
  },
  learningBefore: { color: '#9ca3af' },
  learningArrow: { fontSize: 12, fontWeight: 700 },
  learningAfter: { fontWeight: 700 },
  // Underwriting Model
  uwGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  uwCard: {
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 20,
  },
  uwHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  uwName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e0e8',
  },
  uwRejected: {
    padding: '8px 12px',
    background: 'rgba(153,27,27,0.3)',
    borderRadius: 8,
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 12,
  },
  uwMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  uwMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  uwMetricLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  },
  uwMetricValue: {
    fontSize: 14,
    color: '#e0e0e8',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  // Fallback
  fallbackBanner: {
    background: '#1a1a0a',
    border: '1px solid #ca8a04',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  fallbackTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
  },
  fallbackText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  code: {
    background: '#1e1e35',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  },
  // Judge Section
  judgeSection: {
    marginTop: 48,
    marginBottom: 32,
    background: 'linear-gradient(135deg, #0f0f1a, #0a1a0a)',
    border: '2px solid rgba(74, 222, 128, 0.4)',
    borderRadius: 20,
    padding: 32,
    boxShadow: '0 0 40px rgba(74, 222, 128, 0.08)',
  },
  judgeSectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#4ade80',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  judgeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  judgeItem: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#d1d5db',
  },
  judgeItemLabel: {
    color: '#a5b4fc',
  },
  judgeItemValue: {},
  judgeLink: {
    display: 'inline-block',
    marginLeft: 8,
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
  // Footer
  footer: {
    textAlign: 'center',
    marginTop: 48,
    paddingTop: 32,
    borderTop: '1px solid #1e1e35',
  },
  rerunBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 16,
    transition: 'all 0.3s ease',
  },
  footerText: {
    fontSize: 13,
    color: '#4b5563',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
  },
}
