import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Code2, ExternalLink } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Features', href: '/features' },
    { label: 'Architecture', href: '/architecture' },
    { label: 'Security', href: '/security' },
    { label: 'Documentation', href: '/docs' },
  ],
  Console: [
    { label: 'Sign In', href: '/login' },
    { label: 'Create Account', href: '/register' },
    { label: 'Deploy Agent', href: '/dashboard/download-agent' },
  ],
};

export const PublicFooter = () => {
  return (
    <footer className="border-t border-border-bright/20 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-widest text-white font-mono">ARCDIS</span>
            </Link>
            <p className="text-sm text-text_muted leading-relaxed max-w-xs">
              Intelligent Endpoint Defense for Linux. Detect threats, understand behavior, and stop attacks before they spread.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border-bright/30 text-text_muted hover:text-white hover:border-primary/40 transition-colors"
                aria-label="GitHub"
              >
                <Code2 className="h-4 w-4" />
              </a>
              <Link
                to="/docs"
                className="flex items-center gap-1.5 p-2 px-3 rounded-lg border border-border-bright/30 text-xs text-text_muted hover:text-white hover:border-primary/40 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Docs
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-white tracking-widest uppercase mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-text_muted hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border-bright/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text_muted">
            © 2026 ARCDIS. Intelligent Endpoint Defense for Linux.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-text_muted font-mono">SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
