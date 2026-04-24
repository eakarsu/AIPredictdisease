import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit3, Eye, X, ChevronLeft, ArrowUpDown } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

// Feature configurations
const featureConfig = {
  outbreaks: {
    title: 'Disease Outbreaks',
    endpoint: '/outbreaks',
    listColumns: ['disease_name', 'location', 'region', 'severity', 'cases_reported', 'status'],
    columnLabels: {
      disease_name: 'Disease', location: 'Location', region: 'Region', severity: 'Severity',
      cases_reported: 'Cases', deaths: 'Deaths', status: 'Status', start_date: 'Start Date',
      end_date: 'End Date', description: 'Description'
    },
    formFields: [
      { name: 'disease_name', label: 'Disease Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'moderate', 'high', 'critical'], required: true },
      { name: 'cases_reported', label: 'Cases Reported', type: 'number', required: true },
      { name: 'deaths', label: 'Deaths', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'contained', 'monitoring', 'resolved'] },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    severityField: 'severity',
    statusField: 'status',
  },
  campaigns: {
    title: 'Vaccination Campaigns',
    endpoint: '/campaigns',
    listColumns: ['campaign_name', 'disease_target', 'region', 'vaccine_type', 'status'],
    columnLabels: {
      campaign_name: 'Campaign', disease_target: 'Disease Target', region: 'Region',
      vaccine_type: 'Vaccine Type', target_population: 'Target Pop.', vaccinated_count: 'Vaccinated',
      status: 'Status', start_date: 'Start Date', end_date: 'End Date', budget: 'Budget', description: 'Description'
    },
    formFields: [
      { name: 'campaign_name', label: 'Campaign Name', type: 'text', required: true },
      { name: 'disease_target', label: 'Disease Target', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'target_population', label: 'Target Population', type: 'number', required: true },
      { name: 'vaccinated_count', label: 'Vaccinated Count', type: 'number' },
      { name: 'vaccine_type', label: 'Vaccine Type', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['planned', 'active', 'completed', 'suspended'] },
      { name: 'budget', label: 'Budget ($)', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    statusField: 'status',
  },
  risks: {
    title: 'Regional Risk Assessment',
    endpoint: '/risks',
    listColumns: ['region', 'country', 'risk_level', 'risk_score', 'healthcare_capacity'],
    columnLabels: {
      region: 'Region', country: 'Country', risk_level: 'Risk Level', risk_score: 'Risk Score',
      population: 'Population', healthcare_capacity: 'Healthcare Capacity', primary_threats: 'Primary Threats',
      last_outbreak_date: 'Last Outbreak', infrastructure_rating: 'Infrastructure', notes: 'Notes'
    },
    formFields: [
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'country', label: 'Country', type: 'text', required: true },
      { name: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'moderate', 'high', 'critical'], required: true },
      { name: 'risk_score', label: 'Risk Score (0-10)', type: 'number', required: true },
      { name: 'population', label: 'Population', type: 'number', required: true },
      { name: 'healthcare_capacity', label: 'Healthcare Capacity', type: 'select', options: ['low', 'moderate', 'high'] },
      { name: 'primary_threats', label: 'Primary Threats', type: 'text' },
      { name: 'last_outbreak_date', label: 'Last Outbreak Date', type: 'date' },
      { name: 'infrastructure_rating', label: 'Infrastructure Rating', type: 'select', options: ['poor', 'moderate', 'good', 'excellent'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    severityField: 'risk_level',
  },
  reports: {
    title: 'Surveillance Reports',
    endpoint: '/reports',
    listColumns: ['report_title', 'disease', 'region', 'case_count', 'trend', 'confidence_level'],
    columnLabels: {
      report_title: 'Title', disease: 'Disease', region: 'Region', report_date: 'Date',
      reporter: 'Reporter', case_count: 'Case Count', trend: 'Trend',
      confidence_level: 'Confidence', data_source: 'Data Source', summary: 'Summary'
    },
    formFields: [
      { name: 'report_title', label: 'Report Title', type: 'text', required: true },
      { name: 'disease', label: 'Disease', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'report_date', label: 'Report Date', type: 'date', required: true },
      { name: 'reporter', label: 'Reporter', type: 'text', required: true },
      { name: 'case_count', label: 'Case Count', type: 'number', required: true },
      { name: 'trend', label: 'Trend', type: 'select', options: ['increasing', 'stable', 'decreasing'], required: true },
      { name: 'confidence_level', label: 'Confidence Level', type: 'select', options: ['low', 'moderate', 'high'], required: true },
      { name: 'data_source', label: 'Data Source', type: 'text' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
    ],
  },
  resources: {
    title: 'Resource Allocation',
    endpoint: '/resources',
    listColumns: ['resource_name', 'resource_type', 'allocated_to', 'quantity', 'priority', 'status'],
    columnLabels: {
      resource_name: 'Resource', resource_type: 'Type', allocated_to: 'Allocated To',
      region: 'Region', quantity: 'Quantity', unit: 'Unit', status: 'Status',
      priority: 'Priority', cost: 'Cost', allocation_date: 'Date', notes: 'Notes'
    },
    formFields: [
      { name: 'resource_name', label: 'Resource Name', type: 'text', required: true },
      { name: 'resource_type', label: 'Resource Type', type: 'select', options: ['PPE', 'Antiviral', 'Medical Supply', 'Diagnostic', 'Equipment', 'Prevention', 'Storage', 'Infrastructure', 'Pharmaceutical', 'WASH', 'Personnel', 'Logistics'], required: true },
      { name: 'allocated_to', label: 'Allocated To', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'unit', label: 'Unit', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['allocated', 'in-transit', 'delivered', 'deployed', 'standby'] },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'moderate', 'high', 'critical'], required: true },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'allocation_date', label: 'Allocation Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    severityField: 'priority',
    statusField: 'status',
  },
  alerts: {
    title: 'Public Health Alerts',
    endpoint: '/alerts',
    listColumns: ['alert_title', 'alert_type', 'severity', 'region', 'issued_by', 'status'],
    columnLabels: {
      alert_title: 'Title', alert_type: 'Type', severity: 'Severity', region: 'Region',
      disease: 'Disease', issued_date: 'Issued Date', expiry_date: 'Expiry Date',
      issued_by: 'Issued By', status: 'Status', message: 'Message'
    },
    formFields: [
      { name: 'alert_title', label: 'Alert Title', type: 'text', required: true },
      { name: 'alert_type', label: 'Alert Type', type: 'select', options: ['seasonal', 'emerging threat', 'epidemic', 'PHEIC', 'advisory', 'warning', 'outbreak', 'capacity', 'supply chain', 'travel', 'food safety', 'natural disaster', 'surveillance', 'AMR'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'moderate', 'high', 'critical'], required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'disease', label: 'Disease', type: 'text' },
      { name: 'issued_date', label: 'Issued Date', type: 'datetime-local', required: true },
      { name: 'expiry_date', label: 'Expiry Date', type: 'datetime-local' },
      { name: 'issued_by', label: 'Issued By', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'resolved', 'expired'] },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
    severityField: 'severity',
    statusField: 'status',
  },
  epidata: {
    title: 'Epidemiological Data',
    endpoint: '/epidata',
    listColumns: ['disease', 'region', 'year', 'week_number', 'cases', 'deaths'],
    columnLabels: {
      disease: 'Disease', region: 'Region', year: 'Year', week_number: 'Week',
      cases: 'Cases', deaths: 'Deaths', recovery_rate: 'Recovery Rate',
      transmission_rate: 'R0', age_group: 'Age Group', data_source: 'Data Source'
    },
    formFields: [
      { name: 'disease', label: 'Disease', type: 'text', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'week_number', label: 'Week Number', type: 'number' },
      { name: 'cases', label: 'Cases', type: 'number', required: true },
      { name: 'deaths', label: 'Deaths', type: 'number' },
      { name: 'recovery_rate', label: 'Recovery Rate (%)', type: 'number' },
      { name: 'transmission_rate', label: 'Transmission Rate (R0)', type: 'number' },
      { name: 'age_group', label: 'Age Group', type: 'text' },
      { name: 'data_source', label: 'Data Source', type: 'text' },
    ],
  },
  inventory: {
    title: 'Vaccine Inventory',
    endpoint: '/inventory',
    listColumns: ['vaccine_name', 'manufacturer', 'quantity', 'storage_location', 'expiry_date', 'status'],
    columnLabels: {
      vaccine_name: 'Vaccine', manufacturer: 'Manufacturer', batch_number: 'Batch',
      quantity: 'Quantity', storage_location: 'Storage Location', storage_temp: 'Storage Temp',
      manufacture_date: 'Mfg Date', expiry_date: 'Expiry Date', status: 'Status',
      unit_cost: 'Unit Cost', notes: 'Notes'
    },
    formFields: [
      { name: 'vaccine_name', label: 'Vaccine Name', type: 'text', required: true },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text', required: true },
      { name: 'batch_number', label: 'Batch Number', type: 'text', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'storage_location', label: 'Storage Location', type: 'text', required: true },
      { name: 'storage_temp', label: 'Storage Temperature', type: 'text', required: true },
      { name: 'manufacture_date', label: 'Manufacture Date', type: 'date', required: true },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'reserved', 'expired', 'depleted'] },
      { name: 'unit_cost', label: 'Unit Cost ($)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    statusField: 'status',
  },
  facilities: {
    title: 'Healthcare Facilities',
    endpoint: '/facilities',
    listColumns: ['facility_name', 'facility_type', 'region', 'capacity', 'current_occupancy', 'status'],
    columnLabels: {
      facility_name: 'Facility', facility_type: 'Type', region: 'Region', address: 'Address',
      capacity: 'Capacity', current_occupancy: 'Occupancy', icu_beds: 'ICU Beds',
      ventilators: 'Ventilators', staff_count: 'Staff', contact_number: 'Contact', status: 'Status'
    },
    formFields: [
      { name: 'facility_name', label: 'Facility Name', type: 'text', required: true },
      { name: 'facility_type', label: 'Facility Type', type: 'select', options: ['tertiary hospital', 'teaching hospital', 'general hospital', 'field hospital', 'pediatric hospital', 'national referral', 'operations center', 'research institute', 'university hospital'], required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true },
      { name: 'capacity', label: 'Capacity', type: 'number', required: true },
      { name: 'current_occupancy', label: 'Current Occupancy', type: 'number' },
      { name: 'icu_beds', label: 'ICU Beds', type: 'number' },
      { name: 'ventilators', label: 'Ventilators', type: 'number' },
      { name: 'staff_count', label: 'Staff Count', type: 'number', required: true },
      { name: 'contact_number', label: 'Contact Number', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['operational', 'strained', 'over-capacity', 'closed'] },
    ],
    statusField: 'status',
  },
};

const severityColors = {
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  contained: 'bg-yellow-100 text-yellow-800',
  monitoring: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  planned: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  operational: 'bg-green-100 text-green-800',
  strained: 'bg-orange-100 text-orange-800',
  'over-capacity': 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-800',
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-blue-100 text-blue-800',
  expired: 'bg-red-100 text-red-800',
  depleted: 'bg-gray-100 text-gray-800',
  allocated: 'bg-blue-100 text-blue-800',
  'in-transit': 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  deployed: 'bg-purple-100 text-purple-800',
  standby: 'bg-gray-100 text-gray-800',
  increasing: 'bg-red-100 text-red-800',
  stable: 'bg-blue-100 text-blue-800',
  decreasing: 'bg-green-100 text-green-800',
};

function Badge({ value, type = 'status' }) {
  if (!value) return <span className="text-gray-400">-</span>;
  const colors = type === 'severity' ? severityColors : statusColors;
  const colorClass = colors[value.toLowerCase()] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {value}
    </span>
  );
}

function formatValue(value, key) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    if (key.includes('cost') || key.includes('budget')) return '$' + value.toLocaleString();
    if (key.includes('rate')) return value + '%';
    return value.toLocaleString();
  }
  if (typeof value === 'string' && (key.includes('date') || key.includes('_at'))) {
    try {
      return new Date(value).toLocaleDateString();
    } catch { return value; }
  }
  return String(value);
}

export default function FeaturePage({ feature }) {
  const config = featureConfig[feature];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(config.endpoint);
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    fetchItems();
    setSelectedItem(null);
    setShowDetail(false);
    setShowForm(false);
  }, [feature, fetchItems]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    const initial = {};
    config.formFields.forEach(f => { initial[f.name] = ''; });
    setFormData(initial);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const data = {};
    config.formFields.forEach(f => {
      let val = item[f.name];
      if (f.type === 'date' && val) val = val.split('T')[0];
      if (f.type === 'datetime-local' && val) val = val.slice(0, 16);
      data[f.name] = val || '';
    });
    setFormData(data);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this item?`)) return;
    try {
      await api.delete(`${config.endpoint}/${item.id}`);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`${config.endpoint}/${editingItem.id}`, formData);
      } else {
        await api.post(config.endpoint, formData);
      }
      setShowForm(false);
      fetchItems();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{filteredItems.length} records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
          <button onClick={handleNew} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {config.listColumns.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {config.columnLabels[col] || col}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={config.listColumns.length + 1} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={config.listColumns.length + 1} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {config.listColumns.map(col => (
                      <td key={col} className="px-4 py-3 text-sm">
                        {col === config.severityField ? (
                          <Badge value={item[col]} type="severity" />
                        ) : col === config.statusField || col === 'trend' || col === 'confidence_level' ? (
                          <Badge value={item[col]} />
                        ) : (
                          <span className="text-gray-700">{formatValue(item[col], col)}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleRowClick(item)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Record Details" size="xl">
        {selectedItem && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedItem)
                .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className={`${key === 'description' || key === 'message' || key === 'summary' || key === 'notes' || key === 'primary_threats' || key === 'address' ? 'md:col-span-2' : ''}`}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {config.columnLabels[key] || key.replace(/_/g, ' ')}
                    </label>
                    <div className="text-sm text-gray-900">
                      {key === config?.severityField ? (
                        <Badge value={value} type="severity" />
                      ) : key === config?.statusField || key === 'trend' || key === 'confidence_level' ? (
                        <Badge value={value} />
                      ) : (
                        <p className="bg-gray-50 rounded-lg px-3 py-2">{formatValue(value, key)}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-400">
                ID: {selectedItem.id} | Created: {new Date(selectedItem.created_at).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(selectedItem)} className="btn-primary flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => handleDelete(selectedItem)} className="btn-danger flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingItem ? 'Edit Record' : 'Create New Record'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.formFields.map((field) => (
              <div key={field.name} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="input-field"
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="input-field"
                    rows={3}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="input-field"
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
