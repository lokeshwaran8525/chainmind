/**
 * ChainMind API Client
 * Centralized API calls to the Flask backend.
 * Falls back to mock data if the backend is unavailable.
 */

const BASE_URL = '/api';

async function fetchApi(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, val);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export async function fetchKPIs() {
  return fetchApi(`${BASE_URL}/dashboard/kpis`);
}

export async function fetchDemandTrends() {
  return fetchApi(`${BASE_URL}/dashboard/demand-trends`);
}

export async function fetchRegionRisk() {
  return fetchApi(`${BASE_URL}/dashboard/region-risk`);
}

// ── Suppliers ──────────────────────────────────────────────────────────────
export async function fetchSuppliers() {
  return fetchApi(`${BASE_URL}/suppliers`);
}

// ── Demand Forecasting ────────────────────────────────────────────────────
export async function fetchDemandForecast(product, days) {
  return fetchApi(`${BASE_URL}/demand/forecast`, { product, days });
}

export async function fetchProducts() {
  return fetchApi(`${BASE_URL}/demand/products`);
}

// ── ESG ────────────────────────────────────────────────────────────────────
export async function fetchESGScores() {
  return fetchApi(`${BASE_URL}/esg/scores`);
}

// ── Risk ───────────────────────────────────────────────────────────────────
export async function fetchRiskHeatmap() {
  return fetchApi(`${BASE_URL}/risk/heatmap`);
}

export async function fetchRiskPrediction(params) {
  return fetchApi(`${BASE_URL}/risk/predict`, params);
}

export async function fetchModelInfo() {
  return fetchApi(`${BASE_URL}/risk/model-info`);
}

// ── AI Recommendations ────────────────────────────────────────────────────
export async function fetchAIRecommendations() {
  return fetchApi(`${BASE_URL}/ai/recommendations`);
}

// ── Scenario Simulator ────────────────────────────────────────────────────
export async function fetchSimulation(risk, cost, esg) {
  return fetchApi(`${BASE_URL}/simulator/run`, { risk, cost, esg });
}

// ── Health ─────────────────────────────────────────────────────────────────
export async function fetchHealth() {
  return fetchApi(`${BASE_URL}/health`);
}

// ── Live News ─────────────────────────────────────────────────────────────
export async function fetchLiveNews() {
  return fetchApi(`${BASE_URL}/news/live`);
}
