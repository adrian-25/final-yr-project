import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-surface/50 backdrop-blur-sm flex-shrink-0">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text_muted" />
        <input
          type="text"
          placeholder="Search events, agents..."
          className="w-64 pl-9 pr-4 py-1.5 text-sm bg-background/60 border border-border rounded-lg text-text_muted focus:outline-none focus:border-primary/40 placeholder:text-text_muted transition-colors"
        />
      </div>

      <div className="flex-1 md:flex-none" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* System status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs font-mono text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          OPERATIONAL
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-text_muted hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
