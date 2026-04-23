import React from 'react';
import { Radio, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useLiveNews } from '../../hooks/useLiveNews';
import styles from './NewsTicker.module.css';

const severityIcon = {
  CRITICAL: <AlertTriangle size={12} />,
  WARNING: <AlertCircle size={12} />,
  INFO: <Info size={12} />,
};

export const NewsTicker = () => {
  const { alerts, loading } = useLiveNews();

  if (loading || alerts.length === 0) return null;

  // Duplicate alerts for seamless infinite scroll
  const tickerItems = [...alerts, ...alerts];

  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.tickerLabel}>
        <Radio size={14} className={styles.pulseIcon} />
        <span>LIVE</span>
      </div>
      <div className={styles.tickerTrack}>
        <div className={styles.tickerContent}>
          {tickerItems.map((alert, i) => (
            <a
              key={`${alert.id}-${i}`}
              href={alert.url}
              target="_blank"
              rel="noreferrer"
              className={`${styles.tickerItem} ${styles[alert.type.toLowerCase()]}`}
            >
              <span className={styles.tickerIcon}>
                {severityIcon[alert.type] || severityIcon.INFO}
              </span>
              <span className={styles.tickerMessage}>{alert.message}</span>
              {alert.source && (
                <span className={styles.tickerSource}>{alert.source}</span>
              )}
              <span className={styles.tickerDivider}>●</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
