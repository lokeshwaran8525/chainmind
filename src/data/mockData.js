// mockData.js
export const kpiData = {
  totalShipments: "12,450",
  activeAlerts: 14,
  avgRiskScore: 68,
  esgCompliance: "92%"
};

export const demandTrends = [
  { month: "Jan", actual: 4000, forecasted: 4100 },
  { month: "Feb", actual: 3000, forecasted: 3200 },
  { month: "Mar", actual: 2000, forecasted: 2100 },
  { month: "Apr", actual: 2780, forecasted: 2800 },
  { month: "May", actual: 1890, forecasted: 2000 },
  { month: "Jun", actual: 2390, forecasted: 2400 },
  { month: "Jul", actual: 3490, forecasted: 3600 },
];

export const regionRisk = [
  { region: "North America", risk: 24 },
  { region: "Europe", risk: 36 },
  { region: "Asia Pacific", risk: 78 },
  { region: "Latin America", risk: 52 },
  { region: "Middle East", risk: 64 },
];

export const topSuppliers = [
  { name: "TechTronix", cost: 85, esg: 90, riskRisk: 20, delivery: 95 },
  { name: "GlobalFab", cost: 60, esg: 75, riskRisk: 40, delivery: 80 },
  { name: "Apex Manufacturing", cost: 90, esg: 60, riskRisk: 55, delivery: 70 },
  { name: "Nova Supply", cost: 70, esg: 85, riskRisk: 30, delivery: 88 },
  { name: "Quantum Parts", cost: 50, esg: 50, riskRisk: 80, delivery: 60 }
];

export const liveAlerts = [
  { id: 1, type: "CRITICAL", message: "Port closure in Shanghai due to severe weather. Expected delay: 4 days.", time: "10 mins ago" },
  { id: 2, type: "WARNING", message: "Supplier 'GlobalFab' ESG rating dropped below threshold.", time: "1 hour ago" },
  { id: 3, type: "INFO", message: "Demand spike detected for Product SKU-8821 in Europe.", time: "3 hours ago" },
  { id: 4, type: "WARNING", message: "Logistics bottleneck at Suez Canal. Rerouting suggested.", time: "5 hours ago" }
];

export const aiRecommendations = [
  {
    id: 1,
    title: "Rebalance Asia Pacific Allocation",
    description: "Shift 15% of production from GlobalFab to TechTronix to reduce geopolitical risk exposure by 22% while maintaining cost targets.",
    impact: "High",
    confidence: "94%"
  },
  {
    id: 2,
    title: "Expedite Critical Components",
    description: "Current inventory for SKU-8821 will deplete in 12 days. Expedite next shipment to avoid stockout.",
    impact: "Medium",
    confidence: "88%"
  }
];

export const scenarioData = {
  baseline: { risk: "Normal", cost: "$1.2M", esgScore: "B+" },
  scenarios: [
    { threshold: "Low Risk", cost: "$1.8M", esgScore: "A", implication: "Increases operating costs by 50% but secures supply chain against 95% of predicted disruptions." },
    { threshold: "High ESG", cost: "$1.5M", esgScore: "A+", implication: "Focuses entirely on green suppliers. Moderate cost increase, high brand value." },
    { threshold: "Cost Optimized", cost: "$0.9M", esgScore: "C", implication: "Maximizes margins but leaves supply chain highly vulnerable to regional shocks." }
  ]
};
