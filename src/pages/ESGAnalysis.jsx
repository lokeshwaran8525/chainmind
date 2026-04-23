import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as ScatterTooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip as RadarTooltip
} from 'recharts';
import { Leaf, Award, Recycle, Factory } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './ESGAnalysis.module.css';
import { SkeletonChart, SkeletonTable } from '../components/LoadingSkeleton';
import { topSuppliers as mockSuppliers } from '../data/mockData';
import { fetchESGScores } from '../api/chainmindApi';

export const ESGAnalysis = () => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [networkAvg, setNetworkAvg] = useState(72);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchESGScores()
      .then(res => {
        if (!cancelled) {
          setSuppliers(res.suppliers);
          setNetworkAvg(res.networkAverage);
        }
      })
      .catch(err => {
        console.warn('[ESGAnalysis] API unavailable, using mock data:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Sort suppliers by ESG for the ranking list
  const sortedSuppliers = [...suppliers].sort((a, b) => b.esg - a.esg);

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text">Sustainability & ESG Analytics</h1>
          <p className="text-muted mt-2">Environmental, Social, and Governance compliance across the supplier network.</p>
        </div>
        <div className="flex items-center gap-2">
          <Recycle className="text-accent" size={20} />
          <span className="font-mono text-sm text-accent">NETWORK AVG: {networkAvg}%</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.topSection}>
          <SkeletonTable rows={5} />
          <SkeletonChart height="350px" />
        </div>
      ) : (
      <div className={styles.topSection}>
        <div className={appStyles.card}>
          <h3 className={styles.cardTitle}>
            <Award className="text-accent" size={20} />
            Top ESG Compliant Suppliers
          </h3>
          <div className={styles.rankingList}>
            {sortedSuppliers.map((supplier, idx) => (
              <div key={supplier.name} className={styles.rankingItem}>
                <div className="flex items-center gap-3">
                  <span className="text-muted font-mono">{idx + 1}.</span>
                  <span className={styles.supplierName}>{supplier.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">ESG</span>
                    <span className={`${styles.supplierScore} text-accent`}>{supplier.esg}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">Cost</span>
                    <span className={`${styles.supplierScore} text-primary`}>{supplier.cost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={appStyles.card}>
          <h3 className={styles.cardTitle}>
            <Leaf className="text-accent" size={20} />
            ESG vs Cost Optimization Map
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
                  domain={['auto', 'auto']}
                />
                <YAxis 
                  type="number" 
                  dataKey="esg" 
                  name="ESG Score" 
                  stroke="#8a8a93" 
                  domain={['auto', 'auto']}
                />
                <ScatterTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderColor: '#00ff9d' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono', color: '#fff' }}
                  formatter={(value, name) => [value, name]}
                />
                <Scatter name="Suppliers" data={suppliers} shape="circle">
                  {suppliers.map((entry, index) => {
                    // Green for >80 ESG, Yellow for >60, Red for <60
                    const color = entry.esg >= 80 ? '#00ff9d' : entry.esg >= 60 ? '#ffb000' : '#ff2a2a';
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      <div className={styles.radarSection}>
        <div className={appStyles.card}>
          <h3 className={styles.cardTitle}>
            <Factory className="text-primary" size={20} />
            Supplier Multi-Factor Audit
          </h3>
          <div className="h-[350px] w-full" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={suppliers}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{fill: '#e0e0e0', fontSize: 11}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#8a8a93'}} />
                <Radar name="ESG Compliance" dataKey="esg" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.2} />
                <Radar name="Delivery Perf." dataKey="delivery" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.2} />
                <Legend iconType="circle" />
                <RadarTooltip contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: '#00ff9d' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
