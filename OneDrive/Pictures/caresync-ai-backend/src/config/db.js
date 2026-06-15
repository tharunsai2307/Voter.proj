import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define default mocks to allow fallback if Postgres is unavailable
class InMemoryDb {
  constructor() {
    console.warn("⚠️ DATABASE WARNING: Active PostgreSQL connection could not be established. Falling back to local In-Memory Database Registry.");
    this.store = {
      users: [
        { id: 1, name: "Dr. Sarah Jenkins", email: "doctor.jenkins@caresync.ai", password_hash: "$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa", role: "Doctor", specialty: "Cardiologist & ICU Lead" }, // pwd: password123
        { id: 2, name: "Nurse Carter", email: "nurse.carter@caresync.ai", password_hash: "$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa", role: "Nurse", specialty: "Trauma Ward RN" },
        { id: 3, name: "Chief Admin", email: "admin.chief@caresync.ai", password_hash: "$2a$10$Us5ngpcKNkF0ali7gs4pmeIrMXvXwV44COoDAjUHcmSjOWJyr.uNa", role: "Admin", specialty: "Director of Medicine" }
      ],
      patients: [
        { id: 1, name: "Eleanor Vance", age: 64, gender: "Female", bed: "ICU-04", department: "ICU", status: "Critical", details: "Severe myocardial infarction survivor. Arrhythmias detected.", admission_date: "2026-06-12", primary_doctor_id: 1, primary_nurse_id: 2, history: [{ date: "2026-06-12", event: "Clinical Admission & Triage Complete" }, { date: "2026-06-14", event: "Surgical bypass stent implanted." }], medications: [{ name: "Lisinopril", dosage: "10mg", frequency: "Once daily" }, { name: "Aspirin", dosage: "81mg", frequency: "Once daily" }] },
        { id: 2, name: "Marcus Vance", age: 48, gender: "Male", bed: "WARD-12A", department: "Oncology", status: "High Risk", details: "Stage III lung adenocarcinoma. Chemotherapy recovery.", admission_date: "2026-06-08", primary_doctor_id: 1, primary_nurse_id: 2, history: [{ date: "2026-06-08", event: "Admitted for lung cancer chemotherapy cycle." }], medications: [{ name: "Ondansetron", dosage: "8mg", frequency: "Every 8 hours as needed" }, { name: "Chemotherapy Adjunct", dosage: "100mg", frequency: "Weekly" }] },
        { id: 3, name: "Diana Prince", age: 56, gender: "Female", bed: "WARD-08B", department: "Endocrinology", status: "Stable", details: "Type 2 diabetes. Basal calibration setup.", admission_date: "2026-06-14", primary_doctor_id: 1, primary_nurse_id: 2, history: [{ date: "2026-06-14", event: "Admitted for endocrine diabetic evaluation." }], medications: [{ name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals" }] }
      ],
      diseases: [
        { id: 1, patient_id: 1, disease_name: "Heart Disease", metadata: { painScore: 3, ecgRate: 1.0 } },
        { id: 2, patient_id: 2, disease_name: "Cancer", metadata: { painScore: 7, fatigue: 8, weightTrend: [78.2, 77.5, 76.9] } },
        { id: 3, patient_id: 3, disease_name: "Diabetes", metadata: { sugarHistory: [280, 245, 145] } }
      ],
      vitals_logs: [
        { id: 1, patient_id: 1, recorded_by: 1, oxygen: 95, heart_rate: 95, blood_pressure: "135/88", temperature: 38.2, blood_sugar: 110, recorded_at: new Date() },
        { id: 2, patient_id: 2, recorded_by: 1, oxygen: 96, heart_rate: 82, blood_pressure: "118/74", temperature: 37.1, blood_sugar: 98, recorded_at: new Date() },
        { id: 3, patient_id: 3, recorded_by: 1, oxygen: 99, heart_rate: 72, blood_pressure: "125/82", temperature: 36.6, blood_sugar: 145, recorded_at: new Date() }
      ],
      alerts: [
        { id: 1, patient_id: 1, type: "Critical", metric: "SpO2 (Oxygen Level)", value: "89%", threshold: "<92%", status: "Active", resolved_by: null, action_taken: null, created_at: new Date() }
      ],
      predictions: [
        { id: 1, patient_id: 1, risk_score: 92, severity_level: "Critical", deterioration_probability: 88.0, icu_requirement_probability: 95.0, emergency_probability: 90.0, recommendations: ["Immediate respiratory setup."] }
      ],
      patient_portal_tokens: [
        { id: 1, patient_id: 1, token: "CS-5BD4C8ED", expires_at: new Date(Date.now() + 31536000000), used: false }
      ],
      audit_logs: [],
      appointments: []
    };
  }

  async query(text, params = []) {
    // Normalize newlines, consecutive spaces, and tabs to a single space
    const queryLower = text.toLowerCase().replace(/\s+/g, ' ');
    
    // 1. Audit logs insert
    if (queryLower.includes('insert into audit_logs')) {
      const log = { id: this.store.audit_logs.length + 1, user_id: params[0], action: params[1], details: params[2], created_at: new Date() };
      this.store.audit_logs.push(log);
      return { rows: [log] };
    }

    // 2. Select users by email (auth / duplicate registration checks)
    if (queryLower.includes('from users') && queryLower.includes('email =')) {
      const email = params[0];
      const match = this.store.users.find(u => u.email === email);
      return { rows: match ? [match] : [] };
    }

    // 3. Select user by id (protect middleware lookup)
    if (queryLower.includes('from users') && (queryLower.includes('id =') || queryLower.includes('id='))) {
      const match = this.store.users.find(u => u.id.toString() === params[0].toString());
      return { rows: match ? [match] : [] };
    }

    // 4. Insert user (register)
    if (queryLower.includes('insert into users')) {
      const newUser = {
        id: this.store.users.length + 1,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3],
        specialty: params[4],
        created_at: new Date()
      };
      this.store.users.push(newUser);
      return { rows: [newUser] };
    }

    // 4.1 Update user profile (name, specialty)
    if (queryLower.includes('update users set')) {
      const id = params[params.length - 1];
      const uIdx = this.store.users.findIndex(u => u.id.toString() === id.toString());
      if (uIdx !== -1) {
        this.store.users[uIdx].name = params[0] !== undefined ? params[0] : this.store.users[uIdx].name;
        this.store.users[uIdx].specialty = params[1] !== undefined ? params[1] : this.store.users[uIdx].specialty;
        return { rows: [this.store.users[uIdx]] };
      }
      return { rows: [] };
    }

    // 5.5. Select single patient by id (must come before the general SELECT p.* handler)
    // Matches both plain WHERE id= and portal-style WHERE p.id=
    if (
      (queryLower.includes('from patients') || queryLower.includes('from patients p')) &&
      (queryLower.includes('where p.id =') || queryLower.includes('where p.id=') ||
       queryLower.includes('from patients where id =') || queryLower.includes('from patients where id='))
    ) {
      const id = params[0];
      const patient = this.store.patients.find(p => p.id.toString() === id.toString());
      if (!patient) return { rows: [], rowCount: 0 };
      const diseases = this.store.diseases.filter(d => d.patient_id.toString() === id.toString()).map(d => d.disease_name);
      const doc = this.store.users.find(u => u.id.toString() === patient.primary_doctor_id?.toString());
      const nurse = this.store.users.find(u => u.id.toString() === patient.primary_nurse_id?.toString());
      return { rows: [{ ...patient, diseases, doctor_name: doc ? doc.name : 'Unassigned', nurse_name: nurse ? nurse.name : 'Unassigned' }], rowCount: 1 };
    }

    // 5. Select all patients
    if (queryLower.includes('select p.*') || queryLower.includes('select * from patients')) {
      // Return patients matched with user name
      const rows = this.store.patients.map(p => {
        const doc = this.store.users.find(u => u.id.toString() === p.primary_doctor_id?.toString());
        const nurse = this.store.users.find(u => u.id.toString() === p.primary_nurse_id?.toString());
        return {
          ...p,
          doctor_name: doc ? doc.name : 'Unassigned',
          nurse_name: nurse ? nurse.name : 'Unassigned'
        };
      });
      return { rows };
    }

    // 7. Insert Patient
    if (queryLower.includes('insert into patients')) {
      const newPatient = {
        id: this.store.patients.length + 1,
        name: params[0],
        age: params[1],
        gender: params[2],
        bed: params[3],
        department: params[4],
        status: params[5] || 'Stable',
        details: params[6],
        admission_date: new Date(),
        primary_doctor_id: params[7],
        primary_nurse_id: params[8],
        history: [],
        medications: []
      };
      this.store.patients.push(newPatient);
      return { rows: [newPatient] };
    }

    // 8. Update Patient (handles status updates, clinician assignment, or full updates)
    if (queryLower.includes('update patients set')) {
      const id = params[params.length - 1];
      const pIdx = this.store.patients.findIndex(p => p.id.toString() === id.toString());
      if (pIdx !== -1) {
        if (queryLower.includes("status = 'discharged'") && queryLower.includes("bed = null")) {
          // Patient discharge
          this.store.patients[pIdx].status = 'Discharged';
          this.store.patients[pIdx].bed = null;
        } else if (queryLower.includes('status = $1') && params.length === 2) {
          // Status-only update (e.g. from vitals logs AI check)
          this.store.patients[pIdx].status = params[0];
        } else if (queryLower.includes('primary_doctor_id =') && params.length === 3) {
          // Attending clinicians update
          this.store.patients[pIdx].primary_doctor_id = params[0] !== undefined ? params[0] : this.store.patients[pIdx].primary_doctor_id;
          this.store.patients[pIdx].primary_nurse_id = params[1] !== undefined ? params[1] : this.store.patients[pIdx].primary_nurse_id;
        } else {
          // Full fields update
          this.store.patients[pIdx] = {
            ...this.store.patients[pIdx],
            name: (params[0] !== undefined && params[0] !== null) ? params[0] : this.store.patients[pIdx].name,
            age: (params[1] !== undefined && params[1] !== null) ? params[1] : this.store.patients[pIdx].age,
            gender: (params[2] !== undefined && params[2] !== null) ? params[2] : this.store.patients[pIdx].gender,
            bed: (params[3] !== undefined && params[3] !== null) ? params[3] : this.store.patients[pIdx].bed,
            department: (params[4] !== undefined && params[4] !== null) ? params[4] : this.store.patients[pIdx].department,
            status: (params[5] !== undefined && params[5] !== null) ? params[5] : this.store.patients[pIdx].status,
            details: (params[6] !== undefined && params[6] !== null) ? params[6] : this.store.patients[pIdx].details,
            primary_doctor_id: (params[7] !== undefined && params[7] !== null) ? params[7] : this.store.patients[pIdx].primary_doctor_id,
            primary_nurse_id: (params[8] !== undefined && params[8] !== null) ? params[8] : this.store.patients[pIdx].primary_nurse_id,
            history: (params[9] !== undefined && params[9] !== null) ? (typeof params[9] === 'string' ? JSON.parse(params[9]) : params[9]) : this.store.patients[pIdx].history,
            medications: (params[10] !== undefined && params[10] !== null) ? (typeof params[10] === 'string' ? JSON.parse(params[10]) : params[10]) : this.store.patients[pIdx].medications
          };
        }
        return { rows: [this.store.patients[pIdx]] };
      }
      return { rows: [] };
    }

    // 9. Delete Patient
    if (queryLower.includes('delete from patients')) {
      const id = params[0];
      this.store.patients = this.store.patients.filter(p => p.id.toString() !== id.toString());
      return { rowCount: 1 };
    }

    // 10. Select alerts
    if (queryLower.includes('from alerts')) {
      let filteredAlerts = this.store.alerts;
      if (queryLower.includes('where id =') || queryLower.includes('where id=')) {
        const alertId = params[0];
        filteredAlerts = this.store.alerts.filter(a => a.id.toString() === alertId.toString());
      } else if (queryLower.includes('patient_id =') || queryLower.includes('patient_id=')) {
        // Filter alerts by patient_id (used by portal and patient detail views)
        const patientId = params[0];
        filteredAlerts = this.store.alerts.filter(a => a.patient_id.toString() === patientId.toString());
      } else if (queryLower.includes('status =')) {
        const statusVal = params[0];
        filteredAlerts = this.store.alerts.filter(a => a.status === statusVal);
      }
      const activeRows = filteredAlerts.map(a => {
        const p = this.store.patients.find(pat => pat.id.toString() === a.patient_id.toString());
        return { ...a, patient_name: p ? p.name : 'Unknown', patient_bed: p ? p.bed : null };
      });
      return { rows: activeRows };
    }

    // 11. Insert Alert
    if (queryLower.includes('insert into alerts')) {
      const newAlert = {
        id: this.store.alerts.length + 1,
        patient_id: params[0],
        type: params[1],
        metric: params[2],
        value: params[3],
        threshold: params[4],
        status: 'Active',
        created_at: new Date()
      };
      this.store.alerts.push(newAlert);
      return { rows: [newAlert] };
    }

    // 12. Resolve Alert
    if (queryLower.includes('update alerts set status')) {
      const id = params[2]; // SQL format: SET status = 'Resolved', resolved_by = $1, action_taken = $2 WHERE id = $3
      const alertIdx = this.store.alerts.findIndex(a => a.id.toString() === id.toString());
      if (alertIdx !== -1) {
        this.store.alerts[alertIdx] = {
          ...this.store.alerts[alertIdx],
          status: 'Resolved',
          resolved_by: params[0],
          action_taken: params[1]
        };
        return { rows: [this.store.alerts[alertIdx]] };
      }
      return { rows: [] };
    }

    // 13. Select predictions
    if (queryLower.includes('from predictions')) {
      const match = this.store.predictions.filter(pr => pr.patient_id.toString() === params[0].toString());
      return { rows: match };
    }

    // 14. Insert predictions
    if (queryLower.includes('insert into predictions')) {
      const newPred = {
        id: this.store.predictions.length + 1,
        patient_id: params[0],
        risk_score: params[1],
        severity_level: params[2],
        deterioration_probability: params[3],
        icu_requirement_probability: params[4],
        emergency_probability: params[5],
        recommendations: params[6],
        created_at: new Date()
      };
      this.store.predictions.push(newPred);
      return { rows: [newPred] };
    }

    // 15. Select vitals_logs
    if (queryLower.includes('from vitals_logs')) {
      const logs = this.store.vitals_logs.filter(v => v.patient_id.toString() === params[0].toString()).sort((a,b) => b.recorded_at - a.recorded_at);
      return { rows: logs };
    }

    // 16. Insert vitals_log
    if (queryLower.includes('insert into vitals_logs')) {
      const newVital = {
        id: this.store.vitals_logs.length + 1,
        patient_id: params[0],
        recorded_by: params[1],
        oxygen: params[2],
        heart_rate: params[3],
        blood_pressure: params[4],
        temperature: params[5],
        blood_sugar: params[6],
        respiration_rate: params[7],
        platelet_count: params[8],
        weight: params[9],
        recorded_at: new Date()
      };
      this.store.vitals_logs.push(newVital);
      return { rows: [newVital] };
    }

    // 17. Select diseases by patient_id
    if (queryLower.includes('from diseases where patient_id')) {
      const patientId = params[0];
      const match = this.store.diseases.filter(d => d.patient_id.toString() === patientId.toString());
      return { rows: match };
    }

    // 18. Insert disease mapping
    if (queryLower.includes('insert into diseases')) {
      const newDisease = {
        id: this.store.diseases.length + 1,
        patient_id: Number(params[0]),
        disease_name: params[1],
        metadata: params[2] || {}
      };
      this.store.diseases.push(newDisease);
      return { rows: [newDisease] };
    }

    // 19. Delete diseases mapping
    if (queryLower.includes('delete from diseases')) {
      const patientId = params[0];
      this.store.diseases = this.store.diseases.filter(d => d.patient_id.toString() !== patientId.toString());
      return { rowCount: 1 };
    }

    // 20. Select all users
    if (queryLower.includes('from users') && !queryLower.includes('where')) {
      const sanitizedUsers = this.store.users.map(({ password_hash, ...u }) => u);
      return { rows: sanitizedUsers };
    }

    // 21. Insert portal token
    if (queryLower.includes('insert into patient_portal_tokens')) {
      const newToken = {
        id: this.store.patient_portal_tokens.length + 1,
        patient_id: Number(params[0]),
        token: params[1],
        expires_at: params[2],
        used: false
      };
      this.store.patient_portal_tokens.push(newToken);
      return { rows: [newToken], rowCount: 1 };
    }

    // 22. Validate a specific portal token (token = $1)
    if (queryLower.includes('from patient_portal_tokens') && queryLower.includes('token =')) {
      const token = params[0];
      const tokenRecord = this.store.patient_portal_tokens.find(t => t.token === token);
      if (!tokenRecord) return { rows: [], rowCount: 0 };
      const patient = this.store.patients.find(p => p.id.toString() === tokenRecord.patient_id.toString());
      return { 
        rows: [{ 
          patient_id: tokenRecord.patient_id, 
          token_id: tokenRecord.id, 
          patient_name: patient ? patient.name : 'Unknown', 
          status: patient ? patient.status : 'Unknown' 
        }],
        rowCount: 1
      };
    }

    // 23. List all portal tokens (admin/nurse dashboard)
    if (queryLower.includes('from patient_portal_tokens')) {
      const rows = this.store.patient_portal_tokens.map(t => {
        const patient = this.store.patients.find(p => p.id.toString() === t.patient_id.toString());
        return {
          ...t,
          patient_name: patient ? patient.name : 'Unknown',
          patient_status: patient ? patient.status : 'Unknown'
        };
      });
      return { rows };
    }

    // 24. Delete / revoke portal token
    if (queryLower.includes('delete from patient_portal_tokens')) {
      const tokenId = params[0];
      this.store.patient_portal_tokens = this.store.patient_portal_tokens.filter(
        t => t.id.toString() !== tokenId.toString()
      );
      return { rowCount: 1 };
    }

    // 25. Insert appointment
    if (queryLower.includes('insert into appointments')) {
      const newAppt = {
        id: this.store.appointments.length + 1,
        patient_id: Number(params[0]),
        doctor_id: params[1] || null,
        scheduled_at: params[2],
        status: 'Pending',
        requested_at: new Date()
      };
      this.store.appointments.push(newAppt);
      return { rows: [newAppt], rowCount: 1 };
    }

    // 26. Select appointments by patient_id
    if (queryLower.includes('from appointments')) {
      const patientId = params[0];
      const rows = this.store.appointments
        .filter(a => a.patient_id.toString() === patientId.toString())
        .map(a => {
          const doc = this.store.users.find(u => u.id.toString() === a.doctor_id?.toString());
          return { ...a, doctor_name: doc ? doc.name : null };
        })
        .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
      return { rows };
    }

    // Default empty match
    return { rows: [] };
  }
}

// Automatically runs the schema migrations and seeding if the DB is connected but empty
async function initializeDatabase(pool) {
  try {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    const tableExists = res.rows[0].exists;
    if (!tableExists) {
      console.log('🔄 Database tables not found. Automatically running schema.sql migration...');
      const schemaPath = path.resolve(__dirname, '../../schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the multi-statement schema and seeding script
      await pool.query(schemaSql);
      console.log('✅ Database schema migrated and seeded successfully.');
    } else {
      console.log('ℹ️ Database tables already exist. Skipping auto-migration.');
    }

    // Ensure the discharge constraints and column changes are applied
    await pool.query(`
      ALTER TABLE patients ALTER COLUMN bed DROP NOT NULL;
      ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
      ALTER TABLE patients ADD CONSTRAINT patients_status_check CHECK (status IN ('Stable', 'High Risk', 'Critical', 'Discharged'));
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;
    `);
  } catch (err) {
    console.error('❌ Failed to run auto-migration on database startup:', err.message);
  }
}

let dbInstance;
let supabaseClient = null;

try {
  // Test connection to postgres
  const pool = new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: 2000
  });

  // Verify pool with a quick connection query
  await pool.query('SELECT NOW()');
  console.log('✅ PostgreSQL Database Pool Connected Successfully.');
  
  // Run automated migration and data seeding if needed
  await initializeDatabase(pool);
  
  dbInstance = pool;
} catch (error) {
  // Fall back to in-memory store
  dbInstance = new InMemoryDb();
}

// Set up Supabase Client connection
if (config.supabaseUrl && config.supabaseKey) {
  try {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
    console.log('✅ Supabase Client Initialized.');
  } catch (error) {
    console.warn('⚠️ Supabase client initialization warning:', error.message);
  }
}

export const db = dbInstance;
export const supabase = supabaseClient;
export const isMockDb = dbInstance instanceof InMemoryDb;
export { InMemoryDb };
export default db;
