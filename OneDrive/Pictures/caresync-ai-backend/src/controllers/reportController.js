import db from '../config/db.js';
import { generatePdfReport, generateDocxReport } from '../services/reportGen.js';

// Export patient clinical details as PDF
export const exportPdfReport = async (req, res) => {
  const { patientId } = req.params;

  try {
    // 1. Fetch patient profile details
    const patientResult = await db.query(
      `SELECT p.*, u1.name as doctor_name, u2.name as nurse_name
       FROM patients p
       LEFT JOIN users u1 ON p.primary_doctor_id = u1.id
       LEFT JOIN users u2 ON p.primary_nurse_id = u2.id
       WHERE p.id = $1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patient = patientResult.rows[0];

    // Get diseases list
    const diseaseResult = await db.query('SELECT disease_name FROM diseases WHERE patient_id = $1', [patientId]);
    patient.diseases = diseaseResult.rows.map(d => d.disease_name);

    // 2. Fetch latest vitals entry
    const vitalsResult = await db.query(
      'SELECT * FROM vitals_logs WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [patientId]
    );
    const vitals = vitalsResult.rows.length > 0 ? vitalsResult.rows[0] : {};

    // 3. Fetch latest AI prediction assessment
    const predictionsResult = await db.query(
      'SELECT * FROM predictions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1',
      [patientId]
    );
    const predictions = predictionsResult.rows.length > 0 ? predictionsResult.rows[0] : null;

    // 4. Generate PDF Binary Buffer
    const pdfBuffer = await generatePdfReport(patient, vitals, predictions);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CareSync_Report_P${patientId}.pdf`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error("Export PDF Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to compile clinical PDF document.' });
  }
};

// Export patient clinical details as DOCX
export const exportDocxReport = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patientResult = await db.query(
      `SELECT p.*, u1.name as doctor_name, u2.name as nurse_name
       FROM patients p
       LEFT JOIN users u1 ON p.primary_doctor_id = u1.id
       LEFT JOIN users u2 ON p.primary_nurse_id = u2.id
       WHERE p.id = $1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const patient = patientResult.rows[0];

    const vitalsResult = await db.query(
      'SELECT * FROM vitals_logs WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [patientId]
    );
    const vitals = vitalsResult.rows.length > 0 ? vitalsResult.rows[0] : {};

    const predictionsResult = await db.query(
      'SELECT * FROM predictions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1',
      [patientId]
    );
    const predictions = predictionsResult.rows.length > 0 ? predictionsResult.rows[0] : null;

    // Generate Word Document Buffer
    const docxBuffer = await generateDocxReport(patient, vitals, predictions);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=CareSync_Report_P${patientId}.docx`);
    return res.send(docxBuffer);

  } catch (error) {
    console.error("Export DOCX Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to compile clinical DOCX document.' });
  }
};
export default exportPdfReport;
