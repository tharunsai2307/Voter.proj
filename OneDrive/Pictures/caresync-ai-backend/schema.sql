-- CareSync AI PostgreSQL Schema Setup

-- Clean old tables if they exist (run in order of dependencies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS vitals_logs CASCADE;
DROP TABLE IF EXISTS diseases CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (Clinicians, Administrators, and staff)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Nurse')),
    specialty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patients Table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    bed VARCHAR(50),
    department VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Stable', 'High Risk', 'Critical', 'Discharged')) DEFAULT 'Stable',
    details TEXT,
    admission_date DATE DEFAULT CURRENT_DATE,
    primary_doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    primary_nurse_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    history JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Diseases Table (A patient can map to multiple conditions)
CREATE TABLE diseases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    disease_name VARCHAR(50) NOT NULL CHECK (disease_name IN (
        'Cancer', 'Diabetes', 'Heart Disease', 'Asthma', 'Dengue', 
        'Kidney Disease', 'Pneumonia', 'Hypertension', 'Stroke', 'Diarrhea'
    )),
    metadata JSONB DEFAULT '{}'::jsonb, -- dynamic details like tumor stage, glucose target, pain logs, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vitals Time-Series Logs
CREATE TABLE vitals_logs (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    oxygen INTEGER CHECK (oxygen BETWEEN 0 AND 100), -- SpO2%
    heart_rate INTEGER,
    blood_pressure VARCHAR(20), -- format "Systolic/Diastolic" (e.g. "120/80")
    temperature NUMERIC(4,2), -- body temp in celsius (e.g. 37.50)
    blood_sugar INTEGER, -- blood glucose in mg/dL
    respiration_rate INTEGER, -- breaths per minute
    platelet_count INTEGER, -- platelets/uL (crucial for Dengue / Dengue shock)
    weight NUMERIC(5,2), -- in kg
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Alerts Warning Registry
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Critical', 'High', 'Medium')),
    metric VARCHAR(50) NOT NULL,
    value VARCHAR(50) NOT NULL,
    threshold VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Resolved')) DEFAULT 'Active',
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Deterioration Predictions
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('Stable', 'Medium Alert', 'High Alert', 'Critical')),
    deterioration_probability NUMERIC(5,2) NOT NULL CHECK (deterioration_probability BETWEEN 0.00 AND 100.00),
    icu_requirement_probability NUMERIC(5,2) NOT NULL CHECK (icu_requirement_probability BETWEEN 0.00 AND 100.00),
    emergency_probability NUMERIC(5,2) NOT NULL CHECK (emergency_probability BETWEEN 0.00 AND 100.00),
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Security and Activity Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance tuning
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_vitals_patient_date ON vitals_logs(patient_id, recorded_at DESC);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_predictions_patient ON predictions(patient_id);
CREATE INDEX idx_diseases_patient ON diseases(patient_id);

-- 8. Patient Portal Tokens Table
CREATE TABLE patient_portal_tokens (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- 9. Appointments Table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled'))
);


-- =======================================================
-- Seed Initial Clinical & Administrative Data
-- =======================================================

-- 1. Seed Users (default password hash corresponds to 'password123')
INSERT INTO users (id, name, email, password_hash, role, specialty) VALUES
(1, 'Dr. Sarah Jenkins', 'doctor.jenkins@caresync.ai', '$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa', 'Doctor', 'Cardiologist & ICU Lead'),
(2, 'Nurse Carter', 'nurse.carter@caresync.ai', '$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa', 'Nurse', 'Trauma Ward RN'),
(3, 'Chief Admin', 'admin.chief@caresync.ai', '$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa', 'Admin', 'Director of Medicine')
ON CONFLICT (email) DO NOTHING;

SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

-- 2. Seed Patients
INSERT INTO patients (id, name, age, gender, bed, department, status, details, primary_doctor_id, primary_nurse_id, history, medications) VALUES
(1, 'Eleanor Vance', 64, 'Female', 'ICU-04', 'ICU', 'Critical', 'Severe myocardial infarction survivor. Arrhythmias detected.', 1, 2, '[{"date": "2026-06-12", "event": "Clinical Admission & Triage Complete"}, {"date": "2026-06-14", "event": "Surgical bypass stent implanted."}]'::jsonb, '[{"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily"}, {"name": "Aspirin", "dosage": "81mg", "frequency": "Once daily"}]'::jsonb),
(2, 'Marcus Vance', 48, 'Male', 'WARD-12A', 'Oncology', 'High Risk', 'Stage III lung adenocarcinoma. Chemotherapy recovery.', 1, 2, '[{"date": "2026-06-08", "event": "Admitted for lung cancer chemotherapy cycle."}]'::jsonb, '[{"name": "Ondansetron", "dosage": "8mg", "frequency": "Every 8 hours as needed"}, {"name": "Chemotherapy Adjunct", "dosage": "100mg", "frequency": "Weekly"}]'::jsonb),
(3, 'Diana Prince', 56, 'Female', 'WARD-08B', 'Endocrinology', 'Stable', 'Type 2 diabetes. Basal calibration setup.', 1, 2, '[{"date": "2026-06-14", "event": "Admitted for endocrine diabetic evaluation."}]'::jsonb, '[{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily with meals"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT setval('patients_id_seq', COALESCE((SELECT MAX(id) FROM patients), 1));

-- 3. Seed Diseases
INSERT INTO diseases (id, patient_id, disease_name, metadata) VALUES
(1, 1, 'Heart Disease', '{"painScore": 3, "ecgRate": 1.0}'::jsonb),
(2, 2, 'Cancer', '{"painScore": 7, "fatigue": 8, "weightTrend": [78.2, 77.5, 76.9]}'::jsonb),
(3, 3, 'Diabetes', '{"sugarHistory": [280, 245, 145]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT setval('diseases_id_seq', COALESCE((SELECT MAX(id) FROM diseases), 1));

-- 4. Seed Vitals Logs
INSERT INTO vitals_logs (id, patient_id, recorded_by, oxygen, heart_rate, blood_pressure, temperature, blood_sugar, respiration_rate, platelet_count, weight) VALUES
(1, 1, 1, 95, 95, '135/88', 38.20, 110, 18, 250000, 72.50),
(2, 2, 1, 96, 82, '118/74', 37.10, 98, 16, 180000, 68.00),
(3, 3, 1, 99, 72, '125/82', 36.60, 145, 14, 310000, 84.20)
ON CONFLICT (id) DO NOTHING;

SELECT setval('vitals_logs_id_seq', COALESCE((SELECT MAX(id) FROM vitals_logs), 1));

-- 5. Seed Alerts
INSERT INTO alerts (id, patient_id, type, metric, value, threshold, status) VALUES
(1, 1, 'Critical', 'SpO2 (Oxygen Level)', '89%', '<92%', 'Active')
ON CONFLICT (id) DO NOTHING;

SELECT setval('alerts_id_seq', COALESCE((SELECT MAX(id) FROM alerts), 1));

-- 6. Seed Predictions
INSERT INTO predictions (id, patient_id, risk_score, severity_level, deterioration_probability, icu_requirement_probability, emergency_probability, recommendations) VALUES
(1, 1, 92, 'Critical', 88.00, 95.00, 90.00, '["Immediate respiratory setup."]'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT setval('predictions_id_seq', COALESCE((SELECT MAX(id) FROM predictions), 1));

