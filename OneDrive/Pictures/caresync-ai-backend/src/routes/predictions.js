import express from 'express';
import { getPatientPredictions, simulateRiskPrediction } from '../controllers/predictionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect predictions queries

router.get('/:patientId', getPatientPredictions);
router.post('/simulate', simulateRiskPrediction); // Anyone authenticated can run simulator checks

export default router;
