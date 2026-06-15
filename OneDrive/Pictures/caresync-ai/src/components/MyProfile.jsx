import React, { useState, useEffect } from 'react';
import { UserCheck, Activity, Award, Mail, Edit3, ShieldAlert, Award as BadgeCheck, ExternalLink } from 'lucide-react';

export default function MyProfile({ currentUser, patients, onUpdateProfile, onSelectPatient }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editSpecialty, setEditSpecialty] = useState(currentUser?.specialty || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditSpecialty(currentUser.specialty || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div style={styles.emptyContainer}>
        <h3>No Clinician Access Verified</h3>
        <p>Please authorize your credentials on the Trauma console.</p>
      </div>
    );
  }

  // Filter patients assigned to this clinician
  const isDoctor = currentUser.role === 'Doctor';
  const isNurse = currentUser.role === 'Nurse';
  const isAdmin = currentUser.role === 'Admin';

  const myPatients = patients.filter(p => {
    if (isAdmin) return true; // Admins view all patients
    if (isDoctor) return p.primaryDoctorId == currentUser.id || p.primaryDoctor === currentUser.name;
    if (isNurse) return p.primaryNurseId == currentUser.id || p.primaryNurse === currentUser.name;
    return false;
  });

  const criticalLoad = myPatients.filter(p => p.status === 'Critical' || p.status === 'High Risk').length;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name is a required field.");
      return;
    }
    setIsSaving(true);
    const success = await onUpdateProfile({
      name: editName.trim(),
      specialty: editSpecialty.trim()
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Upper Grid Layout: Profile Card + Stats */}
      <div style={styles.upperGrid}>
        
        {/* Clinician Profile details */}
        <div className="glass-panel" style={styles.profileCard}>
          <div style={styles.avatarRow}>
            <div style={styles.avatar}>
              <UserCheck size={36} color="var(--cyan-pulse)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ backgroundColor: 'var(--cyan-pulse)', color: '#000', fontWeight: 'bold' }}>
                  {currentUser.role.toUpperCase()}
                </span>
                <span style={styles.onlineBadge}>ONLINE</span>
              </div>
              <h2 style={styles.clinicianName}>{currentUser.name}</h2>
              <p style={styles.specialtyText}>{currentUser.specialty || 'General Medical Staff'}</p>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={styles.editForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>FULL CLINICIAN NAME</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CLINICAL SPECIALTY & FIELD</label>
                <input 
                  type="text" 
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" className="btn-glass" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={isSaving} style={{ flex: 2 }}>
                  {isSaving ? 'Syncing...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.infoFields}>
              <div style={styles.infoRow}>
                <Mail size={16} color="var(--text-muted)" />
                <span style={styles.infoVal}>{currentUser.email}</span>
              </div>
              <div style={styles.infoRow}>
                <Award size={16} color="var(--text-muted)" />
                <span style={styles.infoVal}>{currentUser.specialty || 'General Practitioner'}</span>
              </div>
              
              <button 
                className="btn-glass btn-glass-primary" 
                onClick={() => setIsEditing(true)}
                style={styles.editBtn}
              >
                <Edit3 size={14} /> Modify Profile Details
              </button>
            </div>
          )}
        </div>

        {/* Stats Columns */}
        <div style={styles.statsCardGrid}>
          <div className="glass-panel" style={styles.statCard}>
            <Activity size={24} color="var(--cyan-pulse)" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>MY CLINICAL LOAD</span>
              <span style={styles.statVal}>{myPatients.length} Patients</span>
            </div>
          </div>

          <div className="glass-panel" style={styles.statCard}>
            <ShieldAlert size={24} color="var(--emergency-crimson)" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>CRITICAL RISK WATCH</span>
              <span style={{ ...styles.statVal, color: criticalLoad > 0 ? 'var(--emergency-crimson)' : 'var(--recovery-mint)' }}>
                {criticalLoad} Active
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Roster list header */}
      <div style={styles.rosterSection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>MY ASSIGNED CLINICAL ROSTER</h3>
          <span style={styles.rosterCount}>{myPatients.length} active monitors</span>
        </div>

        {myPatients.length === 0 ? (
          <div className="glass-panel" style={styles.emptyRoster}>
            <BadgeCheck size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
            <h4>No Patients Assigned</h4>
            <p>You are currently not listed as the Attending Clinician for any active telemetry beds.</p>
          </div>
        ) : (
          <div style={styles.rosterGrid}>
            {myPatients.map(p => {
              const riskColor = p.riskScore > 80 ? 'var(--emergency-crimson)' : p.riskScore > 50 ? 'var(--royal-gold)' : 'var(--recovery-mint)';
              return (
                <div 
                  key={p.id} 
                  className="glass-panel glass-panel-hover" 
                  style={styles.patientCard}
                  onClick={() => onSelectPatient(p)}
                >
                  <div style={styles.patientCardHeader}>
                    <div>
                      <h4 style={styles.patientName}>{p.name}</h4>
                      <p style={styles.patientMeta}>Bed {p.bed || 'Unassigned'} | {p.department}</p>
                    </div>
                    <span className={`badge ${p.status === 'Critical' ? 'badge-critical' : p.status === 'High Risk' ? 'badge-warning' : 'badge-stable'}`}>
                      {p.status}
                    </span>
                  </div>

                  <div style={styles.patientCardBody}>
                    <div style={styles.diseaseField}>
                      <span style={styles.fieldLabel}>DIAGNOSTIC:</span>
                      <span style={styles.fieldValue}>{p.disease}</span>
                    </div>

                    <div style={styles.riskRow}>
                      <span style={styles.fieldLabel}>AI DETERIORATION:</span>
                      <strong style={{ color: riskColor }}>{p.riskScore}% Risk</strong>
                    </div>
                  </div>

                  <div style={styles.cardFooter}>
                    <span>View Telemetry HUD</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '10px 0 30px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    minHeight: '400px',
  },
  upperGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '24px',
  },
  profileCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  avatarRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  avatar: {
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  clinicianName: {
    fontSize: '1.35rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
    marginTop: '4px',
  },
  specialtyText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  onlineBadge: {
    fontSize: '0.6rem',
    fontWeight: '700',
    background: 'rgba(16, 185, 129, 0.15)',
    color: 'var(--recovery-mint)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    letterSpacing: '0.05em',
  },
  infoFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  infoVal: {
    fontSize: '0.85rem',
    color: 'var(--text-main)',
  },
  editBtn: {
    marginTop: '10px',
    width: '100%',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.82rem',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    outline: 'none',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  statsCardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'var(--bg-card)',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  statVal: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  rosterSection: {
    marginTop: '10px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.02em',
  },
  rosterCount: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  emptyRoster: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    textAlign: 'center',
    borderStyle: 'dashed',
    borderWidth: '1px',
  },
  rosterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  patientCard: {
    padding: '16px',
    background: 'var(--bg-card)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  patientCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: '0.95rem',
    color: 'var(--text-main)',
    fontWeight: '600',
  },
  patientMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  patientCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px 0',
    borderTop: '1px solid var(--border-glass)',
    borderBottom: '1px solid var(--border-glass)',
  },
  diseaseField: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
  },
  riskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
  },
  fieldLabel: {
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  fieldValue: {
    color: 'var(--text-main)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
    fontSize: '0.72rem',
    color: 'var(--cyan-pulse)',
    fontWeight: '600',
  }
};
