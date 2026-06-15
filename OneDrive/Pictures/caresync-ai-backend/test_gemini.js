import dotenv from 'dotenv';
dotenv.config();

console.log("Using API Key:", process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING");

const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 black pixel PNG
const fileName = "test_blood_report.png";
const fileType = "image/png";

const prompt = `You are a clinical AI medical officer. Analyze the attached diagnostic report / lab result file (filename: "${fileName}", MIME type: "${fileType}").
Extract the patient's vitals if present, identify any clinical abnormalities or critical values, write a summary of the report, and recommend a suggested action.
You must return your response as a valid JSON object matching this schema:
{
  "summary": "Concise medical summary of the report's overall findings.",
  "abnormalities": ["List of abnormal findings, warning signs, or out-of-range metrics"],
  "suggestedAction": "Recommended next step or follow-up check for the clinical staff.",
  "vitals": {
    "oxygen": 96,
    "heartRate": 80
  }
}
Return only the raw JSON.`;

const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

try {
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: fileType,
                data: mockBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Result:", JSON.stringify(data, null, 2));
} catch (err) {
  console.error("Error:", err);
}
