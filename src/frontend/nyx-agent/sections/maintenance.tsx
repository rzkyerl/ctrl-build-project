import { Link } from 'react-router-dom'
import '../styles/css/nyx-agent.css'
import '../styles/css/nyx-maintenance.css'

export function NyxMaintenance() {
  return (
    <div className="nyx-root">
      <div className="nyx-maintenance">

        {/* ── Corner labels ── */}
        <span className="nyx-maintenance-corner nyx-maintenance-corner--tl">
          NYX AGENT
        </span>
        <span className="nyx-maintenance-corner nyx-maintenance-corner--tr">
          CTRL BUILD
        </span>
        <span className="nyx-maintenance-corner nyx-maintenance-corner--bl">
          STATUS · UNDER MAINTENANCE
        </span>
        <span className="nyx-maintenance-corner nyx-maintenance-corner--br">
          CHAT · OFFLINE
        </span>

        {/* ── Main content ── */}
        <div className="nyx-maintenance-content">

          {/* Title */}
          <h1 className="nyx-maintenance-title">
            UNDER<span>MAINTENANCE</span>
          </h1>

          {/* Divider */}
          <div className="nyx-maintenance-divider" />

          {/* Description */}
          <p className="nyx-maintenance-desc">
            Nyx Agent Chat is currently undergoing maintenance and improvements.
            We're working hard to bring the AI Chat service back online
            as soon as possible. Please check back again shortly.
          </p>

          {/* Terminal log block */}
          <div className="nyx-maintenance-terminal">
            <div className="nyx-maintenance-terminal-header">
              <span className="nyx-maintenance-terminal-dot" />
              <span className="nyx-maintenance-terminal-dot" />
              <span className="nyx-maintenance-terminal-dot" />
              <span className="nyx-maintenance-terminal-title">nyx-agent · maintenance log</span>
            </div>
            <div className="nyx-maintenance-log">
              <div className="nyx-maintenance-log-line">
                <span className="nyx-maintenance-log-prefix">$</span>
                <span>service status: <strong className="nyx-maintenance-log-val">OFFLINE</strong></span>
              </div>
              <div className="nyx-maintenance-log-line">
                <span className="nyx-maintenance-log-prefix">$</span>
                <span>chat.ctrl-build.my.id → unreachable</span>
              </div>
              <div className="nyx-maintenance-log-line">
                <span className="nyx-maintenance-log-prefix">$</span>
                <span>running system diagnostics...</span>
              </div>
              <div className="nyx-maintenance-log-line">
                <span className="nyx-maintenance-log-prefix">$</span>
                <span>applying patches &amp; improvements...</span>
              </div>
              <div className="nyx-maintenance-log-line nyx-maintenance-log-line--active">
                <span className="nyx-maintenance-log-prefix">$</span>
                <span>
                  restoring service
                  <span className="nyx-maintenance-log-cursor" />
                </span>
              </div>
            </div>
          </div>

          {/* Back link */}
          <Link to="/nyx-agent" className="nyx-maintenance-back">
            <span className="nyx-maintenance-back-arrow">←</span>
            Back to Nyx Agent
          </Link>
        </div>

        {/* ── Background oversized text ── */}
        <div className="nyx-maintenance-oversized" aria-hidden="true">
          MAINTENANCE
        </div>

      </div>
    </div>
  )
}
