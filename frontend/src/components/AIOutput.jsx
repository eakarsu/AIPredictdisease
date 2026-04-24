import React from 'react';
import { Brain, Clock, Database, Sparkles } from 'lucide-react';

function parseMarkdown(text) {
  if (!text) return '';

  // Convert markdown to HTML
  let html = text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')
    .replace(/^\s*(\d+)\.\s+(.*$)/gm, '<li>$2</li>')
    // Line breaks for paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap list items
  html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
    if (!match.startsWith('<ul>')) {
      return `<ul class="list-disc list-inside space-y-1 mb-3 text-gray-700">${match}</ul>`;
    }
    return match;
  });

  return `<p>${html}</p>`;
}

export default function AIOutput({ data, loading, type = 'prediction' }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">AI is analyzing data...</p>
        <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
      </div>
    );
  }

  if (!data) return null;

  const content = data.prediction || data.analysis || data.optimization || data.trends;
  const metadata = data.metadata;

  const typeConfig = {
    prediction: { icon: Sparkles, color: 'purple', label: 'Outbreak Prediction' },
    risk: { icon: Brain, color: 'red', label: 'Risk Analysis' },
    optimization: { icon: Database, color: 'blue', label: 'Resource Optimization' },
    trends: { icon: Clock, color: 'green', label: 'Trend Analysis' },
  };

  const config = typeConfig[type] || typeConfig.prediction;
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-100/50 rounded-xl p-4 border border-${config.color}-200`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${config.color}-100 rounded-lg`}>
            <Icon className={`h-5 w-5 text-${config.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.label} Results</h3>
            {metadata && (
              <p className="text-sm text-gray-500">
                Generated at {new Date(metadata.generatedAt).toLocaleString()} | {metadata.dataPointsUsed} data points analyzed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Response Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="ai-output prose max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
      </div>

      {/* Metadata Footer */}
      {metadata && (
        <div className="flex flex-wrap gap-3">
          {metadata.disease && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Disease: {metadata.disease}
            </span>
          )}
          {metadata.region && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Region: {metadata.region}
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Model: Claude Haiku 4.5
          </span>
        </div>
      )}
    </div>
  );
}
