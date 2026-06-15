import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Heart, Users, ActivitySquare, BrainCircuit, AlertOctagon, TrendingUp, FileSymlink, Mic } from 'lucide-react';

export default function LandingPage({ onEnterDashboard, onOpenAuth }) {
  // Stats count-up animation simulation
  const [totalPatients, setTotalPatients] = useState(0);
  const [criticalPatients, setCriticalPatients] = useState(0);
  const [activeDoctors, setActiveDoctors] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    const duration = 800; // 800ms animation
    const steps = 30;
    const stepTime = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setTotalPatients(Math.min(142, Math.round((142 / steps) * currentStep)));
      setCriticalPatients(Math.min(4, Math.round((4 / steps) * currentStep)));
      setActiveDoctors(Math.min(12, Math.round((12 / steps) * currentStep)));
      setActiveAlerts(Math.min(3, Math.round((3 / steps) * currentStep)));

      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Landing Navbar */}
      <header style={styles.navbar}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIconBox}>
            <Activity className="heartbeat-pulse" size={24} color="var(--cyan-pulse)" />
          </div>
          <span style={styles.logoText}>CareSync <span style={{ color: 'var(--cyan-pulse)' }}>AI</span></span>
        </div>
        <div style={styles.navActions}>
          <button className="btn-glass" onClick={onOpenAuth}>
            <ShieldCheck size={16} color="var(--cyan-pulse)" /> Clinical Login
          </button>
          <button className="btn-glass btn-glass-primary" onClick={onEnterDashboard}>
            Launch Console
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.tagLineContainer}>
            <span style={styles.tagLineBadge}>INTELLIGENT CLINICAL CONSOLE V3.8</span>
          </div>
          <h1 style={styles.heroTitle} className="gold-gradient">
            AI-Powered Critical Patient Monitoring & Response Intelligence System
          </h1>
          <p style={styles.heroSubtitle}>
            Transform clinical decision making with real-time patient telemetry, AI deterioration scoring, automatic emergency escalation alerts, and disease-specific monitoring HUDs.
          </p>

          <div style={styles.ctaGroup}>
            <button className="btn-glass btn-glass-primary" style={styles.heroBtn} onClick={onEnterDashboard}>
              Launch Command Center
            </button>
            <button className="btn-glass" style={styles.heroBtn} onClick={onOpenAuth}>
              Clinical Credentials Sign In
            </button>
          </div>
        </div>

        {/* Dashboard Preview Animation */}
        <div style={styles.previewContainer}>
          <div className="glass-panel ecg-card" style={styles.previewPanel}>
            <div style={styles.previewHeader}>
              <div style={styles.headerDots}>
                <span style={{ ...styles.dot, backgroundColor: 'var(--emergency-crimson)' }}></span>
                <span style={{ ...styles.dot, backgroundColor: 'var(--royal-gold)' }}></span>
                <span style={{ ...styles.dot, backgroundColor: 'var(--recovery-mint)' }}></span>
              </div>
              <div style={styles.previewTitle}>CareSync AI - Terminal 01</div>
            </div>
            
            <div style={styles.previewGrid}>
              <div style={styles.previewLeft}>
                <div style={styles.pulseCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>PATIENT ECG</span>
                    <Heart size={12} color="var(--emergency-crimson)" className="heartbeat-pulse" />
                  </div>
                  {/* ECG Simulated Wave */}
                  <svg viewBox="0 0 200 40" style={styles.ecgSvg}>
                    <path
                      d="M 0 20 L 30 20 L 35 10 L 40 30 L 45 20 L 70 20 L 75 5 L 80 35 L 85 20 L 120 20 L 125 15 L 130 25 L 135 20 L 200 20"
                      fill="none"
                      stroke="var(--cyan-pulse)"
                      strokeWidth="1.5"
                      style={{
                        strokeDasharray: '400',
                        strokeDashoffset: '400',
                        animation: 'dash 3s linear infinite'
                      }}
                    />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>98 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>bpm</span></span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--recovery-mint)', fontWeight: 'bold' }}>STABLE</span>
                  </div>
                </div>

                <div style={styles.previewMiniStats}>
                  <div style={styles.miniStat}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>ICU OCCUPANCY</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--cyan-pulse)' }}>80%</span>
                  </div>
                  <div style={styles.miniStat}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>OXYGEN SpO2</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--recovery-mint)' }}>98%</span>
                  </div>
                </div>
              </div>

              <div style={styles.previewRight}>
                <div style={styles.alertLog}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>SYSTEM ALERTS</span>
                  <div style={styles.alertRow}>
                    <span style={{ ...styles.alertDot, backgroundColor: 'var(--emergency-crimson)' }}></span>
                    <span style={{ fontSize: '0.65rem' }}>ICU-04: SpO2 critical drop</span>
                  </div>
                  <div style={styles.alertRow}>
                    <span style={{ ...styles.alertDot, backgroundColor: 'var(--royal-gold)' }}></span>
                    <span style={{ fontSize: '0.65rem' }}>WARD-05D: Hyperglycemia alert</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Statistics Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div className="glass-panel" style={styles.statCard}>
            <Users size={24} color="var(--medical-blue)" />
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{totalPatients}</span>
              <span style={styles.statLabel}>Total Patients Admitted</span>
            </div>
          </div>
          <div className="glass-panel" style={{ ...styles.statCard, borderLeft: '2px solid var(--emergency-crimson)' }}>
            <AlertOctagon size={24} color="var(--emergency-crimson)" className="heartbeat-pulse" />
            <div style={styles.statInfo}>
              <span style={{ ...styles.statValue, color: 'var(--emergency-crimson)' }}>0{criticalPatients}</span>
              <span style={styles.statLabel}>Critical Patients Monitored</span>
            </div>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <ActivitySquare size={24} color="var(--recovery-mint)" />
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{activeDoctors}</span>
              <span style={styles.statLabel}>Specialist Doctors Online</span>
            </div>
          </div>
          <div className="glass-panel" style={{ ...styles.statCard, borderLeft: '2px solid var(--royal-gold)' }}>
            <BrainCircuit size={24} color="var(--royal-gold)" />
            <div style={styles.statInfo}>
              <span style={{ ...styles.statValue, color: 'var(--royal-gold)' }}>0{activeAlerts}</span>
              <span style={styles.statLabel}>Active Vitals Alerts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.featuresTitle}>CareSync AI Core Features</h2>
        <p style={styles.featuresSubtitle}>High-efficiency diagnostic intelligence architecture built for precision hospital settings.</p>

        <div style={styles.featuresGrid}>
          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><Activity size={22} color="var(--cyan-pulse)" /></div>
            <h3 style={styles.featureName}>Disease-Specific Monitoring</h3>
            <p style={styles.featureDesc}>Tailored metric visualizations for Heart Disease (live ECG), Cancer (pain / fatigue / weight), and Diabetes (blood glucose history).</p>
          </div>

          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><BrainCircuit size={22} color="#a855f7" /></div>
            <h3 style={styles.featureName}>AI Risk Prediction</h3>
            <p style={styles.featureDesc}>Predictive AI scoring model simulating patient clinical deterioration scales. Offers instant physician warnings and recommended guidelines.</p>
          </div>

          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><AlertOctagon size={22} color="var(--emergency-crimson)" /></div>
            <h3 style={styles.featureName}>Critical Alert Engine</h3>
            <p style={styles.featureDesc}>Continuous vital monitoring with custom audio alarms and instant triage escalation protocol for ICU teams.</p>
          </div>

          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><TrendingUp size={22} color="var(--recovery-mint)" /></div>
            <h3 style={styles.featureName}>Smart Analytics</h3>
            <p style={styles.featureDesc}>Interactive distribution graphs mapping patient cases, recovery paths, ICU layouts, and department loads.</p>
          </div>

          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><FileSymlink size={22} color="var(--medical-blue)" /></div>
            <h3 style={styles.featureName}>Patient Reports</h3>
            <p style={styles.featureDesc}>Instantly export fully detailed medical report sheets in secure CSV tables, DOCX briefs, or print-ready PDF sheets.</p>
          </div>

          <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
            <div style={styles.featureIconBox}><Mic size={22} color="var(--cyan-pulse)" /></div>
            <h3 style={styles.featureName}>Voice Assistant</h3>
            <p style={styles.featureDesc}>Simulated medical AI voice response module allowing surgeons and nurses to dictate notes and lookup status hands-free.</p>
          </div>
        </div>
      </section>

      {/* Developer Credits Footer */}
      <footer className="developer-credits-footer">
        <span className="developer-credits-text">
          Created and developed by{' '}
          <a 
            href="https://www.linkedin.com/in/tharun-sai-gangadhar-p-a32245396" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="developer-credits-link"
          >
            Tharun Sai
          </a>{' '}
          &{' '}
          <a 
            href="https://www.linkedin.com/in/harish-krishnnan-35323739b?utm_source=share_via&utm_content=profile&utm_medium=member_android" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="developer-credits-link"
          >
            Harish S
          </a>
        </span>
      </footer>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    padding: '0 40px 80px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 0',
    borderBottom: '1px solid var(--border-glass)',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIconBox: {
    padding: '8px',
    borderRadius: '10px',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  navActions: {
    display: 'flex',
    gap: '15px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 1fr',
    alignItems: 'center',
    gap: '40px',
    padding: '80px 0',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  tagLineContainer: {
    marginBottom: '16px',
  },
  tagLineBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: 'var(--cyan-pulse)',
    letterSpacing: '0.12em',
    padding: '6px 12px',
    borderRadius: '4px',
    background: 'var(--primary-glow)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    fontFamily: 'var(--font-heading)',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '600',
    lineHeight: '1.15',
    marginBottom: '20px',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.03em',
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    marginBottom: '35px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '15px',
    width: '100%',
  },
  heroBtn: {
    padding: '14px 28px',
    fontSize: '0.9rem',
  },
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  previewPanel: {
    width: '100%',
    maxWidth: '460px',
    padding: '16px',
    background: 'rgba(10, 16, 28, 0.75)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-main)',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '8px',
  },
  headerDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  previewTitle: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    ariaLabel: 'CareSync Terminal Screen Title',
    marginLeft: '16px',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.05em',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  previewLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pulseCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px',
  },
  ecgSvg: {
    width: '100%',
    height: '40px',
    margin: '6px 0',
  },
  previewMiniStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  miniStat: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  previewRight: {
    display: 'flex',
  },
  alertLog: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.02)',
  },
  alertDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  statsSection: {
    marginTop: '40px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'var(--bg-card)',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '600',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
    lineHeight: '1.1',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  featuresSection: {
    marginTop: '100px',
    textAlign: 'center',
  },
  featuresTitle: {
    fontSize: '2rem',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)',
  },
  featuresSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
    marginBottom: '40px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    padding: '30px',
    textAlign: 'left',
    background: 'var(--bg-card)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  featureIconBox: {
    padding: '10px',
    borderRadius: '10px',
    background: 'var(--primary-glow)',
    marginBottom: '20px',
    border: '1px solid rgba(6, 182, 212, 0.15)',
  },
  featureName: {
    fontSize: '1.2rem',
    color: 'var(--text-main)',
    marginBottom: '10px',
    fontFamily: 'var(--font-heading)',
  },
  featureDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  }
};
export { styles as landingStyles };
