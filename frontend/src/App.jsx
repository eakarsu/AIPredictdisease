import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIAnalysis from './pages/AIAnalysis';
import Navbar from './components/Navbar';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
