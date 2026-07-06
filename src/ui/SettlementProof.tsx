import React from 'react'
import type { VerificationResult } from '../types/trustnet'

interface SettlementProofProps {
  verification: VerificationResult
  txSignature?: string
  explorerUrl?: string
  isSimulated?: boolean
  fallbackReason?: string
}

export function SettlementProof({ verification, txSignature, explorerUrl, isSimulated = true, fallbackReason }: SettlementProofProps) {
  const canShowExplorer =
    !isSimulated &&
    Boolean(txSignature) &&
    Boolean(explorerUrl) &&
    explorerUrl?.includes('explorer.solana.com/tx/') === true
  return (
    <section style={styles.section}>
      <h2 style={styles.title}>
        <span style={styles.icon}>&#128274;</span> Settlement Proof
      </h2>
      <div style={styles.card}>
        <div style={styles.verificationSection}>
          <h3 style={styles.subTitle}>Verification Result</h3>
          <div style={{
            ...styles.statusBadge,
            background: verification.passed ? 'rgba(4,120,87,0.3)' : 'rgba(153,27,27,0.3)',
            color: verification.passed ? '#4ade80' : '#fca5a5',
            borderColor: verification.passed ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)',
          }}>
            {verification.passed ? 'VERIFIED \u2014 RELEASE' : 'FAILED \u2014 REFUND'}
          </div>
          <p style={styles.reason}>{verification.reason}</p>

          <div style={styles.checksGrid}>
            <CheckItem label="Risk Summary" passed={verification.hasRiskSummary} />
            <CheckItem label="Vulnerabilities" passed={verification.hasVulnerabilities} />
            <CheckItem label="Recommendation" passed={verification.hasRecommendation} />
            <CheckItem label="Confidence Score" passed={verification.hasConfidenceScore} />
            <CheckItem label="Delivery Hash" passed={verification.hasDeliveryHash} />
          </div>
        </div>

        {verification.passed && (
          <>
            <div style={styles.divider} />
            <div style={styles.txSection}>
              <h3 style={styles.subTitle}>
                Solana Devnet Settlement
                <span style={{
                  ...styles.modeBadge,
                  background: isSimulated ? 'rgba(251,191,36,0.15)' : 'rgba(74,222,128,0.15)',
                  color: isSimulated ? '#fbbf24' : '#4ade80',
                  borderColor: isSimulated ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)',
                }}>
                  {isSimulated ? 'SIMULATED' : 'LIVE DEVNET'}
                </span>
              </h3>

              {isSimulated ? (
                /* --- SIMULATED MODE: no Explorer link --- */
                <div style={styles.simulatedBox}>
                  <p style={styles.simulatedText}>
                    Simulated settlement &mdash; Explorer proof available only in Live Devnet Mode.
                  </p>
                  {fallbackReason && (
                    <p style={styles.fallbackReason}>
                      Reason: {fallbackReason}
                    </p>
                  )}
                  <div style={styles.setupHint}>
                    <p style={styles.setupTitle}>Enable Live Devnet Mode:</p>
                    <ol style={styles.setupSteps}>
                      <li>Generate wallet: <code style={styles.inlineCode}>solana-keygen new --outfile ~/.config/solana/devnet-wallet.json</code></li>
                      <li>Fund wallet: <code style={styles.inlineCode}>solana airdrop 2</code></li>
                      <li>Set in <code style={styles.inlineCode}>.env</code>: <code style={styles.inlineCode}>VITE_SETTLEMENT_MODE=live</code> and <code style={styles.inlineCode}>VITE_BUYER_KEYPAIR_B58=...</code></li>
                      <li>Restart dev server</li>
                    </ol>
                  </div>
                </div>
              ) : (
                /* --- LIVE MODE: real Explorer link --- */
                <>
                  <div style={styles.txHash}>
                    <span style={styles.txLabel}>TX Signature:</span>
                    <code style={styles.txCode}>
                      {txSignature ? `${txSignature.slice(0, 32)}...${txSignature.slice(-8)}` : 'No signature'}
                    </code>
                  </div>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.explorerLink}
                  >
                    View on Solana Explorer (devnet) &#8594;
                  </a>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div style={styles.checkItem}>
      <span style={{
        ...styles.checkIcon,
        color: passed ? '#4ade80' : '#ef4444',
        background: passed ? 'rgba(4,120,87,0.2)' : 'rgba(153,27,27,0.2)',
      }}>
        {passed ? '\u2713' : '\u2717'}
      </span>
      <span style={{ color: passed ? '#d1d5db' : '#6b7280' }}>{label}</span>
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
  verificationSection: {},
  subTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#a5b4fc',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  modeBadge: {
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.08em',
    border: '1px solid',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 14,
    border: '1px solid',
    letterSpacing: '0.04em',
  },
  reason: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 1.6,
    marginBottom: 18,
  },
  checksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
  },
  checkItem: {
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: '#1e1e35',
    margin: '24px 0',
  },
  txSection: {},
  txHash: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  txLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
  },
  txCode: {
    fontSize: 12,
    background: '#0a0a14',
    padding: '6px 12px',
    borderRadius: 6,
    color: '#a5b4fc',
    fontFamily: "'JetBrains Mono', monospace",
    border: '1px solid #1e1e35',
  },
  explorerLink: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 14,
    transition: 'all 0.3s ease',
  },
  // Simulated mode
  simulatedBox: {
    background: '#0a0a14',
    border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 10,
    padding: 20,
  },
  simulatedText: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 600,
    marginBottom: 8,
  },
  fallbackReason: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  setupHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #1e1e35',
  },
  setupTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  setupSteps: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 2,
    paddingLeft: 18,
    margin: 0,
  },
  inlineCode: {
    background: '#1e1e35',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
}
