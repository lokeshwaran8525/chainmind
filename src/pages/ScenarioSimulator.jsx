import React, { useState, useEffect, useCallback } from 'react';
import { GitCompareArrows, Sliders, Play, AlertCircle } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './ScenarioSimulator.module.css';
import { scenarioData, topSuppliers as mockSuppliers } from '../data/mockData';
import { fetchSimulation } from '../api/chainmindApi';

export const ScenarioSimulator = () => {
  const [riskWeight, setRiskWeight] = useState(50);
  const [costWeight, setCostWeight] = useState(50);
  const [esgWeight, setEsgWeight] = useState(50);
  const [simulatedSuppliers, setSimulatedSuppliers] = useState([]);
  const [scenario, setScenario] = useState({
    implication: scenarioData.scenarios[0].implication,
    projectedCost: scenarioData.scenarios[0].cost,
    projectedEsg: scenarioData.scenarios[0].esgScore,
    riskLevel: 'Moderate'
  });
  const [loading, setLoading] = useState(false);
  const [usingApi, setUsingApi] = useState(true);

  // Debounced API call
  const runSimulation = useCallback(async (risk, cost, esg) => {
    if (!usingApi) {
      // Fallback to local calculation
      const rw = risk / 100;
      const cw = cost / 100;
      const ew = esg / 100;
      const total = rw + cw + ew || 1;
      const n_rw = rw / total;
      const n_cw = cw / total;
      const n_ew = ew / total;

      const results = mockSuppliers.map(s => {
        const invRisk = 100 - s.riskRisk;
        const score = ((s.cost * n_cw) + (s.esg * n_ew) + (invRisk * n_rw)).toFixed(1);
        return { ...s, simScore: score };
      }).sort((a, b) => b.simScore - a.simScore);

      setSimulatedSuppliers(results);

      let impl = scenarioData.scenarios[0].implication;
      let esgScore = scenarioData.scenarios[0].esgScore;
      let costVal = scenarioData.scenarios[0].cost;

      if (esg > 75) {
        impl = scenarioData.scenarios[1].implication;
        esgScore = scenarioData.scenarios[1].esgScore;
        costVal = scenarioData.scenarios[1].cost;
      } else if (cost > 75) {
        impl = scenarioData.scenarios[2].implication;
        esgScore = scenarioData.scenarios[2].esgScore;
        costVal = scenarioData.scenarios[2].cost;
      }

      setScenario({
        implication: impl,
        projectedCost: costVal,
        projectedEsg: esgScore,
        riskLevel: risk > 75 ? 'Critical' : risk < 25 ? 'Low' : 'Moderate'
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetchSimulation(risk, cost, esg);
      setSimulatedSuppliers(res.suppliers);
      setScenario(res.scenario);
    } catch (err) {
      console.warn('[Simulator] API unavailable, falling back to local:', err.message);
      setUsingApi(false);
      runSimulation(risk, cost, esg);
    } finally {
      setLoading(false);
    }
  }, [usingApi]);

  // Run simulation on weight changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation(riskWeight, costWeight, esgWeight);
    }, 300);
    return () => clearTimeout(timer);
  }, [riskWeight, costWeight, esgWeight, runSimulation]);

  // Determine impact style
  let impactStyle = 'negative';
  if (esgWeight > 75) impactStyle = 'positive';
  else if (costWeight > 75) impactStyle = 'neutral';

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text flex items-center gap-2">
            <GitCompareArrows size={28} className="text-accent" />
            Environment Simulator
          </h1>
          <p className="text-muted mt-2">Adjust macroeconomic and strategic weights to foresee network changes.</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-primary text-main px-4 py-2 rounded-md font-mono" 
          style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
          onClick={() => runSimulation(riskWeight, costWeight, esgWeight)}
        >
          <Play size={16} /> RUN FULL SIMULATION
        </button>
      </div>

      <div className={styles.simulatorLayout}>
        {/* Controls Panel */}
        <div className={`${appStyles.card} ${styles.controlsPanel}`}>
          <h3 className="text-bright font-semibold flex items-center gap-2 border-b border-gray-800 pb-4 mb-2" style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <Sliders size={20} className="text-primary" />
            Parameter Weights
          </h3>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>Risk Tolerance</span>
              <span className={styles.sliderValue}>{riskWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={riskWeight} 
              onChange={(e) => setRiskWeight(parseInt(e.target.value))}
              className={styles.sliderInput} 
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>Cost Priority</span>
              <span className={styles.sliderValue}>{costWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={costWeight} 
              onChange={(e) => setCostWeight(parseInt(e.target.value))}
              className={styles.sliderInput} 
              style={{ '--color-primary': 'var(--color-secondary)', '--color-primary-glow': 'var(--color-secondary-glow)' }}
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>ESG Compliance</span>
              <span className={styles.sliderValue}>{esgWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={esgWeight} 
              onChange={(e) => setEsgWeight(parseInt(e.target.value))}
              className={styles.sliderInput} 
              style={{ '--color-primary': 'var(--color-accent)', '--color-primary-glow': 'var(--color-accent-glow)' }}
            />
          </div>

          <div className={styles.impactCard}>
            <h4 className={styles.impactTitle}>Live Implication</h4>
            <p className={styles.impactDesc}>{scenario.implication}</p>
          </div>
        </div>

        {/* Results Panel */}
        <div className={styles.resultsPanel}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className="text-muted text-sm uppercase tracking-wider">Projected Cost</span>
              <span className={`${styles.metricValue} ${styles[impactStyle]}`}>{scenario.projectedCost}</span>
              <span className="text-xs text-muted font-mono">baseline: $1.2M</span>
            </div>
            <div className={`${styles.metricBox} ${styles.highlight}`}>
              <span className="text-muted text-sm uppercase tracking-wider">Projected ESG</span>
              <span className={`${styles.metricValue} ${styles[impactStyle]}`}>{scenario.projectedEsg}</span>
              <span className="text-xs text-muted font-mono">baseline: B+</span>
            </div>
            <div className={styles.metricBox}>
              <span className="text-muted text-sm uppercase tracking-wider">Network Risk</span>
              <span className={`${styles.metricValue} ${styles[impactStyle]}`}>
                {scenario.riskLevel}
              </span>
              <span className="text-xs text-muted font-mono">baseline: Normal</span>
            </div>
          </div>

          <div className={appStyles.card}>
            <h3 className="text-bright font-semibold flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-secondary" />
              Real-time Supplier Reallocation
              {loading && <span className="text-xs text-primary font-mono ml-2 animate-pulse">COMPUTING...</span>}
            </h3>
            <div className={styles.tableWrapper}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <th className="p-3 text-muted font-medium text-sm">Rank</th>
                    <th className="p-3 text-muted font-medium text-sm">Supplier</th>
                    <th className="p-3 text-muted font-medium text-sm">Sim. Score</th>
                    <th className="p-3 text-muted font-medium text-sm">Risk</th>
                    <th className="p-3 text-muted font-medium text-sm">ESG</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedSuppliers.map((sup, idx) => {
                    return (
                      <tr key={sup.name} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <td className="p-3 font-mono text-muted">0{idx + 1}</td>
                        <td className="p-3 font-semibold text-bright">{sup.name}</td>
                        <td className="p-3 font-mono text-primary">{sup.simScore}</td>
                        <td className={`p-3 font-mono ${sup.riskRisk > 50 ? 'text-danger' : 'text-muted'}`}>
                          {sup.riskRisk}
                        </td>
                        <td className="p-3 font-mono text-accent">{sup.esg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
