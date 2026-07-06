import React from 'react'
import { EscrowState } from '../types/trustnet'

interface EscrowTimelineProps {
  currentState: EscrowState
}

const STATES: EscrowState[] = [
  EscrowState.WANT,
  EscrowState.BID,
  EscrowState.AWARD,
  EscrowState.DEPOSITED,
  EscrowState.DELIVERED,
  EscrowState.VERIFIED,
  EscrowState.RELEASED,
]

const STATE_LABELS: Record<string, string> = {
  WANT: 'Task Posted',
  BID: 'Bids In',
  AWARD: 'Evaluated',
  DEPOSITED: 'Escrowed',
  DELIVERED: 'Delivered',
  VERIFIED: 'Verified',
  RELEASED: 'Released',
}

export function EscrowTimeline({ currentState }: EscrowTimelineProps) {
  const currentIdx = STATES.indexOf(currentState)

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>
        <span style={styles.icon}>&#8594;</span> Escrow Flow — 7-Step State Machine
      </h2>
      <div style={styles.timeline}>
        {STATES.map((state, idx) => {
          const isActive = idx === currentIdx
          const isPast = idx < currentIdx
          const isFuture = idx > currentIdx

          return (
            <React.Fragment key={state}>
              <div style={{
                ...styles.step,
                ...(isFuture ? { opacity: 0.3 } : {}),
              }}>
                <div style={{
                  ...styles.dot,
                  ...(isActive ? styles.dotActive : {}),
                  ...(isPast ? styles.dotPast : {}),
                }} />
                <span style={{
                  ...styles.stateLabel,
                  ...(isActive ? styles.stateLabelActive : {}),
                  ...(isPast ? styles.stateLabelPast : {}),
                }}>
                  {state}
                </span>
                <span style={{
                  ...styles.subLabel,
                  ...(isActive ? { color: '#a5b4fc' } : {}),
                  ...(isPast ? { color: '#4ade80', opacity: 0.7 } : {}),
                }}>
                  {STATE_LABELS[state]}
                </span>
              </div>
              {idx < STATES.length - 1 && (
                <div style={{
                  ...styles.connector,
                  ...(isPast ? styles.connectorPast : {}),
                  ...(isActive ? styles.connectorActive : {}),
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </section>
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
  timeline: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    background: '#12121e',
    border: '1px solid #1e1e35',
    borderRadius: 14,
    padding: '28px 24px 20px',
    overflowX: 'auto',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    minWidth: 75,
    transition: 'opacity 0.4s ease',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#2d2d50',
    border: '2px solid #4b5563',
    transition: 'all 0.4s ease',
  },
  dotActive: {
    width: 20,
    height: 20,
    background: '#6366f1',
    border: '3px solid #a5b4fc',
    boxShadow: '0 0 16px rgba(99, 102, 241, 0.6)',
    animation: 'dotPulse 1.5s ease-in-out infinite',
  },
  dotPast: {
    background: '#4ade80',
    border: '2px solid #065f46',
    boxShadow: '0 0 8px rgba(74, 222, 128, 0.3)',
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily: "'JetBrains Mono', monospace",
  },
  stateLabelActive: {
    color: '#a5b4fc',
    fontSize: 12,
  },
  stateLabelPast: {
    color: '#4ade80',
  },
  subLabel: {
    fontSize: 9,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  connector: {
    flex: 1,
    height: 2,
    background: '#2d2d50',
    minWidth: 16,
    marginTop: 8,
    borderRadius: 1,
    transition: 'background 0.4s ease',
  },
  connectorPast: {
    background: 'linear-gradient(90deg, #4ade80, #4ade80)',
  },
  connectorActive: {
    background: 'linear-gradient(90deg, #4ade80, #6366f1)',
  },
}
