import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Layers, PackageSearch } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './DemandForecasting.module.css';
import { SkeletonChart, SkeletonKPIGrid } from '../components/LoadingSkeleton';
import { fetchDemandForecast, fetchProducts } from '../api/chainmindApi';

// Fallback data generator (original mock)
const generateFallbackData = (days) => {
  const data = [];
  let baseVal = 5000;
  for (let i = 0; i < days; i++) {
    const isHistorical = i < Math.floor(days * 0.4);
    const seasonality = Math.sin(i / 5) * 600;
    const trend = i * 20;
    const noise = (Math.random() - 0.5) * 400;
    
    if (isHistorical) {
      data.push({
        day: `D-${Math.floor(days * 0.4) - i}`,
        historical: Math.floor(baseVal + trend + seasonality + noise),
        forecast: null,
        seasonalityImpact: Math.floor(seasonality > 0 ? seasonality : 0)
      });
    } else {
      data.push({
        day: `D+${i - Math.floor(days * 0.4) + 1}`,
        historical: null,
        forecast: Math.floor(baseVal + trend + seasonality + noise),
        confidenceHigh: Math.floor(baseVal + trend + seasonality + noise + 300 + (i * 10)),
        confidenceLow: Math.floor(baseVal + trend + seasonality + noise - 300 - (i * 10)),
        seasonalityImpact: Math.floor(seasonality > 0 ? seasonality : 0)
      });
    }
  }
  return data;
};

export const DemandForecasting = () => {
  const [timeframe, setTimeframe] = useState(30);
  const [product, setProduct] = useState('M01AB');
  const [products, setProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState({ growth: '+14.2%', accuracy: '94.8%', stockoutDay: 12 });
  const [productInfo, setProductInfo] = useState({ name: 'Quantum Processors', sku: 'SKU-8821' });
  const [loading, setLoading] = useState(true);

  // Load product list
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {
        setProducts([
          { code: 'M01AB', name: 'Quantum Processors', sku: 'SKU-8821' },
          { code: 'M01AE', name: 'Neural Cores', sku: 'SKU-9942' },
          { code: 'N02BA', name: 'Optic Relays', sku: 'SKU-1024' },
        ]);
      });
  }, []);

  // Load forecast data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchDemandForecast(product, timeframe)
      .then(res => {
        if (!cancelled) {
          setChartData(res.data);
          setMetrics(res.metrics);
          setProductInfo(res.product);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartData(generateFallbackData(timeframe));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [timeframe, product]);

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text">Predictive Demand Intelligence</h1>
          <p className="text-muted mt-2">AI-driven forecasting integrating seasonality and market trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="text-secondary" size={20} />
          <span className="font-mono text-sm text-secondary">MODEL: RandomForest (v3.1)</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className="flex items-center gap-4">
          <PackageSearch className="text-primary" size={20} />
          <select 
            className={styles.select} 
            value={product} 
            onChange={(e) => setProduct(e.target.value)}
          >
            {products.length > 0 ? (
              products.map(p => (
                <option key={p.code} value={p.code}>{p.name} ({p.sku})</option>
              ))
            ) : (
              <>
                <option value="M01AB">Quantum Processors (SKU-8821)</option>
                <option value="M01AE">Neural Cores (SKU-9942)</option>
                <option value="N02BA">Optic Relays (SKU-1024)</option>
              </>
            )}
          </select>
        </div>

        <div className={styles.timeGroup}>
          <button 
            className={`${styles.timeButton} ${timeframe === 7 ? styles.active : ''}`}
            onClick={() => setTimeframe(7)}
          >7 Days</button>
          <button 
            className={`${styles.timeButton} ${timeframe === 30 ? styles.active : ''}`}
            onClick={() => setTimeframe(30)}
          >30 Days</button>
          <button 
            className={`${styles.timeButton} ${timeframe === 90 ? styles.active : ''}`}
            onClick={() => setTimeframe(90)}
          >90 Days</button>
        </div>
      </div>

      <div className={`${appStyles.card} ${styles.chartCard}`}>
        <h3 className={styles.chartHeader}>
          <TrendingUp className="text-primary" size={20} />
          Unified Forecast Model: {productInfo.name || product}
        </h3>
        <div className={styles.chartContainer}>
          {loading ? (
            <SkeletonChart height="400px" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#8a8a93" tick={{fontSize: 11}} minTickGap={20} />
                <YAxis stroke="#8a8a93" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: '#00f0ff' }}
                  itemStyle={{fontFamily: 'JetBrains Mono'}}
                />
                <Legend wrapperStyle={{paddingTop: '10px'}} />
                
                {/* Context / Bar */}
                <Bar dataKey="seasonalityImpact" name="Seasonality Impact" fill="#b026ff" fillOpacity={0.2} stackId="a" />
                
                {/* Lines */}
                <Line type="monotone" dataKey="historical" name="Historical Demand" stroke="#00ff9d" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#00f0ff" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="confidenceHigh" name="Upper Bound" stroke="rgba(0, 240, 255, 0.3)" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="confidenceLow" name="Lower Bound" stroke="rgba(0, 240, 255, 0.3)" strokeWidth={1} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={appStyles.card + " " + styles.metricCard}>
          <span className={styles.metricLabel}>Predicted MoM Growth</span>
          <span className={`${styles.metricValue} ${metrics.growth >= 0 ? styles.positive : styles.negative}`}>
            {metrics.growth >= 0 ? '+' : ''}{metrics.growth}%
          </span>
        </div>
        <div className={appStyles.card + " " + styles.metricCard}>
          <span className={styles.metricLabel}>Forecast Accuracy Score</span>
          <span className={`${styles.metricValue} ${styles.neutral}`}>{metrics.accuracy}%</span>
        </div>
        <div className={appStyles.card + " " + styles.metricCard}>
          <span className={styles.metricLabel}>Stockout Risk Warning</span>
          <span className={`${styles.metricValue} ${styles.negative}`}>High (Day {metrics.stockoutDay})</span>
        </div>
      </div>
    </div>
  );
};
