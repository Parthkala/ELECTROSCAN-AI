import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  CheckSquare,
  History as HistoryIcon,
  Cpu,
  BarChart3,
  Settings as SettingsIcon,
  Zap,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentScreen, setCurrentScreen, projectCount, pendingReviews }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload & Process', icon: UploadCloud },
    { id: 'review', label: 'Review & Verify', icon: CheckSquare, badge: pendingReviews > 0 ? pendingReviews : null },
    { id: 'history', label: 'History', icon: HistoryIcon, badge: projectCount > 0 ? projectCount : null },
    { id: 'symbols', label: 'Symbol Library', icon: Cpu },
    { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0B3D91] text-white flex flex-col justify-between flex-shrink-0 select-none shadow-xl z-20">
      <div>
        {/* Logo and Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-blue-900/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              ElectroScan <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-semibold border border-blue-400/30">AI</span>
            </h1>
            <p className="text-[11px] text-blue-200/70 font-medium">Electrical Takeoff Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 translate-x-1'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-200/70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-blue-600' : 'bg-amber-400 text-slate-900'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tagline & System status at bottom */}
      <div className="p-4 border-t border-blue-900/60 bg-blue-950/40">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-200/90">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Offline Engine Ready</span>
        </div>
        <p className="text-[11px] leading-relaxed text-blue-200/60 italic">
          "From manual counting to intelligent estimating."
        </p>
      </div>
    </aside>
  );
}
