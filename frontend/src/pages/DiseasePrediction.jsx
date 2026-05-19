import React, { useState } from 'react';
import { Brain, Plus, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

const urgencyColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const confidenceColors = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

export default function DiseasePrediction() {
  const [symptoms, setSymptoms] = useState(['']);
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSymptom = () => setSymptoms([...symptoms, '']);
  const removeSymptom = (i) => setSymptoms(symptoms.filter((_, idx) => idx !== i));
  const updateSymptom = (i, val) => setSymptoms(symptoms.map((s, idx) => idx === i ? val : s));

  const handlePredict = async (e) => {
    e.preventDefault();
    const validSymptoms = symptoms.filter(s => s.trim());
    if (validSymptoms.length === 0) return setError('Please enter at least one symptom');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/predict-disease', {
        symptoms: validSymptoms,
        patient_id: patientId || undefined,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        medical_history: medicalHistory ? medicalHistory.split(',').map(s => s.trim()) : [],
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Disease Prediction</h1>
        </div>
        <p className="text-gray-500">AI-powered structured disease prediction with probability scores</p>
      </div>

      {/* Input form */}
      <div className="card p-6 mb-6">
        <form onSubmit={handlePredict}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (optional)</label>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} className="input-field" placeholder="e.g., PAT-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} className="input-field" placeholder="e.g., 45" min="0" max="120" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="input-field">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (comma-separated)</label>
            <input type="text" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} className="input-field" placeholder="e.g., diabetes, hypertension, asthma" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Symptoms <span className="text-red-500">*</span></label>
              <button type="button" onClick={addSymptom} className="btn-secondary flex items-center gap-1 text-xs py-1">
                <Plus className="h-3 w-3" /> Add Symptom
              </button>
            </div>
            <div className="space-y-2">
              {symptoms.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s}
                    onChange={e => updateSymptom(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Symptom ${i + 1}...`}
                  />
                  {symptoms.length > 1 && (
                    <button type="button" onClick={() => removeSymptom(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Brain className="h-4 w-4" />}
            {loading ? 'Predicting...' : 'Run AI Prediction'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing symptoms...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Urgency banner */}
          <div className={`p-4 rounded-xl border-2 ${urgencyColors[parsed.urgency_level] || 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Urgency Level: {parsed.urgency_level?.toUpperCase()}</p>
                <p className="text-sm opacity-80">Please seek medical attention accordingly</p>
              </div>
            </div>
          </div>

          {/* Predicted diseases with probability bars */}
          {parsed.predicted_diseases?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Predicted Conditions</h2>
              <div className="space-y-3">
                {parsed.predicted_diseases.sort((a, b) => b.probability - a.probability).map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{d.disease}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${confidenceColors[d.confidence] || 'bg-gray-100 text-gray-700'}`}>
                          {d.confidence}
                        </span>
                        <span className="font-bold text-gray-700 w-10 text-right">{d.probability}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.probability >= 70 ? 'bg-red-500' : d.probability >= 40 ? 'bg-yellow-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${d.probability}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended tests */}
          {parsed.recommended_tests?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Tests</h2>
              <div className="space-y-2">
                {parsed.recommended_tests.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${t.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {t.priority}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.test}</p>
                      <p className="text-xs text-gray-500">{t.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors & preventive measures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsed.risk_factors?.length > 0 && (
              <div className="card p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Risk Factors</h2>
                <ul className="space-y-1">
                  {parsed.risk_factors.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsed.preventive_measures?.length > 0 && (
              <div className="card p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Preventive Measures</h2>
                <ul className="space-y-1">
                  {parsed.preventive_measures.map((m, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
