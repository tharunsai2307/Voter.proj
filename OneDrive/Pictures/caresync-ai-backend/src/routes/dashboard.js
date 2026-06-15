import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // protect stats requests

router.get('/stats', getDashboardStats);

export default router;
