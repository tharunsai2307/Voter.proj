import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, UserCheck, Activity, Users, Flame } from 'lucide-react';
import AdmitPatientModal from './AdmitPatientModal';

export default function Dashboard({ patients, onSelectPatient, onViewPage, alerts, doctors, currentUser, staff = [], onAdmitPatient }) {
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [diseaseFilter, setDiseaseFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter logic: ignore discharged patients in active dashboard views
  const activePatients = patients.filter(p => p.status !== 'Discharged');

  const filteredPatients = activePatients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || p.department === deptFilter;
    const matchesDisease = diseaseFilter === 'All' || p.disease === diseaseFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesDept && matchesDisease && matchesStatus;
  });

  const criticalCount = activePatients.filter(p => p.status === 'Critical').length;
  const activeAlertsCount = alerts.length;
  const onlineDocsCount = doctors.filter(d => d.status === 'Online').length;

  return (
    <div style={styles.container}>
      {/* Top statistics panel */}
      <section style={styles.statsGrid} className="fade-up-stagger">
        <div className="glass-panel glass-panel-hover" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Total Patients</span>
            <Users size={20} color="var(--medical-blue)" />
          </div>
          <span style={styles.statVal}>{activePatients.length}</span>
          <span style={styles.statSub}>Active registries</span>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ ...styles.statCard, borderLeft: '3px solid var(--emergency-crimson)' }}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Critical Patients</span>
            <Flame size={20} color="var(--emergency-crimson)" className="heartbeat-pulse" />
          </div>
          <span style={{ ...styles.statVal, color: 'var(--emergency-crimson)', textShadow: '0 0 10px var(--crimson-glow)' }}>{criticalCount}</span>
          <span style={styles.statSub}>Continuous telemetry</span>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ ...styles.statCard, borderLeft: '3px solid var(--royal-gold)' }}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Emergency Alerts</span>
            <AlertTriangle size={20} color="var(--royal-gold)" />
          </div>
          <span style={{ ...styles.statVal, color: 'var(--royal-gold)' }}>{activeAlertsCount}</span>
          <span style={styles.statSub}>Awaiting acknowledgment</span>
        </div>

        <div className="glass-panel glass-panel-hover" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>ICU Occupancy</span>
            <Activity size={20} color="var(--cyan-pulse)" />
          </div>
          <span style={styles.statVal}>80%</span>
          <span style={styles.statSub}>8 out of 10 beds full</span>
        </div>

        <div className="glass-panel glass-panel-hover" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Active Doctors</span>
            <UserCheck size={20} color="var(--recovery-mint)" />
          </div>
          <span style={{ ...styles.statVal, color: 'var(--recovery-mint)' }}>{onlineDocsCount}</span>
          <span style={styles.statSub}>Clinicians online</span>
        </div>
      </section>

      {/* Patient Monitoring Center Section */}
      <section className="glass-panel" style={styles.monitoringPanel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Patient Monitoring Center</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Nurse' || currentUser.role === 'Doctor') && (
              <button 
                className="btn-glass btn-glass-primary" 
                onClick={() => setIsAdmitModalOpen(true)}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                + Admit Patient
              </button>
            )}
            <span style={styles.panelBadge}>LIVE PATIENT FEED</span>
          </div>
        </div>

        {/* Filter bar */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              aria-label="Search patient database"
            />
          </div>

          <div style={styles.filtersGroup}>
            {/* Department Filter */}
            <div style={styles.filterItem}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={styles.select}
                aria-label="Filter by department"
              >
                <option value="All">All Departments</option>
                <option value="ICU">ICU</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
              </select>
            </div>

            {/* Disease Filter */}
            <div style={styles.filterItem}>
              <select
                value={diseaseFilter}
                onChange={(e) => setDiseaseFilter(e.target.value)}
                style={styles.select}
                aria-label="Filter by primary diagnosis"
              >
                <option value="All">All Diseases</option>
                <option value="Heart Disease">Heart Disease</option>
                <option value="Cancer">Cancer</option>
                <option value="Diabetes">Diabetes</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={styles.filterItem}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
                aria-label="Filter by patient clinical status"
              >
                <option value="All">All Statuses</option>
                <option value="Stable">Stable</option>
                <option value="High Risk">High Risk</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Bed / Dept</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>AI Risk Index</th>
                <th>Vitals Telemetry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  let statusClass = 'badge-stable';
                  if (patient.status === 'Critical') statusClass = 'badge-critical';
                  if (patient.status === 'High Risk') statusClass = 'badge-warning';

                  return (
                    <tr key={patient.id}>
                      <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{patient.id}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {patient.age} yrs • {patient.gender}
                        </div>
                      </td>
                      <td>
                        <div>{patient.bed}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.department}</div>
                      </td>
                      <td>{patient.disease}</td>
                      <td>
                        <span className={`badge ${statusClass}`}>{patient.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={styles.riskProgressContainer}>
                            <div 
                              style={{ 
                                ...styles.riskProgressBar, 
                                width: `${patient.riskScore}%`,
                                backgroundColor: patient.riskScore > 80 ? 'var(--emergency-crimson)' : patient.riskScore > 50 ? 'var(--royal-gold)' : 'var(--recovery-mint)'
                              }}
                            ></div>
                          </div>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{patient.riskScore}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                          <span title="Heart Rate">❤️ {patient.metrics.heartRate}</span>
                          <span title="O2 Level">🩸 {patient.metrics.oxygen}%</span>
                          {patient.metrics.bloodSugar && <span title="Blood Sugar">🍬 {patient.metrics.bloodSugar}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-glass btn-glass-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => {
                              onSelectPatient(patient);
                              onViewPage('profile');
                            }}
                          >
                            HUD View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No patients found matching the selected search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdmitPatientModal 
        isOpen={isAdmitModalOpen} 
        onClose={() => setIsAdmitModalOpen(false)} 
        staff={staff} 
        onAdmit={onAdmitPatient} 
      />
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '20px',
    background: 'var(--bg-card)',
    display: 'flex',
    flexDirection: 'column',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-heading)',
  },
  statVal: {
    fontSize: '2rem',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
    lineHeight: '1.1',
    color: 'var(--text-main)',
  },
  statSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  monitoringPanel: {
    padding: '25px',
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
    fontSize: '1.25rem',
    color: 'var(--text-main)',
  },
  panelBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--cyan-pulse)',
    background: 'var(--primary-glow)',
    padding: '4px 8px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-heading)',
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 10px 10px 40px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'all var(--transition-fast)',
  },
  filtersGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-main)',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
  },
  riskProgressContainer: {
    width: '60px',
    height: '6px',
    backgroundColor: 'var(--border-glass)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  riskProgressBar: {
    height: '100%',
    borderRadius: '3px',
  }
};
export { styles as dashboardStyles };
