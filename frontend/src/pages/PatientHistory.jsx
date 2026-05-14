import React, { useState } from 'react';
import { Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function PatientHistory() {
  const [patientId, setPatientId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const fetchHistory = async (pid, p = 1) => {
    if (!pid.trim()) return setError('Enter a patient ID');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/ai/patient-history/${encodeURIComponent(pid)}?page=${p}&limit=20`);
      setHistory(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory(patientId, 1);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient History Timeline</h1>
        </div>
        <p className="text-gray-500">View complete AI prediction history for a patient</p>
      </div>

      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="input-field"
              placeholder="e.g., PAT-001"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {history.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{total} prediction record(s) for patient <strong>{patientId}</strong></p>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {history.map((item) => {
                const isExpanded = expandedId === item.id;
                const prediction = item.prediction_json;
                const symptoms = item.symptom_report?.symptoms || [];
                return (
                  <div key={item.id} className="relative pl-14">
                    <div className="absolute left-4 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" style={{ top: '1rem' }} />
                    <div className="card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                          {symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {symptoms.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                              ))}
                            </div>
                          )}
                          {prediction?.urgency_level && (
                            <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${urgencyColors[prediction.urgency_level] || 'bg-gray-100 text-gray-700'}`}>
                              Urgency: {prediction.urgency_level}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {isExpanded && prediction?.predicted_diseases?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Predicted Conditions</p>
                          <div className="space-y-1.5">
                            {prediction.predicted_diseases.slice(0, 5).map((d, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{d.disease}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.probability}%` }} />
                                  </div>
                                  <span className="text-gray-600 w-8 text-right">{d.probability}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => fetchHistory(patientId, page - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => fetchHistory(patientId, page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}

      {!loading && history.length === 0 && patientId && !error && (
        <div className="card p-10 text-center text-gray-400">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No history found for patient ID: <strong>{patientId}</strong></p>
        </div>
      )}
    </div>
  );
}
