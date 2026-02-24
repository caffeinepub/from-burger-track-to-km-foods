import { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Users, ClipboardList, DollarSign, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/attendance', label: 'Attendance', icon: ClipboardList },
  { path: '/sales', label: 'Sales & Expenses', icon: DollarSign },
  { path: '/staff', label: 'Staff', icon: Users },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-charcoal border-b border-charcoal-light sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/burger-logo.dim_128x128.png"
              alt="KM Foods Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-lg font-black text-amber tracking-tight leading-none">KM Foods</h1>
              <p className="text-xs text-charcoal-muted font-medium">Staff & Sales Manager</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? currentPath === '/' : currentPath.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-amber text-charcoal-dark'
                      : 'text-charcoal-muted hover:text-amber hover:bg-charcoal-light'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-charcoal-muted hover:text-amber p-2 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden bg-charcoal border-t border-charcoal-light px-4 pb-4">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? currentPath === '/' : currentPath.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold mt-1 transition-all ${
                    isActive
                      ? 'bg-amber text-charcoal-dark'
                      : 'text-charcoal-muted hover:text-amber hover:bg-charcoal-light'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-charcoal border-t border-charcoal-light py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-charcoal-muted">
          <span>© {new Date().getFullYear()} KM Foods — Staff & Sales Manager</span>
          <span className="flex items-center gap-1">
            Built with{' '}
            <span className="text-red-accent">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'km-foods')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
