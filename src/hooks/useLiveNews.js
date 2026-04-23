import { useState, useEffect, useCallback } from 'react';

// Backend proxy for newsdata.io (avoids CORS + hides API key server-side)
const BACKEND_NEWS_URL = '/api/news/live';

// ── Keyword-based severity classifier ──────────────────────────────────────
const CRITICAL_KEYWORDS = [
  'crisis', 'shortage', 'strike', 'war', 'attack', 'disruption', 'blockade',
  'closure', 'sanctions', 'embargo', 'collapse', 'threat', 'havoc', 'conflict',
  'explosion', 'earthquake', 'flood', 'hurricane', 'typhoon', 'shutdown',
  'breach', 'cyberattack', 'surge', 'spike', 'crash', 'disaster'
];

const WARNING_KEYWORDS = [
  'delay', 'risk', 'tariff', 'ban', 'concern', 'strain', 'impact',
  'congestion', 'bottleneck', 'volatility', 'pressure', 'warning',
  'uncertainty', 'downturn', 'decline', 'challenge', 'obstacle',
  'recession', 'inflation', 'cost increase', 'prices', 'shortage'
];

function classifySeverity(title) {
  const lower = title.toLowerCase();
  if (CRITICAL_KEYWORDS.some(kw => lower.includes(kw))) return 'CRITICAL';
  if (WARNING_KEYWORDS.some(kw => lower.includes(kw))) return 'WARNING';
  return 'INFO';
}

// ── Time-ago formatter ─────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return 'recently';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'recently';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Mock data fallback ─────────────────────────────────────────────────────
const MOCK_ALERTS = [
  { id: 'mock-1', type: 'CRITICAL', message: 'Global shipping lane disruption detected in Strait of Hormuz.', time: '10m ago', url: '#', source: 'Reuters' },
  { id: 'mock-2', type: 'WARNING', message: 'Port congestion reaching critical levels in Shanghai.', time: '2h ago', url: '#', source: 'FreightWaves' },
  { id: 'mock-3', type: 'CRITICAL', message: 'Major container ship struck amid escalation in Persian Gulf.', time: '3h ago', url: '#', source: 'S&P Global' },
  { id: 'mock-4', type: 'WARNING', message: 'SE Asia freight rates double amid supply chain shifts.', time: '5h ago', url: '#', source: 'Digitimes' },
  { id: 'mock-5', type: 'INFO', message: 'New sustainability regulations implemented for freight carriers.', time: '6h ago', url: '#', source: 'Supply Chain Dive' },
  { id: 'mock-6', type: 'WARNING', message: 'Trade disruption drives 2,400% surge in shipping reroutes.', time: '8h ago', url: '#', source: 'SDC Executive' },
  { id: 'mock-7', type: 'INFO', message: 'AI-powered logistics platform secures $95M in Series C funding.', time: '12h ago', url: '#', source: 'TechCrunch' },
  { id: 'mock-8', type: 'CRITICAL', message: 'Labor strike looming at major west coast ports.', time: '14h ago', url: '#', source: 'Bloomberg' },
];

// ── Main hook ──────────────────────────────────────────────────────────────
export const useLiveNews = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = useCallback(async () => {
    try {
      // Fetch from backend (newsdata.io proxy)
      let data = null;
      try {
        const res = await fetch(BACKEND_NEWS_URL);
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Backend unavailable, fall through to mock
      }

      if (data && data.articles && data.articles.length > 0) {
        const transformed = data.articles
          .filter(a => a.title && a.title.length > 10)
          .map((a, i) => ({
            id: `nd-${i}-${Date.now()}`,
            type: classifySeverity(a.title),
            message: a.title,
            description: a.description || '',
            time: timeAgo(a.pubDate),
            url: a.link || '#',
            source: a.source || 'newsdata.io',
            imageUrl: a.imageUrl || '',
          }));

        if (transformed.length > 0) {
          setAlerts(transformed);
          setLastUpdated(new Date());
          setLoading(false);
          setError(null);
          return;
        }
      }

      // Fallback to mock data if API returns nothing
      setAlerts(MOCK_ALERTS);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[useLiveNews] Error:', err);
      // Use mock data on total failure instead of showing an error
      setAlerts(MOCK_ALERTS);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();

    // Poll every 5 minutes for fresh news
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { alerts, loading, error, lastUpdated, refetch: fetchNews };
};
