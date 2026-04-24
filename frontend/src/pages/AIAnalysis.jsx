import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp, Package, Activity } from 'lucide-react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

const analysisTypes = [
  {
    id: 'predict',
    title: 'Outbreak Prediction',
    description: 'Predict potential disease outbreaks using AI-driven epidemiological analysis',
    icon: Sparkles,
    color: 'purple',
    endpoint: '/ai/predict-outbreak',
    fields: [
      { name: 'disease', label: 'Disease', placeholder: 'e.g., Influenza, COVID-19, Dengue' },
      { name: 'region', label: 'Region', placeholder: 'e.g., North America, South Asia' },
      { name: 'additionalContext', label: 'Additional Context', placeholder: 'Any extra context for the prediction...', type: 'textarea' },
    ],
    outputType: 'prediction',
  },
  {
    id: 'risk',
    title: 'Risk Analysis',
    description: 'Comprehensive regional health risk assessment powered by AI',
    icon: Activity,
    color: 'red',
    endpoint: '/ai/analyze-risk',
    fields: [
      { name: 'region', label: 'Region', placeholder: 'e.g., West Africa, Southeast Asia' },
      { name: 'factors', label: 'Specific Factors', placeholder: 'Any specific risk factors to consider...', type: 'textarea' },
    ],
    outputType: 'risk',
  },
  {
    id: 'optimize',
    title: 'Resource Optimization',
    description: 'AI-optimized resource allocation and distribution recommendations',
    icon: Package,
    color: 'blue',
    endpoint: '/ai/optimize-resources',
    fields: [
      { name: 'region', label: 'Region', placeholder: 'e.g., Global, South Asia' },
      { name: 'scenario', label: 'Scenario', placeholder: 'e.g., Flu surge, pandemic response...', type: 'textarea' },
    ],
    outputType: 'optimization',
  },
  {
    id: 'trends',
    title: 'Trend Analysis',
    description: 'Analyze disease surveillance trends and forecast future patterns',
    icon: TrendingUp,
    color: 'green',
    endpoint: '/ai/analyze-trends',
    fields: [
      { name: 'disease', label: 'Disease', placeholder: 'e.g., Influenza A, Malaria' },
      { name: 'timeframe', label: 'Timeframe', placeholder: 'e.g., Last 6 months, 2025 season' },
    ],
    outputType: 'trends',
  },
];

const colorClasses = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600', active: 'ring-purple-500 border-purple-400' },
  red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100 text-red-600', active: 'ring-red-500 border-red-400' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', active: 'ring-blue-500 border-blue-400' },
  green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600', active: 'ring-green-500 border-green-400' },
};

export default function AIAnalysis() {
  const [activeType, setActiveType] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeSelect = (type) => {
    setActiveType(type);
    setFormData({});
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!activeType) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post(activeType.endpoint, formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please check your OpenRouter API key in .env file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Analysis Center</h1>
        </div>
        <p className="text-gray-500">Leverage AI-powered analytics for outbreak prediction, risk assessment, and resource optimization</p>
      </div>

      {/* Analysis Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {analysisTypes.map((type) => {
          const Icon = type.icon;
          const colors = colorClasses[type.color];
          const isActive = activeType?.id === type.id;
          return (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type)}
              className={`card border ${colors.bg} ${colors.border} p-4 text-left transition-all duration-200 ${
                isActive ? `ring-2 ${colors.active} shadow-md` : 'hover:shadow-md'
              }`}
            >
              <div className={`inline-flex p-2 rounded-lg ${colors.icon} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{type.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
            </button>
          );
        })}
      </div>

      {/* Input Form */}
      {activeType && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{activeType.title} Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeType.fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="input-field"
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}

      {/* AI Output */}
      {(loading || result) && (
        <AIOutput data={result} loading={loading} type={activeType?.outputType} />
      )}
    </div>
  );
}
