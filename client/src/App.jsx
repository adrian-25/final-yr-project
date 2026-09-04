import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Public layout + pages
import { PublicLayout } from './components/public/PublicLayout';
import { Landing } from './pages/Landing';
import { Features } from './pages/Features';
import { Architecture } from './pages/Architecture';
import { Security } from './pages/Security';
import { Docs } from './pages/Docs';

// Auth pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// App dashboard layout + pages
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Attacks } from './pages/Attacks';
import { Agents } from './pages/Agents';
import { AgentDetail } from './pages/AgentDetail';
import { DownloadAgent } from './pages/DownloadAgent';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f1629',
            color: '#f1f5f9',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0f1629' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0f1629' },
          },
        }}
      />

      <Routes>
        {/* ── Public marketing site ──────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/security" element={<Security />} />
          <Route path="/docs" element={<Docs />} />
        </Route>

        {/* ── Auth pages (no layout wrapper) ─────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Authenticated dashboard ─────────────────────────── */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="attacks" element={<Attacks />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agent/:agentId" element={<AgentDetail />} />
          <Route path="download-agent" element={<DownloadAgent />} />
          {/* Catch-all inside dashboard → redirect to overview */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* ── Legacy redirects (old routes without /dashboard prefix) */}
        <Route path="/attacks" element={<Navigate to="/dashboard/attacks" replace />} />
        <Route path="/agents" element={<Navigate to="/dashboard/agents" replace />} />
        <Route path="/download-agent" element={<Navigate to="/dashboard/download-agent" replace />} />

        {/* ── 404 ─────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
