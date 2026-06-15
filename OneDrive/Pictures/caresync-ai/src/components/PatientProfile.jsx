import React, { useEffect, useRef, useState } from 'react';
import { Heart, Activity, Thermometer, User, ShieldAlert, Calendar, Plus, Download, Printer, RefreshCw, Upload, FileText } from 'lucide-react';
import Reports from './Reports';

export default function PatientProfile({ patient, allPatients, onUpdatePatient, currentUser, onDischargePatient, onUpdatePatientProfile }) {
  const canvasRef = useRef(null);
  const [pain, setPain] = useState(patient?.metrics?.painScore || 0);
  const [isDischarging, setIsDischarging] = useState(false);
  const [sugar, setSugar] = useState(patient?.metrics?.bloodSugar || 100);
  const [oxygen, setOxygen] = useState(patient?.metrics?.oxygen || 95);
  const [heartRate, setHeartRate] = useState(patient?.metrics?.heartRate || 75);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editBed, setEditBed] = useState('');
  const [editDept, setEditDept] = useState('ICU');
  const [editDetails, setEditDetails] = useState('');
  const [editDiseases, setEditDiseases] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventText, setNewEventText] = useState('');
  const [editMedications, setEditMedications] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  // Diagnostic Report Upload States
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (patient) {
      setPain(patient.metrics.painScore || 0);
      setSugar(patient.metrics.bloodSugar || 100);
      setOxygen(patient.metrics.oxygen || 95);
      setHeartRate(patient.metrics.heartRate || 75);

      setEditName(patient.name || '');
      setEditAge(patient.age || '');
      setEditGender(patient.gender || 'Male');
      setEditBed(patient.bed || '');
      setEditDept(patient.department || 'ICU');
      setEditDetails(patient.details || '');
      setEditDiseases(patient.diseases || []);
      setEditHistory(patient.history || []);
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventText('');
      setEditMedications(patient.medications || []);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedFreq('');
      setIsEditingProfile(currentUser?.role === 'Doctor');
      setAnalysisResult(null);
      setErrorMessage(null);
    }
  }, [patient, currentUser]);

  // Canvas ECG with sweeping radar grids
  useEffect(() => {
    if (!canvasRef.current || patient.disease !== 'Heart Disease') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let x = 0;
    const points = [];
    const width = canvas.width;
    const height = canvas.height;

    const generateECGValue = (tick, hr) => {
      const period = Math.floor(600 / (hr / 60));
      const phase = tick % period;
      const baseline = height / 2;
      
      if (phase < 15) {
        return baseline - Math.sin((phase / 15) * Math.PI) * 6;
      } else if (phase >= 15 && phase < 25) {
        return baseline;
      } else if (phase >= 25 && phase < 28) {
        return baseline + 4;
      } else if (phase >= 28 && phase < 33) {
        const progress = (phase - 28) / 5;
        return baseline - Math.sin(progress * Math.PI) * (height * 0.45);
      } else if (phase >= 33 && phase < 38) {
        const progress = (phase - 33) / 5;
        return baseline + Math.sin(progress * Math.PI) * 12;
      } else if (phase >= 38 && phase < 45) {
        return baseline;
      } else if (phase >= 45 && phase < 65) {
        return baseline - Math.sin(((phase - 45) / 20) * Math.PI) * 10;
      } else {
        return baseline;
      }
    };

    let tick = 0;
    const draw = () => {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Draw glowing grid background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // ECG wave math
      const y = generateECGValue(tick, heartRate);
      points.push({ x, y });
      if (points.length > width) {
        points.shift();
      }

      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
      
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const screenX = i;
        if (i === 0) ctx.moveTo(screenX, pt.y);
        else ctx.lineTo(screenX, pt.y);
      }
      ctx.stroke();
      
      // Radar sweeping scanner line
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tick % width, 0);
      ctx.lineTo(tick % width, height);
      ctx.stroke();

      tick++;
      x = (x + 1) % width;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [patient, heartRate]);

  if (!patient) {
    return (
      <div style={styles.noSelection}>
        <Activity size={48} color="var(--text-muted)" style={{ marginBottom: 15 }} />
        <h3>Select a Patient Profile</h3>
        <p>Choose a patient from the main registry to access full clinical telemetry HUD.</p>
      </div>
    );
  }

  const handleSaveMetrics = () => {
    const updated = {
      ...patient,
      metrics: {
        ...patient.metrics,
        painScore: Number(pain),
        bloodSugar: Number(sugar),
        oxygen: Number(oxygen),
        heartRate: Number(heartRate),
      },
      riskScore: Math.min(
        100,
        Math.max(
          10,
          Math.floor(
            (Number(pain) * 5) + 
            (100 - Number(oxygen)) * 6 + 
            (Number(heartRate) > 100 ? (Number(heartRate) - 100) * 1.5 : 0) +
            (Number(sugar) > 200 ? (Number(sugar) - 150) * 0.15 : 0)
          )
        )
      )
    };
    onUpdatePatient(updated);
  };

  const handleDischargeClick = async () => {
    const confirmDischarge = window.confirm(
      `Are you sure you want to authorize bed discharge for ${patient.name}? This will free up bed ${patient.bed || 'Unassigned'} and download their final clinical summary PDF.`
    );
    if (!confirmDischarge) return;

    setIsDischarging(true);
    await onDischargePatient(patient.id);
    setIsDischarging(false);
  };

  const handleDiseaseToggle = (disease) => {
    setEditDiseases(prev => 
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const handleSaveProfile = async () => {
    if (!editName || !editAge || !editBed || !editDept) {
      alert("Name, age, bed, and department are required clinical fields.");
      return;
    }

    let finalHistory = [...editHistory];
    if (patient.bed !== editBed) {
      finalHistory.push({
        date: new Date().toISOString().split('T')[0],
        event: `Bed transfer from ${patient.bed || 'Unassigned'} to ${editBed}`
      });
    }

    setIsSavingProfile(true);
    const success = await onUpdatePatientProfile(patient.id, {
      name: editName,
      age: parseInt(editAge, 10),
      gender: editGender,
      bed: editBed,
      department: editDept,
      details: editDetails,
      diseases: editDiseases,
      history: finalHistory,
      medications: editMedications
    });
    setIsSavingProfile(false);
    if (success) {
      setIsEditingProfile(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file format. Please upload PNG, JPG, WEBP, or PDF.");
      return;
    }

    setAnalyzingFile(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const response = await fetch(`http://localhost:5000/api/patients/${patient.id}/analyze-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('caresync_token')}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        const data = await response.json();
        if (data.success) {
          setAnalysisResult(data.analysis);
          // Trigger a parent state reload by passing an empty profile update
          await onUpdatePatientProfile(patient.id, {});
        } else {
          setErrorMessage(data.message || "Failed to analyze the diagnostic report.");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Connection error. Ensure the server is online.");
      } finally {
        setAnalyzingFile(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read diagnostic file.");
      setAnalyzingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const riskColor = patient.riskScore > 80 ? 'var(--emergency-crimson)' : patient.riskScore > 50 ? 'var(--royal-gold)' : 'var(--recovery-mint)';

  return (
    <div style={styles.container}>
      {/* Patient header */}
      <div className="glass-panel" style={styles.profileHeader}>
        <div style={styles.avatarContainer}>
          <User size={36} color="var(--cyan-pulse)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.titleRow}>
            <h2 style={styles.patientName}>{patient.name}</h2>
            <span className={`badge ${patient.status === 'Critical' ? 'badge-critical' : patient.status === 'High Risk' ? 'badge-warning' : 'badge-stable'}`}>
              {patient.status}
            </span>
          </div>
          <p style={styles.patientMeta}>
            ID: <strong style={{ color: 'var(--text-main)' }}>{patient.id}</strong> | Bed: <strong style={{ color: 'var(--text-main)' }}>{patient.bed}</strong> | Dept: <strong style={{ color: 'var(--text-main)' }}>{patient.department}</strong>
          </p>
        </div>

        {/* AI Radial Risk Gauge */}
        <div style={styles.radialGaugeWrapper}>
          <svg width="80" height="80" viewBox="0 0 36 36" style={styles.radialSvg}>
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-glass)" strokeWidth="3" />
            <circle 
              cx="18" 
              cy="18" 
              r="15" 
              fill="none" 
              stroke={riskColor} 
              strokeWidth="3" 
              strokeDasharray="94.2"
              strokeDashoffset={94.2 - (patient.riskScore / 100) * 94.2}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div style={styles.gaugeText}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: riskColor }}>{patient.riskScore}%</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>RISK</span>
          </div>
        </div>
      </div>

      <div style={styles.gridColumns}>
        <div style={styles.leftColumn}>
          {/* Disease Telemetry */}
          <div className="glass-panel" style={styles.monitoringBlock}>
            <div style={styles.blockHeader}>
              <div style={styles.headerTitleGroup}>
                <Activity size={18} color="var(--cyan-pulse)" />
                <h3 style={styles.blockTitle}>Telemetry Monitor: {patient.disease}</h3>
              </div>
              <span style={styles.diseaseBadge}>{patient.disease.toUpperCase()}</span>
            </div>

            {patient.disease === 'Heart Disease' && (
              <div style={styles.diseaseContainer}>
                <p style={styles.monitorIntro}>Active Electrocardiogram (ECG) telemetry stream:</p>
                <div style={styles.canvasContainer}>
                  <canvas ref={canvasRef} width="600" height="150" style={styles.ecgCanvas}></canvas>
                </div>

                <div style={styles.telemetryDashboard}>
                  <div style={styles.vitalsDial}>
                    <Heart size={16} color="var(--emergency-crimson)" className="heartbeat-pulse" />
                    <div>
                      <label style={styles.dialLabel}>HEART RATE</label>
                      <div style={styles.dialValue}>{heartRate} <span style={styles.unit}>bpm</span></div>
                    </div>
                  </div>
                  <div style={styles.vitalsDial}>
                    <Activity size={16} color="var(--cyan-pulse)" />
                    <div>
                      <label style={styles.dialLabel}>OXYGEN SpO2</label>
                      <div style={styles.dialValue}>{oxygen}%</div>
                    </div>
                  </div>
                  <div style={styles.vitalsDial}>
                    <Thermometer size={16} color="var(--royal-gold)" />
                    <div>
                      <label style={styles.dialLabel}>TEMPERATURE</label>
                      <div style={styles.dialValue}>{patient.metrics.temperature}°C</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {patient.disease === 'Cancer' && (
              <div style={styles.diseaseContainer}>
                <p style={styles.monitorIntro}>Oncology Patient Subjective Pain & Vitals Indices:</p>
                
                <div style={styles.slidersGrid}>
                  <div style={styles.sliderCard}>
                    <label style={styles.sliderLabel}>Subjective Pain Index (Current: {pain}/10)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      value={pain} 
                      onChange={(e) => setPain(e.target.value)}
                      style={styles.sliderRange} 
                    />
                    <div style={styles.sliderScale}>
                      <span>0 (None)</span>
                      <span>5 (Moderate)</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>

                  <div style={styles.sliderCard}>
                    <label style={styles.sliderLabel}>Fatigue Index (Current: {patient.metrics.fatigue}/10)</label>
                    <div style={styles.fatigueMeterContainer}>
                      <div style={{ ...styles.fatigueFill, width: `${patient.metrics.fatigue * 10}%` }}></div>
                    </div>
                    <span style={styles.fatigueText}>Grade {patient.metrics.fatigue > 7 ? '3 (Severe)' : patient.metrics.fatigue > 3 ? '2 (Moderate)' : '1 (Mild)'} Fatigue</span>
                  </div>
                </div>

                <div style={styles.cancerTrends}>
                  <h4 style={styles.subHeading}>Patient Weight Progression Log</h4>
                  <div style={styles.weightTrace}>
                    {patient.metrics.weightTrend ? patient.metrics.weightTrend.map((w, index) => (
                      <div key={index} style={styles.weightNode}>
                        <span style={styles.weightValue}>{w} kg</span>
                        <div style={{ ...styles.weightBar, height: `${(w - 70) * 8}px` }}></div>
                        <span style={styles.weightLabel}>Day -{patient.metrics.weightTrend.length - index - 1}</span>
                      </div>
                    )) : <span>No weight records available</span>}
                  </div>
                </div>
              </div>
            )}

            {patient.disease === 'Diabetes' && (
              <div style={styles.diseaseContainer}>
                <p style={styles.monitorIntro}>Glycemic Indexing and BP Tracking HUD:</p>

                <div style={styles.diabetesVitals}>
                  <div className="glass-panel" style={styles.sugarCard}>
                    <span style={styles.sugarLabel}>LATEST BLOOD GLUCOSE</span>
                    <span style={{ 
                      ...styles.sugarValue, 
                      color: sugar > 200 ? 'var(--emergency-crimson)' : sugar < 70 ? 'var(--royal-gold)' : 'var(--recovery-mint)'
                    }}>
                      {sugar} <span style={{ fontSize: '1rem' }}>mg/dL</span>
                    </span>
                    <span style={styles.sugarStatus}>
                      {sugar > 200 ? 'Hyperglycemia Spike' : sugar < 70 ? 'Hypoglycemia Alert' : 'Target Glycemic Range'}
                    </span>
                  </div>

                  <div className="glass-panel" style={styles.sugarCard}>
                    <span style={styles.sugarLabel}>BLOOD PRESSURE TRACKING</span>
                    <span style={styles.sugarValue}>{patient.metrics.bloodPressure} <span style={{ fontSize: '1rem' }}>mmHg</span></span>
                    <span style={styles.sugarStatus}>Systolic / Diastolic normal</span>
                  </div>
                </div>

                <div style={styles.sugarTrends}>
                  <h4 style={styles.subHeading}>6-Hour Blood Sugar Trend Chart</h4>
                  <div style={styles.sparkline}>
                    {patient.metrics.sugarHistory ? patient.metrics.sugarHistory.map((s, index) => (
                      <div key={index} style={styles.sparkNode}>
                        <div 
                          style={{ 
                            ...styles.sparkPoint, 
                            bottom: `${(s / 350) * 100}%`,
                            backgroundColor: s > 200 ? 'var(--emergency-crimson)' : s < 70 ? 'var(--royal-gold)' : 'var(--cyan-pulse)'
                          }} 
                          title={`${s} mg/dL`}
                        ></div>
                        <span style={styles.sparkLabel}>{index + 1}h ago</span>
                      </div>
                    )) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Simulating Metrics Editor Inputs */}
            <div style={styles.editorPanel}>
              <h4 style={styles.subHeading}>Simulate Live Vitals Update</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Modify parameters below to verify how CareSync AI alerts database and recalculates patient's deterioration scores.
              </p>
              <div style={styles.inputsRow}>
                <div style={styles.inputFieldGroup}>
                  <label style={styles.inputLabel}>Heart Rate</label>
                  <input 
                    type="number" 
                    value={heartRate} 
                    onChange={(e) => setHeartRate(e.target.value)} 
                    style={styles.numberInput} 
                  />
                </div>
                <div style={styles.inputFieldGroup}>
                  <label style={styles.inputLabel}>SpO2 %</label>
                  <input 
                    type="number" 
                    value={oxygen} 
                    onChange={(e) => setOxygen(e.target.value)} 
                    style={styles.numberInput} 
                  />
                </div>
                {patient.disease === 'Diabetes' && (
                  <div style={styles.inputFieldGroup}>
                    <label style={styles.inputLabel}>Blood Glucose</label>
                    <input 
                      type="number" 
                      value={sugar} 
                      onChange={(e) => setSugar(e.target.value)} 
                      style={styles.numberInput} 
                    />
                  </div>
                )}
                <button 
                  className="btn-glass btn-glass-primary" 
                  style={{ alignSelf: 'flex-end', height: '38px', padding: '0 15px' }}
                  onClick={handleSaveMetrics}
                >
                  <RefreshCw size={14} /> Commit Changes
                </button>
              </div>
            </div>
          </div>

          {/* Treatment Timeline */}
          <div className="glass-panel" style={styles.timelineBlock}>
            <h3 style={styles.blockTitle}>Active Treatment Timeline</h3>
            <div style={styles.timelineList}>
              {patient.timeline.map((item, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineBadgeColumn}>
                    <span style={{ 
                      ...styles.timelinePoint, 
                      backgroundColor: item.status === 'Critical' ? 'var(--emergency-crimson)' : item.status === 'High Risk' ? 'var(--royal-gold)' : 'var(--recovery-mint)'
                    }}></span>
                    {idx < patient.timeline.length - 1 && <div style={styles.timelineLine}></div>}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={styles.timelineTitle}>{item.title}</strong>
                      <span style={styles.timelineTime}>{item.time}</span>
                    </div>
                    <p style={styles.timelineDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Medical History and Reports */}
        <div style={styles.rightColumn}>
          {/* Medical Notes & Background */}
          <div className="glass-panel" style={styles.notesBlock}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--cyan-pulse)" />
                <h3 style={styles.blockTitle}>{isEditingProfile ? 'Edit Patient Registry' : 'Clinical Notes & History'}</h3>
              </div>
              
              {!isEditingProfile && patient.status !== 'Discharged' && currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Doctor') && (
                <button
                  type="button"
                  className="btn-glass"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setIsEditingProfile(true)}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
            
            {isEditingProfile ? (
              <div style={styles.editorForm}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.editorLabel}>PATIENT FULL NAME</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      style={styles.editorInput} 
                    />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 0.5 }}>
                    <label style={styles.editorLabel}>AGE</label>
                    <input 
                      type="number" 
                      value={editAge} 
                      onChange={(e) => setEditAge(e.target.value)} 
                      style={styles.editorInput} 
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.editorLabel}>GENDER</label>
                    <select 
                      value={editGender} 
                      onChange={(e) => setEditGender(e.target.value)} 
                      style={styles.editorSelect}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.editorLabel}>BED LOCATION</label>
                    <input 
                      type="text" 
                      value={editBed} 
                      onChange={(e) => setEditBed(e.target.value)} 
                      style={styles.editorInput} 
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.editorLabel}>CLINICAL DEPARTMENT</label>
                  <select 
                    value={editDept} 
                    onChange={(e) => setEditDept(e.target.value)} 
                    style={styles.editorSelect}
                  >
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.editorLabel}>DISEASES & CLINICAL CONDITIONS</label>
                  <div style={styles.checkboxGrid}>
                    {[
                      'Cancer', 'Diabetes', 'Heart Disease', 'Asthma', 'Dengue', 
                      'Kidney Disease', 'Pneumonia', 'Hypertension', 'Stroke', 'Diarrhea'
                    ].map(disease => {
                      const isSelected = editDiseases.includes(disease);
                      return (
                        <button
                          key={disease}
                          type="button"
                          onClick={() => handleDiseaseToggle(disease)}
                          style={{
                            ...styles.checkboxBtn,
                            padding: '6px',
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

                <div style={styles.formGroup}>
                  <label style={styles.editorLabel}>CLINICAL NOTES / DETAILS</label>
                  <textarea 
                    value={editDetails} 
                    onChange={(e) => setEditDetails(e.target.value)} 
                    style={styles.editorTextarea} 
                    rows="4" 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.editorLabel}>SURGICAL & CLINICAL HISTORY</label>
                  <div style={styles.historyEditorList}>
                    {editHistory.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px' }}>No medical history records.</span>
                    ) : (
                      editHistory.map((h, idx) => (
                        <div key={idx} style={styles.historyEditorItem}>
                          <span style={styles.historyEditorDate}>{h.date}</span>
                          <span style={styles.historyEditorEvent}>{h.event}</span>
                          <button
                            type="button"
                            onClick={() => setEditHistory(prev => prev.filter((_, i) => i !== idx))}
                            style={styles.deleteHistoryBtn}
                            title="Delete Event"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={styles.addHistoryForm}>
                    <input 
                      type="date" 
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      style={styles.historyDateInput}
                    />
                    <input 
                      type="text" 
                      placeholder="Add new history event..."
                      value={newEventText}
                      onChange={(e) => setNewEventText(e.target.value)}
                      style={styles.historyTextInput}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newEventText.trim()) return;
                        setEditHistory(prev => [...prev, { date: newEventDate, event: newEventText.trim() }]);
                        setNewEventText('');
                      }}
                      className="btn-glass btn-glass-primary"
                      style={styles.addHistoryBtn}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div style={styles.editorActions}>
                  <button 
                    type="button" 
                    className="btn-glass" 
                    style={{ flex: 1, padding: '8px' }} 
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-glass btn-glass-primary" 
                    style={{ flex: 2, padding: '8px' }} 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? 'Saving Record...' : 'Save Registry'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={styles.detailsParagraph}>{patient.details}</p>

                <div style={styles.metaRow}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <span style={styles.metaLabel}>Admitted: {patient.admissionDate}</span>
                </div>
                <div style={styles.metaRow}>
                  <User size={14} color="var(--text-muted)" />
                  <span style={styles.metaLabel}>Attending: {patient.primaryDoctor}</span>
                </div>

                <h4 style={{ ...styles.subHeading, marginTop: '20px' }}>Surgical & Disease History</h4>
                <ul style={styles.historyList}>
                  {patient.history.map((h, idx) => (
                    <li key={idx} style={styles.historyItem}>
                      <span style={styles.historyDate}>{h.date}</span>
                      <span style={styles.historyEvent}>{h.event}</span>
                    </li>
                  ))}
                </ul>

                {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Doctor') && patient.status !== 'Discharged' && (
                  <button 
                    type="button"
                    className="btn-glass" 
                    style={styles.dischargeBtn}
                    onClick={handleDischargeClick}
                    disabled={isDischarging}
                  >
                    {isDischarging ? 'Processing Discharge...' : '🏥 Authorize Bed Discharge'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Prescribed Medications Card */}
          <div className="glass-panel" style={styles.notesBlock}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--cyan-pulse)" />
                <h3 style={styles.blockTitle}>{isEditingProfile ? 'Manage Medications' : 'Active Prescribed Medications'}</h3>
              </div>
            </div>

            {isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.medsEditorList}>
                  {editMedications.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No medications currently prescribed.</span>
                  ) : (
                    editMedications.map((m, idx) => (
                      <div key={idx} style={styles.medsEditorItem}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{m.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{m.dosage} | {m.frequency}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditMedications(prev => prev.filter((_, i) => i !== idx))}
                          style={styles.deleteHistoryBtn}
                          title="Stop Medication"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.addMedForm}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Medication Name"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      style={styles.medInput}
                    />
                    <input 
                      type="text" 
                      placeholder="Dosage (e.g. 500mg)"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      style={{ ...styles.medInput, width: '130px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="Frequency (e.g. Twice daily)"
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      style={styles.medInput}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newMedName.trim() || !newMedDosage.trim() || !newMedFreq.trim()) {
                          alert("Drug name, dosage, and frequency are all required fields.");
                          return;
                        }
                        setEditMedications(prev => [...prev, { name: newMedName.trim(), dosage: newMedDosage.trim(), frequency: newMedFreq.trim() }]);
                        setNewMedName('');
                        setNewMedDosage('');
                        setNewMedFreq('');
                      }}
                      className="btn-glass btn-glass-primary"
                      style={styles.addMedBtn}
                    >
                      Prescribe
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.medsViewList}>
                {patient.medications && patient.medications.length > 0 ? (
                  <table style={styles.medsTable}>
                    <thead>
                      <tr>
                        <th style={styles.medsTh}>Drug Name</th>
                        <th style={styles.medsTh}>Dosage</th>
                        <th style={styles.medsTh}>Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.medications.map((m, idx) => (
                        <tr key={idx} style={styles.medsTr}>
                          <td style={styles.medsTd}><strong>{m.name}</strong></td>
                          <td style={styles.medsTd}>{m.dosage}</td>
                          <td style={styles.medsTd}>{m.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active clinical prescriptions logged.</span>
                )}
              </div>
            )}
          </div>

          {/* AI Diagnostic Lab */}
          <div className="glass-panel" style={styles.notesBlock}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <Upload size={18} color="var(--cyan-pulse)" />
              <h3 style={styles.blockTitle}>AI Diagnostic Lab</h3>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
              Upload lab results, blood panels, or diagnostics (PDF, PNG, JPG). CareSync AI extracts vitals and logs abnormal findings.
            </p>

            {patient.status === 'Discharged' ? (
              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                Cannot upload reports for discharged patients.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* File Drop/Uploader */}
                <div style={styles.uploadBox}>
                  <input
                    type="file"
                    id="diag-file-upload"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={analyzingFile}
                  />
                  <label htmlFor="diag-file-upload" style={{ ...styles.uploadLabel, cursor: analyzingFile ? 'default' : 'pointer' }}>
                    {analyzingFile ? (
                      <div style={styles.analyzingState}>
                        <div className="spinning" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✨</div>
                        <strong>AI Parsing File...</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Extracting clinical measurements</span>
                      </div>
                    ) : (
                      <div style={styles.uploadPlaceholder}>
                        <FileText size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                        <strong>Drag & Drop or Click to Upload</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PNG, JPG, WEBP, PDF</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--emergency-crimson)', color: 'var(--text-main)', fontSize: '0.75rem' }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Analysis Results Display */}
                {analysisResult && (
                  <div style={styles.analysisContainer}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--cyan-pulse)' }}>✨ AI Summary</strong>
                      <button 
                        onClick={() => setAnalysisResult(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Clear
                      </button>
                    </div>
                    
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      {analysisResult.summary}
                    </p>

                    {/* Abnormalities */}
                    {analysisResult.abnormalities && analysisResult.abnormalities.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--emergency-crimson)', marginBottom: '6px', letterSpacing: '0.05em' }}>FLAGGED ABNORMALITIES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {analysisResult.abnormalities.map((ab, idx) => (
                            <div key={idx} style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--emergency-crimson)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                              {ab}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Vitals */}
                    {analysisResult.vitals && Object.values(analysisResult.vitals).some(v => v !== null && v !== undefined) && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--cyan-pulse)', marginBottom: '6px', letterSpacing: '0.05em' }}>EXTRACTED VITALS LOGGED</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {Object.entries(analysisResult.vitals)
                            .filter(([_, val]) => val !== null && val !== undefined)
                            .map(([key, val]) => (
                              <div key={key} style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', fontSize: '0.72rem' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <strong style={{ color: 'var(--text-main)' }}>{val}</strong>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Action */}
                    {analysisResult.suggestedAction && (
                      <div style={{ padding: '8px 10px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderLeft: '3px solid var(--recovery-mint)', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--recovery-mint)', display: 'block', fontSize: '0.65rem', marginBottom: '2px', letterSpacing: '0.05em' }}>SUGGESTED CLINICAL ACTION</span>
                        <span style={{ color: 'var(--text-main)' }}>{analysisResult.suggestedAction}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exporter triggers */}
          <Reports selectedPatient={patient} allPatients={allPatients} />
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
  dischargeBtn: {
    marginTop: '20px',
    width: '100%',
    padding: '12px',
    border: '1px solid var(--emergency-crimson)',
    color: 'var(--text-main)',
    background: 'rgba(239, 68, 68, 0.08)',
    fontFamily: 'var(--font-heading)',
    fontWeight: '600',
    fontSize: '0.88rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  editorForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  editorLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  editorInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
    outline: 'none',
  },
  editorSelect: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
    outline: 'none',
    height: '36px',
    cursor: 'pointer',
  },
  editorTextarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
    outline: 'none',
    resize: 'none',
    fontFamily: 'var(--font-body)',
  },
  editorActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  checkboxBtn: {
    transition: 'all var(--transition-fast)',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    minHeight: '400px',
  },
  profileHeader: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'var(--bg-card)',
    position: 'relative',
  },
  avatarContainer: {
    padding: '12px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  patientName: {
    fontSize: '1.4rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  patientMeta: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  radialGaugeWrapper: {
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialSvg: {
    width: '100%',
    height: '100%',
  },
  gaugeText: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridColumns: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  monitoringBlock: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  blockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  blockTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-main)',
  },
  diseaseBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    background: 'var(--primary-glow)',
    color: 'var(--cyan-pulse)',
    padding: '4px 10px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-heading)',
  },
  monitorIntro: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  canvasContainer: {
    background: '#080c14',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  ecgCanvas: {
    width: '100%',
    height: '150px',
    display: 'block',
  },
  telemetryDashboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  vitalsDial: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dialLabel: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    display: 'block',
  },
  dialValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    color: 'var(--text-main)',
  },
  unit: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 'normal',
  },
  slidersGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  sliderCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    padding: '16px',
    borderRadius: '8px',
  },
  sliderLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-main)',
    fontWeight: '600',
    display: 'block',
    marginBottom: '10px',
  },
  sliderRange: {
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    accentColor: 'var(--cyan-pulse)',
  },
  sliderScale: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  fatigueMeterContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--border-glass)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  fatigueFill: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: '4px',
  },
  fatigueText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: '8px',
  },
  cancerTrends: {
    marginTop: '10px',
  },
  subHeading: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-heading)',
  },
  weightTrace: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-end',
    background: 'rgba(255,255,255,0.01)',
    padding: '16px',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
  },
  weightNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  weightBar: {
    width: '30px',
    backgroundColor: 'var(--medical-blue)',
    borderRadius: '4px 4px 0 0',
  },
  weightValue: {
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  weightLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
  },
  diabetesVitals: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  sugarCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sugarLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  sugarValue: {
    fontSize: '1.6rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
  },
  sugarStatus: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  sugarTrends: {
    marginTop: '10px',
  },
  sparkline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100px',
    borderBottom: '1px solid var(--border-glass)',
    padding: '0 10px 10px 10px',
    position: 'relative',
  },
  sparkNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '40px',
  },
  sparkPoint: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
  },
  sparkLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginTop: '110px',
    position: 'absolute',
  },
  editorPanel: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px dashed var(--border-glass)',
  },
  inputsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
  },
  inputFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '90px',
  },
  inputLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  numberInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    padding: '6px 8px',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
    fontSize: '0.85rem',
  },
  timelineBlock: {
    padding: '24px',
  },
  timelineList: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
  },
  timelineBadgeColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelinePoint: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginTop: '6px',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: 'var(--border-glass)',
    minHeight: '40px',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '16px',
  },
  timelineTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-main)',
  },
  timelineTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  timelineDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  notesBlock: {
    padding: '24px',
  },
  detailsParagraph: {
    fontSize: '0.85rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  metaLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  historyList: {
    listStyleType: 'none',
    padding: 0,
    marginTop: '10px',
  },
  historyItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-glass)',
  },
  historyDate: {
    fontSize: '0.7rem',
    color: 'var(--cyan-pulse)',
    fontWeight: '700',
  },
  historyEvent: {
    fontSize: '0.8rem',
    color: 'var(--text-main)',
    marginTop: '2px',
  },
  historyEditorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
    background: 'rgba(0,0,0,0.1)',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
    marginBottom: '8px',
  },
  historyEditorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.02)',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid var(--border-glass)',
  },
  historyEditorDate: {
    fontSize: '0.7rem',
    color: 'var(--cyan-pulse)',
    fontWeight: '700',
    minWidth: '75px',
  },
  historyEditorEvent: {
    fontSize: '0.78rem',
    color: 'var(--text-main)',
    flex: 1,
  },
  deleteHistoryBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'opacity var(--transition-fast)',
  },
  addHistoryForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  historyDateInput: {
    padding: '8px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none',
    width: '120px',
    cursor: 'pointer',
  },
  historyTextInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none',
  },
  addHistoryBtn: {
    padding: '0 12px',
    height: '34px',
    fontSize: '0.75rem',
  },
  medsEditorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '180px',
    overflowY: 'auto',
    background: 'rgba(0,0,0,0.1)',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid var(--border-glass)',
  },
  medsEditorItem: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid var(--border-glass)',
  },
  addMedForm: {
    marginTop: '10px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed var(--border-glass)',
    padding: '10px',
    borderRadius: '6px',
  },
  medInput: {
    flex: 1,
    padding: '8px',
    borderRadius: '6px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none',
  },
  addMedBtn: {
    padding: '0 16px',
    height: '34px',
    fontSize: '0.75rem',
  },
  medsViewList: {
    marginTop: '5px',
  },
  medsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
  },
  medsTh: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '1px solid var(--border-glass)',
    color: 'var(--text-muted)',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  medsTr: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
  },
  medsTd: {
    padding: '8px',
    color: 'var(--text-main)',
  },
  uploadBox: {
    border: '2px dashed var(--border-glass)',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '16px',
    textAlign: 'center',
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
    ':hover': {
      borderColor: 'var(--cyan-pulse)',
      background: 'rgba(6, 182, 212, 0.02)'
    }
  },
  uploadLabel: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    color: 'var(--text-main)',
    fontSize: '0.82rem',
  },
  analyzingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    color: 'var(--cyan-pulse)',
    fontSize: '0.82rem',
  },
  analysisContainer: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }
};
export { styles as profileStyles };
