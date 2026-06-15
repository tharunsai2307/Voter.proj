import db from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Patients count
    const totalPatientsResult = await db.query('SELECT COUNT(*) as count FROM patients');
    const totalPatients = parseInt(totalPatientsResult.rows[0].count) || 0;

    // 2. Critical Patients count
    const criticalPatientsResult = await db.query("SELECT COUNT(*) as count FROM patients WHERE status = 'Critical'");
    const criticalPatients = parseInt(criticalPatientsResult.rows[0].count) || 0;

    // 3. Active Alerts count
    const activeAlertsResult = await db.query("SELECT COUNT(*) as count FROM alerts WHERE status = 'Active'");
    const activeAlerts = parseInt(activeAlertsResult.rows[0].count) || 0;

    // 4. Department Statistics
    const deptStatsResult = await db.query(`
      SELECT department, COUNT(*) as count
      FROM patients
      GROUP BY department
    `);
    const departmentStats = deptStatsResult.rows.reduce((acc, row) => {
      acc[row.department] = parseInt(row.count);
      return acc;
    }, {});

    // Ensure common departments have entries in the response
    const defaultDepts = ['ICU', 'Cardiology', 'Oncology', 'Endocrinology', 'Emergency Ward'];
    defaultDepts.forEach(dept => {
      if (departmentStats[dept] === undefined) {
        departmentStats[dept] = 0;
      }
    });

    // 5. Active Doctors Online
    const activeDoctorsResult = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Doctor'");
    const activeDoctors = parseInt(activeDoctorsResult.rows[0].count) || 0;

    return res.json({
      success: true,
      stats: {
        totalPatients,
        criticalPatients,
        activeAlerts,
        activeDoctors,
        departmentStats
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve clinical dashboard counts.' });
  }
};
export default getDashboardStats;
