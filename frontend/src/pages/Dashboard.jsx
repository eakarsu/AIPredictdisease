import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Syringe, AlertTriangle, Building2, FileText, Package,
  Bell, BarChart3, Warehouse, Brain, TrendingUp, Shield, MapPin, Stethoscope,
  Pill, Clock, Users
} from 'lucide-react';
import api from '../services/api';

const features = [
  {
    id: 'outbreaks',
    title: 'Disease Outbreaks',
    description: 'Track and manage active disease outbreaks worldwide',
    icon: Activity,
    color: 'red',
    path: '/outbreaks',
  },
  {
    id: 'campaigns',
    title: 'Vaccination Campaigns',
    description: 'Plan and monitor vaccination campaigns and coverage',
    icon: Syringe,
    color: 'green',
    path: '/campaigns',
  },
  {
    id: 'risks',
    title: 'Regional Risk Assessment',
    description: 'Evaluate disease outbreak risk levels by region',
    icon: MapPin,
    color: 'orange',
    path: '/risks',
  },
  {
    id: 'reports',
    title: 'Surveillance Reports',
    description: 'Disease surveillance data and trend reports',
    icon: FileText,
    color: 'blue',
    path: '/reports',
  },
  {
    id: 'resources',
    title: 'Resource Allocation',
    description: 'Manage medical supplies, equipment and personnel',
    icon: Package,
    color: 'purple',
    path: '/resources',
  },
  {
    id: 'alerts',
    title: 'Public Health Alerts',
    description: 'Issue and manage public health warnings and advisories',
    icon: Bell,
    color: 'yellow',
    path: '/alerts',
  },
  {
    id: 'epidata',
    title: 'Epidemiological Data',
    description: 'Historical disease data, transmission and mortality rates',
    icon: BarChart3,
    color: 'indigo',
    path: '/epidata',
  },
  {
    id: 'inventory',
    title: 'Vaccine Inventory',
    description: 'Track vaccine stock, storage and expiration dates',
    icon: Warehouse,
    color: 'teal',
    path: '/inventory',
  },
  {
    id: 'facilities',
    title: 'Healthcare Facilities',
    description: 'Monitor hospital capacity, ICU beds and staff',
    icon: Building2,
    color: 'cyan',
    path: '/facilities',
  },
  {
    id: 'ai',
    title: 'AI Analysis',
    description: 'AI-powered outbreak prediction, risk and resource analysis',
    icon: Brain,
    color: 'pink',
    path: '/ai-analysis',
  },
  {
    id: 'predict-disease',
    title: 'Disease Prediction',
    description: 'Structured AI disease prediction with probability scores',
    icon: Stethoscope,
    color: 'blue',
    path: '/predict-disease',
  },
  {
    id: 'risk-factors',
    title: 'Risk Factor Analysis',
    description: 'Personalized disease risk profile from demographics',
    icon: Shield,
    color: 'teal',
    path: '/risk-factors',
  },
  {
    id: 'drug-interactions',
    title: 'Drug Interactions',
    description: 'AI-powered drug interaction checker with severity levels',
    icon: Pill,
    color: 'red',
    path: '/drug-interactions',
  },
  {
    id: 'differential',
    title: 'Differential Diagnosis',
    description: 'Ranked differential with diagnostic workup plan',
    icon: Brain,
    color: 'purple',
    path: '/differential-diagnosis',
  },
  {
    id: 'population',
    title: 'Population Analytics',
    description: 'Disease prevalence and demographic breakdowns',
    icon: Users,
    color: 'indigo',
    path: '/population-analytics',
  },
  {
    id: 'patient-history',
    title: 'Patient History',
    description: 'Patient AI prediction history timeline view',
    icon: Clock,
    color: 'cyan',
    path: '/patient-history',
  },
  {
    id: 'ai-history',
    title: 'AI History',
    description: 'Paginated history of all AI forecasts and analyses',
    icon: BarChart3,
    color: 'orange',
    path: '/ai-history',
  },
];

const colorMap = {
  red: 'from-red-500 to-red-600 shadow-red-200',
  green: 'from-green-500 to-green-600 shadow-green-200',
  orange: 'from-orange-500 to-orange-600 shadow-orange-200',
  blue: 'from-blue-500 to-blue-600 shadow-blue-200',
  purple: 'from-purple-500 to-purple-600 shadow-purple-200',
  yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-200',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
  teal: 'from-teal-500 to-teal-600 shadow-teal-200',
  cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-200',
  pink: 'from-pink-500 to-pink-600 shadow-pink-200',
  violet: 'from-violet-500 to-violet-600 shadow-violet-200',
};

const bgColorMap = {
  red: 'bg-red-50 border-red-200 hover:border-red-300',
  green: 'bg-green-50 border-green-200 hover:border-green-300',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-300',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300',
  indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-300',
  teal: 'bg-teal-50 border-teal-200 hover:border-teal-300',
  cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300',
  pink: 'bg-pink-50 border-pink-200 hover:border-pink-300',
  violet: 'bg-violet-50 border-violet-200 hover:border-violet-300',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Global Disease Outbreak Prediction & Response Platform</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Outbreaks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.outbreaks?.active || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.outbreaks?.total || 0} total tracked</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">People Vaccinated</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.campaigns?.total_vaccinated ? (parseInt(stats.campaigns.total_vaccinated) / 1000000).toFixed(0) + 'M' : '0'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Syringe className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.campaigns?.total || 0} active campaigns</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.alerts?.active || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.alerts?.total || 0} total alerts</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Facility Occupancy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.facilities?.total_capacity
                    ? Math.round((parseInt(stats.facilities.total_occupancy) / parseInt(stats.facilities.total_capacity)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.facilities?.total || 0} facilities monitored</p>
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className={`card border ${bgColorMap[feature.color]} p-5 text-left hover:shadow-md transition-all duration-200 group cursor-pointer`}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorMap[feature.color]} shadow-lg mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{feature.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
