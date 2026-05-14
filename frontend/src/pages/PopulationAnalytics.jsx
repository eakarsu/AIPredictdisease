import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function PopulationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchData = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get(`/analytics/disease-prevalence?page=${p}&limit=20`);
      setData(res);
      setTotalPages(res.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(1); }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Population Health Analytics</h1>
        </div>
        <p className="text-gray-500">Aggregated disease prevalence and demographic breakdowns</p>
      </div>
      <div className="flex justify-end mb-4">
        <button onClick={() => fetchData(1)} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.regional_breakdown?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cases by Region</h2>
              <div className="space-y-2">
                {data.regional_breakdown.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{r.region}</span>
                      <span className="text-gray-500 text-xs ml-2">({r.disease_name})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{r.outbreak_count} outbreaks</span>
                      <span className="font-semibold text-indigo-600">{parseInt(r.total_cases).toLocaleString()} cases</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data?.data?.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Disease Prediction Prevalence</h2>
                <p className="text-sm text-gray-500">Based on {data?.pagination?.total || 0} AI predictions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Disease</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Predictions</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg Probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.data.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.disease}</td>
                        <td className="px-4 py-3 text-gray-600">{parseInt(d.prediction_count).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${parseFloat(d.avg_probability)}%` }} />
                            </div>
                            <span className="text-gray-700">{Math.round(parseFloat(d.avg_probability))}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button onClick={() => fetchData(page - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Prev</button>
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  <button onClick={() => fetchData(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-10 text-center text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No prediction data yet. Run disease predictions first.</p>
            </div>
          )}
          {data?.demographic_breakdown?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Epidemiological Data</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Disease</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Region</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.demographic_breakdown.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.disease}</td>
                        <td className="px-4 py-3 text-gray-600">{d.region}</td>
                        <td className="px-4 py-3 text-gray-600">{d.year}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{parseInt(d.cases).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
