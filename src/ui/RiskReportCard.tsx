import React from 'react'
import type { UnderwritingReport } from '../types/trustnet'
import type { FraudAnalysis } from '../engines/fraud-engine'
import type { UnderwritingAnalysis } from '../engines/underwriting-model'
import type { DecisionExplanation } from '../engines/explainability-engine'

interface RiskReportCardProps {
  report: UnderwritingReport
  fraudAnalyses?: FraudAnalysis[]
  underwritingAnalyses?: UnderwritingAnalysis[]
  explanation?: DecisionExplanation | null
}

export function RiskReportCard({ report, fraudAnalyses }: RiskReportCardProps) {
  return (
    <section style={styles.section}>
      <h2 style={styles.title}>
        <span style={styles.icon}>&#128220;</span> Underwriting Decision
      </h2>
      <div style={styles.card}>
        <div style={styles.decision}>
          <span style={styles.label}>Recommended Seller:</span>
          <span style={styles.value}>{report.recommendedSeller}</span>
        </div>
        <div style={styles.reason}>
          <span style={styles.label}>Reason:</span>
          <p style={styles.reasonText}>{report.reason}</p>
        </div>

        <div style={styles.divider} />

        <h3 style={styles.subTitle}>Escrow Policy</h3>
        <div style={styles.policyGrid}>
          <PolicyChip label="Deposit Required" value={`${report.escrowPolicy.depositRequired.toFixed(4)} SOL`} />
          <PolicyChip label="Verification Level" value={report.escrowPolicy.verificationLevel} highlight />
          <PolicyChip label="Deadline" value={`${report.escrowPolicy.deadlineSecs}s`} />
        </div>
        <div style={styles.conditions}>
          <p><strong style={{ color: '#4ade80' }}>Release:</strong> {report.escrowPolicy.releaseCondition}</p>
          <p><strong style={{ color: '#ef4444' }}>Refund:</strong> {report.escrowPolicy.refundCondition}</p>
        </div>

        <div style={styles.divider} />

        <h3 style={styles.subTitle}>Underwriter Panel ({report.underwriterOpinions.length} opinions)</h3>
        <div style={styles.opinions}>
          {report.underwriterOpinions.map(opinion => (
            <div key={opinion.underwriterId} style={styles.opinionCard}>
              <div style={styles.opinionHeader}>
                <span style={styles.opinionName}>{opinion.name}</span>
                <div style={styles.confidenceBar}>
                  <div style={{
                    ...styles.confidenceFill,
                    width: `${opinion.confidence * 100}%`,
                  }} />
                  <span style={styles.confidenceText}>{(opinion.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p style={styles.opinionReasoning}>{opinion.reasoning}</p>
              <span style={styles.opinionRecommends}>
                Recommends: <strong style={{ color: '#a5b4fc' }}>{opinion.recommendedSellerId}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* Fraud Analysis Summary */}
        {fraudAnalyses && fraudAnalyses.length > 0 && (
          <>
            <div style={styles.divider} />
            <h3 style={styles.subTitle}>Fraud Intelligence</h3>
            <div style={styles.fraudGrid}>
              {fraudAnalyses.map((fa, i) => (
                <div key={i} style={{
                  ...styles.fraudItem,
                  borderColor: fa.vetoTriggered ? '#ef4444' : fa.fraudRiskScore > 30 ? '#fbbf24' : '#1e1e35',
                }}>
                  <div style={styles.fraudHeader}>
                    <span style={styles.fraudScore}>
                      <span style={{ color: fa.fraudRiskScore > 50 ? '#ef4444' : fa.fraudRiskScore > 20 ? '#fbbf24' : '#4ade80' }}>
                        {fa.fraudRiskScore}
                      </span>/100
                    </span>
                    {fa.vetoTriggered && <span style={styles.vetoTag}>VETO</span>}
                  </div>
                  {fa.fraudSignals.length > 0 && (
                    <div style={styles.fraudSignals}>
                      {fa.fraudSignals.map((sig, j) => (
                        <div key={j} style={styles.fraudSignal}>{sig}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function PolicyChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.policyItem}>
      <span style={styles.policyLabel}>{label}</span>
      <span style={{
        ...styles.policyValue,
        ...(highlight ? { color: '#a5b4fc' } : {}),
      }}>{value}</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 32 },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 14,
    color: '#e0e0e8',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: 16, opacity: 0.7 },
  card: {
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: 28,
  },
  decision: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  value: {
    fontSize: 20,
    fontWeight: 800,
    color: '#4ade80',
  },
  reason: { marginBottom: 16 },
  reasonText: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
    lineHeight: 1.6,
  },
  divider: {
    height: 1,
    background: '#1e1e35',
    margin: '24px 0',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#a5b4fc',
    marginBottom: 14,
  },
  policyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 16,
  },
  policyItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 14px',
    background: '#0a0a14',
    borderRadius: 8,
    border: '1px solid #1e1e35',
  },
  policyLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  policyValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e0e8',
    fontFamily: "'JetBrains Mono', monospace",
  },
  conditions: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.9,
  },
  opinions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  opinionCard: {
    background: '#0a0a14',
    border: '1px solid #1e1e35',
    borderRadius: 10,
    padding: 18,
  },
  opinionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  opinionName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e0e0e8',
  },
  confidenceBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  confidenceFill: {
    height: 4,
    borderRadius: 2,
    background: '#6366f1',
    minWidth: 40,
  },
  confidenceText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  opinionReasoning: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  opinionRecommends: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Fraud
  fraudGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 12,
  },
  fraudItem: {
    padding: 14,
    background: '#0a0a14',
    borderRadius: 10,
    border: '1px solid #1e1e35',
  },
  fraudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fraudScore: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#6b7280',
  },
  vetoTag: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    color: '#fca5a5',
    background: 'rgba(153,27,27,0.5)',
    border: '1px solid rgba(239,68,68,0.3)',
    letterSpacing: '0.1em',
  },
  fraudSignals: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fraudSignal: {
    fontSize: 11,
    color: '#9ca3af',
    paddingLeft: 8,
    borderLeft: '2px solid #2d2d50',
    lineHeight: 1.5,
  },
}
