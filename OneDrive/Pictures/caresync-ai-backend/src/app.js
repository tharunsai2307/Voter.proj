import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditLogger } from './middleware/logger.js';

// Route Imports
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import vitalsRoutes from './routes/vitals.js';
import alertRoutes from './routes/alerts.js';
import predictionRoutes from './routes/predictions.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import portalRoutes from './routes/portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Express Configuration Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Security & Database Audit Trail logs middleware
app.use(auditLogger);

// Static file serving for discharge reports
const reportsPath = path.resolve(__dirname, '../../discharge_reports');
app.use('/discharge_reports', express.static(reportsPath));

// API Endpoints Mounting
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', portalRoutes);

// Base Route Health check
app.get('/health', (req, res) => {
  return res.json({ 
    success: true, 
    status: 'ONLINE',
    system: 'CareSync AI Smart Hospital Command Backend',
    timestamp: new Date()
  });
});

// Root route welcome message
app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Welcome to CareSync AI Backend API. The server is running successfully.',
    healthCheck: '/health'
  });
});

// 404 Route handler
app.use((req, res, next) => {
  return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Central Error Interceptor Middleware
app.use((err, req, res, next) => {
  console.error("Central Error Handler:", err.stack);
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server clinical exception occurred.'
  });
});

export default app;
