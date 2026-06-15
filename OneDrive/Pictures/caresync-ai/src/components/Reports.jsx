import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Printer, Download, Sparkles, RefreshCw } from 'lucide-react';

export default function Reports({ selectedPatient, allPatients }) {
  const [compilingType, setCompilingType] = useState(null); // 'csv', 'doc', 'pdf' or null

  const triggerLoader = (type, callback) => {
    setCompilingType(type);
    setTimeout(() => {
      callback();
      setCompilingType(null);
    }, 1200);
  };
  
  const exportCSV = () => {
    triggerLoader('csv', () => {
      const headers = "ID,Name,Age,Gender,Bed,Department,Disease,Status,Risk Score,Heart Rate,Oxygen,Sugar,Primary Doctor,Admission Date\n";
      const rows = allPatients.map(p => 
        `"${p.id}","${p.name}",${p.age},"${p.gender}","${p.bed}","${p.department}","${p.disease}","${p.status}",${p.riskScore},${p.metrics.heartRate},${p.metrics.oxygen},${p.metrics.bloodSugar},"${p.primaryDoctor}","${p.admissionDate}"`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CareSync_Patient_Registry_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const exportDOCX = (patient) => {
    if (!patient) return alert("Please select a patient first to export their clinical profile.");
    
    triggerLoader('doc', () => {
      const docContent = `
=========================================
      CARESYNC AI CLINICAL PROFILE
=========================================
Generated: ${new Date().toLocaleString()}
Patient Registry ID: ${patient.id}

PATIENT INFORMATION
-----------------------------------------
Name:            ${patient.name}
Age / Gender:    ${patient.age} / ${patient.gender}
Assigned Bed:    ${patient.bed}
Department:      ${patient.department}
Primary Diagnosis: ${patient.disease}
Patient Status:  ${patient.status}
AI Risk Index:   ${patient.riskScore}% / 100%

LATEST TELEMETRY METRICS
-----------------------------------------
Heart Rate:      ${patient.metrics.heartRate} bpm
Oxygen (SpO2):   ${patient.metrics.oxygen}%
Temperature:     ${patient.metrics.temperature} °C
Blood Pressure:  ${patient.metrics.bloodPressure}
Blood Sugar:     ${patient.metrics.bloodSugar} mg/dL

CLINICAL RECOMMENDATIONS & SUMMARY
-----------------------------------------
Diagnosis Detail:
${patient.details}

Primary Physician: ${patient.primaryDoctor}
Admission Date:    ${patient.admissionDate}

-----------------------------------------
CONFIDENTIAL MEDICAL DATA - FOR AUTHORIZED CLINICAL USE ONLY
      `;

      const blob = new Blob([docContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CareSync_Report_${patient.name.replace(/\s+/g, '_')}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const printReport = (patient) => {
    if (!patient) return alert("Please select a patient to print report.");
    
    triggerLoader('pdf', () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>CareSync Clinical Report: ${patient.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #333;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #0072ff;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #0072ff;
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-top: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
                color: #555;
              }
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 15px 0;
              }
              .item {
                font-size: 14px;
              }
              .label {
                font-weight: bold;
                color: #666;
              }
              .risk-badge {
                display: inline-block;
                padding: 5px 10px;
                background-color: #ffebe9;
                color: #d93838;
                border-radius: 4px;
                font-weight: bold;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 11px;
                color: #888;
                border-top: 1px solid #eee;
                padding-top: 20px;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="header">
              <div class="logo">CareSync AI Hospital Platform</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">CLINICAL SUMMARY &amp; DIAGNOSTIC INTELLIGENCE</div>
            </div>

            <div class="section-title">PATIENT INFORMATION</div>
            <div class="grid">
              <div class="item"><span class="label">ID:</span> ${patient.id}</div>
              <div class="item"><span class="label">Name:</span> ${patient.name}</div>
              <div class="item"><span class="label">Age/Gender:</span> ${patient.age} / ${patient.gender}</div>
              <div class="item"><span class="label">Assigned Bed:</span> ${patient.bed} (${patient.department})</div>
              <div class="item"><span class="label">Primary Doctor:</span> ${patient.primaryDoctor}</div>
              <div class="item"><span class="label">Admission Date:</span> ${patient.admissionDate}</div>
            </div>

            <div class="section-title">AI RISK ASSESSMENT</div>
            <div class="grid">
              <div class="item"><span class="label">Deterioration Score:</span> <span class="risk-badge">${patient.riskScore}%</span></div>
              <div class="item"><span class="label">Status:</span> ${patient.status}</div>
            </div>

            <div class="section-title">LATEST TELEMETRY VITALS</div>
            <div class="grid">
              <div class="item"><span class="label">Heart Rate:</span> ${patient.metrics.heartRate} bpm</div>
              <div class="item"><span class="label">O2 Saturation (SpO2):</span> ${patient.metrics.oxygen}%</div>
              <div class="item"><span class="label">Temperature:</span> ${patient.metrics.temperature} °C</div>
              <div class="item"><span class="label">Blood Pressure:</span> ${patient.metrics.bloodPressure}</div>
              <div class="item"><span class="label">Blood Sugar:</span> ${patient.metrics.bloodSugar} mg/dL</div>
            </div>

            <div class="section-title">CLINICAL OBSERVATION DETAILS</div>
            <p style="font-size: 14px; line-height: 1.6;">${patient.details}</p>

            <div class="section-title">MEDICAL HISTORY</div>
            <ul>${(patient.history || []).map(h => `<li><strong>${h.date}:</strong> ${h.event}</li>`).join('')}</ul>

            <div class="section-title">PRESCRIBED MEDICATIONS</div>
            <ul>${(patient.medications || []).map(m => `<li><strong>${m.name}</strong> – ${m.dosage}, ${m.frequency}</li>`).join('')}</ul>

            <div class="footer">
              CareSync AI Platform • Secured and Compliant under HIPAA Regulations • Confidential Medical Record
            </div>
          </body>
        </html>
        `);
      printWindow.document.close();
    });
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <FileText size={24} color="var(--cyan-pulse)" />
          </div>
          <div>
            <h3 style={styles.title}>Reports & Clinical Registry</h3>
            <p style={styles.desc}>Generate certified medical documentation and export patient data arrays.</p>
          </div>
        </div>

        <div style={styles.actionsGrid}>
          {/* CSV card */}
          <div className="glass-panel glass-panel-hover" style={styles.actionCard} onClick={exportCSV}>
            {compilingType === 'csv' ? (
              <div style={styles.loaderArea} className="skeleton-shimmer">
                <RefreshCw size={24} className="heartbeat-pulse" color="var(--recovery-mint)" />
                <span style={{ fontSize: '0.75rem', marginTop: 10 }}>Compiling CSV Data...</span>
              </div>
            ) : (
              <>
                <FileSpreadsheet size={32} color="var(--recovery-mint)" />
                <h4 style={styles.actionTitle}>Export Patient Registry</h4>
                <p style={styles.actionDesc}>Downloads entire active patient database table in CSV format.</p>
                <button className="btn-glass" style={styles.actionBtn}>
                  <Download size={14} /> Export CSV
                </button>
              </>
            )}
          </div>

          {/* Word DOCX card */}
          <div 
            className="glass-panel glass-panel-hover" 
            style={{
              ...styles.actionCard,
              opacity: selectedPatient ? 1 : 0.6,
              cursor: selectedPatient ? 'pointer' : 'not-allowed'
            }}
            onClick={() => selectedPatient && exportDOCX(selectedPatient)}
          >
            {compilingType === 'doc' ? (
              <div style={styles.loaderArea} className="skeleton-shimmer">
                <RefreshCw size={24} className="heartbeat-pulse" color="var(--cyan-pulse)" />
                <span style={{ fontSize: '0.75rem', marginTop: 10 }}>Building Docx Brief...</span>
              </div>
            ) : (
              <>
                <FileText size={32} color="var(--cyan-pulse)" />
                <h4 style={styles.actionTitle}>Export Doctor's Notes</h4>
                <p style={styles.actionDesc}>
                  {selectedPatient ? `Compile clinical DOCX for ${selectedPatient.name}.` : 'Select a patient to generate clinical Word file.'}
                </p>
                <button className="btn-glass" style={styles.actionBtn} disabled={!selectedPatient}>
                  <Download size={14} /> Export DOC
                </button>
              </>
            )}
          </div>

          {/* Print PDF card */}
          <div 
            className="glass-panel glass-panel-hover" 
            style={{
              ...styles.actionCard,
              opacity: selectedPatient ? 1 : 0.6,
              cursor: selectedPatient ? 'pointer' : 'not-allowed'
            }}
            onClick={() => selectedPatient && printReport(selectedPatient)}
          >
            {compilingType === 'pdf' ? (
              <div style={styles.loaderArea} className="skeleton-shimmer">
                <RefreshCw size={24} className="heartbeat-pulse" color="var(--medical-blue)" />
                <span style={{ fontSize: '0.75rem', marginTop: 10 }}>Formatting PDF Page...</span>
              </div>
            ) : (
              <>
                <Printer size={32} color="var(--medical-blue)" />
                <h4 style={styles.actionTitle}>Print Diagnostic Report</h4>
                <p style={styles.actionDesc}>
                  {selectedPatient ? `Generate print-ready clinical report for ${selectedPatient.name}.` : 'Select a patient to print PDF summary.'}
                </p>
                <button className="btn-glass" style={styles.actionBtn} disabled={!selectedPatient}>
                  <Printer size={14} /> Print PDF
                </button>
              </>
            )}
          </div>
        </div>

        <div style={styles.footerNote}>
          <Sparkles size={16} color="var(--cyan-pulse)" />
          <span>All reports are generated instantly client-side using advanced HIPAA compliant data parsing.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 0',
  },
  card: {
    padding: '30px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '30px',
  },
  iconBox: {
    padding: '12px',
    borderRadius: '12px',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  title: {
    fontSize: '1.3rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  desc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px',
    justifyContent: 'center',
  },
  actionTitle: {
    marginTop: '15px',
    fontSize: '1.05rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  actionDesc: {
    marginTop: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    minHeight: '40px',
    lineHeight: '1.4',
  },
  actionBtn: {
    marginTop: '15px',
    width: '100%',
    padding: '8px 16px',
  },
  loaderArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '30px',
    padding: '12px 16px',
    borderRadius: '8px',
    background: 'var(--nav-active)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  }
};
export { styles as reportStyles };
export { styles as styles };
