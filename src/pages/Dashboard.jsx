import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { Activity, ShieldAlert, Zap, Globe, AlertTriangle, AlertCircle, Info, Loader } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './Dashboard.module.css';
import { SkeletonKPIGrid, SkeletonChart } from '../components/LoadingSkeleton';
import { kpiData as mockKpi, demandTrends as mockTrends, regionRisk as mockRegion, topSuppliers as mockSuppliers } from '../data/mockData';
import { useLiveNews } from '../hooks/useLiveNews';
import { fetchKPIs, fetchDemandTrends, fetchRegionRisk, fetchSuppliers } from '../api/chainmindApi';

export const Dashboard = () => {
  const { alerts, loading: newsLoading, error: newsError } = useLiveNews();

  const [kpi, setKpi] = useState(mockKpi);
  const [trends, setTrends] = useState(mockTrends);
  const [regions, setRegions] = useState(mockRegion);
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [kpiRes, trendsRes, regionRes, suppliersRes] = await Promise.all([
          fetchKPIs(),
          fetchDemandTrends(),
          fetchRegionRisk(),
          fetchSuppliers()
        ]);
        if (!cancelled) {
          setKpi(kpiRes);
          setTrends(trendsRes);
          setRegions(regionRes);
          setSuppliers(suppliersRes);
        }
      } catch (err) {
        console.warn('[Dashboard] API unavailable, using mock data:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.dashboardContent}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text">Supply Chain Command Center</h1>
          <p className="text-muted mt-2">Live overview of global operations, risk, and demand.</p>
        </div>
        <div className="flex gap-4">
          <div className={`${appStyles.card} flex items-center gap-2 p-2 px-4 border-primary`}>
            <Activity size={16} className="text-primary" />
            <span className="font-mono text-sm">{loading ? 'CONNECTING...' : 'SYSTEM OPS: NOMINAL'}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkeletonKPIGrid />
      ) : (
        <div className={styles.kpiGrid}>
          <div className={`${appStyles.card} ${styles.kpiCard}`}>
            <span className={styles.kpiLabel}>Total Active Shipments</span>
            <span className={styles.kpiValue}>{kpi.totalShipments}</span>
          </div>
          <div className={`${appStyles.card} ${styles.kpiCard}`}>
            <span className={styles.kpiLabel}>Global Risk Index</span>
            <span className={`${styles.kpiValue} text-warning`}>{kpi.avgRiskScore}/100</span>
          </div>
          <div className={`${appStyles.card} ${styles.kpiCard}`}>
            <span className={styles.kpiLabel}>Critical Alerts</span>
            <span className={`${styles.kpiValue} text-danger`}>{kpi.activeAlerts}</span>
          </div>
          <div className={`${appStyles.card} ${styles.kpiCard}`}>
            <span className={styles.kpiLabel}>Network ESG Compliance</span>
            <span className={`${styles.kpiValue} text-accent`}>{kpi.esgCompliance}</span>
          </div>
        </div>
      )}

      {/* Primary Charts */}
      {loading ? (
        <div className={styles.chartsGrid}>
          <SkeletonChart height="350px" />
          <SkeletonChart height="350px" />
        </div>
      ) : (
      <div className={styles.chartsGrid}>
        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <Zap size={20} className="text-primary" />
            Demand vs Forecast Trend (90 Days)
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b026ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#b026ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="#8a8a93" tick={{fill: '#8a8a93'}} />
                <YAxis stroke="#8a8a93" tick={{fill: '#8a8a93'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: '#00f0ff', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="actual" stroke="#00f0ff" fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="forecasted" stroke="#b026ff" fillOpacity={1} fill="url(#colorForecast)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <Globe size={20} className="text-secondary" />
            Regional Risk Exposure
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                <XAxis type="number" stroke="#8a8a93" />
                <YAxis dataKey="region" type="category" stroke="#e0e0e0" tick={{fontSize: 12}} width={90} />
                <Tooltip
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: '#b026ff' }}
                />
                <Bar dataKey="risk" fill="#b026ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Secondary Row: Radar and Alerts */}
      {loading ? (
        <div className={styles.secondaryGrid}>
          <SkeletonChart height="350px" />
          <SkeletonChart height="350px" />
        </div>
      ) : (
      <div className={styles.secondaryGrid}>
        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <ShieldAlert size={20} className="text-accent" />
            Supplier Performance Radar
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={suppliers.slice(0, 3)}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{fill: '#e0e0e0', fontSize: 11}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#8a8a93'}} />
                <Radar name="Cost Efficiency" dataKey="cost" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.3} />
                <Radar name="ESG Score" dataKey="esg" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.3} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: '#00ff9d' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${appStyles.card} ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>
            <Activity size={20} className="text-primary" />
            Live Network Alerts
          </h3>
          <div className={styles.alertsList}>
            {newsLoading && <p className="text-muted p-4">Establishing secure connection to news feeds...</p>}
            {newsError && <p className="text-danger p-4">Error fetching intel: {newsError}</p>}
            {!newsLoading && !newsError && alerts.slice(0, 5).map(alert => {
              return (
                <div key={alert.id} className={`${styles.alertItem} ${styles[alert.type.toLowerCase()]}`}>
                  <div className={styles.alertIcon}>
                    {alert.type === 'CRITICAL' && <AlertTriangle size={18} />}
                    {alert.type === 'WARNING' && <AlertCircle size={18} />}
                    {alert.type === 'INFO' && <Info size={18} />}
                  </div>
                  <div className={styles.alertContent}>
                    <a href={alert.url} target="_blank" rel="noreferrer" className={styles.alertMessage} style={{ textDecoration: 'none' }}>
                      {alert.message}
                    </a>
                    <div className="flex items-center gap-2">
                      <span className={styles.alertTime}>{alert.time}</span>
                      {alert.source && <span className={styles.alertTime} style={{ opacity: 0.6 }}>• {alert.source}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
