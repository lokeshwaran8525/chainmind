import React, { useState, useEffect } from 'react';
import { BrainCircuit, Cpu, Target, Zap, CheckCircle2 } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './AIRecommendations.module.css';
import { SkeletonCard, SkeletonTable } from '../components/LoadingSkeleton';
import { aiRecommendations as mockRecs, topSuppliers as mockSuppliers } from '../data/mockData';
import { fetchAIRecommendations } from '../api/chainmindApi';

export const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState(mockRecs);
  const [scoredSuppliers, setScoredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAIRecommendations()
      .then(res => {
        if (!cancelled) {
          setRecommendations(res.recommendations);
          setScoredSuppliers(res.scoredSuppliers);
        }
      })
      .catch(err => {
        console.warn('[AIRecommendations] API unavailable, using mock data:', err.message);
        // Fall back to mock scoring
        const scored = mockSuppliers.map(s => {
          const compositeScore = ((s.cost * 0.4) + (s.esg * 0.4) - (s.riskRisk * 0.2) + (s.delivery * 0.2)).toFixed(1);
          return { ...s, compositeScore };
        }).sort((a, b) => b.compositeScore - a.compositeScore);
        setScoredSuppliers(scored);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text flex items-center gap-2">
            <BrainCircuit size={28} className="text-secondary" />
            Palantir Alpha: Autonomous Decision Engine
          </h1>
          <p className="text-muted mt-2">Machine learning agent prescribing supply chain optimal actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className={`text-primary ${loading ? 'animate-pulse' : ''}`} size={20} />
          <span className="font-mono text-sm text-primary">{loading ? 'PROCESSING...' : 'ENGINE: ONLINE'}</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.heroSection}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : (
      <div className={styles.heroSection}>
        <h3 className="text-bright flex items-center gap-2 font-semibold">
          <Zap size={18} className="text-warning" />
          High Priority Prescriptions
        </h3>
        
        {recommendations.map(rec => (
          <div key={rec.id} className={`${appStyles.card} ${styles.recCard}`}>
            <div className={styles.recHeader}>
              <h4 className={styles.recTitle}>
                <Target size={20} />
                {rec.title}
              </h4>
              <button className={styles.approveButton}>EXECUTE STRATEGY</button>
            </div>
            
            <p className={styles.recDesc}>{rec.description}</p>
            
            <div className={styles.recMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Est. Impact</span>
                <span className={`${styles.metaValue} ${rec.impact === 'High' ? 'text-accent' : 'text-primary'}`}>
                  {rec.impact}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Model Confidence</span>
                <span className={`${styles.metaValue} text-secondary`}>{rec.confidence}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Execution Time</span>
                <span className={styles.metaValue}>Immediate</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className={styles.engineSection}>
        <div className={appStyles.card}>
          <h3 className="text-bright flex items-center gap-2 font-semibold mb-4">
            <CheckCircle2 size={18} className="text-primary" />
            Composite Procurement Scoring Engine
          </h3>
          <table className={styles.engineTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Supplier Partner</th>
                <th>Cost Eff.</th>
                <th>ESG Index</th>
                <th>Risk Profile</th>
                <th>Alpha Score</th>
              </tr>
            </thead>
            <tbody>
              {scoredSuppliers.map((supplier, idx) => (
                <tr key={supplier.name}>
                  <td>
                    <span className="text-muted font-mono" style={{opacity: 0.7}}>0{idx + 1}</span>
                  </td>
                  <td className="font-semibold">{supplier.name}</td>
                  <td className="font-mono text-primary">{supplier.cost}</td>
                  <td className="font-mono text-accent">{supplier.esg}</td>
                  <td className={`font-mono ${supplier.riskRisk > 50 ? 'text-danger' : 'text-muted'}`}>
                    {supplier.riskRisk}
                  </td>
                  <td>
                    <span className={styles.scoreBadge}>{supplier.compositeScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
