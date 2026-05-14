import React, { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import api from '../services/api';

function safeParseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function SeasonalityPredict() {
  const [diseaseName, setDiseaseName] = useState('');
  const [region, setRegion] = useState('');
  const [historyText, setHistoryText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diseaseName.trim() && !historyText.trim()) {
      return setError('Provide a disease name or paste case history');
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {};
      if (diseaseName) payload.disease_name = diseaseName;
      if (region) payload.region = region;
      if (historyText.trim()) {
        const parsed = safeParseJSON(historyText.trim(), null);
        if (Array.isArray(parsed)) payload.history = parsed;
        else payload.history_text = historyText.trim();
      }
      const { data } = await api.post('/ai/seasonality-predict', payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;
  const forecast = parsed?.forecast || parsed?.monthly_forecast || [];
  const interventions = parsed?.intervention_windows || parsed?.interventions || [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seasonality Predictor</h1>
        </div>
        <p className="text-gray-500">12-month seasonal pattern + forecast + intervention windows</p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disease Name</label>
              <input
                type="text"
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                className="input-field"
                placeholder="e.g., influenza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region (optional)</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-field"
                placeholder="e.g., Northeast US"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case History (JSON array or free text — optional)
            </label>
            <textarea
              rows={5}
              value={historyText}
              onChange={(e) => setHistoryText(e.target.value)}
              className="input-field"
              placeholder='[{"month":"2023-01","cases":120}, ...] — server pulls 36 months by name when omitted'
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            {loading ? 'Forecasting...' : 'Run Seasonality Forecast'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is forecasting seasonality...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {parsed.pattern && (
            <div className="card p-5 bg-emerald-50 border-emerald-200">
              <h2 className="text-sm font-semibold text-emerald-800 mb-1">Seasonal Pattern</h2>
              <p className="text-sm text-emerald-700">
                {typeof parsed.pattern === 'string' ? parsed.pattern : JSON.stringify(parsed.pattern)}
              </p>
            </div>
          )}

          {Array.isArray(forecast) && forecast.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">12-Month Forecast</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-2">Month</th>
                      <th className="py-2">Predicted Cases</th>
                      <th className="py-2">Confidence</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((f, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{f.month || f.period || `M${i + 1}`}</td>
                        <td className="py-2">{f.cases ?? f.predicted ?? '-'}</td>
                        <td className="py-2 text-gray-500">{f.confidence || '-'}</td>
                        <td className="py-2 text-gray-500">{f.notes || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {Array.isArray(interventions) && interventions.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Intervention Windows</h2>
              <div className="space-y-2">
                {interventions.map((iv, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg text-sm">
                    {typeof iv === 'string' ? iv : (
                      <>
                        <p className="font-medium text-gray-900">
                          {iv.window || iv.month || iv.action || `Window ${i + 1}`}
                        </p>
                        {iv.action && <p className="text-gray-700">{iv.action}</p>}
                        {iv.rationale && (
                          <p className="text-xs text-gray-500 mt-1">{iv.rationale}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="card p-3">
            <summary className="cursor-pointer text-sm text-gray-500">Raw response</summary>
            <pre className="text-xs overflow-auto mt-2">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
