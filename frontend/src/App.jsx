import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIAnalysis from './pages/AIAnalysis';
import ForecastHistory from './pages/ForecastHistory';
import DiseasePrediction from './pages/DiseasePrediction';
import RiskFactorAnalysis from './pages/RiskFactorAnalysis';
import DrugInteractionChecker from './pages/DrugInteractionChecker';
import DifferentialDiagnosis from './pages/DifferentialDiagnosis';
import PopulationAnalytics from './pages/PopulationAnalytics';
import PatientHistory from './pages/PatientHistory';
import ComorbidityAnalyze from './pages/ComorbidityAnalyze';
import SeasonalityPredict from './pages/SeasonalityPredict';
import Navbar from './components/Navbar';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticDiseaseSurveillancePage from './pages/CFAgenticDiseaseSurveillancePage';
import CFIndividualRiskDashboardPage from './pages/CFIndividualRiskDashboardPage';
import CFTreatmentEfficacyTrackingPage from './pages/CFTreatmentEfficacyTrackingPage';
import CFOutbreakSimulationPage from './pages/CFOutbreakSimulationPage';
import CFTravelHealthRiskPage from './pages/CFTravelHealthRiskPage';
import GapPatientsWithoutComorbidityPage from './pages/GapPatientsWithoutComorbidityPage';
import GapTrendsWithoutSeasonalityPage from './pages/GapTrendsWithoutSeasonalityPage';
import GapBackendCollapsesToCrudJsPage from './pages/GapBackendCollapsesToCrudJsPage';
import GapNoPublicHealthDatabaseIntegrationCdcWhoPage from './pages/GapNoPublicHealthDatabaseIntegrationCdcWhoPage';
import GapNoCaseManagementWorkflowsPage from './pages/GapNoCaseManagementWorkflowsPage';
import GapNoContactTracingPage from './pages/GapNoContactTracingPage';
import GapLimitedPopulationHealthAnalyticsPage from './pages/GapLimitedPopulationHealthAnalyticsPage';
import GapNoEhrIntegrationPage from './pages/GapNoEhrIntegrationPage';
import GapNoNotificationsModuleGrep0Page from './pages/GapNoNotificationsModuleGrep0Page';
import GapNoWebhooksForOutbreakAlertsPage from './pages/GapNoWebhooksForOutbreakAlertsPage';
import GapNoIntegrationWithClinicalSystemsPage from './pages/GapNoIntegrationWithClinicalSystemsPage';
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/outbreaks" element={<ProtectedRoute><FeaturePage feature="outbreaks" /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><FeaturePage feature="campaigns" /></ProtectedRoute>} />
        <Route path="/risks" element={<ProtectedRoute><FeaturePage feature="risks" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><FeaturePage feature="reports" /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><FeaturePage feature="resources" /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><FeaturePage feature="alerts" /></ProtectedRoute>} />
        <Route path="/epidata" element={<ProtectedRoute><FeaturePage feature="epidata" /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><FeaturePage feature="inventory" /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><FeaturePage feature="facilities" /></ProtectedRoute>} />
        <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />
        <Route path="/ai-history" element={<ProtectedRoute><ForecastHistory /></ProtectedRoute>} />
        <Route path="/predict-disease" element={<ProtectedRoute><DiseasePrediction /></ProtectedRoute>} />
        <Route path="/risk-factors" element={<ProtectedRoute><RiskFactorAnalysis /></ProtectedRoute>} />
        <Route path="/drug-interactions" element={<ProtectedRoute><DrugInteractionChecker /></ProtectedRoute>} />
        <Route path="/differential-diagnosis" element={<ProtectedRoute><DifferentialDiagnosis /></ProtectedRoute>} />
        <Route path="/population-analytics" element={<ProtectedRoute><PopulationAnalytics /></ProtectedRoute>} />
        <Route path="/patient-history" element={<ProtectedRoute><PatientHistory /></ProtectedRoute>} />
        <Route path="/comorbidity-analyze" element={<ProtectedRoute><ComorbidityAnalyze /></ProtectedRoute>} />
        <Route path="/seasonality-predict" element={<ProtectedRoute><SeasonalityPredict /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-disease-surveillance" element={<CFAgenticDiseaseSurveillancePage />} />
          <Route path="/cf-individual-risk-dashboard" element={<CFIndividualRiskDashboardPage />} />
          <Route path="/cf-treatment-efficacy-tracking" element={<CFTreatmentEfficacyTrackingPage />} />
          <Route path="/cf-outbreak-simulation" element={<CFOutbreakSimulationPage />} />
          <Route path="/cf-travel-health-risk" element={<CFTravelHealthRiskPage />} />
          <Route path="/gap-patients-without-comorbidity" element={<GapPatientsWithoutComorbidityPage />} />
          <Route path="/gap-trends-without-seasonality" element={<GapTrendsWithoutSeasonalityPage />} />
          <Route path="/gap-backend-collapses-to-crud-js" element={<GapBackendCollapsesToCrudJsPage />} />
          <Route path="/gap-no-public-health-database-integration-cdc-who" element={<GapNoPublicHealthDatabaseIntegrationCdcWhoPage />} />
          <Route path="/gap-no-case-management-workflows" element={<GapNoCaseManagementWorkflowsPage />} />
          <Route path="/gap-no-contact-tracing" element={<GapNoContactTracingPage />} />
          <Route path="/gap-limited-population-health-analytics" element={<GapLimitedPopulationHealthAnalyticsPage />} />
          <Route path="/gap-no-ehr-integration" element={<GapNoEhrIntegrationPage />} />
          <Route path="/gap-no-notifications-module-grep-0" element={<GapNoNotificationsModuleGrep0Page />} />
          <Route path="/gap-no-webhooks-for-outbreak-alerts" element={<GapNoWebhooksForOutbreakAlertsPage />} />
          <Route path="/gap-no-integration-with-clinical-systems" element={<GapNoIntegrationWithClinicalSystemsPage />} />
        </Routes>
    </BrowserRouter>
  );
}
