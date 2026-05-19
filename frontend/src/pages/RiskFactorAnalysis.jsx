import React, { useState } from 'react';
import { Shield, Plus, X, TrendingUp } from 'lucide-react';
import api from '../services/api';

const riskLevelColors = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  very_high: 'bg-red-100 text-red-800',
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export default function RiskFactorAnalysis() {
  const [form, setForm] = useState({
    age: '', gender: '', smoking: '', bmi: '', patient_id: '',
    family_history: [''], exercise: '', diet: '', alcohol: '', stress: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => setForm({ ...form, [key]: val });
  const addHistory = () => setForm({ ...form, family_history: [...form.family_history, ''] });
  const updateHistory = (i, val) => setForm({ ...form, family_history: form.family_history.map((h, idx) => idx === i ? val : h) });
  const removeHistory = (i) => setForm({ ...form, family_history: form.family_history.filter((_, idx) => idx !== i) });

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!form.age || !form.gender) return setError('Age and gender are required');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/risk-factors', {
        age: parseInt(form.age),
        gender: form.gender,
        smoking: form.smoking || undefined,
        bmi: form.bmi ? parseFloat(form.bmi) : undefined,
        family_history: form.family_history.filter(h => h.trim()),
        patient_id: form.patient_id || undefined,
        lifestyle_factors: {
          exercise: form.exercise,
          diet: form.diet,
          alcohol: form.alcohol,
          stress: form.stress,
        },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Factor Analysis</h1>
        </div>
        <p className="text-gray-500">Personalized disease risk profile based on demographics and lifestyle</p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleAnalyze}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
              <input type="number" value={form.age} onChange={e => update('age', e.target.value)} className="input-field" placeholder="45" min="0" max="120" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
              <select value={form.gender} onChange={e => update('gender', e.target.value)} className="input-field" required>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input type="text" value={form.patient_id} onChange={e => update('patient_id', e.target.value)} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smoking Status</label>
              <select value={form.smoking} onChange={e => update('smoking', e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="never">Never smoker</option>
                <option value="former">Former smoker</option>
                <option value="current_light">Current - light (&lt;10/day)</option>
                <option value="current_heavy">Current - heavy (&gt;10/day)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
              <input type="number" value={form.bmi} onChange={e => update('bmi', e.target.value)} className="input-field" placeholder="25.0" step="0.1" min="10" max="70" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol Consumption</label>
              <select value={form.alcohol} onChange={e => update('alcohol', e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Level</label>
              <select value={form.exercise} onChange={e => update('exercise', e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light (1-2x/week)</option>
                <option value="moderate">Moderate (3-4x/week)</option>
                <option value="active">Active (5+ x/week)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet Quality</label>
              <select value={form.diet} onChange={e => update('diet', e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stress Level</label>
              <select value={form.stress} onChange={e => update('stress', e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="chronic">Chronic</option>
              </select>
            </div>
          </div>

          {/* Family history */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Family History</label>
              <button type="button" onClick={addHistory} className="btn-secondary flex items-center gap-1 text-xs py-1">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.family_history.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={h} onChange={e => updateHistory(i, e.target.value)} className="input-field flex-1" placeholder="e.g., Heart disease, Diabetes..." />
                  {form.family_history.length > 1 && (
                    <button type="button" onClick={() => removeHistory(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Analyze Risk Factors'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is building your risk profile...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Overall score */}
          <div className="card p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Risk Score</p>
                <p className="text-4xl font-bold text-teal-700">{parsed.overall_risk_score}/100</p>
              </div>
              <div className="w-24 h-24 relative">
                <svg viewBox="0 0 36 36" className="rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#14b8a6" strokeWidth="3"
                    strokeDasharray={`${parsed.overall_risk_score}, 100`} />
                </svg>
              </div>
            </div>
          </div>

          {/* Risk profile */}
          {parsed.risk_profile?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Disease Risk Profile</h2>
              <div className="space-y-3">
                {parsed.risk_profile.map((r, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{r.disease}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskLevelColors[r.risk_level] || 'bg-gray-100 text-gray-700'}`}>{r.risk_level?.replace('_', ' ')}</span>
                        <span className="text-sm font-bold text-gray-700">{r.lifetime_risk_pct}%</span>
                      </div>
                    </div>
                    {r.top_risk_factors?.length > 0 && (
                      <p className="text-xs text-gray-500">Factors: {r.top_risk_factors.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modifiable factors */}
          {parsed.modifiable_risk_factors?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" /> Modifiable Risk Factors
              </h2>
              <div className="space-y-2">
                {parsed.modifiable_risk_factors.map((f, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{f.factor}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[f.impact] || 'bg-gray-100 text-gray-700'}`}>Impact: {f.impact}</span>
                    </div>
                    <p className="text-xs text-gray-500">Current: {f.current_status}</p>
                    <p className="text-xs text-blue-600 mt-1">Action: {f.improvement_action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {parsed.prevention_recommendations?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Prevention Recommendations</h2>
              <div className="space-y-2">
                {parsed.prevention_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${priorityColors[rec.priority] || 'bg-gray-100 text-gray-700'}`}>{rec.priority}</span>
                    <div>
                      <p className="text-sm text-gray-900">{rec.recommendation}</p>
                      <p className="text-xs text-gray-500">Timeline: {rec.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenings */}
          {parsed.recommended_screenings?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Screenings</h2>
              <div className="space-y-2">
                {parsed.recommended_screenings.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="font-medium text-blue-900 min-w-32">{s.screening}</div>
                    <div className="text-blue-700">Every {s.frequency}</div>
                    <div className="text-blue-600 text-xs">{s.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
