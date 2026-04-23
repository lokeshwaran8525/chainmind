import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShieldAlert, 
  Leaf, 
  BrainCircuit, 
  GitCompareArrows, 
  BellRing,
  Hexagon
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navLinks = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/demand', label: 'Demand Forecasting', icon: TrendingUp },
  { path: '/risk', label: 'Risk Intelligence', icon: ShieldAlert },
  { path: '/esg', label: 'ESG Analysis', icon: Leaf },
  { path: '/ai', label: 'AI Recommendations', icon: BrainCircuit },
  { path: '/simulator', label: 'Scenario Simulator', icon: GitCompareArrows },
  { path: '/alerts', label: 'Alerts & Insights', icon: BellRing },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <aside className={`${styles.sidebarContainer} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logoArea}>
        <Hexagon size={28} className={styles.logoIcon} />
        <span className={styles.logoText}>CHAINMIND</span>
      </div>
      
      <nav className={styles.navList}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Icon size={18} className={styles.navItemIcon} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.bottomSection}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <span className="font-mono text-xs">OP</span>
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>Operator 01</span>
            <span className={styles.userRole}>System Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
