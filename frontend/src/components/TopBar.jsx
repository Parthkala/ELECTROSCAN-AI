import React, { useState } from 'react';
import { Bell, User, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function TopBar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-800 text-base tracking-tight">
          ElectroScan AI Estimator Console
        </span>
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
          v1.0.0
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                <span className="text-[11px] text-blue-600 font-medium">1 new</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/60 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Sample Takeoff Ready</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Commercial Office Level 2 loaded with 100 electrical symbols.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name ? user.name.charAt(0) : 'P'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'Parth Kala'}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">{user?.role || 'Lead Estimator'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-800">{user?.name || 'Parth Kala'}</p>
                <p className="text-slate-500 truncate">{user?.email || 'parth@electroscan.ai'}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
