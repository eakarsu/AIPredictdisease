import React, { useState, useEffect } from 'react';
import { History, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';
import api from '../services/api';

const riskColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const endpointLabels = {
  'predict-outbreak': 'Outbreak Prediction',
  'analyze-risk': 'Risk Analysis',
  'optimize-resources': 'Resource Optimization',
  'analyze-trends': 'Trend Analysis',
};

export default function ForecastHistory() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/ai/history?page=${p}&limit=20`);
      setForecasts(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load forecast history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, []);

  const parsed = selected?.result_json;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <History className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forecast History</h1>
        </div>
        <p className="text-gray-500">Past AI predictions and analyses — {total} total records</p>
      </div>

      {error && (
        <div className="card p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Past Analyses</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : forecasts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No forecast history yet. Run some AI analyses first.
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {forecasts.map(item => (
                  <li
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === item.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                          {endpointLabels[item.endpoint] || item.endpoint}
                        </span>
                        {item.disease && <div className="text-xs font-medium text-gray-700">{item.disease}</div>}
                        {item.region && <div className="text-xs text-gray-500">{item.region}</div>}
                        <div className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {item.predicted_cases != null && (
                          <span className="text-xs font-semibold text-orange-700">{item.predicted_cases?.toLocaleString()} cases</span>
                        )}
                        {item.result_json?.risk_level && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${riskColors[item.result_json.risk_level] || 'bg-gray-100 text-gray-700'}`}>
                            {item.result_json.risk_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              {/* Prediction Summary Cards */}
              {parsed && selected.endpoint === 'predict-outbreak' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {parsed.predicted_new_cases_30d?.toLocaleString() || '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Predicted Cases (30d)</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className={`text-sm font-bold px-2 py-1 rounded-full inline-block ${riskColors[parsed.risk_level] || 'bg-gray-100 text-gray-700'}`}>
                      {parsed.risk_level || '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Risk Level</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-sm font-semibold text-gray-700">
                      {parsed.confidence_interval ? `${parsed.confidence_interval.low?.toLocaleString()} – ${parsed.confidence_interval.high?.toLocaleString()}` : '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Confidence Interval</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-sm font-semibold text-gray-700">{parsed.peak_date_estimate || '—'}</div>
                    <div className="text-xs text-gray-500 mt-1">Peak Date</div>
                  </div>
                </div>
              )}

              {parsed && selected.endpoint === 'analyze-risk' && (
                <div className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart2 className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">Risk Score: {parsed.overall_risk_score}/100</span>
                  </div>
                  {parsed.risk_factors?.length > 0 && (
                    <div className="space-y-2">
                      {parsed.risk_factors.slice(0, 4).map((rf, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{rf.factor}</span>
                          <span className="font-medium text-gray-900">{rf.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Key Risk Factors */}
              {parsed?.key_risk_factors?.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" /> Key Risk Factors
                  </h3>
                  <ul className="space-y-1">
                    {parsed.key_risk_factors.map((f, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured JSON */}
              {parsed && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Structured Output</h3>
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-auto max-h-48 font-mono">
                    {JSON.stringify(parsed, null, 2)}
                  </pre>
                </div>
              )}

              {/* Raw text */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Full AI Response</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-72 overflow-auto leading-relaxed">
                  {selected.result}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center text-gray-400">
              <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select a forecast to view details and structured predictions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
