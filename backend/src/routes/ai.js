import { Router } from 'express';
import fetch from 'node-fetch';
import pool from '../db.js';

const router = Router();

async function callOpenRouter(messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'OutbreakPredict AI Platform'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  return data.choices[0].message.content;
}

// AI Outbreak Prediction
router.post('/predict-outbreak', async (req, res) => {
  try {
    const { disease, region, additionalContext } = req.body;

    // Fetch relevant historical data
    const epiData = await pool.query(
      'SELECT * FROM epidemiological_data WHERE disease ILIKE $1 OR region ILIKE $2 ORDER BY year DESC, week_number DESC LIMIT 10',
      [`%${disease || ''}%`, `%${region || ''}%`]
    );

    const recentOutbreaks = await pool.query(
      'SELECT * FROM disease_outbreaks WHERE disease_name ILIKE $1 OR region ILIKE $2 ORDER BY start_date DESC LIMIT 5',
      [`%${disease || ''}%`, `%${region || ''}%`]
    );

    const prompt = `You are an expert epidemiologist and disease outbreak prediction specialist. Based on the following data, provide a detailed outbreak prediction analysis.

Historical Epidemiological Data:
${JSON.stringify(epiData.rows, null, 2)}

Recent Outbreaks:
${JSON.stringify(recentOutbreaks.rows, null, 2)}

Disease of Interest: ${disease || 'General'}
Region of Interest: ${region || 'Global'}
Additional Context: ${additionalContext || 'None'}

Please provide your analysis in the following structured format:
1. **Risk Assessment**: Current risk level (Critical/High/Moderate/Low) with justification
2. **Outbreak Probability**: Estimated probability of outbreak in next 30/60/90 days
3. **Expected Peak**: Predicted timing and magnitude of peak
4. **Key Risk Factors**: Top factors driving the prediction
5. **Geographic Spread Pattern**: Expected spread trajectory
6. **Vulnerable Populations**: Groups at highest risk
7. **Recommended Actions**: Prioritized list of interventions
8. **Confidence Level**: How confident you are in this prediction and why
9. **Data Gaps**: What additional data would improve the prediction`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert epidemiologist specializing in outbreak prediction and public health analytics. Provide detailed, actionable analyses.' },
      { role: 'user', content: prompt }
    ]);

    res.json({
      prediction: aiResponse,
      metadata: {
        disease,
        region,
        dataPointsUsed: epiData.rows.length + recentOutbreaks.rows.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Analysis
router.post('/analyze-risk', async (req, res) => {
  try {
    const { region, factors } = req.body;

    const risks = await pool.query(
      'SELECT * FROM regional_risks WHERE region ILIKE $1 OR country ILIKE $1',
      [`%${region || ''}%`]
    );

    const facilities = await pool.query(
      'SELECT * FROM healthcare_facilities WHERE region ILIKE $1',
      [`%${region || ''}%`]
    );

    const alerts = await pool.query(
      'SELECT * FROM public_health_alerts WHERE region ILIKE $1 AND status = $2 ORDER BY issued_date DESC LIMIT 5',
      [`%${region || ''}%`, 'active']
    );

    const prompt = `You are a public health risk analyst. Analyze the following regional health data and provide a comprehensive risk assessment.

Regional Risk Data:
${JSON.stringify(risks.rows, null, 2)}

Healthcare Facilities:
${JSON.stringify(facilities.rows, null, 2)}

Active Alerts:
${JSON.stringify(alerts.rows, null, 2)}

Region: ${region || 'General'}
Additional Factors: ${factors || 'None specified'}

Provide a comprehensive risk analysis:
1. **Overall Risk Score**: 1-10 with breakdown by category
2. **Healthcare System Capacity**: Assessment of ability to handle surge
3. **Epidemiological Risk Factors**: Disease-specific threats
4. **Environmental & Social Factors**: Climate, population density, sanitation
5. **Surveillance Capability**: Ability to detect and report outbreaks early
6. **Response Readiness**: Preparedness level and gaps
7. **Critical Vulnerabilities**: Top weaknesses that need immediate attention
8. **Comparative Analysis**: How this region compares to similar regions
9. **Recommendations**: Prioritized actions to reduce risk
10. **Monitoring Indicators**: Key metrics to track going forward`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a public health risk analyst specializing in regional health system assessment and disease preparedness.' },
      { role: 'user', content: prompt }
    ]);

    res.json({
      analysis: aiResponse,
      metadata: {
        region,
        dataPointsUsed: risks.rows.length + facilities.rows.length + alerts.rows.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Resource Optimization
router.post('/optimize-resources', async (req, res) => {
  try {
    const { region, scenario } = req.body;

    const resources = await pool.query(
      'SELECT * FROM resource_allocations WHERE region ILIKE $1 ORDER BY allocation_date DESC',
      [`%${region || ''}%`]
    );

    const inventory = await pool.query(
      'SELECT * FROM vaccine_inventory WHERE status = $1 ORDER BY expiry_date ASC',
      ['available']
    );

    const outbreaks = await pool.query(
      "SELECT * FROM disease_outbreaks WHERE status = 'active' ORDER BY cases_reported DESC LIMIT 10"
    );

    const prompt = `You are a public health resource optimization specialist. Analyze the following resource and outbreak data to provide optimal resource allocation recommendations.

Current Resource Allocations:
${JSON.stringify(resources.rows, null, 2)}

Available Vaccine Inventory:
${JSON.stringify(inventory.rows, null, 2)}

Active Outbreaks:
${JSON.stringify(outbreaks.rows, null, 2)}

Region Focus: ${region || 'Global'}
Scenario: ${scenario || 'Standard optimization'}

Provide optimization recommendations:
1. **Resource Gap Analysis**: What resources are critically needed vs. available
2. **Priority Reallocation**: Resources that should be moved between regions/facilities
3. **Vaccine Distribution Strategy**: Optimal vaccine deployment plan
4. **Supply Chain Recommendations**: Logistics improvements needed
5. **Cost-Effectiveness Analysis**: Most impactful resource investments
6. **Surge Capacity Planning**: How to prepare for outbreak escalation
7. **Expiry Risk Management**: Vaccines/supplies at risk of expiration
8. **Personnel Deployment**: Optimal staffing recommendations
9. **Emergency Reserve Strategy**: What to keep in strategic reserve
10. **Timeline**: Phased implementation plan`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a public health resource optimization specialist focused on efficient allocation of medical resources, vaccines, and personnel during disease outbreaks.' },
      { role: 'user', content: prompt }
    ]);

    res.json({
      optimization: aiResponse,
      metadata: {
        region,
        scenario,
        dataPointsUsed: resources.rows.length + inventory.rows.length + outbreaks.rows.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Trend Analysis
router.post('/analyze-trends', async (req, res) => {
  try {
    const { disease, timeframe } = req.body;

    const epiData = await pool.query(
      'SELECT * FROM epidemiological_data WHERE disease ILIKE $1 ORDER BY year DESC, week_number DESC',
      [`%${disease || ''}%`]
    );

    const reports = await pool.query(
      'SELECT * FROM surveillance_reports WHERE disease ILIKE $1 ORDER BY report_date DESC LIMIT 10',
      [`%${disease || ''}%`]
    );

    const prompt = `You are an epidemiological trend analyst. Analyze the following disease surveillance data and identify key trends and patterns.

Epidemiological Data:
${JSON.stringify(epiData.rows, null, 2)}

Surveillance Reports:
${JSON.stringify(reports.rows, null, 2)}

Disease Focus: ${disease || 'All diseases'}
Timeframe: ${timeframe || 'Last 12 months'}

Provide trend analysis:
1. **Trend Summary**: Overall direction and momentum
2. **Seasonal Patterns**: Identified seasonal or cyclical patterns
3. **Geographic Patterns**: Regional spread trends
4. **Transmission Dynamics**: Changes in R0/transmission rate
5. **Mortality Trends**: Case fatality rate changes
6. **Age Group Shifts**: Changes in affected demographics
7. **Strain/Variant Evolution**: Notable pathogen changes
8. **Anomaly Detection**: Unusual patterns that warrant investigation
9. **Forecast**: Short-term and medium-term projections
10. **Public Health Implications**: What these trends mean for policy`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an epidemiological trend analyst specializing in disease surveillance data interpretation and forecasting.' },
      { role: 'user', content: prompt }
    ]);

    res.json({
      trends: aiResponse,
      metadata: {
        disease,
        timeframe,
        dataPointsUsed: epiData.rows.length + reports.rows.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
