import React, { useState } from 'react';
import { Brain, Plus, X } from 'lucide-react';
import api from '../services/api';

export default function ComorbidityAnalyze() {
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [conditions, setConditions] = useState(['']);
  const [demographics, setDemographics] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addCondition = () => setConditions([...conditions, '']);
  const removeCondition = (i) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i, val) =>
    setConditions(conditions.map((s, idx) => (idx === i ? val : s)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = conditions.filter((c) => c.trim());
    if (valid.length === 0 && !patientId) {
      return setError('Provide a patient_id or at least one condition');
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {};
      if (patientId) payload.patient_id = patientId;
      if (valid.length > 0) payload.conditions = valid;
      if (age) payload.age = parseInt(age, 10);
      if (gender) payload.gender = gender;
      if (demographics.trim()) payload.demographics = demographics.trim();
      const { data } = await api.post('/ai/comorbidity-analyze', payload);
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
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Comorbidity Analyzer</h1>
        </div>
        <p className="text-gray-500">
          Identify clusters, elevated risks, screening priorities, and drug-interaction concerns
        </p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (optional)</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="input-field"
                placeholder="e.g., PAT-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input-field"
                placeholder="e.g., 67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-field"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Demographics / Lifestyle (free text)
            </label>
            <input
              type="text"
              value={demographics}
              onChange={(e) => setDemographics(e.target.value)}
              className="input-field"
              placeholder="e.g., smoker, sedentary, urban"
            />
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Conditions</label>
              <button
                type="button"
                onClick={addCondition}
                className="btn-secondary flex items-center gap-1 text-xs py-1"
              >
                <Plus className="h-3 w-3" /> Add Condition
              </button>
            </div>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => updateCondition(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Condition ${i + 1} (e.g., Type 2 diabetes)`}
                  />
                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Run Comorbidity Analysis'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is mapping comorbidities...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {parsed.clusters?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Comorbidity Clusters</h2>
              {parsed.clusters.map((c, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {c.name || c.cluster || `Cluster ${i + 1}`}
                  </p>
                  {c.conditions && (
                    <p className="text-xs text-gray-500">
                      {Array.isArray(c.conditions) ? c.conditions.join(', ') : String(c.conditions)}
                    </p>
                  )}
                  {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                </div>
              ))}
            </div>
          )}

          {parsed.elevated_risks?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Elevated Risks</h2>
              <ul className="space-y-1">
                {parsed.elevated_risks.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {typeof r === 'string' ? r : JSON.stringify(r)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.screening_priorities?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Screening Priorities</h2>
              <div className="space-y-2">
                {parsed.screening_priorities.map((s, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg text-sm">
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.drug_interactions?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Drug Interaction Concerns
              </h2>
              <ul className="space-y-1">
                {parsed.drug_interactions.map((d, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {typeof d === 'string' ? d : JSON.stringify(d)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.disclaimer && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 italic">
              {parsed.disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
