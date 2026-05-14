import React, { useState } from 'react';
import { Pill, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const severityColors = {
  contraindicated: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', badge: 'bg-red-200 text-red-900' },
  major: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-200 text-orange-900' },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', badge: 'bg-yellow-200 text-yellow-900' },
  minor: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', badge: 'bg-green-200 text-green-900' },
};

const safetyColors = {
  safe: 'bg-green-100 text-green-800 border-green-300',
  caution: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high_risk: 'bg-orange-100 text-orange-800 border-orange-300',
  contraindicated: 'bg-red-100 text-red-800 border-red-300',
};

export default function DrugInteractionChecker() {
  const [medications, setMedications] = useState(['', '']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMed = () => setMedications([...medications, '']);
  const removeMed = (i) => setMedications(medications.filter((_, idx) => idx !== i));
  const updateMed = (i, val) => setMedications(medications.map((m, idx) => idx === i ? val : m));

  const handleCheck = async (e) => {
    e.preventDefault();
    const validMeds = medications.filter(m => m.trim());
    if (validMeds.length < 2) return setError('Please enter at least 2 medications');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/drug-interactions', { medications: validMeds });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Drug interaction check failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Drug Interaction Checker</h1>
        </div>
        <p className="text-gray-500">AI-powered drug interaction analysis with severity levels and management</p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleCheck}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Medications <span className="text-red-500">*</span></label>
              <button type="button" onClick={addMed} className="btn-secondary flex items-center gap-1 text-xs py-1">
                <Plus className="h-3 w-3" /> Add Medication
              </button>
            </div>
            <div className="space-y-2">
              {medications.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={m}
                    onChange={e => updateMed(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Medication ${i + 1} (e.g., Warfarin, Aspirin...)`}
                  />
                  {medications.length > 2 && (
                    <button type="button" onClick={() => removeMed(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Pill className="h-4 w-4" />}
            {loading ? 'Checking...' : 'Check Interactions'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing drug interactions...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Overall safety */}
          <div className={`p-4 rounded-xl border-2 ${safetyColors[parsed.overall_safety_assessment] || 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Overall Safety: {parsed.overall_safety_assessment?.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm opacity-80">{parsed.interactions?.length || 0} interaction(s) detected</p>
              </div>
            </div>
          </div>

          {/* High risk combinations */}
          {parsed.high_risk_combinations?.length > 0 && (
            <div className="card p-4 bg-red-50 border-red-200">
              <h2 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> High Risk Combinations
              </h2>
              <ul className="space-y-1">
                {parsed.high_risk_combinations.map((c, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactions */}
          {parsed.interactions?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detected Interactions</h2>
              <div className="space-y-3">
                {parsed.interactions.map((inter, i) => {
                  const colors = severityColors[inter.severity] || severityColors.minor;
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{inter.drug_pair?.join(' + ')}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors.badge}`}>{inter.severity?.toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1"><strong>Mechanism:</strong> {inter.mechanism}</p>
                      <p className="text-sm text-gray-700 mb-1"><strong>Clinical Effect:</strong> {inter.clinical_effect}</p>
                      <p className={`text-sm font-medium ${colors.text}`}><strong>Management:</strong> {inter.management}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monitoring parameters */}
          {parsed.monitoring_parameters?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Monitoring Parameters</h2>
              <div className="space-y-2">
                {parsed.monitoring_parameters.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="font-medium text-blue-900 min-w-40">{m.parameter}</div>
                    <div className="text-blue-600">Every {m.frequency}</div>
                    <div className="text-gray-600 text-xs">{m.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {parsed.recommendations?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
              <ul className="space-y-2">
                {parsed.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
