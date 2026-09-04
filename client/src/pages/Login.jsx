import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, ChevronRight, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pulseEvents = [
    'Process monitor: active',
    'eBPF probes: attached',
    'ML models: loaded (6/6)',
    'Heartbeat: 30s interval',
    'Threat detection: running',
  ];

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-surface/30 border-r border-border-bright/20">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 hero-bg" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-widest text-white font-mono">ARCDIS</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-10 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            SYSTEM OPERATIONAL
          </div>

          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Intelligent Endpoint<br />
            <span className="text-gradient">Defense for Linux.</span>
          </h2>

          <p className="text-text_muted mb-8 max-w-md">
            Sign in to monitor your endpoints, review attack telemetry, and manage your ARCDIS agents.
          </p>

          {/* Live status feed */}
          <div className="w-full max-w-sm rounded-xl border border-border-bright/20 bg-background/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono text-text_muted">Agent Status Feed</span>
            </div>
            <div className="space-y-2">
              {pulseEvents.map((evt, i) => (
                <motion.div
                  key={evt}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-400">{evt}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 pt-0">
          <p className="text-xs text-text_muted">© 2026 ARCDIS</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-widest text-white font-mono">ARCDIS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-text_muted">Sign in to your security console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3.5 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text_muted uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@arcdis.local"
                className="w-full px-4 py-3 rounded-xl border border-border-bright/30 bg-surface/60 text-white placeholder:text-text_muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text_muted uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border-bright/30 bg-surface/60 text-white placeholder:text-text_muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text_muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-glow hover:shadow-glow-lg text-sm"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>Sign In <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text_muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary_dark font-medium transition-colors">
              Create account
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border-bright/20">
            <p className="text-xs text-text_muted text-center">
              Protected by JWT authentication. Your session expires automatically.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
