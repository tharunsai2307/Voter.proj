import db from '../config/db.js';
import { runAiAudit } from '../services/aiEngine.js';

// Get patient's AI predictions logs
export const getPatientPredictions = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM predictions WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId]
    );

    return res.json({ success: true, count: result.rows.length, predictions: result.rows });
  } catch (error) {
    console.error("Get Predictions Error:", error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patient predictions.' });
  }
};

// Simulate early warning risk calculation based on custom vitals body parameters
export const simulateRiskPrediction = async (req, res) => {
  const { oxygen, heartRate, bloodPressure, temperature, bloodSugar, respirationRate, plateletCount, weight, diseases = [] } = req.body;

  try {
    const vitalsPayload = {
      oxygen: oxygen || 98,
      heartRate: heartRate || 72,
      bloodPressure: bloodPressure || "120/80",
      temperature: temperature || 37.0,
      bloodSugar: bloodSugar || 100,
      respirationRate: respirationRate || 16,
      plateletCount: plateletCount || 250000,
      weight: weight || 70.0,
      painScore: req.body.painScore || 0,
      fatigue: req.body.fatigue || 0
    };

    const analysis = runAiAudit(vitalsPayload, diseases);

    return res.json({
      success: true,
      message: 'AI Deterioration neural projection computed.',
      inputSimulation: vitalsPayload,
      projection: analysis
    });
  } catch (error) {
    console.error("Risk Simulation Error:", error.message);
    return res.status(500).json({ success: false, message: 'Simulation analysis calculation failed.' });
  }
};
