import express from 'express';
import { exportPdfReport, exportDocxReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect reports endpoints

router.get('/:patientId/pdf', exportPdfReport);
router.get('/:patientId/docx', exportDocxReport);

export default router;
