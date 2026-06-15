import express from 'express';
import { getAlerts, resolveAlert } from '../controllers/alertController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect all alert routes

router.get('/', getAlerts);

// Doctors and Nurses can acknowledge/resolve alert warning tags
router.post('/:id/resolve', restrictTo('Doctor', 'Nurse'), resolveAlert);

export default router;
