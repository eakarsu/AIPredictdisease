import React from 'react';
import RiskGauge from '../components/RiskGauge';
import FamilyHistoryTree from '../components/FamilyHistoryTree';
import FHIRExporter from '../components/FHIRExporter';
import RiskCalculatorWizard from '../components/RiskCalculatorWizard';

export default function CustomViewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Risk Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Patient disease risk scoring and hereditary condition tracking
        </p>
      </div>

      <RiskGauge />
      <FamilyHistoryTree />
      <FHIRExporter />
      <RiskCalculatorWizard />
    </div>
  );
}
