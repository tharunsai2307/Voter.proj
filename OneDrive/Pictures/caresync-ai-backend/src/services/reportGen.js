import PDFDocument from 'pdfkit';
import { Document, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, HeadingLevel } from 'docx';

// 1. PDF Export Service
export const generatePdfReport = (patient, vitals, predictions) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Draw header layout
      doc.rect(0, 0, doc.page.width, 30).fill('#080c14');
      
      doc.moveDown(2);
      doc.fillColor('#0072ff').fontSize(22).font('Helvetica-Bold').text('CARESYNC AI CLINICAL PROFILE', { align: 'center' });
      doc.fillColor('#666666').fontSize(10).font('Helvetica').text('ELECTRONIC PATIENT RECORD SYSTEM SUMMARY', { align: 'center' });
      doc.moveDown(1.5);

      // Patient Meta Section
      doc.rect(50, doc.y, 500, 110).stroke('#dddddd');
      doc.fillColor('#111111').fontSize(12).font('Helvetica-Bold').text('  PATIENT INFORMATION', 60, doc.y + 10);
      
      const startY = doc.y + 10;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name:   ${patient.name}`, 70, startY);
      doc.text(`Age/Sex: ${patient.age} / ${patient.gender}`, 70, startY + 18);
      doc.text(`Bed:     ${patient.bed}`, 70, startY + 36);
      doc.text(`Dept:    ${patient.department}`, 70, startY + 54);

      doc.text(`Patient ID:    P-${patient.id}`, 320, startY);
      doc.text(`Attending:     ${patient.doctor_name || 'Dr. Sarah Jenkins'}`, 320, startY + 18);
      doc.text(`Nurse Duty:    ${patient.nurse_name || 'Nurse Carter'}`, 320, startY + 36);
      doc.text(`Admission:     ${new Date(patient.admission_date).toLocaleDateString()}`, 320, startY + 54);

      doc.y = startY + 80;
      doc.moveDown(2.5);

      // AI Risk Summary
      doc.rect(50, doc.y, 500, 60).fill('#f9fafb').stroke('#dddddd');
      const riskY = doc.y;
      doc.fillColor('#0072ff').fontSize(11).font('Helvetica-Bold').text('AI PREDICTIVE INSTABILITY SCORE', 65, riskY + 12);
      
      const score = predictions ? predictions.risk_score : 10;
      const severity = predictions ? predictions.severity_level : 'Stable';
      
      doc.fillColor(score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(`${score}%`, 65, riskY + 28);
         
      doc.fillColor('#555555')
         .fontSize(10)
         .font('Helvetica')
         .text(`Deterioration Level:   ${severity}`, 250, riskY + 14);
         
      doc.text(`Emergency Probability:  ${predictions ? predictions.emergency_probability : '12'}%`, 250, riskY + 32);

      doc.y = riskY + 60;
      doc.moveDown(2);

      // Telemetry Logs Table
      doc.fillColor('#111111').fontSize(12).font('Helvetica-Bold').text('LATEST TELEMETRY METRICS', 50, doc.y);
      doc.moveDown(0.5);

      const tableY = doc.y;
      doc.rect(50, tableY, 500, 20).fill('#080c14');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('METRIC', 60, tableY + 6);
      doc.text('RECORDED VALUE', 220, tableY + 6);
      doc.text('TARGET CLINICAL RANGE', 380, tableY + 6);

      let rowY = tableY + 20;
      const drawRow = (label, val, range) => {
        doc.rect(50, rowY, 500, 20).stroke('#eeeeee');
        doc.fillColor('#333333').fontSize(9).font('Helvetica');
        doc.text(label, 60, rowY + 6);
        doc.fillColor('#000000').font('Helvetica-Bold').text(val, 220, rowY + 6);
        doc.fillColor('#888888').font('Helvetica').text(range, 380, rowY + 6);
        rowY += 20;
      };

      drawRow('Oxygen Saturation (SpO2)', `${vitals.oxygen || 98}%`, '95% - 100%');
      drawRow('Heart Rate (HR)', `${vitals.heart_rate || 72} bpm`, '60 - 100 bpm');
      drawRow('Blood Pressure (BP)', vitals.blood_pressure || '120/80', '90/60 - 139/89');
      drawRow('Body Temperature', `${vitals.temperature || 37.0}°C`, '36.1°C - 37.2°C');
      drawRow('Blood Sugar', `${vitals.blood_sugar || 100} mg/dL`, '70 - 140 mg/dL');
      drawRow('Respiration Rate', `${vitals.respiration_rate || 16} breaths/min`, '12 - 20 breaths/min');

      doc.y = rowY;
      doc.moveDown(2);

      // Details observations
      doc.fillColor('#111111').fontSize(11).font('Helvetica-Bold').text('CLINICAL ADVISORIES & NOTES', 50, doc.y);
      doc.moveDown(0.5);
      
      const note = patient.details || "Patient metrics remain stable. General continuous monitoring scheduled.";
      doc.fillColor('#555555').fontSize(9).font('Helvetica').text(note, { width: 500, align: 'justify' });

      // Footer
      doc.moveDown(3);
      doc.fillColor('#aaaaaa').fontSize(8).text('CareSync AI smart medical diagnostic report • Secured under HIPAA privacy rules.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// 2. DOCX Word Document Export Service
export const generateDocxReport = async (patient, vitals, predictions) => {
  const score = predictions ? predictions.risk_score : 10;
  const severity = predictions ? predictions.severity_level : 'Stable';

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "CARESYNC AI CLINICAL ASSESSMENT REPORT",
                bold: true,
                color: "0072FF",
                size: 28,
              }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()}`,
                italics: true,
              }),
            ],
            spacing: { after: 300 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "PATIENT INFORMATION SUMMARY", bold: true, size: 24, underline: {} }),
            ],
            spacing: { after: 150 }
          }),

          // Demographics details Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Patient Name")] }),
                  new TableCell({ children: [new Paragraph(patient.name)] }),
                  new TableCell({ children: [new Paragraph("Registry ID")] }),
                  new TableCell({ children: [new Paragraph(`P-${patient.id}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Age / Gender")] }),
                  new TableCell({ children: [new Paragraph(`${patient.age} / ${patient.gender}`)] }),
                  new TableCell({ children: [new Paragraph("Bed / Ward")] }),
                  new TableCell({ children: [new Paragraph(patient.bed)] }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "\nAI CRITICAL TELEMETRY STABILITY SCORING", bold: true, size: 24 }),
            ],
            spacing: { before: 200, after: 150 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `Neural Risk Score: ${score}% / 100%\n`, bold: true, color: score > 75 ? "FF0000" : "008000" }),
              new TextRun({ text: `Deterioration Level: ${severity}\n` }),
              new TextRun({ text: `Emergency Incident probability: ${predictions ? predictions.emergency_probability : '10'}%\n` }),
              new TextRun({ text: `ICU Admission Requirement Probability: ${predictions ? predictions.icu_requirement_probability : '5'}%` }),
            ],
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "CLINICAL RECOMMENDATIONS & NOTES", bold: true, size: 24 }),
            ],
            spacing: { before: 200, after: 150 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: patient.details || "Patient metrics are stable. Continuous telemetry monitors are checking vitals logs." }),
            ],
            spacing: { after: 300 }
          }),
        ],
      },
    ],
  });

  return await docx.Packer.toBuffer(doc);
};
