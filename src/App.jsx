import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import { Dashboard } from './pages/Dashboard';
import { DemandForecasting } from './pages/DemandForecasting';
import { RiskIntelligence } from './pages/RiskIntelligence';
import { ESGAnalysis } from './pages/ESGAnalysis';
import { AIRecommendations } from './pages/AIRecommendations';
import { ScenarioSimulator } from './pages/ScenarioSimulator';
import { AlertsInsights } from './pages/AlertsInsights';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/demand" element={<ErrorBoundary><DemandForecasting /></ErrorBoundary>} />
            <Route path="/risk" element={<ErrorBoundary><RiskIntelligence /></ErrorBoundary>} />
            <Route path="/esg" element={<ErrorBoundary><ESGAnalysis /></ErrorBoundary>} />
            <Route path="/ai" element={<ErrorBoundary><AIRecommendations /></ErrorBoundary>} />
            <Route path="/simulator" element={<ErrorBoundary><ScenarioSimulator /></ErrorBoundary>} />
            <Route path="/alerts" element={<ErrorBoundary><AlertsInsights /></ErrorBoundary>} />
          </Routes>
        </AppLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
