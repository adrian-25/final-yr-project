import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Shield, LayoutDashboard, ShieldAlert, Server, Download,
  BookOpen, Settings, LogOut, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Attacks', href: '/dashboard/attacks', icon: ShieldAlert },
  { label: 'Endpoints', href: '/dashboard/agents', icon: Server },
  { label: 'Deploy Agent', href: '/dashboard/download-agent', icon: Download },
];

const bottomItems = [
  { label: 'Documentation', href: '/docs', icon: BookOpen, external: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const AppSidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-surface border-r border-border transition-all duration-300 overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-border px-4 flex-shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="relative flex-shrink-0">
          <Shield className="h-6 w-6 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-ping-slow opacity-75" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-widest text-white font-mono">ARCDIS</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 py-1 text-xs font-semibold text-text_muted uppercase tracking-wider mb-2">
            Console
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text_muted hover:bg-white/5 hover:text-white'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-primary' : 'text-text_muted group-hover:text-white')} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {!collapsed && (
          <div className="my-3 border-t border-border" />
        )}
        {collapsed && <div className="my-2" />}

        {bottomItems.map((item) => (
          item.external ? (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text_muted hover:bg-white/5 hover:text-white transition-colors',
                collapsed ? 'justify-center' : ''
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0 text-text_muted group-hover:text-white" />
              {!collapsed && item.label}
            </Link>
          ) : (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  isActive ? 'bg-primary/10 text-primary' : 'text-text_muted hover:bg-white/5 hover:text-white'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-primary' : 'text-text_muted group-hover:text-white')} />
                  {!collapsed && item.label}
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border p-3 flex-shrink-0">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{user.name || user.email}</div>
              <div className="text-xs text-text_muted truncate">{user.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-text_muted hover:text-danger hover:bg-danger/10 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-text_muted hover:text-white hover:border-primary/40 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
};
