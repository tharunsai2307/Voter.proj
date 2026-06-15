import React, { useState, useEffect } from 'react';
import { 
  Activity, Sun, Moon, LogIn, LogOut, LayoutDashboard, UserCheck, 
  ShieldAlert, BrainCircuit, BarChart3, Compass, Bell, Mic, X, Heart, KeyRound, Copy, CheckCircle2 
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import PatientProfile from './components/PatientProfile';
import AlertCenter from './components/AlertCenter';
import Analytics from './components/Analytics';
import PredictionCenter from './components/PredictionCenter';
import CommandCenter from './components/CommandCenter';
import ClinicianManager from './components/ClinicianManager';
import MyProfile from './components/MyProfile';
import PatientPortal from './components/PatientPortal';

const API_BASE = "http://localhost:5000/api";

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('caresync_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([
    { id: 1, name: "Dr. Sarah Jenkins", role: "Doctor", specialty: "Cardiologist & ICU Lead" },
    { id: 2, name: "Nurse Carter", role: "Nurse", specialty: "Trauma Ward RN" },
    { id: 3, name: "Chief Admin", role: "Admin", specialty: "Director of Medicine" }
  ]);
  const [notifications, setNotifications] = useState([]);
  
  // Patient Portal state
  const [portalToken, setPortalToken] = useState(null);
  const [portalPatientId, setPortalPatientId] = useState(null);
  const [portalPatientName, setPortalPatientName] = useState(null);
  const [isPatientMode, setIsPatientMode] = useState(false);
  
  // Token generation state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenGenPatientId, setTokenGenPatientId] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [tokenGenLoading, setTokenGenLoading] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Voice Assistant state
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceAnswer, setVoiceAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 5000);
  };

  // Helper for authenticated API calls
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Clear expired session
      handleLogout();
      addNotification({
        id: 'SESSION-EXPIRED',
        title: 'SESSION EXPIRED',
        desc: 'Please authenticate again to access the Trauma Console.',
        type: 'danger'
      });
      throw new Error('Unauthorized');
    }

    return response;
  };

  // Try restoring clinical session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!authToken) return;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setActivePage('dashboard');
          addNotification({
            id: 'SESSION-RESTORED',
            title: 'SESSION SECURED',
            desc: `Clinical session restored for ${data.user.name}.`,
            type: 'success'
          });
        } else {
          handleLogout();
        }
      } catch (err) {
        // Silent fail (offline fallback mode)
        console.warn("Session restore query failed. Fallback active.");
      }
    };
    restoreSession();
  }, [authToken]);

  // Fetch clinical data arrays when user is loaded
  const loadConsoleData = async () => {
    if (!authToken) return;
    try {
      // 1. Fetch Patients registry
      const patRes = await fetchWithAuth('/patients');
      const patData = await patRes.json();
      if (patData.success) {
        // Map database schema fields to frontend components format
        const mappedPatients = patData.patients.map(p => ({
          id: p.id.toString(),
          name: p.name,
          age: p.age,
          gender: p.gender,
          bed: p.bed,
          department: p.department,
          status: p.status === 'High Risk' ? 'High Risk' : p.status === 'Critical' ? 'Critical' : 'Stable',
          disease: p.diseases && p.diseases.length > 0 ? p.diseases[0] : 'General Medicine',
          diseases: p.diseases || [],
          details: p.details || '',
          admissionDate: p.admission_date,
          primaryDoctorId: p.primary_doctor_id,
          primaryNurseId: p.primary_nurse_id,
          primaryDoctor: p.doctor_name || 'Dr. Sarah Jenkins',
          primaryNurse: p.nurse_name || 'Nurse Carter',
          riskScore: p.riskScore || 20, // default if missing
          history: typeof p.history === 'string' ? JSON.parse(p.history) : (p.history || [
            { date: p.admission_date || "2026-06-15", event: "Clinical Admission & Triage Complete" }
          ]),
          medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []),
          timeline: [
            { time: "Admit Date", status: "Stable", title: "Patient Registry Initialized", desc: `Admitted on ${p.admission_date || "2026-06-15"}` }
          ],
          metrics: {
            heartRate: 75,
            oxygen: 98,
            temperature: 37.0,
            bloodPressure: "120/80",
            bloodSugar: 100,
            painScore: 2,
            fatigue: 3
          }
        }));
        
        // Load latest telemetry logs for each patient
        for (let p of mappedPatients) {
          try {
            const vitRes = await fetchWithAuth(`/vitals/${p.id}`);
            const vitData = await vitRes.json();
            if (vitData.success && vitData.vitals.length > 0) {
              const latest = vitData.vitals[0];
              p.metrics = {
                heartRate: latest.heart_rate || 75,
                oxygen: latest.oxygen || 98,
                temperature: parseFloat(latest.temperature) || 37.0,
                bloodPressure: latest.blood_pressure || "120/80",
                bloodSugar: latest.blood_sugar || 100,
                painScore: latest.painScore || 2,
                fatigue: latest.fatigue || 3
              };
            }
          } catch(e){}

          // Fetch latest AI predictions
          try {
            const predRes = await fetchWithAuth(`/predictions/${p.id}`);
            const predData = await predRes.json();
            if (predData.success && predData.predictions.length > 0) {
              const latestPred = predData.predictions[0];
              p.riskScore = latestPred.risk_score;
              p.status = latestPred.severity_level === 'Critical' ? 'Critical' : latestPred.severity_level === 'High Alert' ? 'High Risk' : 'Stable';
              p.timeline = latestPred.recommendations ? latestPred.recommendations.map((rec, idx) => ({
                time: `AI Rec ${idx+1}`,
                status: p.status,
                title: "Clinical Advisory",
                desc: rec
              })) : p.timeline;
            }
          } catch(e){}
        }

        setPatients(mappedPatients);
        if (mappedPatients.length > 0) {
          setSelectedPatient(prev => {
            if (prev) {
              const stillExists = mappedPatients.find(pat => pat.id === prev.id);
              if (stillExists) return stillExists;
            }
            return mappedPatients[0];
          });
        } else {
          setSelectedPatient(null);
        }
      }

      // 2. Fetch Active Alerts registry
      const alertRes = await fetchWithAuth('/alerts?status=Active');
      const alertData = await alertRes.json();
      if (alertData.success) {
        setAlerts(alertData.alerts.map(a => ({
          id: a.id.toString(),
          patientId: a.patient_id.toString(),
          patientName: a.patient_name,
          vessel: a.patient_bed,
          type: a.type,
          metric: a.metric,
          value: a.value,
          threshold: a.threshold,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: a.created_at
        })));
      }

      // Mock Doctor registry remains online local states
      setDoctors([
        { id: "1", name: "Dr. Sarah Jenkins", specialty: "Cardiologist & ICU Lead", status: "Online" },
        { id: "2", name: "Dr. Arthur Pendelton", specialty: "Oncologist", status: "Online" },
        { id: "3", name: "Dr. Helen Cho", specialty: "Endocrinologist", status: "Online" }
      ]);

      // 3. Fetch Clinician Staff Directory
      try {
        const staffRes = await fetchWithAuth('/auth/users');
        const staffData = await staffRes.json();
        if (staffData.success) {
          setStaff(staffData.users);
        }
      } catch (err) {
        console.warn("Unable to fetch clinician profiles:", err.message);
      }

    } catch (error) {
      console.warn("Clinical server arrays sync error. Fallback logs activated.");
    }
  };

  useEffect(() => {
    if (authToken) {
      loadConsoleData();
    }
  }, [authToken]);

  const handleLogout = () => {
    localStorage.removeItem('caresync_token');
    setAuthToken(null);
    setCurrentUser(null);
    setActivePage('landing');
    // Also clear patient portal state
    setIsPatientMode(false);
    setPortalToken(null);
    setPortalPatientId(null);
    setPortalPatientName(null);
  };

  // Patient portal login handler
  const handlePatientLogin = ({ token, patientId, patientName, isDischarged }) => {
    setPortalToken(token);
    setPortalPatientId(patientId);
    setPortalPatientName(patientName);
    setIsPatientMode(true);
    setActivePage('patient-portal');
    addNotification({
      id: `NOTIFY-PORTAL-${Date.now()}`,
      title: 'PORTAL ACCESS GRANTED',
      desc: `Welcome, ${patientName}. Your medical records are now available.`,
      type: 'success'
    });
  };

  const handlePatientLogout = () => {
    setIsPatientMode(false);
    setPortalToken(null);
    setPortalPatientId(null);
    setPortalPatientName(null);
    setActivePage('landing');
  };

  // Generate portal token for a patient (nurse/admin only)
  const handleGeneratePortalToken = async () => {
    if (!tokenGenPatientId) return;
    setTokenGenLoading(true);
    setGeneratedToken(null);
    try {
      const res = await fetchWithAuth(`/portal/token/generate/${tokenGenPatientId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGeneratedToken(data);
        addNotification({
          id: `NOTIFY-TOKEN-${Date.now()}`,
          title: 'PORTAL KEY GENERATED',
          desc: `Access key created for ${data.patientName}: ${data.token}`,
          type: 'success'
        });
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTokenGenLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (generatedToken?.token) {
      navigator.clipboard.writeText(generatedToken.token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  // Login handler
  const handleLogin = async (credentials) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password || 'password123'
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('caresync_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setActivePage('dashboard');
        addNotification({
          id: `NOTIFY-LOGIN-${Date.now()}`,
          title: "SECURE LOG IN SUCCESSFUL",
          desc: `Clinical permissions authorized for ${data.user.name} as ${data.user.role}.`,
          type: "success"
        });
      } else {
        alert("Authentication failed: " + data.message);
      }
    } catch (err) {
      alert("Unable to establish backend server connection. Please ensure Express is running.");
    }
  };

  // Resolve Alert handler
  const resolveAlert = async (alertId) => {
    try {
      const res = await fetchWithAuth(`/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ actionTaken: "Clinical telemetry intervention completed at bedside." })
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        addNotification({
          id: `NOTIFY-ALERT-${Date.now()}`,
          title: "ALERT HANDLED",
          desc: `Clinical warning acknowledged and resolved.`,
          type: "success"
        });
        loadConsoleData(); // refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log vitals and run predictions logic
  const handleUpdatePatient = async (updatedPatient) => {
    try {
      const res = await fetchWithAuth(`/vitals/${updatedPatient.id}`, {
        method: 'POST',
        body: JSON.stringify({
          oxygen: updatedPatient.metrics.oxygen,
          heartRate: updatedPatient.metrics.heartRate,
          bloodPressure: updatedPatient.metrics.bloodPressure,
          temperature: updatedPatient.metrics.temperature,
          bloodSugar: updatedPatient.metrics.bloodSugar,
          respirationRate: 16,
          plateletCount: 250000,
          weight: 70.0,
          painScore: updatedPatient.metrics.painScore,
          fatigue: updatedPatient.metrics.fatigue
        })
      });
      const data = await res.json();
      if (data.success) {
        addNotification({
          id: `NOTIFY-VITALS-${Date.now()}`,
          title: "VITALS LOGGED",
          desc: `Vitals entry recorded. AI risk recalculated: ${data.aiAnalysis.riskScore}%`,
          type: data.aiAnalysis.riskScore > 75 ? "danger" : data.aiAnalysis.riskScore > 50 ? "warning" : "success"
        });
        loadConsoleData(); // refresh database states
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admit new patient profile
  const handleAdmitPatient = async (patientData) => {
    try {
      const res = await fetchWithAuth('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: patientData.name,
          age: patientData.age,
          gender: patientData.gender,
          bed: patientData.bed,
          department: patientData.department,
          status: 'Stable',
          details: patientData.details,
          primaryDoctorId: patientData.primaryDoctorId,
          primaryNurseId: patientData.primaryNurseId,
          diseases: patientData.diseases
        })
      });
      const data = await res.json();
      if (data.success) {
        addNotification({
          id: `NOTIFY-ADMIT-${Date.now()}`,
          title: "PATIENT ADMITTED",
          desc: `${patientData.name} has been successfully registered to bed ${patientData.bed}.`,
          type: "success"
        });
        await loadConsoleData(); // refresh database states
        return true;
      } else {
        alert("Failed to admit patient: " + data.message);
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Error admitting patient. Please check server logs.");
      return false;
    }
  };

  // Discharge active patient and trigger automatic PDF download of final clinical report
  const handleDischargePatient = async (patientId) => {
    try {
      const res = await fetchWithAuth(`/patients/${patientId}/discharge`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("Discharge failed: " + errorData.message);
        return false;
      }

      // Read PDF blob response and trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const patient = patients.find(p => p.id === patientId.toString());
      const filename = `Discharge_Report_${patient ? patient.name.replace(/\s+/g, '_') : patientId}.pdf`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        id: `NOTIFY-DISCHARGE-${Date.now()}`,
        title: "PATIENT DISCHARGED",
        desc: `Bed allocation cleared. Final clinical PDF downloaded successfully.`,
        type: "success"
      });

      // Refresh console datasets
      await loadConsoleData();
      
      // Navigate back to active dashboard
      setActivePage('dashboard');
      return true;
    } catch (err) {
      console.error(err);
      alert("Error discharging patient. Please ensure connection is active.");
      return false;
    }
  };

  // Update patient's clinical registry profile (notes, diagnoses, demographics)
  const handleUpdatePatientProfile = async (patientId, profileData) => {
    try {
      const res = await fetchWithAuth(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        addNotification({
          id: `NOTIFY-PROFILE-UPDATE-${Date.now()}`,
          title: "RECORD SYNCHRONIZED",
          desc: `Clinical profile data for ${profileData.name} successfully updated.`,
          type: "success"
        });
        await loadConsoleData(); // refresh database states
        return true;
      } else {
        alert("Failed to update patient record: " + data.message);
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Error updating patient registry. Please check server connectivity.");
      return false;
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const res = await fetchWithAuth('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(prev => ({
          ...prev,
          name: data.user.name,
          specialty: data.user.specialty
        }));
        addNotification({
          id: `NOTIFY-PROFILE-UPDATED-${Date.now()}`,
          title: "PROFILE SYNCHRONIZED",
          desc: `Your profile details have been successfully updated in the database.`,
          type: "success"
        });
        return true;
      } else {
        alert("Failed to update profile: " + data.message);
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Error updating clinician profile. Please verify server connectivity.");
      return false;
    }
  };

  const handleVoiceQuerySubmit = (e) => {
    e.preventDefault();
    if (!voiceQuery) return;
    setIsListening(true);
    setVoiceAnswer('');

    setTimeout(() => {
      setIsListening(false);
      const q = voiceQuery.toLowerCase();
      if (q.includes('vance') || q.includes('eleanor')) {
        const p = patients.find(pat => pat.id === '1');
        setVoiceAnswer(`Vitals for Eleanor Vance (${p.bed}): Heart rate is ${p.metrics.heartRate} bpm, Oxygen saturation ${p.metrics.oxygen}%, stability status is ${p.status.toUpperCase()}. AI deterioration score is ${p.riskScore}%.`);
      } else if (q.includes('alerts') || q.includes('emergency')) {
        setVoiceAnswer(`There are currently ${alerts.length} active alerts: ${alerts.map(a => a.patientName + " (" + a.vessel + ")").join(', ')}.`);
      } else if (q.includes('doctor') || q.includes('jenkins')) {
        setVoiceAnswer(`Dr. Sarah Jenkins is ONLINE and supervising ICU beds.`);
      } else {
        setVoiceAnswer(`Neural voice processor matches query: "${voiceQuery}". Try asking "vitals Eleanor Vance", "active alerts", or "doctors online".`);
      }
    }, 1000);
  };

  return (
    <div className="app-container">
      {/* Dynamic Background Parallax Orbs */}
      <div className="ambient-orb" style={{ width: '450px', height: '450px', background: 'radial-gradient(circle, var(--blue-glow) 0%, transparent 70%)', top: '5%', left: '10%', animation: 'aurora-drift 14s infinite alternate' }}></div>
      <div className="ambient-orb" style={{ width: '550px', height: '550px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', bottom: '10%', right: '5%', animation: 'aurora-drift 20s infinite alternate-reverse' }}></div>

      <div className="global-scanline"></div>

      {/* Header Panel */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerLeft} onClick={() => setActivePage('landing')}>
          <div style={styles.headerLogoBox}>
            <Activity size={22} className="heartbeat-pulse" color="var(--cyan-pulse)" />
          </div>
          <span style={styles.headerLogoText}>
            CareSync <span style={{ color: 'var(--cyan-pulse)', textShadow: '0 0 10px var(--primary-glow)' }}>AI</span>
          </span>
          <span style={styles.headerVersion}>TRAUMA COMMAND CENTER</span>
        </div>

        <div style={styles.headerRight}>
          {currentUser ? (
            <div style={styles.userBadge}>
              <UserCheck size={14} color="var(--recovery-mint)" />
              <span style={styles.userName}>{currentUser.name} ({currentUser.role})</span>
              <button 
                onClick={handleLogout} 
                style={styles.logoutBtn}
                title="Lock Terminal"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="btn-glass btn-glass-primary" onClick={() => setIsAuthModalOpen(true)}>
              <LogIn size={14} /> Clinical Credential Sign In
            </button>
          )}

          <button className="btn-glass" onClick={toggleTheme} style={styles.themeToggleBtn} aria-label="Toggle visual theme">
            {theme === 'dark' ? <Sun size={16} color="var(--royal-gold)" /> : <Moon size={16} color="var(--medical-blue)" />}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      {activePage === 'landing' ? (
        <LandingPage 
          onEnterDashboard={() => {
            if (!currentUser) {
              setIsAuthModalOpen(true);
            } else {
              setActivePage('dashboard');
            }
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      ) : activePage === 'patient-portal' && isPatientMode ? (
        null /* PatientPortal is rendered separately below */
      ) : (
        <div style={styles.mainContent}>
          {/* Sidebar Navigation */}
          <aside className="glass-panel" style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <span style={styles.sidebarSectionTitle}>CLINICAL CONSOLE</span>
            </div>
            
            <nav style={styles.navMenu}>
              <button 
                onClick={() => setActivePage('dashboard')} 
                className={`sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'dashboard' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'dashboard' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button 
                onClick={() => {
                  if (patients.length > 0 && !selectedPatient) {
                    setSelectedPatient(patients[0]);
                  }
                  setActivePage('profile');
                }} 
                className={`sidebar-nav-item ${activePage === 'profile' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'profile' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'profile' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <UserCheck size={18} />
                <span>Patient HUD</span>
              </button>

              <button 
                onClick={() => setActivePage('alerts')} 
                className={`sidebar-nav-item ${activePage === 'alerts' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'alerts' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'alerts' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <ShieldAlert size={18} color={alerts.length > 0 ? 'var(--emergency-crimson)' : 'var(--text-main)'} className={alerts.length > 0 ? 'heartbeat-pulse' : ''} />
                <span>Alerts Feed</span>
                {alerts.length > 0 && <span style={styles.alertsBadge}>{alerts.length}</span>}
              </button>

              <button 
                onClick={() => setActivePage('prediction')} 
                className={`sidebar-nav-item ${activePage === 'prediction' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'prediction' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'prediction' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <BrainCircuit size={18} />
                <span>AI Risk Center</span>
              </button>

              <button 
                onClick={() => setActivePage('analytics')} 
                className={`sidebar-nav-item ${activePage === 'analytics' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'analytics' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'analytics' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>

              <button 
                onClick={() => setActivePage('command')} 
                className={`sidebar-nav-item ${activePage === 'command' ? 'active' : ''}`}
                style={{
                  ...styles.navItem,
                  background: activePage === 'command' ? 'var(--nav-active)' : 'transparent',
                  color: activePage === 'command' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                }}
              >
                <Compass size={18} />
                <span>Command HUD</span>
              </button>

              {currentUser && (
                <button 
                  onClick={() => setActivePage('profile-clinician')} 
                  className={`sidebar-nav-item ${activePage === 'profile-clinician' ? 'active' : ''}`}
                  style={{
                    ...styles.navItem,
                    background: activePage === 'profile-clinician' ? 'var(--nav-active)' : 'transparent',
                    color: activePage === 'profile-clinician' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                  }}
                >
                  <UserCheck size={18} />
                  <span>My Profile</span>
                </button>
              )}

              {currentUser && currentUser.role === 'Admin' && (
                <button 
                  onClick={() => setActivePage('clinicians')} 
                  className={`sidebar-nav-item ${activePage === 'clinicians' ? 'active' : ''}`}
                  style={{
                    ...styles.navItem,
                    background: activePage === 'clinicians' ? 'var(--nav-active)' : 'transparent',
                    color: activePage === 'clinicians' ? 'var(--cyan-pulse)' : 'var(--text-main)',
                  }}
                >
                  <UserCheck size={18} />
                  <span>Manage Staff</span>
                </button>
              )}

              {/* Generate Portal Key — Admin or Nurse only */}
              {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Nurse') && (
                <button 
                  onClick={() => setShowTokenModal(true)} 
                  className="sidebar-nav-item"
                  style={{
                    ...styles.navItem,
                    background: 'rgba(16, 185, 129, 0.06)',
                    color: 'var(--recovery-mint)',
                    border: '1px dashed rgba(16, 185, 129, 0.2)',
                    marginTop: '8px',
                  }}
                >
                  <KeyRound size={18} />
                  <span>Generate Portal Key</span>
                </button>
              )}
            </nav>
          </aside>

          {/* Subpage Container */}
          <main style={styles.pageBody} className="fade-up-stagger">
            {activePage === 'dashboard' && (
              <Dashboard 
                patients={patients} 
                onSelectPatient={(p) => setSelectedPatient(p)} 
                onViewPage={(page) => setActivePage(page)} 
                alerts={alerts}
                doctors={doctors}
                currentUser={currentUser}
                staff={staff}
                onAdmitPatient={handleAdmitPatient}
              />
            )}

            {activePage === 'profile' && (
              <PatientProfile 
                patient={selectedPatient} 
                allPatients={patients}
                onUpdatePatient={handleUpdatePatient}
                currentUser={currentUser}
                onDischargePatient={handleDischargePatient}
                onUpdatePatientProfile={handleUpdatePatientProfile}
              />
            )}

            {activePage === 'profile-clinician' && (
              <MyProfile 
                currentUser={currentUser}
                patients={patients}
                onUpdateProfile={handleUpdateProfile}
                onSelectPatient={(p) => {
                  setSelectedPatient(p);
                  setActivePage('profile');
                }}
              />
            )}

            {activePage === 'alerts' && (
              <AlertCenter 
                alerts={alerts} 
                onResolveAlert={resolveAlert}
                onAddNotification={addNotification}
              />
            )}

            {activePage === 'analytics' && (
              <Analytics patients={patients} />
            )}

            {activePage === 'prediction' && (
              <PredictionCenter />
            )}

            {activePage === 'command' && (
              <CommandCenter onAddNotification={addNotification} />
            )}

            {activePage === 'clinicians' && (
              <ClinicianManager 
                apiBase={API_BASE}
                authToken={authToken} 
                addNotification={addNotification} 
              />
            )}
          </main>
        </div>
      )}

      {/* Patient Portal Full Page (when patient is logged in) */}
      {isPatientMode && activePage === 'patient-portal' && (
        <div style={{ margin: '10px 24px 24px 24px' }}>
          <PatientPortal 
            portalToken={portalToken}
            patientId={portalPatientId}
            onLogout={handlePatientLogout}
          />
        </div>
      )}

      {/* Floating Notifications Toaster */}
      <div style={styles.toaster}>
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className="glass-panel" 
            style={{
              ...styles.toastCard,
              borderLeft: `4px solid ${notif.type === 'danger' ? 'var(--emergency-crimson)' : notif.type === 'warning' ? 'var(--royal-gold)' : 'var(--recovery-mint)'}`
            }}
          >
            <Bell size={18} color="var(--cyan-pulse)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>{notif.title}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Voice Assistant Speech HUD */}
      {activePage !== 'landing' && (
        <div style={styles.voiceAssistantContainer}>
          <button className="btn-glass btn-glass-primary" style={styles.voiceTriggerBtn} onClick={() => setVoiceOpen(!voiceOpen)} aria-label="Open voice dictate panel">
            <Mic size={18} />
          </button>
          
          {voiceOpen && (
            <div className="glass-panel" style={styles.voiceCard}>
              <div style={styles.voiceHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrainCircuit size={16} color="var(--cyan-pulse)" />
                  <span style={styles.voiceTitle}>CareSync Speech Engine</span>
                </div>
                <button style={styles.closeVoiceBtn} onClick={() => setVoiceOpen(false)}><X size={14} /></button>
              </div>

              <form onSubmit={handleVoiceQuerySubmit} style={styles.voiceForm}>
                <input 
                  type="text" 
                  placeholder="Ask CareSync AI (e.g., vitals Vance, active alerts)..."
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  style={styles.voiceInput}
                />
                <button type="submit" className="btn-glass btn-glass-primary" style={{ padding: '6px 12px' }}>
                  {isListening ? 'Processing...' : 'Transmit'}
                </button>
              </form>

              {voiceAnswer && (
                <div style={styles.voiceAnswerBox}>
                  <strong>AI Response:</strong>
                  <p style={styles.voiceAnswerText}>{voiceAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Auth Login Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
        onPatientLogin={handlePatientLogin}
      />

      {/* Token Generation Modal (for nurse/admin) */}
      {showTokenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '30px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={20} color="var(--recovery-mint)" /> Generate Patient Portal Key
              </h2>
              <button onClick={() => { setShowTokenModal(false); setGeneratedToken(null); setTokenGenPatientId(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {!generatedToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>SELECT PATIENT</label>
                  <select 
                    value={tokenGenPatientId} 
                    onChange={(e) => setTokenGenPatientId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                  >
                    <option value="">Choose a patient...</option>
                    {patients.filter(p => p.status !== 'Discharged').map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.department} (Bed: {p.bed})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-glass" onClick={() => { setShowTokenModal(false); setGeneratedToken(null); }} style={{ flex: 1 }}>Cancel</button>
                  <button className="btn-glass btn-glass-primary" onClick={handleGeneratePortalToken} disabled={tokenGenLoading || !tokenGenPatientId} style={{ flex: 2 }}>
                    {tokenGenLoading ? 'Generating...' : 'Generate Access Key'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="var(--recovery-mint)" />
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Portal key for <strong style={{ color: 'var(--text-main)' }}>{generatedToken.patientName}</strong></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--recovery-mint)', letterSpacing: '0.05em', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      {generatedToken.token}
                    </span>
                    <button onClick={copyTokenToClipboard} className="btn-glass" style={{ padding: '8px' }} title="Copy to clipboard">
                      {tokenCopied ? <CheckCircle2 size={16} color="var(--recovery-mint)" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Share this key with the patient. They can use it on the login page → Patient Portal tab.</p>
                <button className="btn-glass btn-glass-primary" onClick={() => { setShowTokenModal(false); setGeneratedToken(null); setTokenGenPatientId(''); }} style={{ width: '100%' }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    margin: '15px 24px',
    borderRadius: '14px',
    boxShadow: 'var(--shadow-main)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  headerLogoBox: {
    padding: '6px',
    borderRadius: '8px',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  headerLogoText: {
    fontSize: '1.35rem',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  headerVersion: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-glass)',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.1em',
    marginLeft: '12px',
    fontFamily: 'var(--font-heading)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--nav-active)',
    border: '1px solid var(--border-glass)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.82rem',
  },
  userName: {
    fontWeight: '600',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--emergency-crimson)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '6px',
  },
  themeToggleBtn: {
    padding: '8px',
    borderRadius: '8px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    minHeight: 'calc(100vh - 120px)',
    margin: '10px 24px 24px 24px',
    gap: '24px',
  },
  sidebar: {
    padding: '24px 18px',
    height: 'fit-content',
  },
  sidebarHeader: {
    marginBottom: '20px',
    paddingLeft: '8px',
  },
  sidebarSectionTitle: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.12em',
    fontFamily: 'var(--font-heading)',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-main)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'var(--font-heading)',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  alertsBadge: {
    position: 'absolute',
    right: '12px',
    backgroundColor: 'var(--emergency-crimson)',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '0.65rem',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  pageBody: {
    minHeight: '100%',
  },
  toaster: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 999,
    maxWidth: '360px',
  },
  toastCard: {
    padding: '14px 18px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    boxShadow: 'var(--shadow-main)',
  },
  voiceAssistantContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999,
  },
  voiceTriggerBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    padding: 0,
    boxShadow: '0 8px 25px var(--primary-glow)',
  },
  voiceCard: {
    position: 'absolute',
    bottom: '60px',
    right: 0,
    width: '330px',
    padding: '18px',
    boxShadow: 'var(--shadow-main)',
  },
  voiceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '8px',
    marginBottom: '12px',
  },
  voiceTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  closeVoiceBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  voiceForm: {
    display: 'flex',
    gap: '8px',
  },
  voiceInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none',
  },
  voiceAnswerBox: {
    marginTop: '12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '0.75rem',
  },
  voiceAnswerText: {
    color: 'var(--text-muted)',
    marginTop: '4px',
    lineHeight: '1.4',
  }
};
export { styles as appStyles };
