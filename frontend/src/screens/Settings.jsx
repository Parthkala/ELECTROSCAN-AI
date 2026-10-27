import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, User, Sliders, Shield } from 'lucide-react';
import { api } from '../api';

export default function Settings({ user }) {
  const [settings, setSettings] = useState({
    auto_threshold: '0.80',
    score_floor: '0.55',
    nms_iou: '0.30',
    company_name: 'ElectroScan Estimating Inc.',
    theme_accent: '#2563EB'
  });
  const [symbols, setSymbols] = useState([]);
  const [rates, setRates] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [s, syms] = await Promise.all([
        api.getSettings(),
        api.getSymbols()
      ]);
      setSettings(prev => ({ ...prev, ...s }));
      setSymbols(syms);
      const rMap = {};
      syms.forEach(sym => {
        rMap[sym.id] = sym.default_unit_rate;
      });
      setRates(rMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      for (const [symId, rate] of Object.entries(rates)) {
        await api.updateSymbol(symId, { rate: parseFloat(rate) || 0 });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F8FAFC]">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure default AI confidence floors, NMS thresholds, and default symbol unit rates.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings and unit rates updated successfully.</span>
          </div>
        )}

        {/* AI Engine Preferences */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Model & Detection Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Auto-Accept Threshold (0.60 – 0.95)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.60"
                max="0.95"
                value={settings.auto_threshold}
                onChange={(e) => setSettings({ ...settings, auto_threshold: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Detections above this are automatically verified.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Score Floor (0.40 – 0.70)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.40"
                max="0.70"
                value={settings.score_floor}
                onChange={(e) => setSettings({ ...settings, score_floor: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Matches below this are discarded as background lines.</p>
            </div>
          </div>
        </div>

        {/* Default Unit Rates */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Default Unit Rates for Takeoff Estimates
          </h3>

          <div className="space-y-3">
            {symbols.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{s.category}</span>
                </div>
                <div className="flex items-center gap-1 w-32">
                  <span className="text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={rates[s.id] || 0}
                    onChange={(e) => setRates({ ...rates, [s.id]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimator Profile */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Estimator Account Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Name</span>
              <span className="font-bold text-slate-900">{user?.name || 'Parth Kala'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Username</span>
              <span className="font-mono text-slate-900">{user?.username || 'parth'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-blue-700">{user?.role || 'Lead Estimator'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Company</span>
              <span className="font-semibold text-slate-900">{settings.company_name}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}
