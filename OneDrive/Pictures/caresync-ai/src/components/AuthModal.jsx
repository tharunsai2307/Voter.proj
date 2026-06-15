import React, { useState } from 'react';
import { Shield, Lock, User, CheckCircle2, Fingerprint, KeyRound, Heart } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onPatientLogin }) {
  const [loginMode, setLoginMode] = useState('staff'); // 'staff' or 'patient'
  const [role, setRole] = useState('Doctor'); // Admin, Doctor, Nurse
  const [username, setUsername] = useState('doctor.jenkins@caresync.ai');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  // Patient portal login state
  const [portalKey, setPortalKey] = useState('');
  const [portalError, setPortalError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setPassword('password123');
    if (selectedRole === 'Admin') {
      setUsername('admin.chief@caresync.ai');
    } else if (selectedRole === 'Doctor') {
      setUsername('doctor.jenkins@caresync.ai');
    } else {
      setUsername('nurse.carter@caresync.ai');
    }
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setSuccess(true);
      setTimeout(() => {
        onLogin({ username, password, role });
        setSuccess(false);
        onClose();
      }, 1000);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onLogin({ username, password, role });
        setSuccess(false);
        onClose();
      }, 1000);
    }, 1200);
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    if (!portalKey.trim()) {
      setPortalError('Please enter your portal access key.');
      return;
    }
    setPortalLoading(true);
    setPortalError('');
    try {
      const res = await fetch(`http://localhost:5000/api/portal/token/validate/${portalKey.trim()}`);
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onPatientLogin({ token: data.token, patientId: data.patientId, patientName: data.patientName, isDischarged: data.isDischarged });
          setSuccess(false);
          setPortalKey('');
          onClose();
        }, 1000);
      } else {
        setPortalError(data.message || 'Invalid access key. Please try again.');
      }
    } catch (err) {
      setPortalError('Unable to connect to hospital server. Please try again later.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel auth-card" style={styles.modal}>
        {/* Biometric scanline overlay active during scanning */}
        {biometricScanning && <div style={styles.biometricScanline}></div>}
        
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Shield size={32} color="var(--cyan-pulse)" style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
          </div>
          <h2 style={styles.title} className="gold-gradient">CARESYNC SECURITY ACCESS</h2>
          <p style={styles.subtitle}>Smart Hospital Cryptographic Command Login</p>
        </div>

        {/* Mode Toggle: Staff vs Patient */}
        <div style={styles.modeToggle}>
          <button
            type="button"
            onClick={() => { setLoginMode('staff'); setPortalError(''); }}
            style={{
              ...styles.modeBtn,
              background: loginMode === 'staff' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: loginMode === 'staff' ? 'var(--cyan-pulse)' : 'var(--text-muted)',
              borderColor: loginMode === 'staff' ? 'var(--cyan-pulse)' : 'var(--border-glass)',
            }}
          >
            <Shield size={16} /> Clinical Staff
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('patient'); setPortalError(''); }}
            style={{
              ...styles.modeBtn,
              background: loginMode === 'patient' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: loginMode === 'patient' ? 'var(--recovery-mint)' : 'var(--text-muted)',
              borderColor: loginMode === 'patient' ? 'var(--recovery-mint)' : 'var(--border-glass)',
            }}
          >
            <Heart size={16} /> Patient Portal
          </button>
        </div>

        {success ? (
          <div style={styles.successContainer}>
            <CheckCircle2 size={64} color="var(--recovery-mint)" className="heartbeat-pulse" />
            <h3 style={{ color: 'var(--recovery-mint)', marginTop: 15, fontFamily: 'var(--font-heading)' }}>
              {loginMode === 'patient' ? 'ACCESS GRANTED' : 'CREDENTIALS VERIFIED'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {loginMode === 'patient' ? 'Loading your medical portal...' : 'Initializing clinical interface...'}
            </p>
          </div>
        ) : biometricScanning ? (
          <div style={styles.successContainer}>
            <Fingerprint size={64} color="var(--cyan-pulse)" style={{ animation: 'pulse-glow 1.2s infinite' }} />
            <h3 style={{ color: 'var(--cyan-pulse)', marginTop: 15, fontFamily: 'var(--font-heading)' }}>SCANNING BIOMETRICS</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verify identity index on sensor...</p>
          </div>
        ) : loginMode === 'patient' ? (
          /* ── PATIENT PORTAL LOGIN FORM ── */
          <form onSubmit={handlePatientLogin} style={styles.form}>
            <div style={styles.patientInfoBox}>
              <Heart size={18} color="var(--recovery-mint)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--recovery-mint)' }}>Patient Portal Access</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Enter the access key provided by your nurse or hospital administrator.
                </span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>PORTAL ACCESS KEY</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="text"
                  value={portalKey}
                  onChange={(e) => { setPortalKey(e.target.value.toUpperCase()); setPortalError(''); }}
                  placeholder="e.g. CS-A1B2C3D4"
                  style={styles.input}
                  autoFocus
                  required
                />
              </div>
              {portalError && (
                <span style={styles.errorText}>{portalError}</span>
              )}
            </div>

            <div style={styles.disclaimer}>
              Your medical records are protected by HIPAA regulations. Only authorized personnel can generate access keys.
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className="btn-glass"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-glass btn-glass-primary"
                style={{ flex: 2, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                disabled={portalLoading}
              >
                {portalLoading ? 'Verifying Key...' : 'Access My Records'}
              </button>
            </div>
          </form>
        ) : (
          /* ── STAFF LOGIN FORM ── */
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.roleSelector}>
              {['Admin', 'Doctor', 'Nurse'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  style={{
                    ...styles.roleBtn,
                    backgroundColor: role === r ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    borderColor: role === r ? 'var(--royal-gold)' : 'var(--border-glass)',
                    color: role === r ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: role === r ? '0 0 12px var(--primary-glow)' : 'none',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>CLINICAL ACCESS ID</label>
              <div style={styles.inputWrapper}>
                <User size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>CRYPTO SECURITY TOKEN</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Quick biometric scan shortcut */}
            <div 
              className="glass-panel glass-panel-hover" 
              style={styles.biometricBtn} 
              onClick={handleBiometricAuth}
            >
              <Fingerprint size={24} color="var(--cyan-pulse)" />
              <span>Use Simulated Biometric Bypass</span>
            </div>

            <div style={styles.disclaimer}>
              System login requests are recorded. Unauthorized entries violate HIPAA federal laws.
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className="btn-glass"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-glass btn-glass-primary"
                style={{ flex: 2 }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Authorize Terminal'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    padding: '35px 30px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(6, 182, 212, 0.15)',
  },
  biometricScanline: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '4px',
    background: 'linear-gradient(to bottom, var(--cyan-pulse), transparent)',
    boxShadow: '0 0 15px var(--cyan-pulse)',
    zIndex: 10,
    animation: 'scan-effect 2s infinite linear',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoContainer: {
    display: 'inline-flex',
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--primary-glow)',
    marginBottom: '12px',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  title: {
    fontSize: '1.45rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  modeToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  modeBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s',
    background: 'transparent',
  },
  patientInfoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  roleSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '5px',
  },
  roleBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
    transition: 'all var(--transition-fast)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all var(--transition-fast)',
  },
  errorText: {
    color: 'var(--emergency-crimson)',
    fontSize: '0.78rem',
    marginTop: '2px',
  },
  biometricBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px',
    cursor: 'pointer',
    background: 'rgba(6, 182, 212, 0.03)',
    border: '1px dashed rgba(6, 182, 212, 0.2)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: '1.4',
    padding: '8px',
    borderRadius: '6px',
    background: 'rgba(239, 68, 68, 0.03)',
    border: '1px solid rgba(239, 68, 68, 0.05)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '5px',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center',
  }
};
export { styles as authModalStyles };
export { styles as styles };
