import React, { useState } from 'react';
import { Home, Compass, UserCheck, Flame, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { mockDepartments, mockDoctors } from '../mockData';

export default function CommandCenter({ onAddNotification }) {
  const [departments, setDepartments] = useState(mockDepartments);
  const [doctors, setDoctors] = useState(mockDoctors);
  const [activeDrill, setActiveDrill] = useState(false);
  const [codeBlueActive, setCodeBlueActive] = useState(false);

  const toggleDoctorStatus = (docId) => {
    setDoctors(prev => 
      prev.map(d => d.id === docId ? { ...d, status: d.status === 'Online' ? 'Offline' : 'Online' } : d)
    );
  };

  const triggerEmergencyDrill = () => {
    setActiveDrill(!activeDrill);
    if (!activeDrill) {
      onAddNotification({
        id: `NOTIFY-${Date.now()}`,
        title: "SYSTEM DRILL INITIALIZED",
        desc: "Hospital-wide trauma drill initiated. Verify active emergency alert status.",
        type: "warning"
      });
    } else {
      onAddNotification({
        id: `NOTIFY-${Date.now()}`,
        title: "SYSTEM DRILL TERMINATED",
        desc: "Trauma drill complete. Restoring normal tracking profiles.",
        type: "success"
      });
    }
  };

  const triggerCodeBlue = () => {
    setCodeBlueActive(!codeBlueActive);
    if (!codeBlueActive) {
      onAddNotification({
        id: `NOTIFY-CODEBLUE-${Date.now()}`,
        title: "CRITICAL ALERT: CODE BLUE DISPATCHED",
        desc: "Cardiac arrest team dispatched to ICU Section A. General warning alarms active.",
        type: "danger"
      });
    }
  };

  const increaseDeptLoad = (deptName) => {
    setDepartments(prev => 
      prev.map(d => {
        if (d.name === deptName) {
          const newOccupied = Math.min(d.capacity, d.occupied + 1);
          const loadRatio = newOccupied / d.capacity;
          return {
            ...d,
            occupied: newOccupied,
            status: loadRatio >= 0.95 ? 'CRITICAL LOAD' : loadRatio >= 0.85 ? 'High Load' : 'Optimal'
          };
        }
        return d;
      })
    );
  };

  return (
    <div style={styles.container}>
      {codeBlueActive && (
        <div style={styles.codeBlueOverlay}>
          <Flame size={48} className="heartbeat-pulse" color="#fff" />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '2rem', letterSpacing: '0.1em' }}>CODE BLUE EMERGENCY BROADCAST ACTIVE</h2>
          <button className="btn-glass" onClick={() => setCodeBlueActive(false)} style={{ marginTop: '15px', borderColor: '#fff', color: '#fff' }}>
            Acknowledge & Mute Alarm
          </button>
        </div>
      )}

      <div style={styles.grid}>
        
        {/* Department Status HUD */}
        <div className="glass-panel" style={styles.leftCard}>
          <div style={styles.cardHeader}>
            <Compass size={20} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>Department Blueprint & Occupancy</h3>
          </div>
          <p style={styles.description}>
            Interactive floor layout monitor displaying current patient loads, bed configurations, and capacity limits.
          </p>

          <div style={styles.deptGrid}>
            {departments.map((dept, idx) => {
              const loadPercent = Math.round((dept.occupied / dept.capacity) * 100);
              let barColor = 'var(--cyan-pulse)';
              if (dept.status.toLowerCase().includes('critical') || loadPercent >= 95) barColor = 'var(--emergency-crimson)';
              else if (dept.status.toLowerCase().includes('high') || loadPercent >= 85) barColor = 'var(--royal-gold)';

              return (
                <div key={idx} className="glass-panel" style={styles.deptCard}>
                  <div style={styles.deptHeader}>
                    <strong style={styles.deptName}>{dept.name}</strong>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: `${barColor}15`, 
                        borderColor: barColor, 
                        color: barColor,
                        fontSize: '0.65rem'
                      }}
                    >
                      {dept.status}
                    </span>
                  </div>

                  <div style={styles.occupancyRow}>
                    <span style={styles.occupancyLabel}>BED OCCUPANCY</span>
                    <span style={styles.occupancyVal}>{dept.occupied} / {dept.capacity}</span>
                  </div>

                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressBar, width: `${loadPercent}%`, backgroundColor: barColor }}></div>
                  </div>

                  <div style={styles.deptFooter}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Load Ratio: {loadPercent}%</span>
                    <button 
                      className="btn-glass" 
                      onClick={() => increaseDeptLoad(dept.name)}
                      style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                    >
                      + Admit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Management Controls */}
        <div style={styles.rightColumn}>
          <div className="glass-panel" style={styles.controlCard}>
            <div style={styles.cardHeader}>
              <Flame size={20} color="var(--emergency-crimson)" className="heartbeat-pulse" />
              <h3 style={styles.cardTitle}>Emergency Response Controls</h3>
            </div>
            
            <p style={styles.description}>
              Trigger smart hospital triage drills and manage pager protocols for on-duty critical care units.
            </p>

            <div style={styles.actionsBlock}>
              <button 
                onClick={triggerCodeBlue}
                className="btn-glass" 
                style={{ ...styles.actionButton, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--emergency-crimson)', color: '#fff' }}
              >
                <ShieldAlert size={18} color="var(--emergency-crimson)" className="heartbeat-pulse" />
                <span>CODE BLUE EMERGENCY DISPATCH</span>
              </button>

              <button 
                onClick={triggerEmergencyDrill}
                className={`btn-glass ${activeDrill ? 'btn-glass-danger' : 'btn-glass-primary'}`} 
                style={styles.actionButton}
              >
                <ShieldAlert size={18} />
                <span>{activeDrill ? 'ABORT CLINICAL DRILL' : 'TRIGGER TRAUMA DRILL'}</span>
              </button>

              <button 
                onClick={() => onAddNotification({
                  id: `NOTIFY-${Date.now()}`,
                  title: "PAGER BROADCAST SENT",
                  desc: "Attending specialty doctor list notified of active command status.",
                  type: "info"
                })}
                className="btn-glass" 
                style={styles.actionButton}
              >
                <RefreshCw size={16} /> Broadcast System Pager Test
              </button>
            </div>
          </div>

          {/* Active Clinician Registry */}
          <div className="glass-panel" style={styles.doctorsCard}>
            <div style={styles.cardHeader}>
              <UserCheck size={20} color="var(--recovery-mint)" />
              <h3 style={styles.cardTitle}>On-Duty Specialist Doctors</h3>
            </div>

            <div style={styles.docList}>
              {doctors.map((doc) => (
                <div key={doc.id} style={styles.docRow}>
                  <div>
                    <strong style={styles.docName}>{doc.name}</strong>
                    <span style={styles.docSpecialty}>{doc.specialty}</span>
                  </div>
                  <button 
                    onClick={() => toggleDoctorStatus(doc.id)}
                    className="badge" 
                    style={{ 
                      backgroundColor: doc.status === 'Online' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      borderColor: doc.status === 'Online' ? 'var(--recovery-mint)' : 'var(--text-muted)',
                      color: doc.status === 'Online' ? 'var(--recovery-mint)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    {doc.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 0',
    position: 'relative',
  },
  codeBlueOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    animation: 'pulse-overlay 2s infinite alternate',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '24px',
  },
  leftCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-main)',
  },
  description: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  deptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  deptCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.01)',
  },
  deptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  deptName: {
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  occupancyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    marginBottom: '6px',
  },
  occupancyLabel: {
    color: 'var(--text-muted)',
  },
  occupancyVal: {
    fontWeight: 'bold',
    color: 'var(--text-main)',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--border-glass)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
  },
  deptFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  controlCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  actionsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    fontSize: '0.85rem',
  },
  doctorsCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  docRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border-glass)',
  },
  docName: {
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    display: 'block',
  },
  docSpecialty: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
  }
};
export { styles as commandCenterStyles };
