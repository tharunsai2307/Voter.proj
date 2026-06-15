import db from '../config/db.js';

// Get active or resolved alerts list
export const getAlerts = async (req, res) => {
  const { status } = req.query; // Active, Resolved, or empty for all

  try {
    let query = `
      SELECT a.*, p.name as patient_name, p.bed as patient_bed, p.department
      FROM alerts a
      JOIN patients p ON a.patient_id = p.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE a.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY a.created_at DESC`;

    const result = await db.query(query, params);
    return res.json({ success: true, count: result.rows.length, alerts: result.rows });
  } catch (error) {
    console.error("Get Alerts Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve alerts list.' });
  }
};

// Acknowledge & resolve an alert
export const resolveAlert = async (req, res) => {
  const { id } = req.params;
  const { actionTaken } = req.body;
  const resolvedBy = req.user ? req.user.id : null;

  if (!actionTaken) {
    return res.status(400).json({ success: false, message: 'Please provide actionTaken text describing clinical intervention.' });
  }

  try {
    // Check if alert exists
    const checkAlert = await db.query('SELECT id, status FROM alerts WHERE id = $1', [id]);
    if (checkAlert.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alert warning record not found.' });
    }

    if (checkAlert.rows[0].status === 'Resolved') {
      return res.status(400).json({ success: false, message: 'Alert has already been resolved.' });
    }

    const result = await db.query(
      `UPDATE alerts 
       SET status = 'Resolved',
           resolved_by = $1,
           action_taken = $2
       WHERE id = $3 RETURNING *`,
      [resolvedBy, actionTaken, id]
    );

    return res.json({
      success: true,
      message: 'Alert resolved and clinical log recorded.',
      alert: result.rows[0]
    });
  } catch (error) {
    console.error("Resolve Alert Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to resolve alert warning.' });
  }
};
export default resolveAlert;
