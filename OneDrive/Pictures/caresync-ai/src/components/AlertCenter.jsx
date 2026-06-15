import React, { useState } from 'react';
import { AlertOctagon, Volume2, VolumeX, ShieldAlert, Check, Radio, Send, BellRing } from 'lucide-react';

export default function AlertCenter({ alerts, onResolveAlert, onAddNotification }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [escalationTarget, setEscalationTarget] = useState('All Stations');
  const [selectedAlertForEscalation, setSelectedAlertForEscalation] = useState(null);

  // sound alarm play helper using Web Audio API
  const playAlarmBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          setTimeout(() => osc2.stop(), 120);
        }, 80);
      }, 120);
    } catch (e) {
      console.warn("AudioContext block by browser auto-play policy.", e);
    }
  };

  React.useEffect(() => {
    const hasCritical = alerts.some(a => a.type === 'Critical');
    if (hasCritical && soundEnabled) {
      const interval = setInterval(() => {
        playAlarmBeep();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [alerts, soundEnabled]);

  const handleEscalate = (alert) => {
    onAddNotification({
      id: `NOTIFY-${Date.now()}`,
      title: `EMERGENCY ESCALATION: ${alert.patientName}`,
      desc: `Critical alert escalated to: ${escalationTarget}. Immediate response required in ${alert.vessel}.`,
      type: 'danger'
    });
    alert.escalated = true;
    setSelectedAlertForEscalation(null);
  };

  return (
    <div style={styles.container}>
      {/* Sound Controller panel */}
      <div className="glass-panel" style={styles.topPanel}>
        <div style={styles.audioControls}>
          <div style={styles.audioMeta}>
            <Radio size={22} color={alerts.length > 0 ? 'var(--emergency-crimson)' : 'var(--recovery-mint)'} className={alerts.length > 0 ? 'heartbeat-pulse' : ''} />
            <div>
              <h3 style={styles.audioTitle}>Audio Alarm Broadcast</h3>
              <p style={styles.audioDesc}>Automatic audio alerts for critical vitals desaturations.</p>
            </div>
          </div>
          <button 
            className="btn-glass" 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                setTimeout(() => {
                  try {
                    const actx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = actx.createOscillator();
                    osc.connect(actx.destination);
                    osc.start();
                    osc.stop(0.05);
                  } catch(err){}
                }, 50);
              }
            }}
            style={{
              borderColor: soundEnabled ? 'var(--cyan-pulse)' : 'var(--border-glass)',
              color: soundEnabled ? 'var(--cyan-pulse)' : 'var(--text-muted)'
            }}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{soundEnabled ? 'ALARMS UNMUTED' : 'UNMUTE ALARMS'}</span>
          </button>
        </div>
      </div>

      <div style={styles.alertDashboardGrid}>
        {/* Alerts List */}
        <div className="glass-panel" style={styles.listPanel}>
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={20} color="var(--emergency-crimson)" />
              <h3 style={styles.panelTitle}>Active Clinical Alerts</h3>
            </div>
            <span style={styles.alertsCount}>{alerts.length} Warnings Active</span>
          </div>

          <div style={styles.alertsList}>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="glass-panel" 
                  style={{ 
                    ...styles.alertCard,
                    borderLeft: `4px solid ${alert.type === 'Critical' ? 'var(--emergency-crimson)' : 'var(--royal-gold)'}`
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <strong style={styles.patientName}>{alert.patientName}</strong>
                      <span style={styles.bedMeta}>{alert.vessel}</span>
                    </div>
                    <span className={`badge ${alert.type === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                      {alert.type}
                    </span>
                  </div>

                  <div style={styles.cardTelemetry}>
                    <div>
                      <span style={styles.telemetryLabel}>VIOLATION METRIC</span>
                      <strong style={styles.telemetryVal}>{alert.metric}</strong>
                    </div>
                    <div>
                      <span style={styles.telemetryLabel}>VALUE RECORDED</span>
                      <strong style={{ ...styles.telemetryVal, color: alert.type === 'Critical' ? 'var(--emergency-crimson)' : 'var(--royal-gold)' }}>
                        {alert.value}
                      </strong>
                    </div>
                    <div>
                      <span style={styles.telemetryLabel}>THRESHOLD LIMIT</span>
                      <span style={styles.telemetryVal}>{alert.threshold}</span>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button 
                      className="btn-glass" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => onResolveAlert(alert.id)}
                    >
                      <Check size={12} color="var(--recovery-mint)" /> Acknowledge & Resolve
                    </button>
                    
                    <button 
                      className="btn-glass btn-glass-danger" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => setSelectedAlertForEscalation(alert)}
                    >
                      <BellRing size={12} /> Escalate Emergency
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyAlerts}>
                <Check size={36} color="var(--recovery-mint)" style={{ marginBottom: '10px' }} />
                <h4>No active warnings</h4>
                <p>All monitored patient telemetry is within standard clinical safety ranges.</p>
              </div>
            )}
          </div>
        </div>

        {/* Escalation Center */}
        <div className="glass-panel" style={styles.escalationPanel}>
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--cyan-pulse)" />
              <h3 style={styles.panelTitle}>ER Triage Escalation</h3>
            </div>
          </div>

          {selectedAlertForEscalation ? (
            <div style={styles.escalateForm}>
              <div style={styles.formRow}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PATIENT TO ESCALATE</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedAlertForEscalation.patientName} ({selectedAlertForEscalation.vessel})</strong>
              </div>

              <div style={styles.formRow}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ALERT CAUSE</span>
                <strong style={{ color: 'var(--emergency-crimson)' }}>{selectedAlertForEscalation.metric}: {selectedAlertForEscalation.value}</strong>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>DISPATCH RESPONSE CHANNEL</label>
                <select 
                  value={escalationTarget} 
                  onChange={(e) => setEscalationTarget(e.target.value)} 
                  style={styles.select}
                >
                  <option value="All Stations">Broad Cast to All Stations</option>
                  <option value="ICU Triage Unit">ICU Emergency Resident Team</option>
                  <option value="Cardiology Specialist Call">On-Duty Cardiologist Pager</option>
                  <option value="Anesthesia Resident Line">Anesthesia Rapid Response</option>
                </select>
              </div>

              <div style={styles.escalateActions}>
                <button 
                  className="btn-glass" 
                  onClick={() => setSelectedAlertForEscalation(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-glass btn-glass-danger" 
                  onClick={() => handleEscalate(selectedAlertForEscalation)}
                  style={{ flex: 2 }}
                >
                  <Send size={14} /> Send Dispatch Now
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.emptyEscalate}>
              <AlertOctagon size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <h4>Escalation Standby</h4>
              <p>Select "Escalate Emergency" on any active alert card to dispatch rapid response teams.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topPanel: {
    padding: '20px 24px',
    background: 'var(--bg-card)',
  },
  audioControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  audioMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  audioTitle: {
    fontSize: '1rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  audioDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  alertDashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '24px',
  },
  listPanel: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  escalationPanel: {
    padding: '24px',
    background: 'var(--bg-card)',
    height: 'fit-content',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  panelTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-main)',
  },
  alertsCount: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  alertCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.01)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  patientName: {
    fontSize: '0.95rem',
    color: 'var(--text-main)',
    fontWeight: '700',
  },
  bedMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginLeft: '8px',
  },
  cardTelemetry: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '12px',
    background: 'rgba(255,255,255,0.02)',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
    marginBottom: '15px',
  },
  telemetryLabel: {
    display: 'block',
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  telemetryVal: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginTop: '2px',
    display: 'block',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
  },
  emptyAlerts: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  escalateForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  select: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    padding: '10px 12px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
  },
  escalateActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  emptyEscalate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  }
};
export { styles as alertStyles };
