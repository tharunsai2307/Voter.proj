// src/middleware/authPortal.js
import { pool } from '../config/db.js'; // Adjust path if your DB pool export differs
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const portalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No portal token provided.' });
    }
    const token = authHeader.split(' ')[1];
    // Look up token in DB; token stays valid until patient discharged
    const result = await pool.query(
      `SELECT ppt.*, patients.status FROM patient_portal_tokens ppt JOIN patients ON ppt.patient_id = patients.id WHERE ppt.token = $1 AND ppt.used = FALSE`,
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or used portal token.' });
    }
    const portalToken = result.rows[0];
    if (portalToken.status === 'Discharged') {
      return res.status(403).json({ success: false, message: 'Patient already discharged.' });
    }
    // Optionally mark token as used for this session (keep reusable until discharge)
    await pool.query('UPDATE patient_portal_tokens SET used = TRUE WHERE id = $1', [portalToken.id]);
    // Attach patient id for downstream handlers
    req.portalPatientId = portalToken.patient_id;
    next();
  } catch (err) {
    console.error('Portal auth error:', err);
    res.status(500).json({ success: false, message: 'Server error during portal authentication.' });
  }
};
