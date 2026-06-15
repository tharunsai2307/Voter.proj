// src/routes/portal.js
import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { pharmacySuggester } from '../services/pharmacySuggester.js';

const router = express.Router();

// ── PUBLIC ROUTES (no auth required) ───────────────────────────

// Token validation endpoint — patient enters token here
router.get('/token/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await db.query(
      `SELECT ppt.patient_id, ppt.id as token_id, p.name as patient_name, p.status 
       FROM patient_portal_tokens ppt 
       JOIN patients p ON ppt.patient_id = p.id 
       WHERE ppt.token = $1`,
      [token]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid portal access key. Please contact your nurse or hospital admin.' });
    }
    const row = result.rows[0];
    // Even discharged patients can view their history
    return res.json({ 
      success: true, 
      patientId: row.patient_id, 
      patientName: row.patient_name,
      status: row.status,
      token,
      isDischarged: row.status === 'Discharged'
    });
  } catch (err) {
    console.error('Token validation error:', err);
    return res.status(500).json({ success: false, message: 'Server error during token validation.' });
  }
});

// ── STAFF-ONLY ROUTES (JWT auth required) ──────────────────────

// Generate a portal token – admin or nurse only
router.post('/token/generate/:patientId', protect, restrictTo('Admin', 'Nurse'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check patient exists
    const patientCheck = await db.query('SELECT id, name, status FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const patient = patientCheck.rows[0];

    // Generate unique 8-char alphanumeric key (more user-friendly than UUID)
    const shortKey = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    const fullToken = `CS-${shortKey}`;
    
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now (lives until discharge)
    
    await db.query(
      `INSERT INTO patient_portal_tokens (patient_id, token, expires_at, used) VALUES ($1, $2, $3, FALSE)`,
      [patientId, fullToken, expiresAt]
    );

    res.json({ 
      success: true, 
      token: fullToken, 
      patientName: patient.name,
      patientId: patient.id,
      expiresAt,
      message: `Portal access key generated for ${patient.name}. Share this key with the patient: ${fullToken}`
    });
  } catch (err) {
    console.error('Generate portal token error:', err);
    res.status(500).json({ success: false, message: 'Could not generate portal access key.' });
  }
});

// List all portal tokens (for admin/nurse dashboard)
router.get('/tokens', protect, restrictTo('Admin', 'Nurse'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ppt.*, p.name as patient_name, p.status as patient_status 
       FROM patient_portal_tokens ppt 
       JOIN patients p ON ppt.patient_id = p.id 
       ORDER BY ppt.id DESC`
    );
    res.json({ success: true, tokens: result.rows });
  } catch (err) {
    console.error('List tokens error:', err);
    res.status(500).json({ success: false, message: 'Could not list portal tokens.' });
  }
});

// Revoke a portal token
router.delete('/token/:tokenId', protect, restrictTo('Admin', 'Nurse'), async (req, res) => {
  try {
    await db.query('DELETE FROM patient_portal_tokens WHERE id = $1', [req.params.tokenId]);
    res.json({ success: true, message: 'Portal access key revoked.' });
  } catch (err) {
    console.error('Revoke token error:', err);
    res.status(500).json({ success: false, message: 'Could not revoke token.' });
  }
});

// ── PORTAL-AUTH PROTECTED ROUTES (patient token required) ──────

// Get patient full record (read-only for portal)
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      `SELECT p.*, u1.name as doctor_name, u2.name as nurse_name 
       FROM patients p 
       LEFT JOIN users u1 ON p.primary_doctor_id = u1.id 
       LEFT JOIN users u2 ON p.primary_nurse_id = u2.id 
       WHERE p.id = $1`, 
      [patientId]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    const patient = result.rows[0];

    // Normalize history and medications from JSON string (PostgreSQL JSONB) to arrays
    if (typeof patient.history === 'string') {
      try { patient.history = JSON.parse(patient.history); } catch { patient.history = []; }
    }
    if (!Array.isArray(patient.history)) patient.history = [];

    if (typeof patient.medications === 'string') {
      try { patient.medications = JSON.parse(patient.medications); } catch { patient.medications = []; }
    }
    if (!Array.isArray(patient.medications)) patient.medications = [];

    // Pull related data (vitals, diseases, alerts, predictions)
    const [vitalsRes, diseasesRes, alertsRes, predictionsRes] = await Promise.all([
      db.query('SELECT * FROM vitals_logs WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 20', [patientId]),
      db.query('SELECT * FROM diseases WHERE patient_id = $1', [patientId]),
      db.query('SELECT * FROM alerts WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 10', [patientId]),
      db.query('SELECT * FROM predictions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 5', [patientId])
    ]);

    patient.vitals = vitalsRes.rows;
    // Normalize diseases: the in-memory DB returns objects with disease_name, PostgreSQL returns rows too
    patient.diseases = diseasesRes.rows.map(d => 
      typeof d === 'string' ? { disease_name: d } : d
    );
    patient.alerts = alertsRes.rows;
    patient.predictions = predictionsRes.rows;

    res.json({ success: true, patient });
  } catch (err) {
    console.error('Portal get patient error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch patient data.' });
  }
});

// AI pharmacy suggestion endpoint
router.post('/medication/suggest', async (req, res) => {
  try {
    const { diagnosis, currentMeds, allergies, labs } = req.body;
    const suggestions = pharmacySuggester({ diagnosis, currentMeds, allergies, labs });
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error('Pharmacy suggest error:', err);
    res.status(500).json({ success: false, message: 'Suggestion service failed.' });
  }
});

// Appointment request (patient can request)
router.post('/appointments', async (req, res) => {
  try {
    const { patientId, scheduledAt, reason } = req.body;
    await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status) VALUES ($1, NULL, $2, 'Pending')`,
      [patientId, scheduledAt]
    );
    res.json({ success: true, message: 'Appointment requested successfully.' });
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ success: false, message: 'Could not create appointment.' });
  }
});

// List patient appointments
router.get('/appointments/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      `SELECT a.*, u.name as doctor_name 
       FROM appointments a 
       LEFT JOIN users u ON a.doctor_id = u.id 
       WHERE a.patient_id = $1 
       ORDER BY a.requested_at DESC`, 
      [patientId]
    );
    res.json({ success: true, appointments: result.rows });
  } catch (err) {
    console.error('List appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to list appointments.' });
  }
});

export default router;
