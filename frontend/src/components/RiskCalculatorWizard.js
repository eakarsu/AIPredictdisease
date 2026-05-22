import React, { useState } from 'react';
import api from '../services/api';

const STEPS = [
  { key: 'demo',      title: 'Age & Sex' },
  { key: 'family',    title: 'Family History' },
  { key: 'lifestyle', title: 'Lifestyle' },
  { key: 'bio',       title: 'Biomarkers' },
  { key: 'review',    title: 'Review' },
];

const initialState = {
  age: 50,
  sex: 'F',
  family_history: {
    diabetes: false,
    heart_disease: false,
    cancer: false,
    stroke: false,
    alzheimers: false,
  },
  lifestyle: {
    smoker: false,
    heavy_alcohol: false,
    sedentary: false,
    poor_diet: false,
    high_stress: false,
  },
  biomarkers: {
    hba1c: 5.5,
    ldl: 120,
    bp_systolic: 125,
    bmi: 24.5,
  },
};

function Toggle({ label, checked, onChange, testId }) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
      <span className="text-sm text-gray-800">{label}</span>
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

export default function RiskCalculatorWizard() {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(initialState);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const parts = path.split('.');
      let target = next;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] };
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/custom-views/calculate-risk', form);
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setForm(initialState); setResult(null); setStep(0); setError(''); };

  return (
    <div data-testid="risk-calculator-wizard" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Disease Risk Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Five-step wizard producing a composite 0-100 risk score with band and personalized recommendations.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${
                active ? 'bg-blue-600 text-white ring-blue-600'
                       : done ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-gray-50 text-gray-600 ring-gray-200'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  active ? 'bg-white text-blue-600' : done ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>{i + 1}</span>
                {s.title}
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 min-w-[12px]" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step bodies */}
      {step === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number" min={0} max={120}
              data-testid="rcw-age"
              value={form.age}
              onChange={(e) => update('age', Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select
              data-testid="rcw-sex"
              value={form.sex}
              onChange={(e) => update('sex', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="U">Prefer not to say</option>
            </select>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Type 2 Diabetes in 1st-degree relative" checked={form.family_history.diabetes}
                  onChange={(v) => update('family_history.diabetes', v)} testId="rcw-fh-diabetes" />
          <Toggle label="Heart Disease in family" checked={form.family_history.heart_disease}
                  onChange={(v) => update('family_history.heart_disease', v)} testId="rcw-fh-heart" />
          <Toggle label="Cancer (any) in family" checked={form.family_history.cancer}
                  onChange={(v) => update('family_history.cancer', v)} testId="rcw-fh-cancer" />
          <Toggle label="Stroke in family" checked={form.family_history.stroke}
                  onChange={(v) => update('family_history.stroke', v)} testId="rcw-fh-stroke" />
          <Toggle label="Alzheimer's / Dementia in family" checked={form.family_history.alzheimers}
                  onChange={(v) => update('family_history.alzheimers', v)} testId="rcw-fh-alz" />
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Current smoker" checked={form.lifestyle.smoker}
                  onChange={(v) => update('lifestyle.smoker', v)} testId="rcw-ls-smoker" />
          <Toggle label="Heavy alcohol use (> 14 drinks/wk)" checked={form.lifestyle.heavy_alcohol}
                  onChange={(v) => update('lifestyle.heavy_alcohol', v)} testId="rcw-ls-alc" />
          <Toggle label="Sedentary lifestyle (< 150 min/wk activity)" checked={form.lifestyle.sedentary}
                  onChange={(v) => update('lifestyle.sedentary', v)} testId="rcw-ls-sed" />
          <Toggle label="Poor diet (low fiber / high processed)" checked={form.lifestyle.poor_diet}
                  onChange={(v) => update('lifestyle.poor_diet', v)} testId="rcw-ls-diet" />
          <Toggle label="High stress / poor sleep" checked={form.lifestyle.high_stress}
                  onChange={(v) => update('lifestyle.high_stress', v)} testId="rcw-ls-stress" />
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HbA1c (%)</label>
            <input type="number" step="0.1" data-testid="rcw-bio-hba1c" value={form.biomarkers.hba1c}
                   onChange={(e) => update('biomarkers.hba1c', Number(e.target.value))}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LDL Cholesterol (mg/dL)</label>
            <input type="number" data-testid="rcw-bio-ldl" value={form.biomarkers.ldl}
                   onChange={(e) => update('biomarkers.ldl', Number(e.target.value))}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP (mmHg)</label>
            <input type="number" data-testid="rcw-bio-bp" value={form.biomarkers.bp_systolic}
                   onChange={(e) => update('biomarkers.bp_systolic', Number(e.target.value))}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
            <input type="number" step="0.1" data-testid="rcw-bio-bmi" value={form.biomarkers.bmi}
                   onChange={(e) => update('biomarkers.bmi', Number(e.target.value))}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Demographics</div>
              <div className="text-sm font-semibold text-gray-900">Age {form.age} · {form.sex}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Family Risk Factors</div>
              <div className="text-sm font-semibold text-gray-900">
                {Object.entries(form.family_history).filter(([, v]) => v).length} selected
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Lifestyle Risks</div>
              <div className="text-sm font-semibold text-gray-900">
                {Object.entries(form.lifestyle).filter(([, v]) => v).length} selected
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 col-span-1 md:col-span-3">
              <div className="text-xs text-gray-500 mb-1">Biomarkers</div>
              <div className="text-sm font-semibold text-gray-900">
                HbA1c {form.biomarkers.hba1c}% · LDL {form.biomarkers.ldl} mg/dL · BP {form.biomarkers.bp_systolic} mmHg · BMI {form.biomarkers.bmi}
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="rcw-submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Calculating...' : 'Calculate Risk Score'}
          </button>

          {error && <div className="p-3 rounded-lg bg-red-50 ring-1 ring-red-200 text-red-700 text-sm">{error}</div>}

          {result && (
            <div data-testid="rcw-result" className="border border-gray-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div
                  className="w-24 h-24 rounded-full flex flex-col items-center justify-center ring-4"
                  style={{ color: result.band_color, ringColor: result.band_color, boxShadow: `inset 0 0 0 4px ${result.band_color}` }}
                >
                  <div className="text-3xl font-bold" style={{ color: result.band_color }}>{result.score}</div>
                  <div className="text-[10px] text-gray-500">/ 100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Risk Band</div>
                  <div className="text-xl font-bold" style={{ color: result.band_color }}>{result.band}</div>
                  <div className="text-xs text-gray-500 mt-1">{result.method}</div>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-800 mb-2">Score Breakdown</h4>
              <div className="space-y-2 mb-4">
                {result.breakdown.map((b, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{b.category}</span>
                      <span className="text-gray-500">{b.points} / {b.max} · {b.note}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(b.points / b.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-semibold text-gray-800 mb-2">Recommendations</h4>
              <ul className="space-y-1.5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-0.5 text-blue-600">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step nav */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          data-testid="rcw-prev"
          onClick={prev}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Back
        </button>
        <div className="text-xs text-gray-500">Step {step + 1} of {STEPS.length}</div>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            data-testid="rcw-next"
            onClick={next}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            data-testid="rcw-reset"
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
