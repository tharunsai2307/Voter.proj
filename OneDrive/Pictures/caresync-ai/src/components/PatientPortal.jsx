import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, Activity, Thermometer, Droplets, Shield, Clock, FileText, 
  Pill, AlertTriangle, Calendar, Download, CheckCircle2, XCircle,
  Stethoscope, TrendingUp, Brain, Siren, Clipboard, BadgeCheck,
  HeartPulse, Wind, Scale, ChevronRight, RefreshCw, Send, Sparkles
} from 'lucide-react';

const API_BASE = "http://localhost:5000/api";

export default function PatientPortal({ portalToken, patientId, onLogout }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  
  // AI Pharmacy state
  const [pharmacyDiagnosis, setPharmacyDiagnosis] = useState('');
  const [pharmacyAllergies, setPharmacyAllergies] = useState('');
  const [pharmacySuggestions, setPharmacySuggestions] = useState(null);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  
  // Appointment state
  const [appointments, setAppointments] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  
  // Live update notifications
  const [liveUpdates, setLiveUpdates] = useState([]);

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/portal/patient/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setPatient(data.patient);
        
        // Auto-set pharmacy diagnosis from diseases
        if (data.patient.diseases && data.patient.diseases.length > 0) {
          setPharmacyDiagnosis(data.patient.diseases[0].disease_name || '');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Unable to connect to hospital server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/portal/appointments/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
    fetchAppointments();
    
    // Poll for live updates every 15 seconds
    const interval = setInterval(() => {
      fetchPatientData();
      fetchAppointments();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [fetchPatientData, fetchAppointments]);

  const handlePharmacySuggest = async () => {
    if (!pharmacyDiagnosis) return;
    setPharmacyLoading(true);
    try {
      const currentMeds = patient?.medications 
        ? (typeof patient.medications === 'string' ? JSON.parse(patient.medications) : patient.medications)
        : [];
      
      const res = await fetch(`${API_BASE}/portal/medication/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: pharmacyDiagnosis,
          currentMeds: currentMeds,
          allergies: pharmacyAllergies.split(',').map(a => a.trim()).filter(Boolean),
          labs: {}
        })
      });
      const data = await res.json();
      if (data.success) {
        setPharmacySuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Pharmacy suggestion failed', err);
    } finally {
      setPharmacyLoading(false);
    }
  };

  const handleAppointmentRequest = async () => {
    if (!appointmentDate) return;
    setAppointmentSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/portal/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, scheduledAt: appointmentDate })
      });
      const data = await res.json();
      if (data.success) {
        setAppointmentDate('');
        fetchAppointments();
        setLiveUpdates(prev => [{
          id: Date.now(),
          message: 'Appointment requested successfully!',
          type: 'success',
          time: new Date().toLocaleTimeString()
        }, ...prev]);
      }
    } catch (err) {
      console.error('Appointment request failed', err);
    } finally {
      setAppointmentSubmitting(false);
    }
  };

  if (loading && !patient) {
    return (
      <div style={portalStyles.loadingContainer}>
        <div style={portalStyles.loadingSpinner}></div>
        <p style={portalStyles.loadingText}>Loading your medical records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={portalStyles.errorContainer}>
        <XCircle size={48} color="var(--emergency-crimson)" />
        <h2 style={portalStyles.errorTitle}>Access Error</h2>
        <p style={portalStyles.errorText}>{error}</p>
        <button className="btn-glass btn-glass-primary" onClick={onLogout}>Return to Login</button>
      </div>
    );
  }

  const latestVitals = patient?.vitals?.[0] || {};
  const isDischarged = patient?.status === 'Discharged';
  const history = typeof patient?.history === 'string' ? JSON.parse(patient.history) : (patient?.history || []);
  const medications = typeof patient?.medications === 'string' ? JSON.parse(patient.medications) : (patient?.medications || []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
    { id: 'vitals', label: 'Vitals History', icon: <HeartPulse size={16} /> },
    { id: 'pharmacy', label: 'AI Pharmacy', icon: <Pill size={16} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={16} /> },
    { id: 'history', label: 'Medical Timeline', icon: <Clock size={16} /> },
  ];

  return (
    <div style={portalStyles.container}>
      {/* Portal Header */}
      <div className="glass-panel" style={portalStyles.header}>
        <div style={portalStyles.headerLeft}>
          <div style={portalStyles.patientAvatar}>
            {patient?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h1 style={portalStyles.patientName}>{patient?.name || 'Patient'}</h1>
            <div style={portalStyles.patientMeta}>
              <span>{patient?.age} yrs • {patient?.gender}</span>
              <span style={portalStyles.separator}>|</span>
              <span>{patient?.department}</span>
              <span style={portalStyles.separator}>|</span>
              <span>Bed: {patient?.bed || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div style={portalStyles.headerRight}>
          <div style={{
            ...portalStyles.statusBadge,
            background: isDischarged ? 'rgba(16, 185, 129, 0.15)' : 
              patient?.status === 'Critical' ? 'rgba(239, 68, 68, 0.15)' :
              patient?.status === 'High Risk' ? 'rgba(245, 158, 11, 0.15)' :
              'rgba(6, 182, 212, 0.15)',
            color: isDischarged ? 'var(--recovery-mint)' :
              patient?.status === 'Critical' ? 'var(--emergency-crimson)' :
              patient?.status === 'High Risk' ? 'var(--royal-gold)' :
              'var(--cyan-pulse)',
            border: `1px solid ${isDischarged ? 'rgba(16, 185, 129, 0.3)' : 
              patient?.status === 'Critical' ? 'rgba(239, 68, 68, 0.3)' :
              patient?.status === 'High Risk' ? 'rgba(245, 158, 11, 0.3)' :
              'rgba(6, 182, 212, 0.3)'}`,
          }}>
            <Shield size={14} />
            {isDischarged ? 'DISCHARGED' : patient?.status?.toUpperCase()}
          </div>
          <button className="btn-glass" onClick={() => { fetchPatientData(); fetchAppointments(); }} style={{ padding: '8px' }}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-glass" onClick={onLogout} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            Exit Portal
          </button>
        </div>
      </div>

      {/* Discharged Banner */}
      {isDischarged && (
        <div className="glass-panel" style={portalStyles.dischargeBanner}>
          <CheckCircle2 size={20} color="var(--recovery-mint)" />
          <div>
            <strong style={{ color: 'var(--recovery-mint)' }}>You have been discharged!</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Your medical records are available below. Follow your doctor's discharge instructions carefully.
            </p>
          </div>
          {patient?.id && (
            <a 
              href={`${API_BASE.replace('/api', '')}/discharge_reports/patient_${patient.id}_discharge.pdf`}
              target="_blank" 
              rel="noreferrer"
              className="btn-glass btn-glass-primary"
              style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.82rem', textDecoration: 'none' }}
            >
              <Download size={14} /> Download Discharge Report
            </a>
          )}
        </div>
      )}

      {/* Doctor Info */}
      <div style={portalStyles.infoRow}>
        <div className="glass-panel" style={portalStyles.infoCard}>
          <Stethoscope size={18} color="var(--cyan-pulse)" />
          <div>
            <span style={portalStyles.infoLabel}>Primary Doctor</span>
            <span style={portalStyles.infoValue}>{patient?.doctor_name || 'Not Assigned'}</span>
          </div>
        </div>
        <div className="glass-panel" style={portalStyles.infoCard}>
          <BadgeCheck size={18} color="var(--recovery-mint)" />
          <div>
            <span style={portalStyles.infoLabel}>Primary Nurse</span>
            <span style={portalStyles.infoValue}>{patient?.nurse_name || 'Not Assigned'}</span>
          </div>
        </div>
        <div className="glass-panel" style={portalStyles.infoCard}>
          <Calendar size={18} color="var(--royal-gold)" />
          <div>
            <span style={portalStyles.infoLabel}>Admission Date</span>
            <span style={portalStyles.infoValue}>{patient?.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        <div className="glass-panel" style={portalStyles.infoCard}>
          <Shield size={18} color="var(--medical-blue)" />
          <div>
            <span style={portalStyles.infoLabel}>Portal Key</span>
            <span style={portalStyles.infoValue}>{portalToken}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={portalStyles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              ...portalStyles.tabBtn,
              background: activeTab === tab.id ? 'var(--nav-active)' : 'transparent',
              color: activeTab === tab.id ? 'var(--cyan-pulse)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--cyan-pulse)' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={portalStyles.tabContent}>
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={portalStyles.overviewGrid}>
            {/* Current Vitals */}
            <div className="glass-panel" style={portalStyles.section}>
              <h3 style={portalStyles.sectionTitle}><HeartPulse size={18} color="var(--emergency-crimson)" /> Current Vitals</h3>
              <div style={portalStyles.vitalsGrid}>
                <VitalCard icon={<Heart size={20} />} label="Heart Rate" value={latestVitals.heart_rate || '--'} unit="bpm" color="var(--emergency-crimson)" />
                <VitalCard icon={<Wind size={20} />} label="SpO2" value={latestVitals.oxygen || '--'} unit="%" color="var(--cyan-pulse)" />
                <VitalCard icon={<Thermometer size={20} />} label="Temperature" value={latestVitals.temperature ? parseFloat(latestVitals.temperature).toFixed(1) : '--'} unit="°C" color="var(--royal-gold)" />
                <VitalCard icon={<Activity size={20} />} label="Blood Pressure" value={latestVitals.blood_pressure || '--'} unit="" color="var(--medical-blue)" />
                <VitalCard icon={<Droplets size={20} />} label="Blood Sugar" value={latestVitals.blood_sugar || '--'} unit="mg/dL" color="var(--recovery-mint)" />
                <VitalCard icon={<Scale size={20} />} label="Weight" value={latestVitals.weight ? parseFloat(latestVitals.weight).toFixed(1) : '--'} unit="kg" color="var(--text-muted)" />
              </div>
            </div>

            {/* Diagnoses */}
            <div className="glass-panel" style={portalStyles.section}>
              <h3 style={portalStyles.sectionTitle}><Clipboard size={18} color="var(--royal-gold)" /> Active Diagnoses</h3>
              {patient?.diseases?.length > 0 ? (
                <div style={portalStyles.diseaseList}>
                  {patient.diseases.map((d, i) => (
                    <div key={i} className="glass-panel" style={portalStyles.diseaseCard}>
                      <AlertTriangle size={16} color="var(--royal-gold)" />
                      <span style={portalStyles.diseaseName}>{d.disease_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={portalStyles.emptyText}>No active diagnoses on record.</p>
              )}
            </div>

            {/* Current Medications */}
            <div className="glass-panel" style={portalStyles.section}>
              <h3 style={portalStyles.sectionTitle}><Pill size={18} color="var(--recovery-mint)" /> Current Medications</h3>
              {medications.length > 0 ? (
                <div style={portalStyles.medList}>
                  {medications.map((med, i) => (
                    <div key={i} className="glass-panel" style={portalStyles.medCard}>
                      <Pill size={14} color="var(--cyan-pulse)" />
                      <div>
                        <strong style={{ fontSize: '0.88rem' }}>{med.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {med.dosage} • {med.frequency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={portalStyles.emptyText}>No medications currently prescribed.</p>
              )}
            </div>

            {/* AI Risk Predictions */}
            {patient?.predictions?.length > 0 && (
              <div className="glass-panel" style={portalStyles.section}>
                <h3 style={portalStyles.sectionTitle}><Brain size={18} color="var(--cyan-pulse)" /> AI Risk Assessment</h3>
                {(() => {
                  const pred = patient.predictions[0];
                  return (
                    <div style={portalStyles.predictionBox}>
                      <div style={portalStyles.riskScoreCircle}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" 
                            stroke={pred.risk_score > 75 ? 'var(--emergency-crimson)' : pred.risk_score > 50 ? 'var(--royal-gold)' : 'var(--recovery-mint)'}
                            strokeWidth="8" strokeDasharray={`${pred.risk_score * 2.64} 264`} 
                            strokeLinecap="round" transform="rotate(-90 50 50)"
                          />
                          <text x="50" y="50" textAnchor="middle" dy="0.35em" 
                            style={{ fill: 'var(--text-main)', fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                            {pred.risk_score}%
                          </text>
                        </svg>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Risk Score</span>
                      </div>
                      <div style={portalStyles.predictionDetails}>
                        <div style={portalStyles.predRow}><span>Severity Level</span><strong>{pred.severity_level}</strong></div>
                        <div style={portalStyles.predRow}><span>Deterioration Risk</span><strong>{parseFloat(pred.deterioration_probability).toFixed(1)}%</strong></div>
                        <div style={portalStyles.predRow}><span>ICU Requirement</span><strong>{parseFloat(pred.icu_requirement_probability).toFixed(1)}%</strong></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── VITALS HISTORY TAB ── */}
        {activeTab === 'vitals' && (
          <div className="glass-panel" style={portalStyles.section}>
            <h3 style={portalStyles.sectionTitle}><HeartPulse size={18} color="var(--emergency-crimson)" /> Vitals Log History</h3>
            {patient?.vitals?.length > 0 ? (
              <div style={portalStyles.vitalsTable}>
                <div style={portalStyles.tableHeader}>
                  <span>Date/Time</span><span>HR</span><span>SpO2</span><span>BP</span><span>Temp</span><span>Sugar</span><span>Weight</span>
                </div>
                {patient.vitals.map((v, i) => (
                  <div key={i} style={portalStyles.tableRow}>
                    <span>{new Date(v.recorded_at).toLocaleString()}</span>
                    <span style={{ color: v.heart_rate > 100 ? 'var(--emergency-crimson)' : 'var(--text-main)' }}>{v.heart_rate || '--'}</span>
                    <span style={{ color: v.oxygen < 94 ? 'var(--emergency-crimson)' : 'var(--text-main)' }}>{v.oxygen || '--'}%</span>
                    <span>{v.blood_pressure || '--'}</span>
                    <span style={{ color: parseFloat(v.temperature) > 38 ? 'var(--royal-gold)' : 'var(--text-main)' }}>{v.temperature ? parseFloat(v.temperature).toFixed(1) : '--'}°C</span>
                    <span>{v.blood_sugar || '--'}</span>
                    <span>{v.weight ? parseFloat(v.weight).toFixed(1) : '--'} kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={portalStyles.emptyText}>No vitals history recorded yet.</p>
            )}
          </div>
        )}

        {/* ── AI PHARMACY TAB ── */}
        {activeTab === 'pharmacy' && (
          <div>
            <div className="glass-panel" style={portalStyles.section}>
              <h3 style={portalStyles.sectionTitle}><Sparkles size={18} color="var(--cyan-pulse)" /> AI Pharmacy Suggestion Engine</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Get personalized medication suggestions based on your diagnosis. This is for reference only — always consult your doctor.
              </p>
              <div style={portalStyles.pharmacyForm}>
                <div style={portalStyles.formGroup}>
                  <label style={portalStyles.formLabel}>Diagnosis / Condition</label>
                  <select 
                    value={pharmacyDiagnosis} 
                    onChange={(e) => setPharmacyDiagnosis(e.target.value)}
                    style={portalStyles.formSelect}
                  >
                    <option value="">Select diagnosis...</option>
                    {['Cancer','Diabetes','Heart Disease','Asthma','Dengue','Kidney Disease','Pneumonia','Hypertension','Stroke','Diarrhea'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={portalStyles.formGroup}>
                  <label style={portalStyles.formLabel}>Known Allergies (comma-separated)</label>
                  <input 
                    type="text" 
                    value={pharmacyAllergies} 
                    onChange={(e) => setPharmacyAllergies(e.target.value)}
                    placeholder="e.g., aspirin, penicillin"
                    style={portalStyles.formInput}
                  />
                </div>
                <button 
                  className="btn-glass btn-glass-primary" 
                  onClick={handlePharmacySuggest}
                  disabled={pharmacyLoading || !pharmacyDiagnosis}
                  style={{ padding: '10px 20px' }}
                >
                  {pharmacyLoading ? 'Analyzing...' : <><Sparkles size={14} /> Get AI Suggestions</>}
                </button>
              </div>
            </div>

            {pharmacySuggestions && (
              <div className="glass-panel" style={{ ...portalStyles.section, marginTop: '16px' }}>
                <h3 style={portalStyles.sectionTitle}>
                  <Pill size={18} color="var(--recovery-mint)" /> 
                  Suggestions for: {pharmacySuggestions.diagnosis}
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: pharmacySuggestions.confidence === 'high' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: pharmacySuggestions.confidence === 'high' ? 'var(--recovery-mint)' : 'var(--royal-gold)',
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    marginLeft: '8px' 
                  }}>
                    {pharmacySuggestions.confidence} confidence
                  </span>
                </h3>

                {pharmacySuggestions.warnings?.length > 0 && (
                  <div style={portalStyles.warningBox}>
                    {pharmacySuggestions.warnings.map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertTriangle size={14} color="var(--royal-gold)" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={portalStyles.subTitle}>Recommended Medications</h4>
                <div style={portalStyles.medSuggestGrid}>
                  {pharmacySuggestions.medications?.map((med, i) => (
                    <div key={i} className="glass-panel" style={portalStyles.medSuggestCard}>
                      <div style={portalStyles.medSuggestHeader}>
                        <Pill size={16} color="var(--cyan-pulse)" />
                        <strong>{med.name}</strong>
                      </div>
                      <div style={portalStyles.medSuggestBody}>
                        <div><span style={portalStyles.medLabel}>Dosage:</span> {med.dosage}</div>
                        <div><span style={portalStyles.medLabel}>Frequency:</span> {med.frequency}</div>
                        <div><span style={portalStyles.medLabel}>Purpose:</span> {med.purpose}</div>
                        {med.warnings && <div style={{ color: 'var(--royal-gold)', fontSize: '0.75rem', marginTop: '4px' }}>⚠ {med.warnings}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <h4 style={portalStyles.subTitle}>Precautions & Lifestyle Recommendations</h4>
                <div style={portalStyles.precautionsList}>
                  {pharmacySuggestions.precautions?.map((p, i) => (
                    <div key={i} style={portalStyles.precautionItem}>
                      <CheckCircle2 size={14} color="var(--recovery-mint)" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── APPOINTMENTS TAB ── */}
        {activeTab === 'appointments' && (
          <div>
            {!isDischarged && (
              <div className="glass-panel" style={portalStyles.section}>
                <h3 style={portalStyles.sectionTitle}><Calendar size={18} color="var(--cyan-pulse)" /> Request Appointment</h3>
                <div style={portalStyles.appointmentForm}>
                  <input 
                    type="datetime-local" 
                    value={appointmentDate} 
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    style={portalStyles.formInput}
                  />
                  <button 
                    className="btn-glass btn-glass-primary" 
                    onClick={handleAppointmentRequest}
                    disabled={appointmentSubmitting || !appointmentDate}
                    style={{ padding: '10px 20px' }}
                  >
                    {appointmentSubmitting ? 'Submitting...' : <><Send size={14} /> Request</>}
                  </button>
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ ...portalStyles.section, marginTop: '16px' }}>
              <h3 style={portalStyles.sectionTitle}><Clock size={18} color="var(--royal-gold)" /> Appointment History</h3>
              {appointments.length > 0 ? (
                <div style={portalStyles.appointmentList}>
                  {appointments.map((apt, i) => (
                    <div key={i} className="glass-panel" style={portalStyles.appointmentCard}>
                      <div style={portalStyles.appointmentStatus}>
                        {apt.status === 'Approved' ? <CheckCircle2 size={18} color="var(--recovery-mint)" /> :
                         apt.status === 'Rejected' ? <XCircle size={18} color="var(--emergency-crimson)" /> :
                         <Clock size={18} color="var(--royal-gold)" />}
                      </div>
                      <div>
                        <strong>{apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleString() : 'Pending Schedule'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Status: <span style={{ 
                            color: apt.status === 'Approved' ? 'var(--recovery-mint)' : 
                                   apt.status === 'Rejected' ? 'var(--emergency-crimson)' : 'var(--royal-gold)' 
                          }}>{apt.status}</span>
                          {apt.doctor_name && ` • Dr. ${apt.doctor_name}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Requested: {new Date(apt.requested_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={portalStyles.emptyText}>No appointments found.</p>
              )}
            </div>
          </div>
        )}

        {/* ── MEDICAL TIMELINE TAB ── */}
        {activeTab === 'history' && (
          <div className="glass-panel" style={portalStyles.section}>
            <h3 style={portalStyles.sectionTitle}><Clock size={18} color="var(--medical-blue)" /> Medical Timeline</h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Clinical notes: {patient?.details || 'No additional notes.'}
              </p>
            </div>
            {history.length > 0 ? (
              <div style={portalStyles.timeline}>
                {history.map((entry, i) => (
                  <div key={i} style={portalStyles.timelineItem}>
                    <div style={portalStyles.timelineDot}></div>
                    <div style={portalStyles.timelineContent}>
                      <span style={portalStyles.timelineDate}>{entry.date}</span>
                      <span style={portalStyles.timelineEvent}>{entry.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={portalStyles.emptyText}>No medical history entries yet.</p>
            )}

            {/* Alerts History */}
            {patient?.alerts?.length > 0 && (
              <>
                <h3 style={{ ...portalStyles.sectionTitle, marginTop: '24px' }}><Siren size={18} color="var(--emergency-crimson)" /> Clinical Alerts</h3>
                <div style={portalStyles.alertsList}>
                  {patient.alerts.map((alert, i) => (
                    <div key={i} className="glass-panel" style={{
                      ...portalStyles.alertCard,
                      borderLeft: `3px solid ${alert.type === 'Critical' ? 'var(--emergency-crimson)' : alert.type === 'High' ? 'var(--royal-gold)' : 'var(--cyan-pulse)'}`
                    }}>
                      <AlertTriangle size={16} color={alert.type === 'Critical' ? 'var(--emergency-crimson)' : 'var(--royal-gold)'} />
                      <div>
                        <strong>{alert.metric}: {alert.value}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Threshold: {alert.threshold} • Status: {alert.status} • {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Update Toast */}
      {liveUpdates.length > 0 && (
        <div style={portalStyles.liveToast}>
          {liveUpdates.slice(0, 3).map(update => (
            <div key={update.id} className="glass-panel" style={{
              ...portalStyles.liveToastItem,
              borderLeft: `3px solid ${update.type === 'success' ? 'var(--recovery-mint)' : 'var(--cyan-pulse)'}`,
            }}>
              <CheckCircle2 size={14} color="var(--recovery-mint)" />
              <span>{update.message}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{update.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for vitals cards
function VitalCard({ icon, label, value, unit, color }) {
  return (
    <div className="glass-panel" style={portalStyles.vitalCard}>
      <div style={{ color }}>{icon}</div>
      <div style={portalStyles.vitalInfo}>
        <span style={portalStyles.vitalLabel}>{label}</span>
        <span style={portalStyles.vitalValue}>{value} <span style={portalStyles.vitalUnit}>{unit}</span></span>
      </div>
    </div>
  );
}

const portalStyles = {
  container: { padding: '0' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTop: '3px solid var(--cyan-pulse)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  errorContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' },
  errorTitle: { fontSize: '1.4rem', fontFamily: 'var(--font-heading)' },
  errorText: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  header: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  patientAvatar: { width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--cyan-pulse), var(--medical-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-heading)' },
  patientName: { fontSize: '1.3rem', fontWeight: '700', fontFamily: 'var(--font-heading)', margin: 0 },
  patientMeta: { fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' },
  separator: { color: 'var(--border-glass)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' },
  dischargeBanner: { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' },
  infoRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  infoCard: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' },
  infoLabel: { display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' },
  infoValue: { display: 'block', fontSize: '0.88rem', fontWeight: '600', marginTop: '2px' },
  tabBar: { display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-heading)', fontWeight: '600', borderRadius: '8px 8px 0 0', transition: 'all 0.2s' },
  tabContent: { minHeight: '400px' },
  section: { padding: '20px 24px', marginBottom: '16px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: '700', fontFamily: 'var(--font-heading)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' },
  subTitle: { fontSize: '0.9rem', fontWeight: '700', fontFamily: 'var(--font-heading)', marginTop: '20px', marginBottom: '12px', color: 'var(--text-main)' },
  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  vitalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  vitalCard: { padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' },
  vitalInfo: { display: 'flex', flexDirection: 'column' },
  vitalLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  vitalValue: { fontSize: '1.2rem', fontWeight: '700', fontFamily: 'var(--font-heading)' },
  vitalUnit: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' },
  diseaseList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  diseaseCard: { padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' },
  diseaseName: { fontSize: '0.85rem', fontWeight: '600' },
  medList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  medCard: { padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' },
  predictionBox: { display: 'flex', alignItems: 'center', gap: '30px', padding: '10px' },
  riskScoreCircle: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  predictionDetails: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  predRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' },
  vitalsTable: { fontSize: '0.8rem' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr repeat(6, 1fr)', gap: '8px', padding: '10px 12px', background: 'var(--nav-active)', borderRadius: '8px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr repeat(6, 1fr)', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border-glass)', fontSize: '0.8rem' },
  pharmacyForm: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formLabel: { fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  formInput: { padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none' },
  formSelect: { padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none' },
  warningBox: { background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' },
  medSuggestGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  medSuggestCard: { padding: '14px' },
  medSuggestHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  medSuggestBody: { fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  medLabel: { color: 'var(--text-muted)', fontWeight: '600' },
  precautionsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  precautionItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', padding: '6px 0' },
  appointmentForm: { display: 'flex', gap: '12px', alignItems: 'center' },
  appointmentList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  appointmentCard: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' },
  appointmentStatus: { flexShrink: 0 },
  timeline: { position: 'relative', paddingLeft: '24px' },
  timelineItem: { position: 'relative', paddingBottom: '20px', paddingLeft: '20px', borderLeft: '2px solid var(--border-glass)' },
  timelineDot: { position: 'absolute', left: '-7px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--cyan-pulse)', border: '2px solid var(--bg-main)' },
  timelineContent: { display: 'flex', flexDirection: 'column', gap: '2px' },
  timelineDate: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' },
  timelineEvent: { fontSize: '0.85rem' },
  alertsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  alertCard: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' },
  emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' },
  liveToast: { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 999, maxWidth: '320px' },
  liveToastItem: { padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' },
};

export { portalStyles };
