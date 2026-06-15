import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

export default function Analytics({ patients }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const heartCount = patients.filter(p => p.disease === 'Heart Disease').length;
  const cancerCount = patients.filter(p => p.disease === 'Cancer').length;
  const diabetesCount = patients.filter(p => p.disease === 'Diabetes').length;
  const totalCount = patients.length || 1;

  const heartPct = Math.round((heartCount / totalCount) * 100);
  const cancerPct = Math.round((cancerCount / totalCount) * 100);
  const diabetesPct = Math.round((diabetesCount / totalCount) * 100);

  const circ = 251.3;
  const heartStroke = (heartCount / totalCount) * circ;
  const cancerStroke = (cancerCount / totalCount) * circ;
  const diabetesStroke = (diabetesCount / totalCount) * circ;

  const heartOffset = circ;
  const cancerOffset = circ - heartStroke;
  const diabetesOffset = circ - heartStroke - cancerStroke;

  const occupancyTimeline = [
    { hour: "06:00", val: 70 },
    { hour: "08:00", val: 80 },
    { hour: "10:00", val: 80 },
    { hour: "12:00", val: 90 },
    { hour: "14:00", val: 80 },
    { hour: "16:00", val: 85 }
  ];

  const recoveryStats = [
    { label: "Cardiology", recovered: 42, critical: 8 },
    { label: "Oncology", recovered: 28, critical: 12 },
    { label: "Endocrine", recovered: 36, critical: 3 },
    { label: "General ER", recovered: 54, critical: 14 }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        
        {/* Donut Chart */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <PieChart size={18} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>Disease Distribution</h3>
          </div>
          
          <div style={styles.donutLayout}>
            <div style={styles.svgWrapper}>
              <svg width="180" height="180" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="var(--border-glass)" 
                  strokeWidth="8" 
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="var(--cyan-pulse)" 
                  strokeWidth={hoveredSlice === 'heart' ? '12' : '8'}
                  strokeDasharray={`${heartStroke} ${circ}`} 
                  strokeDashoffset={heartOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSlice('heart')}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="#a855f7" 
                  strokeWidth={hoveredSlice === 'cancer' ? '12' : '8'}
                  strokeDasharray={`${cancerStroke} ${circ}`} 
                  strokeDashoffset={cancerOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSlice('cancer')}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="var(--royal-gold)" 
                  strokeWidth={hoveredSlice === 'diabetes' ? '12' : '8'}
                  strokeDasharray={`${diabetesStroke} ${circ}`} 
                  strokeDashoffset={diabetesOffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSlice('diabetes')}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                
                <text x="50%" y="48%" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold" fontFamily="var(--font-heading)">
                  {patients.length}
                </text>
                <text x="50%" y="62%" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontFamily="var(--font-body)">
                  PATIENTS
                </text>
              </svg>
            </div>

            <div style={styles.legend}>
              <div 
                style={{ ...styles.legendRow, opacity: hoveredSlice && hoveredSlice !== 'heart' ? 0.4 : 1 }}
                onMouseEnter={() => setHoveredSlice('heart')}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span style={{ ...styles.colorDot, backgroundColor: 'var(--cyan-pulse)' }}></span>
                <span style={styles.legendLabel}>Cardiovascular</span>
                <span style={styles.legendVal}>{heartCount} ({heartPct}%)</span>
              </div>

              <div 
                style={{ ...styles.legendRow, opacity: hoveredSlice && hoveredSlice !== 'cancer' ? 0.4 : 1 }}
                onMouseEnter={() => setHoveredSlice('cancer')}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span style={{ ...styles.colorDot, backgroundColor: '#a855f7' }}></span>
                <span style={styles.legendLabel}>Oncology</span>
                <span style={styles.legendVal}>{cancerCount} ({cancerPct}%)</span>
              </div>

              <div 
                style={{ ...styles.legendRow, opacity: hoveredSlice && hoveredSlice !== 'diabetes' ? 0.4 : 1 }}
                onMouseEnter={() => setHoveredSlice('diabetes')}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span style={{ ...styles.colorDot, backgroundColor: 'var(--royal-gold)' }}></span>
                <span style={styles.legendLabel}>Endocrinology</span>
                <span style={styles.legendVal}>{diabetesCount} ({diabetesPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ICU Occupancy Area Line Chart */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <TrendingUp size={18} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>ICU Occupancy Log (24h)</h3>
          </div>

          <div style={styles.chartBody}>
            <svg width="100%" height="150" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cyan-pulse)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--cyan-pulse)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-glass)" strokeDasharray="4" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-glass)" strokeDasharray="4" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="var(--border-glass)" strokeDasharray="4" />
              
              <path 
                d="M 0 100 L 0 70 L 60 55 L 120 50 L 180 30 L 240 50 L 300 40 L 300 100 Z" 
                fill="url(#areaGrad)" 
              />
              
              <path 
                d="M 0 70 L 60 55 L 120 50 L 180 30 L 240 50 L 300 40" 
                fill="transparent" 
                stroke="var(--cyan-pulse)" 
                strokeWidth="2" 
              />

              <circle cx="0" cy="70" r="3" fill="var(--cyan-pulse)" />
              <circle cx="60" cy="55" r="3" fill="var(--cyan-pulse)" />
              <circle cx="120" cy="50" r="3" fill="var(--cyan-pulse)" />
              <circle cx="180" cy="30" r="3" fill="var(--cyan-pulse)" />
              <circle cx="240" cy="50" r="3" fill="var(--cyan-pulse)" />
              <circle cx="300" cy="40" r="3" fill="var(--cyan-pulse)" />
            </svg>

            <div style={styles.chartTimelineLabels}>
              {occupancyTimeline.map((t, idx) => (
                <span key={idx} style={styles.timelineLabelText}>{t.hour} ({t.val}%)</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-panel" style={{ ...styles.card, gridColumn: 'span 2' }}>
          <div style={styles.cardHeader}>
            <BarChart3 size={18} color="var(--cyan-pulse)" />
            <h3 style={styles.cardTitle}>Emergency Recovery vs Critical Influx by Ward</h3>
          </div>

          <div style={styles.barChartContainer}>
            {recoveryStats.map((stat, idx) => {
              const maxVal = 70;
              const recHeight = (stat.recovered / maxVal) * 120;
              const critHeight = (stat.critical / maxVal) * 120;

              return (
                <div key={idx} style={styles.barColumn}>
                  <div style={styles.barsGroup}>
                    <div 
                      style={{ 
                        ...styles.bar, 
                        height: `${recHeight}px`, 
                        backgroundColor: 'var(--recovery-mint)',
                        boxShadow: hoveredBar === `rec-${idx}` ? '0 0 12px rgba(16,185,129,0.3)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredBar(`rec-${idx}`)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {hoveredBar === `rec-${idx}` && <span style={styles.barTooltip}>{stat.recovered} Patients</span>}
                    </div>

                    <div 
                      style={{ 
                        ...styles.bar, 
                        height: `${critHeight}px`, 
                        backgroundColor: 'var(--emergency-crimson)',
                        boxShadow: hoveredBar === `crit-${idx}` ? '0 0 12px rgba(239,68,68,0.3)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredBar(`crit-${idx}`)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {hoveredBar === `crit-${idx}` && <span style={styles.barTooltip}>{stat.critical} Critical</span>}
                    </div>
                  </div>
                  <span style={styles.barLabel}>{stat.label}</span>
                </div>
              );
            })}
          </div>

          <div style={styles.barLegend}>
            <div style={styles.barLegendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: 'var(--recovery-mint)' }}></span>
              <span>Recovered & Discharged</span>
            </div>
            <div style={styles.barLegendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: 'var(--emergency-crimson)' }}></span>
              <span>ICU Admissions</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '24px',
    background: 'var(--bg-card)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-main)',
  },
  donutLayout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
  },
  svgWrapper: {
    display: 'inline-block',
    position: 'relative',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    transition: 'opacity 0.2s',
    cursor: 'pointer',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendLabel: {
    color: 'var(--text-muted)',
    width: '100px',
  },
  legendVal: {
    fontWeight: 'bold',
    color: 'var(--text-main)',
  },
  chartBody: {
    padding: '10px 0',
  },
  chartTimelineLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
    padding: '0 5px',
  },
  timelineLabelText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  barChartContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '160px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '10px',
    marginTop: '10px',
  },
  barColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  barsGroup: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '6px',
    height: '120px',
  },
  bar: {
    width: '16px',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  },
  barLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  barTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    whiteSpace: 'nowrap',
    marginBottom: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    border: '1px solid var(--border-glass)',
  },
  barLegend: {
    display: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '20px',
    display: 'flex',
  },
  barLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '2px',
  }
};
export { styles as analyticsStyles };
