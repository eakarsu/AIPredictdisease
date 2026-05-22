import React, { useEffect, useState } from 'react';
import api from '../services/api';

const NODE_W = 130;
const NODE_H = 70;
const GEN_GAP = 130;
const COL_GAP = 160;
const PADDING = 40;

function ConditionDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-gray-700">{label}</span>
    </span>
  );
}

export default function FamilyHistoryTree() {
  const [data, setData]       = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedId, setSel]  = useState('P-1001');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/custom-views/family-history?patient_id=${encodeURIComponent(selectedId)}`)
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        if (res.data?.available_patients) setPatients(res.data.available_patients);
      })
      .catch((e) => alive && setError(e?.response?.data?.error || e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [selectedId]);

  if (loading) return <div className="p-8 text-gray-500">Loading family history tree...</div>;
  if (error)   return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data?.tree) return null;

  const { members, edges } = data.tree;
  const conditionColors = data.condition_colors || {};

  // Compute pixel positions from logical (generation, x) coords
  const xToPx = (x) => PADDING + (x - 1) * COL_GAP;
  const gToPx = (g) => PADDING + g * GEN_GAP;

  const memberById = Object.fromEntries(members.map(m => [m.id, m]));
  const maxX = Math.max(...members.map(m => m.x));
  const maxG = Math.max(...members.map(m => m.generation));
  const svgW = xToPx(maxX) + NODE_W + PADDING;
  const svgH = gToPx(maxG) + NODE_H + PADDING;

  // Build unique color list of conditions actually present
  const conditionsInTree = Array.from(new Set(members.flatMap(m => m.conditions)));

  return (
    <div data-testid="family-history-tree" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Family History Tree</h2>
          <p className="text-sm text-gray-500 mt-1">Relatives and disease diagnoses, color-coded by condition</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="family-patient-select" className="text-sm font-medium text-gray-700">Patient</label>
          <select
            id="family-patient-select"
            data-testid="family-patient-select"
            value={selectedId}
            onChange={(e) => setSel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4 p-3 bg-gray-50 rounded-lg">
        {conditionsInTree.length === 0 ? (
          <span className="text-xs text-gray-500">No diagnosed conditions in this family.</span>
        ) : conditionsInTree.map(c => (
          <ConditionDot key={c} color={conditionColors[c] || '#9ca3af'} label={c} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg
          data-testid="family-tree-svg"
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="bg-gradient-to-b from-slate-50 to-white rounded-lg"
        >
          {/* Edges */}
          <g stroke="#94a3b8" strokeWidth="1.5" fill="none">
            {edges.map((e, i) => {
              const a = memberById[e.from];
              const b = memberById[e.to];
              if (!a || !b) return null;
              const x1 = xToPx(a.x) + NODE_W / 2;
              const y1 = gToPx(a.generation) + NODE_H;
              const x2 = xToPx(b.x) + NODE_W / 2;
              const y2 = gToPx(b.generation);
              const midY = (y1 + y2) / 2;
              return (
                <path
                  key={`e-${i}`}
                  d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {members.map((m) => {
              const x = xToPx(m.x);
              const y = gToPx(m.generation);
              const primary = m.conditions[0];
              const fill = primary ? (conditionColors[primary] || '#9ca3af') : '#ffffff';
              const stroke = m.isPatient ? '#2563eb' : '#cbd5e1';
              const strokeW = m.isPatient ? 3 : 1.5;
              const textColor = primary ? '#ffffff' : '#1f2937';
              const subColor  = primary ? 'rgba(255,255,255,0.85)' : '#6b7280';

              return (
                <g key={m.id} transform={`translate(${x}, ${y})`}>
                  <rect
                    width={NODE_W} height={NODE_H} rx={10} ry={10}
                    fill={fill} stroke={stroke} strokeWidth={strokeW}
                    opacity={m.deceased ? 0.65 : 1}
                  />
                  <text x={NODE_W / 2} y={20} textAnchor="middle" fontSize="11" fontWeight="600" fill={textColor}>
                    {m.name}
                  </text>
                  <text x={NODE_W / 2} y={36} textAnchor="middle" fontSize="9" fill={subColor}>
                    {m.relation}
                  </text>
                  <text x={NODE_W / 2} y={52} textAnchor="middle" fontSize="9" fill={textColor}>
                    {m.conditions.length ? m.conditions.join(', ').slice(0, 28) : 'No diagnoses'}
                  </text>
                  {m.deceased && (
                    <line x1={8} y1={NODE_H - 6} x2={NODE_W - 8} y2={6} stroke="#1f2937" strokeWidth="1.5" opacity="0.5" />
                  )}
                  {m.isPatient && (
                    <circle cx={NODE_W - 12} cy={12} r={6} fill="#2563eb" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
