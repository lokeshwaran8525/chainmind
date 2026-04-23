import React from 'react';
import styles from './LoadingSkeleton.module.css';

/**
 * Reusable skeleton loading components matching ChainMind's cyberpunk aesthetic.
 * Variants: KPI, Chart, Table, Card, PageHeader
 */

export const SkeletonKPIGrid = () => (
  <div className={styles.kpiGrid}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className={styles.kpiSkeleton}>
        <div className={styles.kpiLabel} />
        <div className={styles.kpiValue} />
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ height = '350px' }) => (
  <div className={styles.chartSkeleton} style={{ minHeight: height }}>
    <div className={styles.chartHeader}>
      <div className={styles.chartIcon} />
      <div className={styles.chartTitleBar} />
    </div>
    <div className={styles.chartArea}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={styles.chartBar}
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className={styles.tableSkeleton}>
    <div className={styles.chartHeader} style={{ marginBottom: '0.5rem' }}>
      <div className={styles.chartIcon} />
      <div className={styles.chartTitleBar} />
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={styles.tableRow}>
        <div className={styles.tableCellSm} />
        <div className={styles.tableCellMd} />
        <div className={styles.tableCellLg} />
        <div className={styles.tableCellLg} />
      </div>
    ))}
  </div>
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className={styles.cardSkeleton}>
    <div className={styles.cardLineMd} />
    {[...Array(lines)].map((_, i) => (
      <div
        key={i}
        className={i === lines - 1 ? styles.cardLineSm : styles.cardLineFull}
      />
    ))}
  </div>
);

export const SkeletonPageHeader = () => (
  <div className={styles.headerSkeleton}>
    <div>
      <div className={styles.headerTitle} />
      <div className={styles.headerSubtitle} />
    </div>
    <div className={styles.headerBadge} />
  </div>
);

/**
 * Full page skeleton – combines header + KPIs + charts.
 * Use this as a drop-in loading state for any page.
 */
export const SkeletonPage = () => (
  <div className={styles.pageSkeletonWrapper}>
    <SkeletonPageHeader />
    <SkeletonKPIGrid />
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);
