import express from 'express';
import { getPatients, getPatientById, createPatient, updatePatient, deletePatient, assignClinicians, dischargePatient, analyzeDiagnosticReport } from '../controllers/patientController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect all patient routes

router.get('/', getPatients);
router.get('/:id', getPatientById);

// Admins, Doctors, and Nurses can register or modify patient lists
router.post('/', restrictTo('Admin', 'Doctor', 'Nurse'), createPatient);
router.put('/:id', restrictTo('Admin', 'Doctor', 'Nurse'), updatePatient);
router.delete('/:id', restrictTo('Admin'), deletePatient); // Only Admin can delete

// Assign clinician teams
router.post('/:id/assign', restrictTo('Admin', 'Doctor'), assignClinicians);

// Discharge patients (Admins and Doctors only)
router.post('/:id/discharge', restrictTo('Admin', 'Doctor'), dischargePatient);

// Analyze diagnostic reports
router.post('/:id/analyze-report', restrictTo('Admin', 'Doctor', 'Nurse'), analyzeDiagnosticReport);

export default router;
