import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Activity, LogOut, User, Shield } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/outbreaks', label: 'Outbreaks' },
  { path: '/campaigns', label: 'Campaigns' },
  { path: '/risks', label: 'Risks' },
  { path: '/reports', label: 'Surveillance' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/resources', label: 'Resources' },
  { path: '/inventory', label: 'Vaccines' },
  { path: '/facilities', label: 'Facilities' },
  { path: '/epidata', label: 'Epi Data' },
  { path: '/ai-analysis', label: 'AI Analysis' },
  { path: '/predict-disease', label: 'Disease AI' },
  { path: '/risk-factors', label: 'Risk Factors' },
  { path: '/drug-interactions', label: 'Drug Check' },
  { path: '/differential-diagnosis', label: 'Differential Dx' },
  { path: '/population-analytics', label: 'Population' },
  { path: '/patient-history', label: 'Patient History' },
  { path: '/comorbidity-analyze', label: 'Comorbidity' },
  { path: '/seasonality-predict', label: 'Seasonality' },
  { path: '/ai-history', label: 'AI History' },
  // === Batch 06 Gaps & Frontend Mounts ===
  { path: '/cf-agentic-disease-surveillance', label: 'Agentic disease surveillance', icon: '✨' },
  { path: '/cf-individual-risk-dashboard', label: 'Individual risk dashboard', icon: '✨' },
  { path: '/cf-treatment-efficacy-tracking', label: 'Treatment efficacy tracking', icon: '✨' },
  { path: '/cf-outbreak-simulation', label: 'Outbreak simulation', icon: '✨' },
  { path: '/cf-travel-health-risk', label: 'Travel health risk', icon: '✨' },
  { path: '/gap-patients-without-comorbidity', label: 'Patients without `/comorbidity', icon: '✨' },
  { path: '/gap-trends-without-seasonality', label: 'Trends without `/seasonality', icon: '✨' },
  { path: '/gap-backend-collapses-to-crud-js', label: 'Backend collapses to crud.js', icon: '✨' },
  { path: '/gap-no-public-health-database-integration-cdc-who', label: 'No public health database integration (CDC, WHO)', icon: '✨' },
  { path: '/gap-no-case-management-workflows', label: 'No case management workflows', icon: '✨' },
  { path: '/gap-no-contact-tracing', label: 'No contact tracing', icon: '✨' },
  { path: '/gap-limited-population-health-analytics', label: 'Limited population health analytics', icon: '✨' },
  { path: '/gap-no-ehr-integration', label: 'No EHR integration', icon: '✨' },
  { path: '/gap-no-notifications-module-grep-0', label: 'No notifications module (grep 0)', icon: '✨' },
  { path: '/gap-no-webhooks-for-outbreak-alerts', label: 'No webhooks for outbreak alerts', icon: '✨' },
  { path: '/gap-no-integration-with-clinical-systems', label: 'No integration with clinical systems', icon: '✨' }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">OutbreakPredict<span className="text-primary-600">AI</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.name || 'User'}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger-600 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-200 bg-white py-2 px-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
