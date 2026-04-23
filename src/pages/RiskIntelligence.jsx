import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis 
} from 'recharts';
import { ShieldAlert, Crosshair, AlertTriangle, AlertOctagon, TrendingDown, Cpu, Brain } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './RiskIntelligence.module.css';
import { SkeletonKPIGrid, SkeletonChart, SkeletonCard } from '../components/LoadingSkeleton';
import { regionRisk as mockRegion, topSuppliers as mockSuppliers } from '../data/mockData';
import { fetchRegionRisk, fetchSuppliers, fetchRiskHeatmap, fetchRiskPrediction, fetchModelInfo } from '../api/chainmindApi';

const getRiskClass = (score) => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

export const RiskIntelligence = () => {
  const [regions, setRegions] = useState(mockRegion);
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [heatmap, setHeatmap] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [regionRes, supplierRes, heatmapRes, modelRes] = await Promise.all([
          fetchRegionRisk(),
          fetchSuppliers(),
          fetchRiskHeatmap(),
          fetchModelInfo()
        ]);
        if (!cancelled) {
          setRegions(regionRes);
          setSuppliers(supplierRes);
          setHeatmap(heatmapRes);
          setModelInfo(modelRes);
        }

        // Run a sample prediction
        const predRes = await fetchRiskPrediction({
          geo_risk: 50, risk_reduction: 0.1, cost: 15,
          esg_score: 75, esg_penalty: 0.5,
          env_score: 70, social_score: 70, gov_score: 70
        });
        if (!cancelled) setPrediction(predRes);
      } catch (err) {
        console.warn('[RiskIntelligence] API unavailable, using mock data:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const criticalCount = regions.filter(r => r.risk >= 50).length;

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text">Network Risk Intelligence</h1>
          <p className="text-muted mt-2">Geopolitical, climatic, and supplier-specific risk monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <Crosshair className="text-danger" size={20} />
          <span className="font-mono text-sm text-danger animate-pulse">{criticalCount} HIGH-RISK REGIONS DETECTED</span>
        </div>
      </div>

      {loading ? (
        <SkeletonKPIGrid />
      ) : (
      <div className={styles.riskGrid}>
        {regions.map((region) => (
          <div key={region.region} className={`${appStyles.card} ${styles.riskCard} ${styles[getRiskClass(region.risk)]}`}>
            <span className={styles.regionName}>{region.region}</span>
            <span className={styles.riskScore}>{region.risk}</span>
            <span className="text-muted text-xs font-mono mt-1 block">RISK INDEX</span>
          </div>
        ))}
      </div>
      )}

      {loading ? (
        <div className={styles.chartSection}>
          <SkeletonChart height="400px" />
          <SkeletonCard lines={5} />
        </div>
      ) : (
      <div className={styles.chartSection}>
        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <TrendingDown className="text-secondary" size={20} />
            Supplier Risk vs. Cost Efficiency Map
          </h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="cost" 
                  name="Cost Efficiency" 
                  stroke="#8a8a93" 
                  domain={[0, 'auto']}
                  label={{ value: "Cost Efficiency →", position: "bottom", fill: "#8a8a93" }}
                />
                <YAxis 
                  type="number" 
                  dataKey="riskRisk" 
                  name="Risk Index" 
                  stroke="#8a8a93" 
                  domain={[0, 'auto']}
                  label={{ value: "Risk Index ↑", angle: -90, position: "left", fill: "#8a8a93" }}
                />
                <ZAxis type="number" range={[100, 300]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderColor: '#b026ff', borderRadius: '8px' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono', color: '#fff' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value, name) => {
                    if (name === 'Risk Index') return [value, 'Risk'];
                    if (name === 'Cost Efficiency') return [value, 'Cost Eff.'];
                    return [value, name];
                  }}
                />
                <Scatter name="Suppliers" data={suppliers} shape="circle">
                  {suppliers.map((entry, index) => {
                    const color = entry.riskRisk > 70 ? '#ff2a2a' : 
                                 entry.riskRisk > 40 ? '#ffb000' : '#00ff9d';
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <Brain className="text-secondary" size={20} />
            ML Risk Prediction Engine
          </h3>
          <div className={styles.threatList}>
            {modelInfo && (
              <div className={styles.threatItem} style={{ borderLeftColor: 'var(--color-primary)' }}>
                <Cpu size={18} className="text-primary mt-1" />
                <div className={styles.threatContent}>
                  <span className={styles.threatTitle}>Model Performance</span>
                  <span className={styles.threatDesc}>
                    R² Score: <strong style={{color: 'var(--color-accent)'}}>{modelInfo.r2_score}</strong> | 
                    MAE: <strong style={{color: 'var(--color-primary)'}}>{modelInfo.mae}</strong> | 
                    Trained on {modelInfo.train_samples} samples
                  </span>
                </div>
              </div>
            )}
            {prediction && !prediction.error && (
              <div className={styles.threatItem} style={{ borderLeftColor: 'var(--color-accent)' }}>
                <ShieldAlert size={18} className="text-accent mt-1" />
                <div className={styles.threatContent}>
                  <span className={styles.threatTitle}>Sample Prediction (Default Parameters)</span>
                  <span className={styles.threatDesc}>
                    Predicted Risk: <strong style={{color: prediction.predicted_risk_score > 50 ? 'var(--color-danger)' : 'var(--color-accent)'}}>{prediction.predicted_risk_score}</strong> | 
                    95% CI: [{prediction.confidence_interval.low}, {prediction.confidence_interval.high}]
                  </span>
                </div>
              </div>
            )}
            {modelInfo?.feature_importance && modelInfo.feature_importance.slice(0, 3).map((fi, idx) => (
              <div key={fi.feature} className={styles.threatItem} style={{ borderLeftColor: idx === 0 ? 'var(--color-warning)' : 'rgba(255,255,255,0.1)' }}>
                <AlertTriangle size={18} style={{ color: idx === 0 ? 'var(--color-warning)' : 'var(--color-muted)' }} className="mt-1" />
                <div className={styles.threatContent}>
                  <span className={styles.threatTitle}>Key Factor #{idx + 1}: {fi.feature.replace(/_/g, ' ')}</span>
                  <span className={styles.threatDesc}>
                    Feature importance: {(fi.importance * 100).toFixed(1)}% contribution to risk prediction.
                  </span>
                </div>
              </div>
            ))}
            {!modelInfo && (
              <>
                <div className={styles.threatItem}>
                  <AlertTriangle size={18} className={styles.threatIcon} />
                  <div className={styles.threatContent}>
                    <span className={styles.threatTitle}>Typhoon approaching Taiwan Strait</span>
                    <span className={styles.threatDesc}>Estimated 65% probability of port disruptions at Kaohsiung within 48 hours. Affects 2 key electronics suppliers.</span>
                  </div>
                </div>
                <div className={styles.threatItem}>
                  <AlertTriangle size={18} className={styles.threatIcon} />
                  <div className={styles.threatContent}>
                    <span className={styles.threatTitle}>Quantum Parts - Financial Instability</span>
                    <span className={styles.threatDesc}>Supplier's short-term liquidity drop flagged by AI crawler. Risk score elevated to 80.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
