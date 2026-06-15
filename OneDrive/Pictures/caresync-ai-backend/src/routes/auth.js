import express from 'express';
import { registerUser, loginUser, getMe, getUsers, updateProfile } from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', protect, restrictTo('Admin'), registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, restrictTo('Admin', 'Doctor', 'Nurse'), getUsers);
router.put('/profile', protect, updateProfile);

export default router;
