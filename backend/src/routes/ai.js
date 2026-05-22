import { Router } from 'express';
import fetch from 'node-fetch';
import pool from '../db.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { body, query, validationResult } from 'express-validator';

const router = Router();

// HIPAA audit logger
async function auditLog(req, action, resource, patientId, details) {
  try {
    await pool.query(
      `INSERT INTO hipaa_audit_log (user_id, action, resource, patient_id, ip_address, user_agent, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        req.user?.id || null,
        action,
        resource,
        patientId || null,
        req.ip,
        req.headers['user-agent'] || null,
        details ? JSON.stringify(details) : null,
      ]
    );
  } catch (err) {
    console.error('HIPAA audit log error:', err.message);
  }
}

// Apply rate limiter to all AI routes
router.use(aiRateLimiter);

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
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
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

function parseAIJson(text) {
  // Strategy 1: direct JSON parse
  try { return JSON.parse(text); } catch {}
  // Strategy 2: extract from ```json block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  // Strategy 3: find first { ... } block
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) { try { return JSON.parse(brace[0]); } catch {} }
  return null;
}

async function persistForecast({ userId, endpoint, disease, region, result, resultJson }) {
  try {
    let predictedCases = null;
    let confidenceLow = null;
    let confidenceHigh = null;
    if (resultJson) {
      predictedCases = resultJson.predicted_new_cases_30d || null;
      confidenceLow = resultJson.confidence_interval?.low || null;
      confidenceHigh = resultJson.confidence_interval?.high || null;
    }
    await pool.query(
      `INSERT INTO forecasts (user_id, endpoint, disease, region, result, result_json, predicted_cases, confidence_low, confidence_high)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, endpoint, disease || null, region || null, result,
       resultJson ? JSON.stringify(resultJson) : null,
       predictedCases, confidenceLow, confidenceHigh]
    );
  } catch (err) {
    console.error('Failed to persist forecast:', err);
  }
}

// GET /api/ai/history — paginated forecasts for logged-in user
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const [rows, count] = await Promise.all([
      pool.query(
        'SELECT * FROM forecasts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM forecasts WHERE user_id = $1', [userId]),
    ]);

    res.json({
      data: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Outbreak Prediction
router.post('/predict-outbreak', async (req, res) => {
  try {
    const { disease, region, additionalContext } = req.body;

    const epiData = await pool.query(
      'SELECT * FROM epidemiological_data WHERE disease ILIKE $1 OR region ILIKE $2 ORDER BY year DESC, week_number DESC LIMIT 10',
      [`%${disease || ''}%`, `%${region || ''}%`]
    );

    const recentOutbreaks = await pool.query(
      'SELECT * FROM disease_outbreaks WHERE disease_name ILIKE $1 OR region ILIKE $2 ORDER BY start_date DESC LIMIT 5',
      [`%${disease || ''}%`, `%${region || ''}%`]
    );

    const prompt = `You are an expert epidemiologist. Based on the following data, return ONLY valid JSON matching this schema:
{ "predicted_new_cases_30d": number, "confidence_interval": {"low": number, "high": number}, "risk_level": "low"|"medium"|"high"|"critical", "peak_date_estimate": string, "key_risk_factors": [], "containment_recommendations": [] }

Historical Epidemiological Data: ${JSON.stringify(epiData.rows, null, 2)}
Recent Outbreaks: ${JSON.stringify(recentOutbreaks.rows, null, 2)}
Disease: ${disease || 'General'}, Region: ${region || 'Global'}
Additional Context: ${additionalContext || 'None'}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert epidemiologist specializing in outbreak prediction. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsed = parseAIJson(aiResponse);
    await persistForecast({
      userId: req.user?.id,
      endpoint: 'predict-outbreak',
      disease,
      region,
      result: aiResponse,
      resultJson: parsed,
    });

    res.json({
      prediction: aiResponse,
      parsed,
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

    const prompt = `You are a public health risk analyst. Analyze the following data and return ONLY valid JSON matching this schema:
{ "overall_risk_score": number (0-100), "risk_factors": [{"factor": string, "weight": number, "score": number}], "vulnerable_populations": [], "mitigation_priorities": [] }

Regional Risk Data: ${JSON.stringify(risks.rows, null, 2)}
Healthcare Facilities: ${JSON.stringify(facilities.rows, null, 2)}
Active Alerts: ${JSON.stringify(alerts.rows, null, 2)}
Region: ${region || 'General'}, Additional Factors: ${factors || 'None'}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a public health risk analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsed = parseAIJson(aiResponse);
    await persistForecast({
      userId: req.user?.id,
      endpoint: 'analyze-risk',
      disease: null,
      region,
      result: aiResponse,
      resultJson: parsed,
    });

    res.json({
      analysis: aiResponse,
      parsed,
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

    const prompt = `You are a public health resource optimization specialist. Analyze the following data and return ONLY valid JSON matching this schema:
{ "resource_allocation": [{"resource_type": string, "current_qty": number, "recommended_qty": number, "priority_region": string}], "cost_estimate": number, "expected_impact": string }

Current Resources: ${JSON.stringify(resources.rows, null, 2)}
Available Inventory: ${JSON.stringify(inventory.rows, null, 2)}
Active Outbreaks: ${JSON.stringify(outbreaks.rows, null, 2)}
Region: ${region || 'Global'}, Scenario: ${scenario || 'Standard'}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a public health resource optimization specialist. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsed = parseAIJson(aiResponse);
    await persistForecast({
      userId: req.user?.id,
      endpoint: 'optimize-resources',
      disease: null,
      region,
      result: aiResponse,
      resultJson: parsed,
    });

    res.json({
      optimization: aiResponse,
      parsed,
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

    const prompt = `You are an epidemiological trend analyst. Analyze the following data and return ONLY valid JSON matching this schema:
{ "trend": "rising"|"falling"|"stable", "rate_of_change_pct": number, "key_drivers": [], "forecast_90d": string }

Epidemiological Data: ${JSON.stringify(epiData.rows, null, 2)}
Surveillance Reports: ${JSON.stringify(reports.rows, null, 2)}
Disease: ${disease || 'All'}, Timeframe: ${timeframe || 'Last 12 months'}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an epidemiological trend analyst. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsed = parseAIJson(aiResponse);
    await persistForecast({
      userId: req.user?.id,
      endpoint: 'analyze-trends',
      disease,
      region: null,
      result: aiResponse,
      resultJson: parsed,
    });

    res.json({
      trends: aiResponse,
      parsed,
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

// POST /api/ai/predict-disease — structured disease prediction
router.post(
  '/predict-disease',
  [
    body('symptoms').isArray({ min: 1 }).withMessage('symptoms must be a non-empty array'),
    body('patient_id').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { symptoms, patient_id, age, gender, medical_history } = req.body;

      await auditLog(req, 'predict-disease', 'ai/predict-disease', patient_id, { symptoms, age, gender });

      const prompt = `You are an expert clinical diagnostician. Based on the provided patient symptoms and data, return ONLY valid JSON matching this exact schema:
{
  "predicted_diseases": [{"disease": string, "probability": number (0-100), "confidence": "high"|"medium"|"low"}],
  "risk_factors": [string],
  "recommended_tests": [{"test": string, "priority": "urgent"|"routine", "rationale": string}],
  "urgency_level": "low"|"medium"|"high"|"critical",
  "preventive_measures": [string],
  "disclaimer": string
}

Patient symptoms: ${JSON.stringify(symptoms)}
Age: ${age || 'Not provided'}
Gender: ${gender || 'Not provided'}
Medical history: ${JSON.stringify(medical_history || [])}`;

      const aiResponse = await callOpenRouter([
        { role: 'system', content: 'You are an expert clinical diagnostician. Return only valid JSON. Always include a disclaimer that this is AI-generated and not a substitute for professional medical advice.' },
        { role: 'user', content: prompt }
      ]);

      const parsed = parseAIJson(aiResponse);

      // Persist to ai_results
      const resultRow = await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, patient_id, result, result_json) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [req.user?.id, 'predict-disease', patient_id || null, aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      // Persist patient history
      if (patient_id) {
        await pool.query(
          `INSERT INTO patient_history (patient_id, symptom_report, prediction_id) VALUES ($1,$2,$3)`,
          [patient_id, JSON.stringify({ symptoms, age, gender, medical_history }), resultRow.rows[0]?.id]
        );
      }

      res.json({
        prediction: aiResponse,
        parsed,
        metadata: {
          patient_id,
          symptoms_count: symptoms.length,
          generatedAt: new Date().toISOString(),
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/ai/patient-history/:patient_id — paginated
router.get('/patient-history/:patient_id', async (req, res) => {
  try {
    await auditLog(req, 'view-patient-history', 'ai/patient-history', req.params.patient_id, {});

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT ph.*, ar.result_json as prediction_json
         FROM patient_history ph
         LEFT JOIN ai_results ar ON ar.id = ph.prediction_id
         WHERE ph.patient_id = $1 ORDER BY ph.created_at DESC LIMIT $2 OFFSET $3`,
        [req.params.patient_id, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM patient_history WHERE patient_id = $1', [req.params.patient_id]),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/risk-factors
router.post(
  '/risk-factors',
  [
    body('age').isInt({ min: 0, max: 120 }).withMessage('age must be 0-120'),
    body('gender').notEmpty().withMessage('gender is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { age, gender, smoking, bmi, family_history, current_medications, lifestyle_factors, patient_id } = req.body;

      await auditLog(req, 'risk-factors', 'ai/risk-factors', patient_id, { age, gender });

      const prompt = `You are a preventive medicine specialist. Analyze the patient's demographic and lifestyle data and return ONLY valid JSON:
{
  "overall_risk_score": number (0-100),
  "risk_profile": [{"disease": string, "risk_level": "low"|"moderate"|"high"|"very_high", "lifetime_risk_pct": number, "top_risk_factors": [string]}],
  "modifiable_risk_factors": [{"factor": string, "current_status": string, "impact": "high"|"medium"|"low", "improvement_action": string}],
  "non_modifiable_risk_factors": [string],
  "prevention_recommendations": [{"recommendation": string, "priority": "high"|"medium"|"low", "timeline": string}],
  "recommended_screenings": [{"screening": string, "frequency": string, "rationale": string}]
}

Patient Data:
Age: ${age}, Gender: ${gender}
Smoking: ${smoking || 'Not specified'}
BMI: ${bmi || 'Not specified'}
Family History: ${JSON.stringify(family_history || [])}
Current Medications: ${JSON.stringify(current_medications || [])}
Lifestyle Factors: ${JSON.stringify(lifestyle_factors || {})}`;

      const aiResponse = await callOpenRouter([
        { role: 'system', content: 'You are a preventive medicine specialist. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      const parsed = parseAIJson(aiResponse);

      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, patient_id, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
        [req.user?.id, 'risk-factors', patient_id || null, aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      res.json({ analysis: aiResponse, parsed, metadata: { generatedAt: new Date().toISOString() } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/drug-interactions
router.post(
  '/drug-interactions',
  [
    body('medications').isArray({ min: 1 }).withMessage('medications must be a non-empty array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { medications, patient_id } = req.body;

      await auditLog(req, 'drug-interactions', 'ai/drug-interactions', patient_id, { medications });

      const prompt = `You are a clinical pharmacist specializing in drug interactions. Analyze the following medications and return ONLY valid JSON:
{
  "interactions": [
    {
      "drug_pair": [string, string],
      "severity": "contraindicated"|"major"|"moderate"|"minor",
      "mechanism": string,
      "clinical_effect": string,
      "management": string
    }
  ],
  "high_risk_combinations": [string],
  "monitoring_parameters": [{"parameter": string, "frequency": string, "reason": string}],
  "overall_safety_assessment": "safe"|"caution"|"high_risk"|"contraindicated",
  "recommendations": [string]
}

Medications: ${JSON.stringify(medications)}`;

      const aiResponse = await callOpenRouter([
        { role: 'system', content: 'You are a clinical pharmacist. Return only valid JSON. Note that this is for educational purposes and clinical decisions should be verified with official drug databases.' },
        { role: 'user', content: prompt }
      ]);

      const parsed = parseAIJson(aiResponse);

      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, patient_id, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
        [req.user?.id, 'drug-interactions', patient_id || null, aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      res.json({
        interactions: aiResponse,
        parsed,
        metadata: { medication_count: medications.length, generatedAt: new Date().toISOString() }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/differential-diagnosis
router.post(
  '/differential-diagnosis',
  [
    body('symptoms').isArray({ min: 1 }).withMessage('symptoms must be non-empty array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { symptoms, lab_values, vital_signs, age, gender, patient_id } = req.body;

      await auditLog(req, 'differential-diagnosis', 'ai/differential-diagnosis', patient_id, { symptoms });

      const prompt = `You are an expert clinician creating a differential diagnosis. Return ONLY valid JSON:
{
  "differentials": [
    {
      "diagnosis": string,
      "likelihood_pct": number,
      "supporting_evidence": [string],
      "against_evidence": [string],
      "icd_code": string
    }
  ],
  "diagnostic_workup": [
    {
      "test": string,
      "type": "lab"|"imaging"|"procedure"|"consultation",
      "priority": "stat"|"urgent"|"routine",
      "rationale": string
    }
  ],
  "red_flags": [string],
  "disposition": "discharge"|"observation"|"admission"|"icu",
  "follow_up_timeframe": string,
  "disclaimer": string
}

Symptoms: ${JSON.stringify(symptoms)}
Lab values: ${JSON.stringify(lab_values || {})}
Vital signs: ${JSON.stringify(vital_signs || {})}
Age: ${age || 'Unknown'}, Gender: ${gender || 'Unknown'}`;

      const aiResponse = await callOpenRouter([
        { role: 'system', content: 'You are an expert clinician. Return only valid JSON. Always include a disclaimer.' },
        { role: 'user', content: prompt }
      ]);

      const parsed = parseAIJson(aiResponse);

      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, patient_id, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
        [req.user?.id, 'differential-diagnosis', patient_id || null, aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      res.json({ diagnosis: aiResponse, parsed, metadata: { generatedAt: new Date().toISOString() } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/analytics/disease-prevalence — population health dashboard
router.get('/disease-prevalence', async (req, res) => {
  try {
    await auditLog(req, 'view-analytics', 'analytics/disease-prevalence', null, {});

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [prevalenceRes, demographicsRes, regionRes, totalCount] = await Promise.all([
      pool.query(`
        SELECT
          jsonb_array_elements(result_json->'predicted_diseases')->>'disease' as disease,
          COUNT(*) as prediction_count,
          AVG((jsonb_array_elements(result_json->'predicted_diseases')->>'probability')::numeric) as avg_probability
        FROM ai_results
        WHERE endpoint = 'predict-disease' AND result_json IS NOT NULL
        GROUP BY disease ORDER BY prediction_count DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      pool.query(`
        SELECT d.disease, COUNT(*) as cases, d.region, d.year
        FROM epidemiological_data d
        GROUP BY d.disease, d.region, d.year
        ORDER BY cases DESC LIMIT 20
      `),
      pool.query(`
        SELECT region, disease_name, SUM(cases_reported) as total_cases, COUNT(*) as outbreak_count
        FROM disease_outbreaks
        GROUP BY region, disease_name ORDER BY total_cases DESC LIMIT 10
      `),
      pool.query(`SELECT COUNT(*) FROM ai_results WHERE endpoint = 'predict-disease'`),
    ]);

    const total = parseInt(totalCount.rows[0].count);

    res.json({
      data: prevalenceRes.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      demographic_breakdown: demographicsRes.rows,
      regional_breakdown: regionRes.rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/results — paginated AI results
router.get('/results', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const [rows, count] = await Promise.all([
      pool.query(
        'SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM ai_results WHERE user_id = $1', [userId]),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/comorbidity-analyze — flag patient health risk factors based on comorbidities
router.post('/comorbidity-analyze', async (req, res) => {
  try {
    const { patient_id, conditions, age, sex, lifestyle, current_medications } = req.body;

    let dxList = conditions;
    let demographics = { age, sex };
    if (!dxList && patient_id) {
      try {
        const r = await pool.query(
          'SELECT condition_name, diagnosis_date, status FROM patient_conditions WHERE patient_id = $1 ORDER BY diagnosis_date DESC LIMIT 50',
          [patient_id]
        );
        dxList = r.rows.map(x => `${x.condition_name} (${x.status || 'active'}, dx: ${x.diagnosis_date || '?'})`);
      } catch (_) {}
      try {
        const p = await pool.query('SELECT age, sex FROM patients WHERE id = $1', [patient_id]);
        if (p.rows[0]) demographics = { age: p.rows[0].age, sex: p.rows[0].sex };
      } catch (_) {}
    }

    const aiResponse = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an epidemiologist AI specializing in comorbidity-driven risk stratification. Return JSON only.'
      },
      {
        role: 'user',
        content: `Patient demographics: ${JSON.stringify(demographics)}
Conditions: ${JSON.stringify(dxList || [])}
Lifestyle: ${lifestyle || 'unknown'}
Current Medications: ${JSON.stringify(current_medications || [])}

Return JSON only:
{
  "comorbidity_clusters": [{"cluster": "string", "conditions": ["string"], "interaction_risk": "low|moderate|high"}],
  "elevated_risks": [{"disease": "string", "elevated_by": ["string"], "rr_or_or": "string|null", "evidence": "string"}],
  "screening_priorities": [{"test": "string", "priority": "low|medium|high", "interval": "string"}],
  "lifestyle_recommendations": ["string"],
  "drug_interaction_risks": [{"drugs": ["string"], "concern": "string"}],
  "summary": "string"
}`
      }
    ]);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, result) VALUES ($1, $2, $3)`,
      [req.user?.id || null, 'comorbidity-analyze', JSON.stringify({ patient_id, response: aiResponse })]
    ).catch(() => {});
    await auditLog(req, 'ai_comorbidity_analyze', 'patient', patient_id || null, { conditions_count: (dxList || []).length });

    res.json({ analysis: aiResponse, patient_id });
  } catch (err) {
    console.error('comorbidity-analyze error:', err);
    res.status(500).json({ error: 'Comorbidity analysis failed' });
  }
});

// POST /api/ai/seasonality-predict — seasonal disease pattern forecasting
router.post('/seasonality-predict', async (req, res) => {
  try {
    const { disease, region, historical_data, climate_factors } = req.body;

    let history = historical_data;
    if (!history && disease) {
      try {
        const r = await pool.query(
          `SELECT TO_CHAR(reported_at, 'YYYY-MM') AS month, COUNT(*) AS cases
           FROM disease_cases
           WHERE disease ILIKE $1 AND reported_at >= NOW() - INTERVAL '36 months'
           GROUP BY month ORDER BY month`,
          [`%${disease}%`]
        );
        history = r.rows;
      } catch (_) { history = []; }
    }

    const aiResponse = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an epidemiologic forecasting AI focused on seasonal disease patterns. Return JSON only.'
      },
      {
        role: 'user',
        content: `Disease: ${disease || 'unknown'}
Region: ${region || 'unknown'}
Climate Factors: ${JSON.stringify(climate_factors || {})}

Historical monthly cases:
${(history || []).map(h => `${h.month}: ${h.cases}`).join('\n') || 'No historical data provided'}

Return JSON only:
{
  "seasonal_pattern": "summer_peak|winter_peak|spring_peak|fall_peak|biannual|aseasonal|unknown",
  "expected_peak_months": ["string"],
  "expected_trough_months": ["string"],
  "predicted_next_12_months": [{"month": "YYYY-MM", "expected_cases": 0, "confidence": "low|medium|high"}],
  "drivers": [{"factor": "string", "effect": "string"}],
  "intervention_windows": [{"window": "string", "intervention": "string"}],
  "summary": "string"
}`
      }
    ]);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, result) VALUES ($1, $2, $3)`,
      [req.user?.id || null, 'seasonality-predict', JSON.stringify({ disease, region, response: aiResponse })]
    ).catch(() => {});

    res.json({ analysis: aiResponse, disease, region });
  } catch (err) {
    console.error('seasonality-predict error:', err);
    res.status(500).json({ error: 'Seasonality prediction failed' });
  }
});

export default router;
