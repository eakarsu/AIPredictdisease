import React, { useEffect, useState } from 'react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import api from '../services/api';

function zoneFor(score) {
  if (score < 30) return { label: 'Low risk',      color: '#10b981', bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-300' };
  if (score <= 60) return { label: 'Moderate risk', color: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-300' };
  return            { label: 'High risk',     color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-300' };
}

export default function RiskGauge() {
  const [data, setData]       = useState(null);
  const [selectedId, setSel]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/custom-views/risk-scores')
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        setSel(res.data?.patients?.[0]?.id || '');
      })
      .catch((e) => alive && setError(e?.response?.data?.error || e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading risk gauge...</div>;
  if (error)   return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data)   return null;

  const patient = data.patients.find(p => p.id === selectedId) || data.patients[0];
  const zone    = zoneFor(patient.risk_score);

  // Radial gauge data — single arc representing the risk score 0-100
  const gaugeData = [{ name: 'risk', value: patient.risk_score, fill: zone.color }];

  // Biomarker bars
  const biomarkers = [
    { name: 'HbA1c',       value: patient.biomarkers.hba1c,        ref: 5.7,  unit: '%' },
    { name: 'LDL',         value: patient.biomarkers.ldl,          ref: 130,  unit: 'mg/dL' },
    { name: 'BP Systolic', value: patient.biomarkers.bp_systolic,  ref: 130,  unit: 'mmHg' },
    { name: 'BMI',         value: patient.biomarkers.bmi,          ref: 25,   unit: '' },
  ];

  return (
    <div data-testid="risk-gauge" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Patient Disease Risk Score</h2>
          <p className="text-sm text-gray-500 mt-1">{data.scoring_method}</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="risk-patient-select" className="text-sm font-medium text-gray-700">Patient</label>
          <select
            id="risk-patient-select"
            data-testid="risk-patient-select"
            value={selectedId}
            onChange={(e) => setSel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {data.patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gauge */}
        <div className={`relative rounded-xl ${zone.bg} ring-1 ${zone.ring} p-4`}>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%" cy="55%"
              innerRadius="70%" outerRadius="100%"
              barSize={28}
              startAngle={210} endAngle={-30}
              data={gaugeData}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={14} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-6">
            <div className="text-6xl font-bold" style={{ color: zone.color }}>{patient.risk_score}</div>
            <div className="text-xs text-gray-500 mt-1">out of 100</div>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${zone.text} ${zone.bg} ring-1 ${zone.ring}`}>
              {zone.label}
            </div>
          </div>

          {/* Zone legend */}
          <div className="mt-4 flex items-center justify-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> 0-29</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> 30-60</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"   /> 61-100</span>
          </div>
        </div>

        {/* Patient info + biomarkers */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-sm font-semibold text-gray-900">{patient.name}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Age / Sex</div>
              <div className="text-sm font-semibold text-gray-900">{patient.age} · {patient.sex}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-gray-500">Primary concern</div>
              <div className="text-sm font-semibold text-gray-900">{patient.primary_concern}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Biomarker Profile</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={biomarkers} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(v, _n, p) => `${v}${p?.payload?.unit ? ' ' + p.payload.unit : ''}`}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {biomarkers.map((b, i) => (
                    <Cell key={i} fill={b.value > b.ref ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
