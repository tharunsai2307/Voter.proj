export const mockPatients = [
  {
    id: "P-101",
    name: "Eleanor Vance",
    age: 64,
    gender: "Female",
    bed: "ICU-04",
    department: "ICU",
    disease: "Heart Disease",
    status: "Critical",
    admissionDate: "2026-06-12",
    primaryDoctor: "Dr. Sarah Jenkins",
    riskScore: 92,
    details: "Severe myocardial infarction survivor. Patient exhibits brief episodes of ventricular arrhythmia. Monitored continuously via ECG telemetry.",
    history: [
      { date: "2022-04-10", event: "Diagnosed with hypertension" },
      { date: "2024-09-18", event: "Coronary angioplasty performed" },
      { date: "2026-06-12", event: "Admitted via ER due to severe chest pain" }
    ],
    timeline: [
      { time: "08:30 AM", status: "Critical", title: "Arrhythmia Alert", desc: "PVC runs detected on ECG track." },
      { time: "09:45 AM", status: "Stable", title: "Medication Administered", desc: "Amiodarone bolus + infusion initiated." },
      { time: "11:00 AM", status: "Critical", title: "Oxygen Desaturation", desc: "SpO2 dropped to 89%. Oxygen supply increased to 4L/min." },
      { time: "01:15 PM", status: "Critical", title: "Vitals Check", desc: "Heart rate stabilizing at 95 bpm, SpO2 back to 95%." }
    ],
    metrics: {
      heartRate: 95,
      oxygen: 95,
      temperature: 38.2,
      bloodPressure: "135/88",
      ecgRate: 1.0, // scale factor for ECG animation
      painScore: 3,
      fatigue: 4,
      bloodSugar: 110,
    }
  },
  {
    id: "P-102",
    name: "Marcus Vance",
    age: 48,
    gender: "Male",
    bed: "WARD-12A",
    department: "Oncology",
    disease: "Cancer",
    status: "High Risk",
    admissionDate: "2026-06-08",
    primaryDoctor: "Dr. Arthur Pendelton",
    riskScore: 74,
    details: "Stage III lung adenocarcinoma. Undergoing active chemotherapy cycle 3. Experiencing significant cancer-related fatigue and moderate pain.",
    history: [
      { date: "2025-11-05", event: "Primary tumor diagnosed in left upper lobe" },
      { date: "2026-01-20", event: "Lobectomy performed" },
      { date: "2026-06-08", event: "Admitted for chemotherapy infusion and pain stabilization" }
    ],
    timeline: [
      { time: "Yesterday", status: "Stable", title: "Chemo Infusion", desc: "Completed 4-hour Cisplatin drip without immediate reactions." },
      { time: "06:00 AM", status: "High Risk", title: "Nausea & Fatigue Spike", desc: "Patient reported Grade 3 fatigue and severe nausea. Administered Ondansetron." },
      { time: "10:30 AM", status: "High Risk", title: "Pain Management", desc: "Complained of deep chest pain. Breakthrough dose of morphine administered." }
    ],
    metrics: {
      heartRate: 82,
      oxygen: 96,
      temperature: 37.1,
      bloodPressure: "118/74",
      painScore: 7,
      weightTrend: [78.2, 77.5, 76.9, 75.8, 75.2], // declining weight trend
      fatigue: 8,
      bloodSugar: 98,
    }
  },
  {
    id: "P-103",
    name: "Diana Prince",
    age: 56,
    gender: "Female",
    bed: "WARD-08B",
    department: "Endocrinology",
    disease: "Diabetes",
    status: "Stable",
    admissionDate: "2026-06-14",
    primaryDoctor: "Dr. Helen Cho",
    riskScore: 35,
    details: "Type 2 diabetes mellitus with diabetic ketoacidosis history. Admitted for insulin pump calibration and glycemic indexing setup.",
    history: [
      { date: "2015-05-12", event: "Type 2 Diabetes diagnosis" },
      { date: "2021-08-03", event: "Diabetic retinopathy screening (mild)" },
      { date: "2026-06-14", event: "Admitted for blood sugar stabilization" }
    ],
    timeline: [
      { time: "Yesterday", status: "Stable", title: "Admission", desc: "Admitted with fasting glucose of 280 mg/dL." },
      { time: "07:00 AM", status: "Stable", title: "Insulin Calibration", desc: "Fasting glucose measured at 145 mg/dL. Adjusting basal rate." },
      { time: "12:30 PM", status: "Stable", title: "Postprandial Check", desc: "Glucose surged to 210 mg/dL. Delivered 3.5 units bolus insulin." }
    ],
    metrics: {
      heartRate: 72,
      oxygen: 99,
      temperature: 36.6,
      bloodPressure: "125/82",
      painScore: 1,
      fatigue: 3,
      bloodSugar: 145,
      sugarHistory: [280, 245, 195, 145, 210, 168], // glucose trace over time
      bloodPressureHistory: ["140/90", "135/88", "130/85", "125/82"]
    }
  },
  {
    id: "P-104",
    name: "Robert Chen",
    age: 72,
    gender: "Male",
    bed: "ICU-02",
    department: "Cardiology",
    disease: "Heart Disease",
    status: "Critical",
    admissionDate: "2026-06-10",
    primaryDoctor: "Dr. Sarah Jenkins",
    riskScore: 88,
    details: "Congestive heart failure (NYHA Class IV). Exhibiting pulmonary edema. Patient under strict fluid restriction and continuous pulse oximetry.",
    history: [
      { date: "2018-02-14", event: "Diagnosed with cardiomyopathy" },
      { date: "2023-11-22", event: "ICD pacemaker implanted" },
      { date: "2026-06-10", event: "Admitted due to acute decompensated heart failure" }
    ],
    timeline: [
      { time: "06:00 AM", status: "Critical", title: "Pacemaker Discharge Warning", desc: "ICD device reported minor ventricular tracking error. Checked by cardiology tech." },
      { time: "08:15 AM", status: "Critical", title: "Furosemide Administered", desc: "IV Lasix 80mg push given to reduce fluid overload." }
    ],
    metrics: {
      heartRate: 104,
      oxygen: 92,
      temperature: 37.5,
      bloodPressure: "108/65",
      ecgRate: 1.3,
      painScore: 4,
      fatigue: 6,
      bloodSugar: 125,
    }
  },
  {
    id: "P-105",
    name: "Sofia Rodriguez",
    age: 39,
    gender: "Female",
    bed: "WARD-15C",
    department: "Oncology",
    disease: "Cancer",
    status: "Stable",
    admissionDate: "2026-06-11",
    primaryDoctor: "Dr. Arthur Pendelton",
    riskScore: 28,
    details: "HER2+ breast cancer. Admitted for scheduled immunotherapy dose (Trastuzumab) and assessment of chemotherapy-induced neuropathy.",
    history: [
      { date: "2026-02-28", event: "Diagnosed with HER2+ invasive ductal carcinoma" },
      { date: "2026-03-15", event: "Bilateral mastectomy and reconstruction" }
    ],
    timeline: [
      { time: "09:00 AM", status: "Stable", title: "Infusion Started", desc: "Trastuzumab load dose begun. Patient vitals within normal parameters." },
      { time: "11:30 AM", status: "Stable", title: "Neuropathy Test", desc: "Conducted sensory test on fingers/toes. Mild Grade 1 peripheral neuropathy noted." }
    ],
    metrics: {
      heartRate: 78,
      oxygen: 98,
      temperature: 36.9,
      bloodPressure: "120/80",
      painScore: 2,
      weightTrend: [65.4, 65.2, 64.9, 65.1],
      fatigue: 4,
      bloodSugar: 94,
    }
  },
  {
    id: "P-106",
    name: "Jameson Miller",
    age: 51,
    gender: "Male",
    bed: "WARD-05D",
    department: "Endocrinology",
    disease: "Diabetes",
    status: "High Risk",
    admissionDate: "2026-06-13",
    primaryDoctor: "Dr. Helen Cho",
    riskScore: 68,
    details: "Type 1 diabetes presenting with extreme glycemic variability. Admitted following a severe hypoglycemic seizure at home.",
    history: [
      { date: "1998-10-04", event: "Type 1 Diabetes diagnosis" },
      { date: "2020-05-12", event: "Admitted with DKA" }
    ],
    timeline: [
      { time: "Yesterday", status: "Critical", title: "Hypoglycemic Seizure", desc: "Admitted in semi-conscious state, blood glucose at 38 mg/dL. Corrected with IV Dextrose." },
      { time: "04:00 AM", status: "High Risk", title: "Rebound Hyperglycemia", desc: "Somogyi effect triggered blood glucose surge to 310 mg/dL. Treated with short-acting insulin." }
    ],
    metrics: {
      heartRate: 88,
      oxygen: 97,
      temperature: 37.0,
      bloodPressure: "138/85",
      painScore: 1,
      fatigue: 7,
      bloodSugar: 310,
      sugarHistory: [38, 110, 180, 240, 310, 260],
      bloodPressureHistory: ["145/95", "140/90", "138/85"]
    }
  }
];

export const mockAlerts = [
  {
    id: "A-501",
    patientId: "P-101",
    patientName: "Eleanor Vance",
    vessel: "ICU-04",
    type: "Critical",
    metric: "SpO2 (Oxygen Level)",
    value: "89%",
    threshold: "<92%",
    time: "11:00 AM",
    date: "2026-06-15",
    escalated: true,
    actionTaken: "Oxygen flow rate boosted to 4L/min. Vitals stabilizing."
  },
  {
    id: "A-502",
    patientId: "P-106",
    patientName: "Jameson Miller",
    vessel: "WARD-05D",
    type: "High Risk",
    metric: "Blood Sugar (Hyperglycemia)",
    value: "310 mg/dL",
    threshold: ">250 mg/dL",
    time: "04:00 AM",
    date: "2026-06-15",
    escalated: false,
    actionTaken: "Administered corrective insulin dose."
  },
  {
    id: "A-503",
    patientId: "P-104",
    patientName: "Robert Chen",
    vessel: "ICU-02",
    type: "Critical",
    metric: "Heart Rate (Tachycardia)",
    value: "104 bpm",
    threshold: ">100 bpm (At Rest)",
    time: "06:12 AM",
    date: "2026-06-15",
    escalated: false,
    actionTaken: "Administered continuous beta-blocker infusion."
  }
];

export const mockDoctors = [
  { id: "D-201", name: "Dr. Sarah Jenkins", specialty: "Cardiologist & ICU Lead", status: "Online" },
  { id: "D-202", name: "Dr. Arthur Pendelton", specialty: "Oncologist", status: "Online" },
  { id: "D-203", name: "Dr. Helen Cho", specialty: "Endocrinologist", status: "Online" },
  { id: "D-204", name: "Dr. Marcus Brody", specialty: "Neurologist", status: "Offline" },
  { id: "D-205", name: "Dr. Clara Oswald", specialty: "Emergency Medicine", status: "Online" }
];

export const mockDepartments = [
  { name: "ICU", occupied: 8, capacity: 10, efficiency: "98%", status: "Optimal" },
  { name: "Cardiology", occupied: 14, capacity: 15, efficiency: "95%", status: "Optimal" },
  { name: "Oncology", occupied: 22, capacity: 25, efficiency: "92%", status: "Optimal" },
  { name: "Endocrinology", occupied: 9, capacity: 12, efficiency: "89%", status: "Optimal" },
  { name: "Emergency Ward", occupied: 18, capacity: 20, efficiency: "97%", status: "High Load" }
];
