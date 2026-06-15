// src/services/pharmacySuggester.js
// Rule-based AI pharmacy suggestion engine

const drugDatabase = {
  'Heart Disease': {
    primary: [
      { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', purpose: 'Antiplatelet therapy', warnings: 'Avoid if bleeding disorders present' },
      { name: 'Metoprolol', dosage: '25-100mg', frequency: 'Twice daily', purpose: 'Beta-blocker for heart rate control', warnings: 'Monitor for bradycardia' },
      { name: 'Lisinopril', dosage: '10-40mg', frequency: 'Once daily', purpose: 'ACE inhibitor for blood pressure', warnings: 'Monitor potassium levels' },
      { name: 'Atorvastatin', dosage: '20-80mg', frequency: 'Once daily at bedtime', purpose: 'Cholesterol management', warnings: 'Monitor liver function' }
    ],
    precautions: [
      'Maintain low-sodium diet (< 2g/day)',
      'Regular cardiac rehabilitation exercises',
      'Monitor blood pressure twice daily',
      'Avoid heavy lifting for 6 weeks post-procedure',
      'Report any chest pain or shortness of breath immediately'
    ]
  },
  'Cancer': {
    primary: [
      { name: 'Ondansetron', dosage: '8mg', frequency: 'Every 8 hours as needed', purpose: 'Anti-nausea during chemotherapy', warnings: 'May cause constipation' },
      { name: 'Dexamethasone', dosage: '4-8mg', frequency: 'Once daily', purpose: 'Anti-inflammatory, appetite stimulant', warnings: 'Taper gradually, do not stop abruptly' },
      { name: 'Filgrastim', dosage: '5mcg/kg', frequency: 'Daily injection', purpose: 'White blood cell stimulation', warnings: 'Monitor bone pain' }
    ],
    precautions: [
      'Avoid crowds and sick individuals (immunocompromised)',
      'Maintain high-protein, nutrient-dense diet',
      'Stay hydrated (8-10 glasses of water daily)',
      'Report fever above 100.4°F (38°C) immediately',
      'Wear sunscreen; chemotherapy increases sun sensitivity'
    ]
  },
  'Diabetes': {
    primary: [
      { name: 'Metformin', dosage: '500-1000mg', frequency: 'Twice daily with meals', purpose: 'Blood sugar regulation', warnings: 'Take with food to reduce GI side effects' },
      { name: 'Glipizide', dosage: '5-10mg', frequency: 'Before breakfast', purpose: 'Insulin secretion stimulator', warnings: 'Risk of hypoglycemia' },
      { name: 'Insulin Glargine', dosage: 'As prescribed', frequency: 'Once daily at bedtime', purpose: 'Long-acting basal insulin', warnings: 'Rotate injection sites' }
    ],
    precautions: [
      'Monitor blood glucose 4 times daily',
      'Follow diabetic meal plan strictly',
      'Exercise 30 minutes daily (walking recommended)',
      'Check feet daily for cuts, blisters, or sores',
      'Carry fast-acting glucose for hypoglycemia episodes'
    ]
  },
  'Hypertension': {
    primary: [
      { name: 'Amlodipine', dosage: '5-10mg', frequency: 'Once daily', purpose: 'Calcium channel blocker', warnings: 'May cause ankle swelling' },
      { name: 'Losartan', dosage: '50-100mg', frequency: 'Once daily', purpose: 'ARB for blood pressure control', warnings: 'Avoid in pregnancy' },
      { name: 'Hydrochlorothiazide', dosage: '12.5-25mg', frequency: 'Once daily', purpose: 'Diuretic', warnings: 'Monitor electrolytes' }
    ],
    precautions: [
      'Reduce sodium intake to less than 1500mg/day',
      'Limit alcohol consumption',
      'Maintain healthy weight (BMI < 25)',
      'Practice stress management techniques',
      'Monitor blood pressure at home daily'
    ]
  },
  'Asthma': {
    primary: [
      { name: 'Albuterol Inhaler', dosage: '2 puffs', frequency: 'Every 4-6 hours as needed', purpose: 'Rescue bronchodilator', warnings: 'May cause tremor/tachycardia' },
      { name: 'Fluticasone Inhaler', dosage: '110mcg', frequency: 'Twice daily', purpose: 'Inhaled corticosteroid controller', warnings: 'Rinse mouth after use' },
      { name: 'Montelukast', dosage: '10mg', frequency: 'Once daily at bedtime', purpose: 'Leukotriene receptor antagonist', warnings: 'Report mood changes' }
    ],
    precautions: [
      'Identify and avoid known triggers',
      'Always carry rescue inhaler',
      'Use peak flow meter daily to monitor lung function',
      'Get annual flu vaccination',
      'Avoid smoking and secondhand smoke'
    ]
  },
  'Dengue': {
    primary: [
      { name: 'Acetaminophen', dosage: '500-1000mg', frequency: 'Every 6 hours as needed', purpose: 'Fever and pain relief', warnings: 'Do NOT use aspirin or ibuprofen' },
      { name: 'ORS (Oral Rehydration)', dosage: '200-400ml', frequency: 'After every loose stool', purpose: 'Fluid replacement', warnings: 'Monitor for dehydration signs' }
    ],
    precautions: [
      'Complete bed rest during febrile phase',
      'Monitor platelet count daily',
      'Drink plenty of fluids (coconut water, electrolyte solutions)',
      'Watch for warning signs: abdominal pain, persistent vomiting, bleeding',
      'Avoid mosquito bites to prevent spread'
    ]
  },
  'Kidney Disease': {
    primary: [
      { name: 'Furosemide', dosage: '20-80mg', frequency: 'Once or twice daily', purpose: 'Loop diuretic for fluid management', warnings: 'Monitor potassium levels' },
      { name: 'Erythropoietin', dosage: 'As prescribed', frequency: '1-3 times weekly', purpose: 'Anemia management', warnings: 'Monitor hemoglobin levels' },
      { name: 'Calcium Carbonate', dosage: '500mg', frequency: 'With meals', purpose: 'Phosphorus binder', warnings: 'Take with food only' }
    ],
    precautions: [
      'Restrict fluid intake as advised by nephrologist',
      'Low-protein diet (0.6-0.8g/kg/day)',
      'Limit potassium and phosphorus intake',
      'Monitor weight daily (sudden gain = fluid retention)',
      'Avoid NSAIDs (ibuprofen, naproxen)'
    ]
  },
  'Pneumonia': {
    primary: [
      { name: 'Azithromycin', dosage: '500mg Day 1, then 250mg', frequency: 'Once daily for 5 days', purpose: 'Macrolide antibiotic', warnings: 'Complete full course' },
      { name: 'Ceftriaxone', dosage: '1-2g', frequency: 'Once daily IV', purpose: 'Broad-spectrum antibiotic', warnings: 'Monitor for allergic reactions' },
      { name: 'Acetaminophen', dosage: '500-1000mg', frequency: 'Every 6 hours as needed', purpose: 'Fever reduction', warnings: 'Max 3g/day' }
    ],
    precautions: [
      'Deep breathing exercises every 2 hours',
      'Incentive spirometry 10 times per hour while awake',
      'Stay hydrated (aim for 2-3 liters daily)',
      'Get pneumococcal and flu vaccines after recovery',
      'Report worsening breathing or high fever immediately'
    ]
  },
  'Stroke': {
    primary: [
      { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', purpose: 'Antiplatelet therapy', warnings: 'Risk of bleeding' },
      { name: 'Atorvastatin', dosage: '40-80mg', frequency: 'Once daily', purpose: 'Cholesterol and vascular protection', warnings: 'Monitor liver enzymes' },
      { name: 'Lisinopril', dosage: '10-20mg', frequency: 'Once daily', purpose: 'Blood pressure management', warnings: 'Monitor renal function' }
    ],
    precautions: [
      'Begin physical rehabilitation immediately',
      'Speech therapy if language affected',
      'Monitor blood pressure strictly (target < 130/80)',
      'Fall prevention measures at home',
      'Learn FAST signs: Face drooping, Arm weakness, Speech difficulty, Time to call emergency'
    ]
  },
  'Diarrhea': {
    primary: [
      { name: 'ORS (Oral Rehydration)', dosage: '200ml', frequency: 'After every loose stool', purpose: 'Electrolyte replacement', warnings: 'Prepare fresh daily' },
      { name: 'Loperamide', dosage: '2mg', frequency: 'After each loose stool (max 16mg/day)', purpose: 'Anti-diarrheal', warnings: 'Do not use if bloody stool or fever' },
      { name: 'Zinc Supplement', dosage: '20mg', frequency: 'Once daily for 10-14 days', purpose: 'Reduce duration and severity', warnings: 'May cause nausea on empty stomach' }
    ],
    precautions: [
      'BRAT diet (Bananas, Rice, Applesauce, Toast)',
      'Avoid dairy, spicy, and fatty foods',
      'Wash hands frequently to prevent spread',
      'Monitor for signs of dehydration (dry mouth, dizziness)',
      'Seek emergency care if blood in stool or high fever'
    ]
  }
};

export const pharmacySuggester = ({ diagnosis, currentMeds = [], allergies = [], labs = {} }) => {
  const normalizedDiagnosis = diagnosis ? diagnosis.trim() : '';
  
  // Find matching disease
  let matchedDisease = null;
  for (const [disease, data] of Object.entries(drugDatabase)) {
    if (normalizedDiagnosis.toLowerCase().includes(disease.toLowerCase()) ||
        disease.toLowerCase().includes(normalizedDiagnosis.toLowerCase())) {
      matchedDisease = { name: disease, ...data };
      break;
    }
  }

  if (!matchedDisease) {
    return {
      diagnosis: normalizedDiagnosis,
      medications: [],
      precautions: [
        'Consult your attending physician for personalized recommendations',
        'Maintain a balanced diet and adequate hydration',
        'Follow up with scheduled appointments',
        'Report any new or worsening symptoms immediately'
      ],
      warnings: ['No specific medication match found for the given diagnosis. Please consult a specialist.'],
      confidence: 'low'
    };
  }

  // Filter out medications the patient is allergic to
  const allergyLower = allergies.map(a => a.toLowerCase());
  const safeMeds = matchedDisease.primary.filter(med => 
    !allergyLower.some(allergy => med.name.toLowerCase().includes(allergy))
  );

  // Filter out already prescribed medications
  const currentMedLower = currentMeds.map(m => (typeof m === 'string' ? m : m.name || '').toLowerCase());
  const newSuggestions = safeMeds.filter(med =>
    !currentMedLower.some(cm => cm.includes(med.name.toLowerCase()))
  );

  return {
    diagnosis: matchedDisease.name,
    medications: safeMeds,
    newSuggestions: newSuggestions,
    alreadyPrescribed: safeMeds.filter(med =>
      currentMedLower.some(cm => cm.includes(med.name.toLowerCase()))
    ),
    precautions: matchedDisease.precautions,
    warnings: allergies.length > 0 
      ? [`Medications containing ${allergies.join(', ')} have been excluded due to known allergies.`]
      : [],
    confidence: 'high'
  };
};
