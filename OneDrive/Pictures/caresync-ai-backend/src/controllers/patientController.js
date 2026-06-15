import db from '../config/db.js';
import { io } from '../index.js';
import fs from 'fs';
import path from 'path';
import { generatePdfReport } from '../services/reportGen.js';
import { runAiAudit } from '../services/aiEngine.js';

// Get all patients with active clinician assignments
export const getPatients = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, 
             u1.name as doctor_name, 
             u2.name as nurse_name
      FROM patients p
      LEFT JOIN users u1 ON p.primary_doctor_id = u1.id
      LEFT JOIN users u2 ON p.primary_nurse_id = u2.id
      ORDER BY p.id ASC
    `);

    // Fetch diseases map for each patient
    const patients = result.rows;
    for (let p of patients) {
      const diseaseResult = await db.query(
        'SELECT disease_name FROM diseases WHERE patient_id = $1',
        [p.id]
      );
      p.diseases = diseaseResult.rows.map(d => d.disease_name);
    }

    return res.json({ success: true, count: patients.length, patients });
  } catch (error) {
    console.error("Get Patients Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patient registry.' });
  }
};

// Get single patient profile
export const getPatientById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT p.*, 
              u1.name as doctor_name, 
              u2.name as nurse_name
       FROM patients p
       LEFT JOIN users u1 ON p.primary_doctor_id = u1.id
       LEFT JOIN users u2 ON p.primary_nurse_id = u2.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const patient = result.rows[0];

    // Get assigned diseases
    const diseaseResult = await db.query(
      'SELECT disease_name, metadata FROM diseases WHERE patient_id = $1',
      [id]
    );
    patient.diseases = diseaseResult.rows.map(d => d.disease_name);
    patient.diseases_detail = diseaseResult.rows;

    return res.json({ success: true, patient });
  } catch (error) {
    console.error("Get Patient ID Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patient profile.' });
  }
};

// Create patient profile and link diseases list
export const createPatient = async (req, res) => {
  const { name, age, gender, bed, department, status, details, primaryDoctorId, primaryNurseId, diseases = [] } = req.body;

  if (!name || !age || !gender || !bed || !department) {
    return res.status(400).json({ success: false, message: 'Please provide name, age, gender, bed, and department.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO patients (name, age, gender, bed, department, status, details, primary_doctor_id, primary_nurse_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, age, gender, bed, department, status || 'Stable', details, primaryDoctorId, primaryNurseId]
    );

    const newPatient = result.rows[0];

    // Link diseases mapping
    if (diseases && diseases.length > 0) {
      for (let diseaseName of diseases) {
        await db.query(
          'INSERT INTO diseases (patient_id, disease_name) VALUES ($1, $2)',
          [newPatient.id, diseaseName]
        );
      }
    }

    newPatient.diseases = diseases;

    return res.status(201).json({
      success: true,
      message: 'Patient profile registered successfully.',
      patient: newPatient
    });
  } catch (error) {
    console.error("Create Patient Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to register patient profile.' });
  }
};

// Update patient details
export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const { name, age, gender, bed, department, status, details, primaryDoctorId, primaryNurseId, diseases, history, medications } = req.body;

  try {
    // Check if patient exists
    const checkPatient = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    if (!checkPatient.rows || checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Update patient base table fields
    const result = await db.query(
      `UPDATE patients 
       SET name = COALESCE($1, name),
           age = COALESCE($2, age),
           gender = COALESCE($3, gender),
           bed = COALESCE($4, bed),
           department = COALESCE($5, department),
           status = COALESCE($6, status),
           details = COALESCE($7, details),
           primary_doctor_id = COALESCE($8, primary_doctor_id),
           primary_nurse_id = COALESCE($9, primary_nurse_id),
           history = COALESCE($10, history),
           medications = COALESCE($11, medications)
       WHERE id = $12 RETURNING *`,
      [name, age, gender, bed, department, status, details, primaryDoctorId, primaryNurseId, 
       (history !== undefined && history !== null) ? (typeof history === 'string' ? history : JSON.stringify(history)) : null, 
       (medications !== undefined && medications !== null) ? (typeof medications === 'string' ? medications : JSON.stringify(medications)) : null, 
       id]
    );

    const updatedPatient = result.rows[0];

    // If diseases array is explicitly sent, clear existing connections and replace them
    if (diseases !== undefined) {
      await db.query('DELETE FROM diseases WHERE patient_id = $1', [id]);
      if (diseases && diseases.length > 0) {
        for (let diseaseName of diseases) {
          await db.query(
            'INSERT INTO diseases (patient_id, disease_name) VALUES ($1, $2)',
            [id, diseaseName]
          );
        }
      }
      updatedPatient.diseases = diseases;
    } else {
      const diseaseResult = await db.query('SELECT disease_name FROM diseases WHERE patient_id = $1', [id]);
      updatedPatient.diseases = diseaseResult.rows.map(d => d.disease_name);
    }

    io.emit('patient:update', { patientId: id, patient: updatedPatient });
    // Generate PDF summary of updated patient history
      let historyPdfPath = null;
      try {
        const pdfBuffer = await generatePdfReport(updatedPatient, null, null);
        const reportsDir = path.resolve(process.cwd(), 'discharge_reports');
        if (!fs.existsSync(reportsDir)) { fs.mkdirSync(reportsDir, { recursive: true }); }
        const pdfFile = `patient_${id}_history.pdf`;
        historyPdfPath = path.join(reportsDir, pdfFile);
        fs.writeFileSync(historyPdfPath, pdfBuffer);
      } catch (pdfErr) {
        console.error('Failed to generate patient history PDF:', pdfErr.message);
      }

      // Emit update event with optional PDF URL
      io.emit('patient:history:update', { patientId: id, pdfUrl: historyPdfPath ? `/discharge_reports/${path.basename(historyPdfPath)}` : null, patient: updatedPatient });

      return res.json({
        success: true,
        message: 'Patient profile updated successfully.',
        patient: updatedPatient,
        historyPdf: historyPdfPath ? `/discharge_reports/${path.basename(historyPdfPath)}` : undefined
      });
  } catch (error) {
    console.error("Update Patient Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to update patient profile.' });
  }
};

// Delete patient profile
export const deletePatient = async (req, res) => {
  const { id } = req.params;

  try {
    const checkPatient = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    if (checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    await db.query('DELETE FROM patients WHERE id = $1', [id]);

    return res.json({ success: true, message: 'Patient profile deleted from active registry.' });
  } catch (error) {
    console.error("Delete Patient Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete patient profile.' });
  }
};

// Assign clinician roles
export const assignClinicians = async (req, res) => {
  const { id } = req.params;
  const { doctorId, nurseId } = req.body;

  try {
    const checkPatient = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    if (checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const result = await db.query(
      `UPDATE patients 
       SET primary_doctor_id = COALESCE($1, primary_doctor_id),
           primary_nurse_id = COALESCE($2, primary_nurse_id)
       WHERE id = $3 RETURNING *`,
      [doctorId, nurseId, id]
    );

    return res.json({
      success: true,
      message: 'Attending clinicians assigned successfully.',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error("Assign Clinicians Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to assign clinicians.' });
  }
};

// Discharge patient profile, free bed, and return PDF clinical summary
export const dischargePatient = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch patient details
    const patientResult = await db.query(
      `SELECT p.*, u1.name as doctor_name, u2.name as nurse_name
       FROM patients p
       LEFT JOIN users u1 ON p.primary_doctor_id = u1.id
       LEFT JOIN users u2 ON p.primary_nurse_id = u2.id
       WHERE p.id = $1`,
      [id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patient = patientResult.rows[0];

    // If patient is already discharged, return error
    if (patient.status === 'Discharged') {
      return res.status(400).json({ success: false, message: 'Patient is already discharged.' });
    }

    // Get diseases list
    const diseaseResult = await db.query('SELECT disease_name FROM diseases WHERE patient_id = $1', [id]);
    patient.diseases = diseaseResult.rows.map(d => d.disease_name);

    // 2. Fetch latest vitals entry
    const vitalsResult = await db.query(
      'SELECT * FROM vitals_logs WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [id]
    );
    const vitals = vitalsResult.rows.length > 0 ? vitalsResult.rows[0] : {};

    // 3. Fetch latest AI prediction assessment
    const predictionsResult = await db.query(
      'SELECT * FROM predictions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    const predictions = predictionsResult.rows.length > 0 ? predictionsResult.rows[0] : null;

    // 4. Generate PDF Report Buffer
    const pdfBuffer = await generatePdfReport(patient, vitals, predictions);

    // Ensure discharge_reports directory exists
    const reportsDir = path.resolve(process.cwd(), 'discharge_reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfPath = path.join(reportsDir, `patient_${id}_discharge.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // 5. Update patient status in database to 'Discharged' and set bed to NULL
    await db.query(
      `UPDATE patients 
       SET status = 'Discharged', bed = NULL
       WHERE id = $1`,
      [id]
    );

    // 6. Log to audit trail
    try {
      await db.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [req.user ? req.user.id : null, 'DISCHARGE_PATIENT', JSON.stringify({ patientId: id, patientName: patient.name, previousBed: patient.bed })]
      );
    } catch (auditErr) {
      console.error("Audit log insertion failed:", auditErr.message);
    }

    // 7. Emit discharge event to portal clients
    io.emit('patient:discharge', { patientId: id, pdfUrl: `/discharge_reports/patient_${id}_discharge.pdf` });

    // 8. Stream PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Discharge_Report_P${id}.pdf`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error("Discharge Patient Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to complete patient discharge.' });
  }
};

// Analyze diagnostic report files using Gemini AI API
export const analyzeDiagnosticReport = async (req, res) => {
  const { id } = req.params;
  const { fileName, fileType, fileData } = req.body;

  if (!fileData || !fileType) {
    return res.status(400).json({ success: false, message: 'Please provide fileData (base64) and fileType.' });
  }

  try {
    // 1. Confirm patient exists
    const checkPatient = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (!checkPatient.rows || checkPatient.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patient = checkPatient.rows[0];

    // Strip out base64 header if present (e.g., "data:image/png;base64,")
    let base64Data = fileData;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API Key is not configured on the server.' });
    }

    // Prepare Gemini payload
    const prompt = `You are a clinical AI medical officer. Analyze the attached diagnostic report / lab result file (filename: "${fileName}", MIME type: "${fileType}").
Extract the patient's vitals if present, identify any clinical abnormalities or critical values, write a summary of the report, and recommend a suggested action.
You must return your response as a valid JSON object matching this schema:
{
  "summary": "Concise medical summary of the report's overall findings.",
  "abnormalities": ["List of abnormal findings, warning signs, or out-of-range metrics"],
  "suggestedAction": "Recommended next step or follow-up check for the clinical staff.",
  "vitals": {
    "oxygen": number (between 0 and 100, e.g. 96, if oxygen level is found),
    "heartRate": number (beats per minute, if heart rate is found),
    "bloodPressure": "string (format 'systolic/diastolic', e.g. '120/80', if blood pressure is found)",
    "temperature": number (celsius, if temperature is found),
    "bloodSugar": number (mg/dL, if glucose/sugar is found),
    "respirationRate": number (breaths per minute, if respiration is found),
    "plateletCount": number (platelets/uL, if platelet count is found),
    "weight": number (kg, if weight is found)
  }
}
If a vitals parameter is not mentioned, exclude it from the "vitals" object or set it to null. Do not hallucinate values.
Return only the raw JSON. Do not include markdown code block formatting (like \`\`\`json).`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: fileType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status, errorText);
      return res.status(500).json({ success: false, message: 'Gemini API failed to process the diagnostic report.' });
    }

    const resultData = await response.json();
    const candidateText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return res.status(500).json({ success: false, message: 'Gemini API returned an empty or invalid response.' });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(candidateText.trim());
    } catch (parseErr) {
      console.error("Failed to parse Gemini output:", candidateText);
      return res.status(500).json({ success: false, message: 'Failed to parse AI output as JSON.' });
    }

    const { summary, abnormalities = [], suggestedAction, vitals = {} } = parsedResult;

    // 2. Fetch active patient diseases to run disease-specific rules
    const diseaseResult = await db.query('SELECT disease_name FROM diseases WHERE patient_id = $1', [id]);
    const diseases = diseaseResult.rows.map(d => d.disease_name);

    // 3. Save new vitals log if vitals are extracted
    let loggedVitals = null;
    let aiReport = null;
    const hasVitals = vitals && Object.values(vitals).some(v => v !== null && v !== undefined);
    
    if (hasVitals) {
      const {
        oxygen = null,
        heartRate = null,
        bloodPressure = null,
        temperature = null,
        bloodSugar = null,
        respirationRate = null,
        plateletCount = null,
        weight = null
      } = vitals;

      const insertResult = await db.query(
        `INSERT INTO vitals_logs (
          patient_id, recorded_by, oxygen, heart_rate, blood_pressure, 
          temperature, blood_sugar, respiration_rate, platelet_count, weight
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [id, req.user ? req.user.id : null, oxygen, heartRate, bloodPressure, temperature, bloodSugar, respirationRate, plateletCount, weight]
      );
      loggedVitals = insertResult.rows[0];

      // Run AI clinical audit
      const vitalsPayload = {
        oxygen: oxygen || 98,
        heartRate: heartRate || 72,
        bloodPressure: bloodPressure || "120/80",
        temperature: temperature || 37.0,
        bloodSugar: bloodSugar || 100,
        respirationRate: respirationRate || 16,
        plateletCount: plateletCount || 250000,
        weight: weight || 70.0
      };

      aiReport = runAiAudit(vitalsPayload, diseases);

      // Update status if needed
      let dbStatus = 'Stable';
      if (aiReport.severityLevel === 'Critical') dbStatus = 'Critical';
      else if (aiReport.severityLevel === 'High Alert') dbStatus = 'High Risk';
      
      if (dbStatus !== patient.status) {
        await db.query('UPDATE patients SET status = $1 WHERE id = $2', [dbStatus, id]);
      }

      // Save predictions
      await db.query(
        `INSERT INTO predictions (
          patient_id, risk_score, severity_level, deterioration_probability, 
          icu_requirement_probability, emergency_probability, recommendations
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id, 
          aiReport.riskScore, 
          aiReport.severityLevel, 
          aiReport.probabilities.deterioration, 
          aiReport.probabilities.icuRequirement, 
          aiReport.probabilities.emergency,
          JSON.stringify(aiReport.recommendations)
        ]
      );
    }

    // 4. Append to patient history
    const dateStr = new Date().toISOString().split('T')[0];
    const eventMsg = `Diagnostic Report: ${fileName}. Summary: ${summary}`;
    
    // Parse current history
    let currentHistory = patient.history;
    if (typeof currentHistory === 'string') {
      try { currentHistory = JSON.parse(currentHistory); } catch { currentHistory = []; }
    }
    if (!Array.isArray(currentHistory)) currentHistory = [];
    
    currentHistory.push({ date: dateStr, event: eventMsg });

    await db.query(
      `UPDATE patients SET history = $1 WHERE id = $2`,
      [JSON.stringify(currentHistory), id]
    );

    // 5. Emit socket event
    io.emit('patient:update', { patientId: id });

    return res.json({
      success: true,
      message: 'Diagnostic report analyzed and logged successfully.',
      analysis: {
        summary,
        abnormalities,
        suggestedAction,
        vitals
      },
      vitalsLogged: loggedVitals,
      aiAnalysis: aiReport
    });
  } catch (error) {
    console.error("Analyze Diagnostic Report Error:", error);
    return res.status(500).json({ success: false, message: 'Failed to analyze diagnostic report: ' + error.message });
  }
};
