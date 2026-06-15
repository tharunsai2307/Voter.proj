import express from 'express';
import { logVitals, getVitalsHistory } from '../controllers/vitalsController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect all vitals routes

router.get('/:patientId', getVitalsHistory);

// Only doctors and nurses can record clinical telemetry vitals logs
router.post('/:patientId', restrictTo('Doctor', 'Nurse'), logVitals);

export default router;
