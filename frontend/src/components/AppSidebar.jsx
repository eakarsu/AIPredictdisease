import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/outbreaks', label: 'Outbreaks', group: 'Workspace' },
  { to: '/campaigns', label: 'Campaigns', group: 'Workspace' },
  { to: '/risks', label: 'Risks', group: 'Workspace' },
  { to: '/reports', label: 'Reports', group: 'Workspace' },
  { to: '/resources', label: 'Resources', group: 'Workspace' },
  { to: '/alerts', label: 'Alerts', group: 'Workspace' },
  { to: '/epidata', label: 'Epidata', group: 'Workspace' },
  { to: '/inventory', label: 'Inventory', group: 'Workspace' },
  { to: '/facilities', label: 'Facilities', group: 'Workspace' },
  { to: '/ai-analysis', label: 'AI Analysis', group: 'AI tools' },
  { to: '/ai-history', label: 'Forecast History', group: 'AI tools' },
  { to: '/predict-disease', label: 'Disease Prediction', group: 'Workspace' },
  { to: '/risk-factors', label: 'Risk Factor Analysis', group: 'Workspace' },
  { to: '/drug-interactions', label: 'Drug Interaction Checker', group: 'Workspace' },
  { to: '/differential-diagnosis', label: 'Differential Diagnosis', group: 'Workspace' },
  { to: '/population-analytics', label: 'Population Analytics', group: 'Workspace' },
  { to: '/patient-history', label: 'Patient History', group: 'Workspace' },
  { to: '/comorbidity-analyze', label: 'Comorbidity Analyze', group: 'Workspace' },
  { to: '/seasonality-predict', label: 'Seasonality Predict', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
  { to: '/cf-agentic-disease-surveillance', label: 'CF Agentic Disease Surveillance', group: 'Workspace' },
  { to: '/cf-individual-risk-dashboard', label: 'CF Individual Risk Dashboard', group: 'Workspace' },
  { to: '/cf-treatment-efficacy-tracking', label: 'CF Treatment Efficacy Tracking', group: 'Workspace' },
  { to: '/cf-outbreak-simulation', label: 'CF Outbreak Simulation', group: 'Workspace' },
  { to: '/cf-travel-health-risk', label: 'CF Travel Health Risk', group: 'Workspace' },
  { to: '/gap-patients-without-comorbidity', label: 'Gap Patients Without Comorbidity', group: 'Workspace' },
  { to: '/gap-trends-without-seasonality', label: 'Gap Trends Without Seasonality', group: 'Workspace' },
  { to: '/gap-backend-collapses-to-crud-js', label: 'Gap Backend Collapses To Crud Js', group: 'Workspace' },
  { to: '/gap-no-public-health-database-integration-cdc-who', label: 'Gap No Public Health Database Integration Cdc Who', group: 'Workspace' },
  { to: '/gap-no-case-management-workflows', label: 'Gap No Case Management Workflows', group: 'Workspace' },
  { to: '/gap-no-contact-tracing', label: 'Gap No Contact Tracing', group: 'Workspace' },
  { to: '/gap-limited-population-health-analytics', label: 'Gap Limited Population Health Analytics', group: 'Workspace' },
  { to: '/gap-no-ehr-integration', label: 'Gap No Ehr Integration', group: 'Workspace' },
  { to: '/gap-no-notifications-module-grep-0', label: 'Gap No Notifications Module Grep0', group: 'Workspace' },
  { to: '/gap-no-webhooks-for-outbreak-alerts', label: 'Gap No Webhooks For Outbreak Alerts', group: 'Workspace' },
  { to: '/gap-no-integration-with-clinical-systems', label: 'Gap No Integration With Clinical Systems', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AIPredictdisease</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
