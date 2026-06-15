// CareSync AI Monitoring & Clinical Prediction Engine

export const runAiAudit = (vitals, diseases = []) => {
  let riskScore = 10; // base risk score
  let recommendations = [];
  const details = {};

  const {
    oxygen = 98,
    heartRate = 72,
    bloodPressure = "120/80",
    temperature = 37.0,
    bloodSugar = 100,
    respirationRate = 16,
    plateletCount = 250000,
    weight = 70.0
  } = vitals;

  // BP Parsing Helper
  let systolic = 120;
  let diastolic = 80;
  if (bloodPressure && bloodPressure.includes('/')) {
    const parts = bloodPressure.split('/');
    systolic = parseInt(parts[0]) || 120;
    diastolic = parseInt(parts[1]) || 80;
  }

  // 1. General Vitals Scoring Rules
  if (oxygen < 90) {
    riskScore += 30;
    recommendations.push("Oxygen saturation is CRITICAL (<90%). Initiate high-flow O2 therapy immediately.");
  } else if (oxygen < 94) {
    riskScore += 15;
    recommendations.push("Oxygen saturation low (90-94%). Provide nasal cannula support and inspect airway.");
  }

  if (heartRate > 120 || heartRate < 45) {
    riskScore += 25;
    recommendations.push("Heart rate is at critical levels. Check ECG for ventricular arrhythmia signals.");
  } else if (heartRate > 100 || heartRate < 55) {
    riskScore += 10;
    recommendations.push("Heart rate is borderline tachycardic/bradycardic. Monitor patient posture and hydration.");
  }

  if (systolic >= 160 || diastolic >= 100) {
    riskScore += 20;
    recommendations.push("Hypertensive emergency detected. Administer immediate anti-hypertensives.");
  } else if (systolic <= 90 || diastolic <= 50) {
    riskScore += 20;
    recommendations.push("Hypotension warning. Assess fluid balances and prepare saline infusion.");
  }

  if (temperature > 39.0) {
    riskScore += 15;
    recommendations.push("Severe hyperpyrexia fever. Administer IV antipyretics and conduct blood culture tests.");
  } else if (temperature < 35.0) {
    riskScore += 15;
    recommendations.push("Hypothermia alert. Apply active core warming blankets.");
  }

  // 2. Disease-Specific Clinical Rules
  diseases.forEach(diseaseName => {
    switch (diseaseName) {
      case 'Cancer':
        // Monitor Pain, Oxygen, Fatigue, Weight loss (simulated via vitals)
        // Check pain score from metadata (painScore > 6 or severe fatigue adds risk)
        if (vitals.painScore && vitals.painScore >= 7) {
          riskScore += 15;
          recommendations.push("Patient complains of Grade 3 severe pain. Deliver ordered breakthrough analgesic (opioid).");
        }
        if (vitals.fatigue && vitals.fatigue >= 8) {
          riskScore += 10;
          recommendations.push("Cancer-induced fatigue is severe. Review blood counts for anemia / red cell indices.");
        }
        break;

      case 'Diabetes':
        // Monitor Sugar, BP
        if (bloodSugar > 250) {
          riskScore += 20;
          recommendations.push("Severe hyperglycemia glucose level detected. Administer insulin bolus per sliding scale.");
        } else if (bloodSugar < 65) {
          riskScore += 20;
          recommendations.push("Severe hypoglycemia crisis. Deliver immediate IV D50 Dextrose or glucagon.");
        }
        if (systolic >= 140 || diastolic >= 90) {
          riskScore += 10;
          recommendations.push("Elevated diabetic blood pressure. Strict target limit under 130/80 is required.");
        }
        break;

      case 'Heart Disease':
        // Monitor ECG, HR, BP
        if (heartRate > 105) {
          riskScore += 15;
          recommendations.push("Heart disease patient tachycardic. Prepare beta-blocker administration.");
        }
        if (systolic > 150) {
          riskScore += 15;
          recommendations.push("Severe cardiovascular afterload risk due to high systolic BP.");
        }
        break;

      case 'Asthma':
        // Monitor Oxygen, Respiration
        if (respirationRate > 25) {
          riskScore += 20;
          recommendations.push("Tachypnea breathing detected in asthma patient. Begin continuous nebulizer treatments.");
        }
        break;

      case 'Dengue':
        // Monitor Platelets, Temp
        if (plateletCount < 80000) {
          riskScore += 25;
          recommendations.push("Platelet count is critical (<80k/uL) for Dengue. High risk of Dengue Hemorrhagic Shock. Prepare platelet transfusion.");
        } else if (plateletCount < 120000) {
          riskScore += 10;
          recommendations.push("Dengue platelet count declining. Monitor hematocrit and fluid balance closely.");
        }
        break;

      case 'Kidney Disease':
        // Monitor Weight gain (water retention), BP
        if (systolic > 155) {
          riskScore += 15;
          recommendations.push("Elevated BP is dangerous for chronic kidney disease. Administer ACE/ARB inhibitor.");
        }
        break;

      case 'Pneumonia':
        // Monitor Oxygen, Temp, Respiration
        if (oxygen < 92) {
          riskScore += 15;
          recommendations.push("Pneumonia hypoxia. Escalate respiratory support to CPAP/BiPAP.");
        }
        break;

      case 'Hypertension':
        if (systolic > 160) {
          riskScore += 20;
          recommendations.push("Crisis hypertension. Immediate continuous blood pressure arterial line audit.");
        }
        break;

      case 'Stroke':
        // Monitor BP, HR
        if (systolic > 180) {
          riskScore += 25;
          recommendations.push("Critical Post-Stroke Blood Pressure. Immediate neuro-critical care notification.");
        }
        break;

      case 'Diarrhea':
        // Monitor Weight loss (Dehydration), Temp
        if (temperature > 38.5) {
          riskScore += 10;
          recommendations.push("Infectious acute gastroenteritis. Initiate active IV rehydration.");
        }
        break;
        
      default:
        break;
    }
  });

  // Bound risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Severity Levels
  let severityLevel = 'Stable';
  if (riskScore > 75) severityLevel = 'Critical';
  else if (riskScore > 50) severityLevel = 'High Alert';
  else if (riskScore > 25) severityLevel = 'Medium Alert';

  // 3. AI Predictive Probabilities Math Model (MEWS curves)
  const deteriorationProbability = Math.min(100, Math.max(0, riskScore * 0.95 + (100 - oxygen) * 0.2));
  const icuRequirementProbability = Math.max(0, Math.min(100, riskScore > 70 ? (riskScore - 30) * 1.4 : riskScore * 0.3));
  const emergencyProbability = Math.max(0, Math.min(100, riskScore > 50 ? riskScore * 1.1 : riskScore * 0.5));

  // Default recommendation if empty
  if (recommendations.length === 0) {
    recommendations.push("All monitored clinical parameters are within baseline target limits.");
  }

  return {
    riskScore,
    severityLevel,
    probabilities: {
      deterioration: parseFloat(deteriorationProbability.toFixed(1)),
      icuRequirement: parseFloat(icuRequirementProbability.toFixed(1)),
      emergency: parseFloat(emergencyProbability.toFixed(1))
    },
    recommendations
  };
};
export default runAiAudit;
