import React, { useState } from 'react';
import { BellRing, AlertTriangle, AlertCircle, Info, Sparkles, Filter } from 'lucide-react';
import appStyles from '../components/Layout/AppLayout.module.css';
import styles from './AlertsInsights.module.css';
import { useLiveNews } from '../hooks/useLiveNews';

export const AlertsInsights = () => {
  const [filter, setFilter] = useState('ALL');
  const { alerts, loading, error } = useLiveNews();

  const displayedAlerts = filter === 'ALL' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const getIcon = (type) => {
    switch(type) {
      case 'CRITICAL': return <AlertTriangle size={20} />;
      case 'WARNING': return <AlertCircle size={20} />;
      case 'INFO': return <Info size={20} />;
      default: return <BellRing size={20} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={appStyles.pageHeader}>
        <div>
          <h1 className="glow-text flex items-center gap-2">
            <BellRing size={28} className="text-danger" />
            Global Event Feed
          </h1>
          <p className="text-muted mt-2">Real-time telemetry and anomaly detection spanning the supply chain network.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-muted" size={18} />
          <span className="font-mono text-sm text-muted">24HR WINDOW</span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Main Feed */}
        <div className={appStyles.card}>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${filter === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilter('ALL')}
            >ALL EVENTS</button>
            <button 
              className={`${styles.filterBtn} ${filter === 'CRITICAL' ? styles.active : ''}`}
              onClick={() => setFilter('CRITICAL')}
            >CRITICAL</button>
            <button 
              className={`${styles.filterBtn} ${filter === 'WARNING' ? styles.active : ''}`}
              onClick={() => setFilter('WARNING')}
            >WARNINGS</button>
            <button 
              className={`${styles.filterBtn} ${filter === 'INFO' ? styles.active : ''}`}
              onClick={() => setFilter('INFO')}
            >INFO</button>
          </div>

          <div className={styles.alertFeed}>
            {loading && (
              <div className="p-6 text-center text-primary font-mono bg-white/5 rounded-md flex flex-col items-center gap-2">
                <Sparkles size={24} className="animate-spin" />
                ESTABLISHING SECURE CONNECTION TO LIVE NEWS FEEDS...
              </div>
            )}
            {error && (
              <div className="p-6 text-center text-danger font-mono bg-white/5 rounded-md">
                ERROR ESTABLISHING CONNECTION: {error}
              </div>
            )}
            {!loading && !error && displayedAlerts.map(alert => (
              <a href={alert.url} target="_blank" rel="noreferrer" key={alert.id} className={`${styles.alertCard} ${styles[alert.type.toLowerCase()]}`} style={{ textDecoration: 'none' }}>
                <div className={styles.iconWrapper}>
                  {getIcon(alert.type)}
                </div>
                <div className={styles.alertContent}>
                  <div className={styles.alertHeader}>
                    <span className={styles.alertType}>{alert.type}</span>
                    <div className="flex items-center gap-2">
                      <span className={styles.alertTime}>{alert.time}</span>
                      {alert.source && <span className={styles.alertTime} style={{ opacity: 0.6 }}>• {alert.source}</span>}
                    </div>
                  </div>
                  <p className={styles.alertMessage}>{alert.message}</p>
                </div>
              </a>
            ))}
            
            {!loading && !error && displayedAlerts.length === 0 && (
              <div className="p-6 text-center text-muted font-mono bg-white/5 rounded-md">
                NO EVENTS DETECTED FOR CURRENT FILTER
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Card */}
        <div className={`${appStyles.card} ${styles.insightCard}`}>
          <div className={styles.insightHeader}>
            <Sparkles size={24} className="text-secondary" />
            <h3 className="text-bright font-semibold text-lg">Synthesized Network Observations</h3>
          </div>
          
          <div className={styles.insightBlock}>
            <div className={styles.insightItem}>
              <span className={styles.insightNumber}>01</span>
              <p className={styles.insightText}>
                Correlated weather pattern across Southeast Asia strongly indicates port congestion within 72 hours. Probability of delay for incoming component shipments is 84%.
              </p>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightNumber}>02</span>
              <p className={styles.insightText}>
                The supplier "Quantum Parts" has shown a 12% week-over-week degradation in lead time adherence, aligning with their recent financial risk flags.
              </p>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightNumber}>03</span>
              <p className={styles.insightText}>
                A compounding effect of SKU-8821 demand spike (+14%) and Suez Canal bottleneck means current safety stock will deplete 4 days faster than classical forecasting models project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
