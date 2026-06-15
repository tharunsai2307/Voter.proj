import db from '../config/db.js';
import { runAiAudit } from '../services/aiEngine.js';
import { broadcastEmergencyAlert } from '../services/notification.js';

// Get vitals log history for a patient
export const getVitalsHistory = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM vitals_logs WHERE patient_id = $1 ORDER BY recorded_at DESC',
      [patientId]
    );

    return res.json({ success: true, count: result.rows.length, vitals: result.rows });
  } catch (error) {
    console.error("Get Vitals Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve vitals logs history.' });
  }
};

// Add vitals log entry and run AI scoring check in real-time
export const logVitals = async (req, res) => {
  const { patientId } = req.params;
  const { oxygen, heartRate, bloodPressure, temperature, bloodSugar, respirationRate, plateletCount, weight } = req.body;
  const recordedBy = req.user ? req.user.id : null;

  try {
    // 1. Confirm patient exists
    const checkPatient = await db.query('SELECT * FROM patients WHERE id = $1', [patientId]);
    if (checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patient = checkPatient.rows[0];

    // 2. Fetch active patient diseases to run disease-specific rules
    const diseaseResult = await db.query('SELECT disease_name FROM diseases WHERE patient_id = $1', [patientId]);
    const diseases = diseaseResult.rows.map(d => d.disease_name);

    // 3. Save vitals entry to logs
    const insertResult = await db.query(
      `INSERT INTO vitals_logs (
        patient_id, recorded_by, oxygen, heart_rate, blood_pressure, 
        temperature, blood_sugar, respiration_rate, platelet_count, weight
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [patientId, recordedBy, oxygen, heartRate, bloodPressure, temperature, bloodSugar, respirationRate, plateletCount, weight]
    );
    const loggedVitals = insertResult.rows[0];

    // 4. Trigger AI clinical analysis engine check
    const vitalsPayload = {
      oxygen,
      heartRate,
      bloodPressure,
      temperature,
      bloodSugar,
      respirationRate,
      plateletCount,
      weight,
      // Map metadata attributes if available
      painScore: req.body.painScore || 0,
      fatigue: req.body.fatigue || 0
    };
    
    const aiReport = runAiAudit(vitalsPayload, diseases);

    // 5. Update patient status (Stable, High Risk, Critical) based on calculated AI risk severity
    let dbStatus = 'Stable';
    if (aiReport.severityLevel === 'Critical') dbStatus = 'Critical';
    else if (aiReport.severityLevel === 'High Alert') dbStatus = 'High Risk';
    
    if (dbStatus !== patient.status) {
      await db.query('UPDATE patients SET status = $1 WHERE id = $2', [dbStatus, patientId]);
    }

    // 6. Save AI prediction to database
    await db.query(
      `INSERT INTO predictions (
        patient_id, risk_score, severity_level, deterioration_probability, 
        icu_requirement_probability, emergency_probability, recommendations
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        patientId, 
        aiReport.riskScore, 
        aiReport.severityLevel, 
        aiReport.probabilities.deterioration, 
        aiReport.probabilities.icuRequirement, 
        aiReport.probabilities.emergency,
        JSON.stringify(aiReport.recommendations)
      ]
    );

    // 7. Write to active alerts registry if threshold alerts trigger
    let triggerAlert = false;
    let alertType = '';
    let alertMetric = '';
    let alertVal = '';
    let alertThresh = '';

    if (oxygen && oxygen < 92) {
      triggerAlert = true;
      alertType = 'Critical';
      alertMetric = 'Oxygen Saturation (SpO2)';
      alertVal = `${oxygen}%`;
      alertThresh = '<92%';
    } else if (heartRate && (heartRate > 115 || heartRate < 45)) {
      triggerAlert = true;
      alertType = 'Critical';
      alertMetric = 'Heart Rate (Tachycardia/Bradycardia)';
      alertVal = `${heartRate} bpm`;
      alertThresh = '<45 or >115 bpm';
    } else if (aiReport.riskScore > 50) {
      triggerAlert = true;
      alertType = aiReport.riskScore > 75 ? 'Critical' : 'High';
      alertMetric = 'AI Deterioration Index Risk';
      alertVal = `${aiReport.riskScore}%`;
      alertThresh = '>50%';
    }

    if (triggerAlert) {
      const alertInsert = await db.query(
        `INSERT INTO alerts (patient_id, type, metric, value, threshold, status)
         VALUES ($1, $2, $3, $4, $5, 'Active') RETURNING *`,
        [patientId, alertType, alertMetric, alertVal, alertThresh]
      );

      // 8. Broadcast immediate emergency warning dispatch alerts (SMS/WhatsApp/Email)
      await broadcastEmergencyAlert(patient, alertInsert.rows[0]);
    }

    return res.status(201).json({
      success: true,
      message: 'Vitals log saved successfully.',
      vitals: loggedVitals,
      aiAnalysis: aiReport
    });
  } catch (error) {
    console.error("Log Vitals Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to record vitals log entry.' });
  }
};
export default logVitals;
