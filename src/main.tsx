import React from 'react'
import ReactDOM from 'react-dom/client'
import './ui/styles.css'
import { TrustNetDashboard } from './ui/TrustNetDashboard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TrustNetDashboard />
  </React.StrictMode>,
)
