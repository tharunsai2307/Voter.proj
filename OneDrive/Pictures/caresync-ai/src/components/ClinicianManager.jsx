import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Lock, RefreshCw, Briefcase, Key, Mail, CheckCircle } from 'lucide-react';

export default function ClinicianManager({ apiBase = 'http://localhost:5000/api', authToken, addNotification }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null); // stores generated credentials to show Admin

  const fetchUsers = async () => {
    setIsListLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.warn("Failed to fetch clinician profiles:", error.message);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-generate credentials based on input name and role
  const handleAutoGenerate = () => {
    if (!name.trim()) {
      alert("Please provide the clinician's full name first to generate credentials.");
      return;
    }

    // Generate clean email first.last@caresync.ai
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '.');
    const generatedEmail = `${cleanName}@caresync.ai`;
    
    // Generate secure random clinical token
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedPassword = `CareSync@${randomDigits}`;

    setEmail(generatedEmail);
    setPassword(generatedPassword);
    
    addNotification({
      id: `NOTIFY-GEN-${Date.now()}`,
      title: "CREDENTIALS GENERATED",
      desc: "Secure Access ID & Crypto Token have been generated successfully.",
      type: "success"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      alert("Please fill in all clinician registry fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, email, password, role, specialty: specialty || 'General Practice' })
      });

      const data = await res.json();
      if (data.success) {
        // Show credentials details popup for the admin
        setCredentialsModal({
          name,
          email,
          password,
          role,
          specialty: specialty || 'General Practice'
        });

        addNotification({
          id: `NOTIFY-REG-${Date.now()}`,
          title: "CLINICIAN PROFILE CREATED",
          desc: `${name} registered as attending ${role}.`,
          type: "success"
        });

        // Reset form
        setName('');
        setSpecialty('');
        setEmail('');
        setPassword('');
        
        // Refresh list
        fetchUsers();
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      alert("Error contacting the clinical server. Please ensure connection is active.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Credentials Confirmation Overlay Popup */}
      {credentialsModal && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={styles.credentialsCard}>
            <div style={styles.popupHeader}>
              <CheckCircle size={32} color="var(--recovery-mint)" className="heartbeat-pulse" />
              <h3 style={{ margin: '10px 0 5px 0', color: 'var(--text-main)', fontSize: '1.25rem' }}>Attending Profile Active</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provide the credentials below to the clinical staff member.</p>
            </div>
            
            <div style={styles.credsGrid}>
              <div style={styles.credsRow}>
                <span style={styles.credsLabel}>Clinician Name:</span>
                <strong style={styles.credsVal}>{credentialsModal.name}</strong>
              </div>
              <div style={styles.credsRow}>
                <span style={styles.credsLabel}>Clinical Role / Dept:</span>
                <strong style={styles.credsVal}>{credentialsModal.role} ({credentialsModal.specialty})</strong>
              </div>
              <div style={styles.credsRow}>
                <span style={styles.credsLabel}>Access ID (Email):</span>
                <span style={{ ...styles.credsVal, color: 'var(--cyan-pulse)', fontFamily: 'monospace' }}>{credentialsModal.email}</span>
              </div>
              <div style={styles.credsRow}>
                <span style={styles.credsLabel}>Crypto Token (Password):</span>
                <span style={{ ...styles.credsVal, color: 'var(--royal-gold)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{credentialsModal.password}</span>
              </div>
            </div>

            <button 
              className="btn-glass btn-glass-primary" 
              onClick={() => setCredentialsModal(null)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        
        {/* Registration Form Panel */}
        <div className="glass-panel" style={styles.leftCard}>
          <div style={styles.cardHeader}>
            <UserPlus size={20} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>Register attending Clinician</h3>
          </div>
          <p style={styles.description}>
            Initialize credentials and access index databases for newly admitted physicians and trauma nurses.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>FULL CLINICIAN NAME</label>
              <input
                type="text"
                placeholder="e.g. Dr. Arthur Pendelton"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>CLINICAL ROLE</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={styles.select}
                >
                  <option value="Doctor">Attending Doctor</option>
                  <option value="Nurse">Attending Nurse</option>
                  <option value="Admin">Chief Admin</option>
                </select>
              </div>

              <div style={{ ...styles.inputGroup, flex: 1.2 }}>
                <label style={styles.label}>SPECIALTY / WARD</label>
                <div style={styles.inputWrapper}>
                  <Briefcase size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="e.g. ICU General RN, Neurologist"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>
            </div>

            <div style={styles.credentialsGenerationBlock}>
              <div style={styles.genHeader}>
                <label style={styles.label}>SECURE ACCESS PROFILE CREDENTIALS</label>
                <button 
                  type="button" 
                  onClick={handleAutoGenerate}
                  className="btn-glass"
                  style={styles.generateBtn}
                >
                  ⚡ Auto-Generate ID & Token
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>ACCESS ID (EMAIL)</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="first.last@caresync.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.inputWithIcon}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>CRYPTO SECURITY TOKEN (PASSWORD)</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Strong security token"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.inputWithIcon}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-glass btn-glass-primary"
              disabled={isLoading}
              style={{ padding: '12px 24px', marginTop: '10px' }}
            >
              {isLoading ? 'Registering Attending...' : 'Register Attending Clinician'}
            </button>
          </form>
        </div>

        {/* Clinician Directory Panel */}
        <div className="glass-panel" style={styles.rightCard}>
          <div style={styles.cardHeader}>
            <Users size={20} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>Attending Clinicians Directory</h3>
            <button 
              className="btn-glass" 
              onClick={fetchUsers}
              style={{ marginLeft: 'auto', padding: '6px' }}
              title="Refresh Directory"
            >
              <RefreshCw size={14} className={isListLoading ? 'spin-anim' : ''} />
            </button>
          </div>
          <p style={styles.description}>
            Registry log of staff indexes authorized with cryptographic credentials on this command console.
          </p>

          <div style={styles.tableContainer}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Clinician</th>
                  <th>Clinical Role</th>
                  <th>Access ID</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u) => {
                    let roleBadge = 'badge-stable';
                    if (u.role === 'Admin') roleBadge = 'badge-critical';
                    else if (u.role === 'Doctor') roleBadge = 'badge-warning';

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.specialty}</div>
                        </td>
                        <td>
                          <span className={`badge ${roleBadge}`} style={{ fontSize: '0.65rem' }}>{u.role}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {u.email}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {isListLoading ? 'Syncing clinician profiles...' : 'No clinician records logged.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
  },
  leftCard: {
    padding: '24px',
    background: 'var(--bg-card)',
    height: 'fit-content',
  },
  rightCard: {
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
    transition: 'all var(--transition-fast)',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
    cursor: 'pointer',
    height: '40px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
  },
  credentialsGenerationBlock: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '6px',
  },
  genHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  generateBtn: {
    fontSize: '0.72rem',
    padding: '4px 10px',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  tableContainer: {
    maxHeight: '480px',
    overflowY: 'auto',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 16, 0.9)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  credentialsCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '30px',
    background: 'var(--bg-card)',
    boxShadow: 'var(--shadow-main)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  popupHeader: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  credsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  credsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px dashed var(--border-glass)',
  },
  credsLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  credsVal: {
    fontSize: '0.85rem',
    color: 'var(--text-main)',
  }
};
