import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const passwordChecks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(form.password) },
    { label: 'Passwords match', pass: form.password && form.password === form.confirm },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await register({ full_name: form.name, email: form.email, password: form.password });
      toast.success('Account created. Welcome to ARCDIS.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed. This email may already be in use.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-surface/30 border-r border-border-bright/20">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 hero-bg" />

        <div className="relative z-10 p-10">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-widest text-white font-mono">ARCDIS</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-10 pb-10">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Start protecting<br />
            <span className="text-gradient">your endpoints.</span>
          </h2>
          <p className="text-text_muted mb-8 max-w-sm">
            Create an account to deploy ARCDIS agents and start monitoring your Linux infrastructure.
          </p>

          <div className="space-y-4">
            {[
              { title: 'Deploy in 5 minutes', desc: 'One-command agent installer for Ubuntu' },
              { title: 'ML-powered detection', desc: '6 models running locally on each endpoint' },
              { title: 'Automated response', desc: 'Threats mitigated without human intervention' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-text_muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-10 pt-0">
          <p className="text-xs text-text_muted">© 2026 ARCDIS</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-widest text-white font-mono">ARCDIS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Create account</h1>
            <p className="text-text_muted">Set up your security console in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text_muted uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="Alex Operator"
                className="w-full px-4 py-3 rounded-xl border border-border-bright/30 bg-surface/60 text-white placeholder:text-text_muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text_muted uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
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
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 8 characters"
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
              {/* Password checks */}
              {form.password && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {passwordChecks.map(c => (
                    <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? 'text-primary' : 'text-text_muted'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.pass ? 'bg-primary' : 'bg-text_muted'}`} />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text_muted uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border-bright/30 bg-surface/60 text-white placeholder:text-text_muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-glow hover:shadow-glow-lg text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>Create account <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text_muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary_dark font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
