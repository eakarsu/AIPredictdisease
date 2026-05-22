import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function FHIRExporter() {
  const [patients, setPatients]   = useState([]);
  const [selectedId, setSel]      = useState('');
  const [bundle, setBundle]       = useState(null);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [hasExported, setExported]= useState(false);

  // Bootstrap: load the default patient & roster
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/custom-views/fhir-bundle')
      .then((res) => {
        if (!alive) return;
        setPatients(res.data.available_patients || []);
        setSel(res.data.patient_id);
        setBundle(res.data.bundle);
        setMeta({ fhir_version: res.data.fhir_version, profile: res.data.profile });
      })
      .catch((e) => alive && setError(e?.response?.data?.error || e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const handleExport = async () => {
    if (!selectedId) return;
    setLoading(true); setError(''); setExported(false);
    try {
      const res = await api.get('/custom-views/fhir-bundle', { params: { patient_id: selectedId } });
      setBundle(res.data.bundle);
      setMeta({ fhir_version: res.data.fhir_version, profile: res.data.profile });
      setExported(true);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-bundle-${selectedId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const counts = bundle?.entry ? bundle.entry.reduce((acc, e) => {
    const t = e.resource?.resourceType || 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {}) : {};

  return (
    <div data-testid="fhir-exporter" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">HL7 / FHIR Bundle Export</h2>
          <p className="text-sm text-gray-500 mt-1">
            Export patient demographics, biomarkers (LOINC) and conditions (SNOMED CT) as a FHIR R4 Bundle.
          </p>
          {meta && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 ring-1 ring-blue-200 rounded-full">
                FHIR {meta.fhir_version}
              </span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-700 ring-1 ring-gray-200 rounded-full">
                {meta.profile}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="fhir-patient-select" className="text-sm font-medium text-gray-700">Patient</label>
          <select
            id="fhir-patient-select"
            data-testid="fhir-patient-select"
            value={selectedId}
            onChange={(e) => setSel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          <button
            type="button"
            data-testid="fhir-export-btn"
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Exporting...' : 'Export FHIR Bundle'}
          </button>
          <button
            type="button"
            data-testid="fhir-download-btn"
            onClick={handleDownload}
            disabled={!bundle}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400"
          >
            Download JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 ring-1 ring-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {hasExported && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-sm">
          Bundle generated successfully — {bundle?.entry?.length || 0} resources.
        </div>
      )}

      {/* Resource summary cards */}
      {bundle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Bundle Type</div>
            <div className="text-sm font-semibold text-gray-900">{bundle.type}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Patient</div>
            <div className="text-sm font-semibold text-gray-900">{counts.Patient || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Observations</div>
            <div className="text-sm font-semibold text-gray-900">{counts.Observation || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Conditions</div>
            <div className="text-sm font-semibold text-gray-900">{counts.Condition || 0}</div>
          </div>
        </div>
      )}

      {/* JSON Preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Bundle JSON Preview</h3>
        <pre
          data-testid="fhir-json-preview"
          className="bg-gray-900 text-green-200 text-xs p-4 rounded-lg overflow-auto max-h-96 font-mono leading-relaxed"
        >
{bundle ? JSON.stringify(bundle, null, 2) : 'No bundle generated yet.'}
        </pre>
      </div>
    </div>
  );
}
