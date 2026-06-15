import React, { useState } from 'react';
import { X, UserPlus, Heart, Activity } from 'lucide-react';

export default function AdmitPatientModal({ isOpen, onClose, staff, onAdmit }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bed, setBed] = useState('');
  const [department, setDepartment] = useState('ICU');
  const [details, setDetails] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [nurseId, setNurseId] = useState('');
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const doctors = staff.filter(s => s.role === 'Doctor');
  const nurses = staff.filter(s => s.role === 'Nurse');

  const availableDiseases = [
    'Cancer', 'Diabetes', 'Heart Disease', 'Asthma', 'Dengue', 
    'Kidney Disease', 'Pneumonia', 'Hypertension', 'Stroke', 'Diarrhea'
  ];

  const handleDiseaseToggle = (disease) => {
    setSelectedDiseases(prev => 
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age || !bed || !department) {
      alert("Please fill in name, age, bed number, and department.");
      return;
    }

    setIsSubmitting(true);
    const success = await onAdmit({
      name,
      age: parseInt(age, 10),
      gender,
      bed,
      department,
      details,
      primaryDoctorId: doctorId ? parseInt(doctorId, 10) : null,
      primaryNurseId: nurseId ? parseInt(nurseId, 10) : null,
      diseases: selectedDiseases
    });

    setIsSubmitting(false);
    if (success) {
      // Reset form
      setName('');
      setAge('');
      setGender('Male');
      setBed('');
      setDepartment('ICU');
      setDetails('');
      setDoctorId('');
      setNurseId('');
      setSelectedDiseases([]);
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.titleWrapper}>
            <UserPlus size={20} color="var(--cyan-pulse)" />
            <h3 style={styles.title}>Admit New Patient Profile</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 2 }}>
              <label style={styles.label}>PATIENT FULL NAME</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            
            <div style={{ ...styles.inputGroup, flex: 0.8 }}>
              <label style={styles.label}>AGE (YEARS)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={styles.input}
                min="0"
                max="125"
                required
              />
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>GENDER</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={styles.select}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>ASSIGNED BED</label>
              <input
                type="text"
                placeholder="e.g. ICU-05, WARD-12A"
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={{ ...styles.inputGroup, flex: 1.5 }}>
              <label style={styles.label}>CLINICAL DEPARTMENT</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} style={styles.select}>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="General Medicine">General Medicine</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>ATTENDING SPECIALIST DOCTOR</label>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} style={styles.select}>
                <option value="">-- Assign Attending Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>ATTENDING ATTENDING NURSE</label>
              <select value={nurseId} onChange={(e) => setNurseId(e.target.value)} style={styles.select}>
                <option value="">-- Assign Attending Nurse --</option>
                {nurses.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.specialty || 'Ward RN'})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>DISEASE-SPECIFIC DIAGNOSTIC GROUPS (SELECT ALL APPLICABLE)</label>
            <div style={styles.checkboxGrid}>
              {availableDiseases.map(disease => {
                const isSelected = selectedDiseases.includes(disease);
                return (
                  <button
                    key={disease}
                    type="button"
                    onClick={() => handleDiseaseToggle(disease)}
                    style={{
                      ...styles.checkboxBtn,
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.01)',
                      borderColor: isSelected ? 'var(--cyan-pulse)' : 'var(--border-glass)',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    {disease}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>CLINICAL NOTES / ADMISSION STATUS DETAILS</label>
            <textarea
              placeholder="e.g. Severe coronary artery disease, recovery observation, check vitals..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="btn-glass" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-glass btn-glass-primary" style={{ flex: 2 }} disabled={isSubmitting}>
              {isSubmitting ? 'Admitting Patient...' : 'Authorize Admission'}
            </button>
          </div>
        </form>
      </div>
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
    maxWidth: '560px',
    padding: '30px',
    background: 'var(--bg-card)',
    boxShadow: 'var(--shadow-main)',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '1.2rem',
    color: 'var(--text-main)',
    fontWeight: '600',
    fontFamily: 'var(--font-heading)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'inline-flex',
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
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
    resize: 'none',
    fontFamily: 'var(--font-body)',
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
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '8px',
    marginTop: '4px',
  },
  checkboxBtn: {
    padding: '8px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: '600',
    transition: 'all var(--transition-fast)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  }
};
