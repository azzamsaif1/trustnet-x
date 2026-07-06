import React from 'react'
import type { SellerBidReport } from '../types/trustnet'

interface BidTableProps {
  bids: SellerBidReport[]
  recommendedSeller: string
}

export function BidTable({ bids, recommendedSeller }: BidTableProps) {
  const cheapest = [...bids].sort((a, b) => a.bid - b.bid)[0]

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>
        <span style={styles.icon}>&#9733;</span> Seller Bids — Risk-Adjusted
      </h2>
      <div style={styles.callout}>
        <span style={styles.calloutIcon}>&#9888;</span>
        Cheapest bid lost because risk made it more expensive.
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Seller</th>
              <th style={styles.th}>Bid (SOL)</th>
              <th style={styles.th}>Trust Score</th>
              <th style={styles.th}>Risk Premium</th>
              <th style={styles.th}>Insurance Fee</th>
              <th style={styles.th}>Real Cost</th>
              <th style={styles.th}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(bid => {
              const isRecommended = bid.sellerId === recommendedSeller
              const isCheapestBid = bid.sellerId === cheapest.sellerId && !isRecommended
              return (
                <tr
                  key={bid.sellerId}
                  style={{
                    ...styles.row,
                    ...(isRecommended ? styles.recommendedRow : {}),
                    ...(isCheapestBid ? styles.expensiveRow : {}),
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.sellerCell}>
                      <span style={styles.sellerName}>{bid.sellerName}</span>
                      {isRecommended && <span className="badge badge-selected">SELECTED</span>}
                      {isCheapestBid && <span className="badge badge-cheapest">CHEAPEST BID</span>}
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace" }}>{bid.bid.toFixed(2)}</td>
                  <td style={styles.td}>
                    <div style={styles.trustCell}>
                      <span style={{ color: getScoreColor(bid.trustScore), fontWeight: 700 }}>
                        {bid.trustScore}
                      </span>
                      <span style={styles.trustMax}>/100</span>
                      <div style={styles.trustBar}>
                        <div style={{
                          ...styles.trustBarFill,
                          width: `${bid.trustScore}%`,
                          background: getScoreColor(bid.trustScore),
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      color: bid.riskPremium > 0.1 ? '#ef4444' : '#4ade80',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                    }}>
                      +{bid.riskPremium.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace" }}>
                    +{bid.insuranceFee.toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isCheapestBid ? '#ef4444' : isRecommended ? '#4ade80' : '#e0e0e8',
                    }}>
                      {bid.realCost.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>SOL</span>
                  </td>
                  <td style={styles.td}>
                    <span className={`badge badge-${bid.riskLevel.toLowerCase()}`}>
                      {bid.riskLevel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#4ade80'
  if (score >= 45) return '#fbbf24'
  return '#ef4444'
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
  callout: {
    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    borderRadius: 10,
    padding: '14px 20px',
    marginBottom: 16,
    fontSize: 15,
    fontWeight: 700,
    color: '#a5b4fc',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  calloutIcon: { fontSize: 18 },
  tableContainer: {
    overflowX: 'auto',
    background: '#12121e',
    borderRadius: 14,
    border: '1px solid #1e1e35',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    borderBottom: '2px solid #2d2d50',
    color: '#6b7280',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  row: {
    borderBottom: '1px solid #1e1e35',
    transition: 'background 0.2s ease',
  },
  recommendedRow: {
    background: 'rgba(4, 120, 87, 0.12)',
    borderLeft: '3px solid #4ade80',
  },
  expensiveRow: {
    background: 'rgba(153, 27, 27, 0.12)',
    borderLeft: '3px solid #ef4444',
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  },
  sellerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: { fontWeight: 600 },
  trustCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  trustMax: { fontSize: 11, color: '#4b5563' },
  trustBar: {
    width: 60,
    height: 4,
    background: '#1e1e35',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 6,
  },
  trustBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.8s ease-out',
  },
}
