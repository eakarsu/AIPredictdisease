import React, { useState } from 'react';
import { Stethoscope, Plus, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const dispositionColors = {
  discharge: 'bg-green-100 text-green-800',
  observation: 'bg-blue-100 text-blue-800',
  admission: 'bg-yellow-100 text-yellow-800',
  icu: 'bg-red-100 text-red-800',
};

const priorityColors = {
  stat: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  routine: 'bg-gray-100 text-gray-700',
};

const typeIcons = { lab: '🧪', imaging: '📷', procedure: '🔬', consultation: '👨‍⚕️' };

export default function DifferentialDiagnosis() {
  const [symptoms, setSymptoms] = useState(['']);
  const [form, setForm] = useState({ age: '', gender: '', patient_id: '' });
  const [labValues, setLabValues] = useState('');
  const [vitalSigns, setVitalSigns] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSymptom = () => setSymptoms([...symptoms, '']);
  const removeSymptom = (i) => setSymptoms(symptoms.filter((_, idx) => idx !== i));
  const updateSymptom = (i, val) => setSymptoms(symptoms.map((s, idx) => idx === i ? val : s));

  const parseJsonField = (text) => {
    try { return JSON.parse(text); } catch { return text || undefined; }
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    const validSymptoms = symptoms.filter(s => s.trim());
    if (validSymptoms.length === 0) return setError('Please enter at least one symptom');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/differential-diagnosis', {
        symptoms: validSymptoms,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        patient_id: form.patient_id || undefined,
        lab_values: labValues ? parseJsonField(labValues) : undefined,
        vital_signs: vitalSigns ? parseJsonField(vitalSigns) : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Differential Diagnosis</h1>
        </div>
        <p className="text-gray-500">Ranked differential diagnosis with diagnostic workup plan</p>
      </div>

      <div className="card p-6 mb-6">
        <form onSubmit={handleDiagnose}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input type="text" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="input-field" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="input-field" placeholder="e.g., 55" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Symptoms <span className="text-red-500">*</span></label>
              <button type="button" onClick={addSymptom} className="btn-secondary flex items-center gap-1 text-xs py-1">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {symptoms.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={s} onChange={e => updateSymptom(i, e.target.value)} className="input-field flex-1" placeholder={`Symptom ${i + 1}...`} />
                  {symptoms.length > 1 && (
                    <button type="button" onClick={() => removeSymptom(i)} className="p-2 text-red-400 hover:text-red-600 rounded-lg"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vital Signs (JSON or text)</label>
              <textarea value={vitalSigns} onChange={e => setVitalSigns(e.target.value)} className="input-field" rows={3}
                placeholder='{"HR": 110, "BP": "90/60", "Temp": 39.2, "SpO2": 94}' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lab Values (JSON or text)</label>
              <textarea value={labValues} onChange={e => setLabValues(e.target.value)} className="input-field" rows={3}
                placeholder='{"WBC": 14.5, "Hgb": 10.2, "CRP": 85, "Troponin": 0.08}' />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Stethoscope className="h-4 w-4" />}
            {loading ? 'Diagnosing...' : 'Generate Differential Diagnosis'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is generating differential diagnosis...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Disposition */}
          <div className="flex items-center gap-4 flex-wrap">
            {parsed.disposition && (
              <span className={`px-4 py-2 rounded-xl font-semibold text-sm border ${dispositionColors[parsed.disposition] || 'bg-gray-100 text-gray-700'}`}>
                Disposition: {parsed.disposition?.toUpperCase()}
              </span>
            )}
            {parsed.follow_up_timeframe && (
              <span className="px-4 py-2 rounded-xl font-medium text-sm bg-blue-50 text-blue-800 border border-blue-200">
                Follow-up: {parsed.follow_up_timeframe}
              </span>
            )}
          </div>

          {/* Red flags */}
          {parsed.red_flags?.length > 0 && (
            <div className="card p-4 bg-red-50 border-red-300">
              <h2 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Red Flags
              </h2>
              <ul className="space-y-1">
                {parsed.red_flags.map((f, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2"><span>•</span> {f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Differentials */}
          {parsed.differentials?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Differential Diagnoses (Ranked)</h2>
              <div className="space-y-3">
                {parsed.differentials.sort((a, b) => b.likelihood_pct - a.likelihood_pct).map((d, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="font-semibold text-gray-900">{d.diagnosis}</span>
                        {d.icd_code && <span className="text-xs text-gray-400 font-mono">{d.icd_code}</span>}
                      </div>
                      <span className="text-lg font-bold text-purple-700">{d.likelihood_pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${d.likelihood_pct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {d.supporting_evidence?.length > 0 && (
                        <div>
                          <p className="font-medium text-green-700 mb-1">Supporting:</p>
                          <ul className="space-y-0.5">
                            {d.supporting_evidence.map((e, j) => <li key={j} className="text-gray-600">+ {e}</li>)}
                          </ul>
                        </div>
                      )}
                      {d.against_evidence?.length > 0 && (
                        <div>
                          <p className="font-medium text-red-700 mb-1">Against:</p>
                          <ul className="space-y-0.5">
                            {d.against_evidence.map((e, j) => <li key={j} className="text-gray-600">- {e}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic workup */}
          {parsed.diagnostic_workup?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Diagnostic Workup Plan</h2>
              <div className="space-y-2">
                {parsed.diagnostic_workup.map((w, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-lg">{typeIcons[w.type] || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{w.test}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[w.priority] || 'bg-gray-100 text-gray-700'}`}>{w.priority}</span>
                      </div>
                      <p className="text-xs text-gray-500">{w.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
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
