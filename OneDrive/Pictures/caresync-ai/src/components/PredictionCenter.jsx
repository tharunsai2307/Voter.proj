import React, { useState } from 'react';
import { Brain, Sliders, ShieldAlert, CheckCircle, Flame, ArrowUpRight } from 'lucide-react';

export default function PredictionCenter() {
  const [systolic, setSystolic] = useState(120);
  const [spo2, setSpo2] = useState(98);
  const [heartRate, setHeartRate] = useState(72);
  const [temperature, setTemperature] = useState(37.0);

  // Computed MEWS (Modified Early Warning Score) / AI Deterioration Risk Score
  // Logic:
  // - SpO2: 95-100 = 0 pts, 92-94 = 2 pts, <92 = 4 pts
  // - Heart Rate: 50-90 = 0 pts, 91-110 = 1 pt, >110 = 3 pts, <50 = 2 pts
  // - Systolic BP: 100-140 = 0 pts, 141-159 = 1 pt, >160 = 2 pts, <100 = 3 pts
  // - Temp: 36-38 = 0 pts, >38 or <36 = 2 pts
  const computeMEWSPoints = () => {
    let score = 0;
    if (spo2 < 92) score += 4;
    else if (spo2 <= 94) score += 2;

    if (heartRate > 110 || heartRate < 45) score += 3;
    else if (heartRate > 90 || heartRate < 50) score += 1;

    if (systolic < 90) score += 3;
    else if (systolic < 100 || systolic >= 160) score += 2;
    else if (systolic >= 140) score += 1;

    if (temperature > 38.5 || temperature < 35.5) score += 3;
    else if (temperature > 37.8 || temperature < 36.0) score += 1;

    return score;
  };

  const mewsPoints = computeMEWSPoints();
  const maxMews = 13;
  const riskPercent = Math.min(100, Math.round((mewsPoints / maxMews) * 100));

  let riskCategory = "STABLE / LOW RISK";
  let riskColor = "var(--success)";
  let recommendations = [
    "Continue standard continuous ward telemetry.",
    "Re-assess vitals every 6 to 8 hours.",
    "Standard discharge pathways apply."
  ];

  if (riskPercent > 60) {
    riskCategory = "CRITICAL / SEVERE DETERIORATION";
    riskColor = "var(--danger)";
    recommendations = [
      "IMMEDIATE Action: Activate Rapid Response ICU pager code RED.",
      "Increase oxygen delivery via face mask or high flow nasal cannula.",
      "Prepare bedside resuscitation cart and emergency airway cart.",
      "Continuous arterial line setup for blood pressure tracking."
    ];
  } else if (riskPercent > 25) {
    riskCategory = "HIGH RISK / INSTABILITY DETECTED";
    riskColor = "var(--warning)";
    recommendations = [
      "Notify attending medical registrar for urgent bedside audit.",
      "Increase telemetry assessment intervals to every 30 minutes.",
      "Check blood gas analysis (ABG) and lactate levels immediately.",
      "Verify patent IV access ports."
    ];
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        
        {/* Risk Calculator Inputs */}
        <div className="glass-panel" style={styles.leftCard}>
          <div style={styles.cardHeader}>
            <Sliders size={20} color="var(--primary)" />
            <h3 style={styles.cardTitle}>AI Clinical Simulation Inputs</h3>
          </div>
          <p style={styles.description}>
            Manipulate virtual telemetry dials below to observe neural predictive risk updates in real-time.
          </p>

          <div style={styles.controls}>
            {/* SpO2 dial */}
            <div style={styles.controlRow}>
              <div style={styles.controlMeta}>
                <span style={styles.inputName}>Oxygen Saturation (SpO2)</span>
                <strong style={{ color: spo2 < 92 ? 'var(--danger)' : spo2 < 95 ? 'var(--warning)' : 'var(--text-main)' }}>{spo2}%</strong>
              </div>
              <input 
                type="range" 
                min="85" 
                max="100" 
                value={spo2} 
                onChange={(e) => setSpo2(Number(e.target.value))} 
                style={styles.slider} 
              />
            </div>

            {/* Heart Rate dial */}
            <div style={styles.controlRow}>
              <div style={styles.controlMeta}>
                <span style={styles.inputName}>Heart Rate (HR)</span>
                <strong style={{ color: heartRate > 100 || heartRate < 50 ? 'var(--danger)' : 'var(--text-main)' }}>{heartRate} bpm</strong>
              </div>
              <input 
                type="range" 
                min="40" 
                max="150" 
                value={heartRate} 
                onChange={(e) => setHeartRate(Number(e.target.value))} 
                style={styles.slider} 
              />
            </div>

            {/* Systolic Blood Pressure */}
            <div style={styles.controlRow}>
              <div style={styles.controlMeta}>
                <span style={styles.inputName}>Systolic BP</span>
                <strong style={{ color: systolic < 90 || systolic > 150 ? 'var(--danger)' : 'var(--text-main)' }}>{systolic} mmHg</strong>
              </div>
              <input 
                type="range" 
                min="70" 
                max="200" 
                value={systolic} 
                onChange={(e) => setSystolic(Number(e.target.value))} 
                style={styles.slider} 
              />
            </div>

            {/* Body Temperature */}
            <div style={styles.controlRow}>
              <div style={styles.controlMeta}>
                <span style={styles.inputName}>Body Temperature</span>
                <strong style={{ color: temperature > 38 || temperature < 36 ? 'var(--danger)' : 'var(--text-main)' }}>{temperature.toFixed(1)} °C</strong>
              </div>
              <input 
                type="range" 
                min="34.0" 
                max="41.0" 
                step="0.1"
                value={temperature} 
                onChange={(e) => setTemperature(Number(e.target.value))} 
                style={styles.slider} 
              />
            </div>
          </div>
        </div>

        {/* Prediction Results HUD */}
        <div style={styles.rightColumn}>
          {/* AI Score meter */}
          <div className="glass-panel" style={styles.scoreCard}>
            <div style={styles.cardHeader}>
              <Brain size={20} color="var(--primary)" />
              <h3 style={styles.cardTitle}>Deterioration Neural Analysis</h3>
            </div>

            <div style={styles.radialGaugeContainer}>
              {/* Semi-circular gauge representation */}
              <svg width="180" height="100" viewBox="0 0 100 50" style={{ display: 'block', margin: '0 auto' }}>
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke="var(--border-glass)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke={riskColor} 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (riskPercent / 100) * 125.6}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={styles.gaugeTextContainer}>
                <span style={{ ...styles.riskPercentVal, color: riskColor }}>{riskPercent}%</span>
                <span style={styles.mewsScoreLabel}>MEWS SCORE: {mewsPoints} / {maxMews}</span>
              </div>
            </div>

            <div style={{ ...styles.riskAlertBox, borderColor: riskColor, backgroundColor: `${riskColor}10` }}>
              <ShieldAlert size={18} color={riskColor} />
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: riskColor }}>{riskCategory}</span>
            </div>
          </div>

          {/* Clinician actions checklist */}
          <div className="glass-panel" style={styles.guidelinesCard}>
            <h4 style={styles.guideTitle}>CareSync AI Recommended Actions</h4>
            <ul style={styles.guideList}>
              {recommendations.map((rec, index) => (
                <li key={index} style={styles.guideItem}>
                  <CheckCircle size={16} color={riskColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={styles.guideText}>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
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
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  controlRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  controlMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  inputName: {
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: 'var(--primary)',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  scoreCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  radialGaugeContainer: {
    position: 'relative',
    marginTop: '15px',
    marginBottom: '10px',
  },
  gaugeTextContainer: {
    textAlign: 'center',
    marginTop: '-20px',
  },
  riskPercentVal: {
    fontSize: '2rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    display: 'block',
  },
  mewsScoreLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  riskAlertBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '15px',
  },
  guidelinesCard: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  guideTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  guideList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  guideItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  guideText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  }
};
export { styles as predictionStyles };
