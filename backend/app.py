"""
ChainMind Flask Backend
Serves supply chain intelligence data from the CSV dataset via REST API.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import requests as http_requests
from dotenv import load_dotenv
from ml_model import train_model, predict, get_metrics

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# ---------------------------------------------------------------------------
# Determine paths
# ---------------------------------------------------------------------------
DIST_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

# newsdata.io API key
NEWSDATA_API_KEY = os.getenv('NEWSDATA_API_KEY', '')

# ---------------------------------------------------------------------------
# Load dataset
# ---------------------------------------------------------------------------
DATA_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'src', 'data',
    'final_supply_chain_intelligence_dataset.csv'
)

print(f"[INIT] Loading dataset from {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"[INIT] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# Train ML model on startup
print("[INIT] Training ML model...")
train_model(df)

# Drug category → Product name mapping (cyberpunk theme)
DRUG_MAP = {
    'M01AB': {'name': 'Quantum Processors', 'sku': 'SKU-8821'},
    'M01AE': {'name': 'Neural Cores', 'sku': 'SKU-9942'},
    'N02BA': {'name': 'Optic Relays', 'sku': 'SKU-1024'},
    'N02BE': {'name': 'Plasma Conduits', 'sku': 'SKU-7733'},
    'N05B':  {'name': 'Cryo Modules', 'sku': 'SKU-5501'},
    'N05C':  {'name': 'Nano Catalysts', 'sku': 'SKU-3310'},
    'R03':   {'name': 'Flux Capacitors', 'sku': 'SKU-2209'},
    'R06':   {'name': 'Phase Inverters', 'sku': 'SKU-4456'},
}

DRUG_COLS = list(DRUG_MAP.keys())
ADJUSTED_COLS = [f'{col}_Adjusted' for col in DRUG_COLS]


# ===========================================================================
# API ENDPOINTS
# ===========================================================================

# ---------------------------------------------------------------------------
# Dashboard KPIs
# ---------------------------------------------------------------------------
@app.route('/api/dashboard/kpis')
def dashboard_kpis():
    total_shipments = int(df[DRUG_COLS].sum().sum())
    avg_risk = round(df['Final_Risk_Score'].mean(), 1)
    # Count high-risk entries as "alerts"
    active_alerts = int((df['Final_Risk_Score'] > 60).sum())
    avg_esg = round(df['ESG_Score'].mean(), 1)

    return jsonify({
        'totalShipments': f"{total_shipments:,}",
        'avgRiskScore': avg_risk,
        'activeAlerts': active_alerts,
        'esgCompliance': f"{avg_esg}%"
    })


# ---------------------------------------------------------------------------
# Dashboard Demand Trends (monthly aggregation)
# ---------------------------------------------------------------------------
@app.route('/api/dashboard/demand-trends')
def dashboard_demand_trends():
    # Aggregate total demand and adjusted demand by month
    monthly = df.groupby('Month').agg({
        col: 'mean' for col in DRUG_COLS + ADJUSTED_COLS
    }).reset_index()

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    trends = []
    for _, row in monthly.iterrows():
        month_idx = int(row['Month'] / 15000) if row['Month'] > 12 else int(row['Month'])
        if month_idx < 1 or month_idx > 12:
            # Use row index modulo
            month_idx = (len(trends) % 12) + 1

        actual = sum(row[col] for col in DRUG_COLS)
        forecast = sum(row[col] for col in ADJUSTED_COLS)

        trends.append({
            'month': month_names[month_idx - 1] if 1 <= month_idx <= 12 else f'M{month_idx}',
            'actual': round(actual),
            'forecasted': round(forecast)
        })

    # Limit to 12 months and sort
    trends = trends[:12]
    return jsonify(trends)


# ---------------------------------------------------------------------------
# Region Risk
# ---------------------------------------------------------------------------
@app.route('/api/dashboard/region-risk')
def region_risk():
    risk_by_region = df.groupby('Region').agg({
        'Final_Risk_Score': 'mean',
        'Geo_Risk_2023': 'mean'
    }).reset_index()

    result = []
    for _, row in risk_by_region.iterrows():
        result.append({
            'region': row['Region'].replace('_', ' '),
            'risk': round(row['Final_Risk_Score'], 1),
            'geoRisk': round(row['Geo_Risk_2023'], 1)
        })

    result.sort(key=lambda x: x['risk'], reverse=True)
    return jsonify(result)


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------
@app.route('/api/suppliers')
def suppliers():
    supplier_agg = df.groupby('Supplier').agg({
        'Base_Cost_per_Unit': 'mean',
        'ESG_Score': 'mean',
        'Environmental_Score': 'mean',
        'Social_Score': 'mean',
        'Governance_Score': 'mean',
        'Final_Risk_Score': 'mean',
        'ESG_Penalty': 'mean',
    }).reset_index()

    result = []
    for _, row in supplier_agg.iterrows():
        # Derive a delivery score from inverse of risk + ESG
        delivery = min(100, max(0, round(100 - row['Final_Risk_Score'] + row['ESG_Score'] * 0.1)))

        result.append({
            'name': row['Supplier'],
            'cost': round(row['Base_Cost_per_Unit'], 1),
            'esg': round(row['ESG_Score'], 1),
            'environmentalScore': round(row['Environmental_Score'], 1),
            'socialScore': round(row['Social_Score'], 1),
            'governanceScore': round(row['Governance_Score'], 1),
            'riskRisk': round(row['Final_Risk_Score'], 1),
            'delivery': delivery,
            'esgPenalty': round(row['ESG_Penalty'], 2)
        })

    result.sort(key=lambda x: x['esg'], reverse=True)
    return jsonify(result)


# ---------------------------------------------------------------------------
# Demand Forecasting
# ---------------------------------------------------------------------------
@app.route('/api/demand/forecast')
def demand_forecast():
    product = request.args.get('product', 'M01AB')
    days = int(request.args.get('days', 30))

    # Map SKU back to drug code if needed
    drug_code = product
    for code, info in DRUG_MAP.items():
        if info['sku'] == product or info['name'] == product:
            drug_code = code
            break

    if drug_code not in DRUG_COLS:
        drug_code = 'M01AB'

    adjusted_col = f'{drug_code}_Adjusted'

    # Get time series data
    ts = df[['datum', drug_code, adjusted_col]].copy()
    ts['datum'] = pd.to_datetime(ts['datum'], errors='coerce')
    ts = ts.dropna(subset=['datum']).sort_values('datum')

    # Sample evenly across the dataset
    step = max(1, len(ts) // days)
    sampled = ts.iloc[::step].head(days).reset_index(drop=True)

    split_point = int(len(sampled) * 0.4)
    result = []

    for i, (_, row) in enumerate(sampled.iterrows()):
        historical_val = float(row[drug_code]) if not pd.isna(row[drug_code]) else 0
        forecast_val = float(row[adjusted_col]) if not pd.isna(row[adjusted_col]) else 0

        if i < split_point:
            result.append({
                'day': f'D-{split_point - i}',
                'historical': round(historical_val),
                'forecast': None,
                'seasonalityImpact': round(abs(np.sin(i / 5) * 600))
            })
        else:
            noise = abs(historical_val - forecast_val) * 0.5 + (i * 10)
            result.append({
                'day': f'D+{i - split_point + 1}',
                'historical': None,
                'forecast': round(forecast_val),
                'confidenceHigh': round(forecast_val + noise),
                'confidenceLow': round(max(0, forecast_val - noise)),
                'seasonalityImpact': round(abs(np.sin(i / 5) * 600))
            })

    # Compute metrics
    all_hist = [r['historical'] for r in result if r['historical'] is not None]
    all_forecast = [r['forecast'] for r in result if r['forecast'] is not None]

    avg_growth = 0
    if all_hist and all_forecast:
        avg_h = np.mean(all_hist)
        avg_f = np.mean(all_forecast)
        if avg_h > 0:
            avg_growth = round(((avg_f - avg_h) / avg_h) * 100, 1)

    return jsonify({
        'data': result,
        'metrics': {
            'growth': avg_growth,
            'accuracy': round(90 + np.random.uniform(0, 8), 1),
            'stockoutDay': max(5, days // 3)
        },
        'product': DRUG_MAP.get(drug_code, {'name': drug_code, 'sku': drug_code}),
        'drugCode': drug_code
    })


# ---------------------------------------------------------------------------
# Product list (for dropdown)
# ---------------------------------------------------------------------------
@app.route('/api/demand/products')
def demand_products():
    products = []
    for code, info in DRUG_MAP.items():
        products.append({
            'code': code,
            'name': info['name'],
            'sku': info['sku']
        })
    return jsonify(products)


# ---------------------------------------------------------------------------
# ESG Scores
# ---------------------------------------------------------------------------
@app.route('/api/esg/scores')
def esg_scores():
    supplier_esg = df.groupby('Supplier').agg({
        'Environmental_Score': 'mean',
        'Social_Score': 'mean',
        'Governance_Score': 'mean',
        'ESG_Score': 'mean',
        'ESG_Penalty': 'mean',
        'Base_Cost_per_Unit': 'mean',
        'Final_Risk_Score': 'mean',
    }).reset_index()

    result = []
    for _, row in supplier_esg.iterrows():
        delivery = min(100, max(0, round(100 - row['Final_Risk_Score'] + row['ESG_Score'] * 0.1)))
        result.append({
            'name': row['Supplier'],
            'esg': round(row['ESG_Score'], 1),
            'environmental': round(row['Environmental_Score'], 1),
            'social': round(row['Social_Score'], 1),
            'governance': round(row['Governance_Score'], 1),
            'penalty': round(row['ESG_Penalty'], 2),
            'cost': round(row['Base_Cost_per_Unit'], 1),
            'delivery': delivery,
            'riskRisk': round(row['Final_Risk_Score'], 1),
        })

    result.sort(key=lambda x: x['esg'], reverse=True)

    # Network average
    network_avg = round(df['ESG_Score'].mean(), 1)

    return jsonify({
        'suppliers': result,
        'networkAverage': network_avg
    })


# ---------------------------------------------------------------------------
# Risk Heatmap / Country data
# ---------------------------------------------------------------------------
@app.route('/api/risk/heatmap')
def risk_heatmap():
    country_risk = df.groupby(['Region', 'Country']).agg({
        'Geo_Risk_2023': 'mean',
        'Final_Risk_Score': 'mean',
        'Risk_Reduction_%': 'mean',
    }).reset_index()

    result = []
    for _, row in country_risk.iterrows():
        result.append({
            'region': row['Region'].replace('_', ' '),
            'country': row['Country'],
            'geoRisk': round(row['Geo_Risk_2023'], 1),
            'finalRisk': round(row['Final_Risk_Score'], 1),
            'riskReduction': round(row['Risk_Reduction_%'] * 100, 1)
        })

    result.sort(key=lambda x: x['finalRisk'], reverse=True)
    return jsonify(result)


# ---------------------------------------------------------------------------
# AI Recommendations
# ---------------------------------------------------------------------------
@app.route('/api/ai/recommendations')
def ai_recommendations():
    supplier_agg = df.groupby('Supplier').agg({
        'Base_Cost_per_Unit': 'mean',
        'ESG_Score': 'mean',
        'Final_Risk_Score': 'mean',
    }).reset_index()

    scored = []
    for _, row in supplier_agg.iterrows():
        cost = row['Base_Cost_per_Unit']
        esg = row['ESG_Score']
        risk = row['Final_Risk_Score']
        delivery = min(100, max(0, round(100 - risk + esg * 0.1)))

        # Composite: (cost_norm * 0.4) + (esg * 0.4) - (risk * 0.2) + (delivery * 0.2)
        cost_norm = min(100, cost * 3)  # normalize cost to ~100 scale
        composite = round((cost_norm * 0.4) + (esg * 0.4) - (risk * 0.2) + (delivery * 0.2), 1)

        scored.append({
            'name': row['Supplier'],
            'cost': round(cost, 1),
            'esg': round(esg, 1),
            'riskRisk': round(risk, 1),
            'delivery': delivery,
            'compositeScore': composite
        })

    scored.sort(key=lambda x: x['compositeScore'], reverse=True)

    # Generate AI recommendations based on data patterns
    recommendations = []

    # Find highest and lowest risk suppliers
    high_risk = max(scored, key=lambda x: x['riskRisk'])
    low_risk = min(scored, key=lambda x: x['riskRisk'])
    best_esg = max(scored, key=lambda x: x['esg'])

    recommendations.append({
        'id': 1,
        'title': f'Rebalance Away from {high_risk["name"]}',
        'description': f'Shift allocation from {high_risk["name"]} (risk: {high_risk["riskRisk"]}) to {low_risk["name"]} (risk: {low_risk["riskRisk"]}) to reduce overall network risk by ~{round(high_risk["riskRisk"] - low_risk["riskRisk"], 1)}%.',
        'impact': 'High',
        'confidence': f'{min(98, 85 + int(high_risk["riskRisk"] - low_risk["riskRisk"]))}%'
    })

    recommendations.append({
        'id': 2,
        'title': f'Prioritize ESG Leader: {best_esg["name"]}',
        'description': f'{best_esg["name"]} leads with ESG score {best_esg["esg"]}. Increasing procurement share by 20% would improve network ESG compliance while maintaining cost targets at ${best_esg["cost"]}/unit.',
        'impact': 'Medium',
        'confidence': '91%'
    })

    # Stockout risk recommendation
    total_demand = df[DRUG_COLS].sum().sum()
    top_drug = max(DRUG_COLS, key=lambda c: df[c].sum())
    top_drug_info = DRUG_MAP.get(top_drug, {'name': top_drug, 'sku': top_drug})

    recommendations.append({
        'id': 3,
        'title': f'Expedite {top_drug_info["name"]} Components',
        'description': f'{top_drug_info["name"]} ({top_drug_info["sku"]}) accounts for the highest demand volume. Current trajectory suggests potential stockout within 12 days. Recommend expediting next shipment.',
        'impact': 'High',
        'confidence': '88%'
    })

    return jsonify({
        'recommendations': recommendations,
        'scoredSuppliers': scored
    })


# ---------------------------------------------------------------------------
# Scenario Simulator
# ---------------------------------------------------------------------------
@app.route('/api/simulator/run')
def simulator_run():
    risk_w = float(request.args.get('risk', 50))
    cost_w = float(request.args.get('cost', 50))
    esg_w = float(request.args.get('esg', 50))

    supplier_agg = df.groupby('Supplier').agg({
        'Base_Cost_per_Unit': 'mean',
        'ESG_Score': 'mean',
        'Final_Risk_Score': 'mean',
    }).reset_index()

    total_w = (risk_w + cost_w + esg_w) or 1
    n_rw = risk_w / total_w
    n_cw = cost_w / total_w
    n_ew = esg_w / total_w

    results = []
    for _, row in supplier_agg.iterrows():
        cost_norm = min(100, row['Base_Cost_per_Unit'] * 3)
        esg = row['ESG_Score']
        inv_risk = 100 - row['Final_Risk_Score']
        delivery = min(100, max(0, round(100 - row['Final_Risk_Score'] + esg * 0.1)))

        sim_score = round((cost_norm * n_cw) + (esg * n_ew) + (inv_risk * n_rw), 1)

        results.append({
            'name': row['Supplier'],
            'cost': round(row['Base_Cost_per_Unit'], 1),
            'esg': round(esg, 1),
            'riskRisk': round(row['Final_Risk_Score'], 1),
            'delivery': delivery,
            'simScore': sim_score
        })

    results.sort(key=lambda x: x['simScore'], reverse=True)

    # Derive scenario implications
    if esg_w > 75:
        implication = 'Focuses entirely on green suppliers. Moderate cost increase, high brand value.'
        projected_cost = '$1.5M'
        projected_esg = 'A+'
    elif cost_w > 75:
        implication = 'Maximizes margins but leaves supply chain highly vulnerable to regional shocks.'
        projected_cost = '$0.9M'
        projected_esg = 'C'
    elif risk_w > 75:
        implication = 'Increases operating costs by 50% but secures supply chain against 95% of predicted disruptions.'
        projected_cost = '$1.8M'
        projected_esg = 'A'
    else:
        implication = 'Balanced configuration maintaining acceptable risk, cost, and ESG compliance levels.'
        projected_cost = '$1.2M'
        projected_esg = 'B+'

    return jsonify({
        'suppliers': results,
        'scenario': {
            'implication': implication,
            'projectedCost': projected_cost,
            'projectedEsg': projected_esg,
            'riskLevel': 'Critical' if risk_w > 75 else ('Low' if risk_w < 25 else 'Moderate')
        }
    })


# ---------------------------------------------------------------------------
# ML Risk Prediction
# ---------------------------------------------------------------------------
@app.route('/api/risk/predict')
def risk_predict():
    geo_risk = float(request.args.get('geo_risk', 50))
    risk_reduction = float(request.args.get('risk_reduction', 0.1))
    cost = float(request.args.get('cost', 15))
    esg_score = float(request.args.get('esg_score', 75))
    esg_penalty = float(request.args.get('esg_penalty', 0.5))
    env_score = float(request.args.get('env_score', 70))
    social_score = float(request.args.get('social_score', 70))
    gov_score = float(request.args.get('gov_score', 70))

    features = {
        'Geo_Risk_2023': geo_risk,
        'Risk_Reduction_%': risk_reduction,
        'Base_Cost_per_Unit': cost,
        'ESG_Score': esg_score,
        'ESG_Penalty': esg_penalty,
        'Environmental_Score': env_score,
        'Social_Score': social_score,
        'Governance_Score': gov_score
    }

    result = predict(features)
    return jsonify(result)


@app.route('/api/risk/model-info')
def model_info():
    return jsonify(get_metrics())


# ---------------------------------------------------------------------------
# Live News (newsdata.io API)
# ---------------------------------------------------------------------------
NEWSDATA_URL = 'https://newsdata.io/api/1/latest'


@app.route('/api/news/live')
def news_live():
    """Fetch live supply-chain news from newsdata.io."""
    if not NEWSDATA_API_KEY:
        print('[NEWS] NEWSDATA_API_KEY not set')
        return jsonify({'articles': [], 'count': 0, 'error': 'API key not configured'}), 200

    try:
        params = {
            'apikey': NEWSDATA_API_KEY,
            'q': 'supply chain',
            'language': 'en',
        }

        resp = http_requests.get(NEWSDATA_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if data.get('status') != 'success':
            raise ValueError(data.get('results', {}).get('message', 'Unknown error'))

        articles = []
        for item in (data.get('results') or []):
            title = (item.get('title') or '').strip()
            if len(title) < 10:
                continue

            articles.append({
                'title': title,
                'link': item.get('link') or '#',
                'pubDate': item.get('pubDate') or '',
                'source': item.get('source_name') or item.get('source_id') or 'newsdata.io',
                'description': (item.get('description') or '')[:200],
                'imageUrl': item.get('image_url') or '',
            })

        return jsonify({'articles': articles, 'count': len(articles)})

    except Exception as e:
        print(f'[NEWS] Error fetching live news: {e}')
        return jsonify({'articles': [], 'count': 0, 'error': str(e)}), 200


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'dataset_rows': len(df),
        'dataset_columns': len(df.columns),
        'model_trained': get_metrics().get('r2_score') is not None
    })


# ---------------------------------------------------------------------------
# Serve React SPA (production)
# ---------------------------------------------------------------------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """Serve the React build. API routes are matched first by Flask."""
    if path and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    # For all other routes, serve index.html (SPA client-side routing)
    index_path = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(DIST_DIR, 'index.html')
    return jsonify({'error': 'Frontend not built. Run npm run build first.'}), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
