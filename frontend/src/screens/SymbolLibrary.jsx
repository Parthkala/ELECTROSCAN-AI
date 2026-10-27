import React, { useState, useEffect } from 'react';
import { Cpu, Plus, Check, Edit2, Sparkles, Image as ImageIcon, DollarSign } from 'lucide-react';
import { api } from '../api';

export default function SymbolLibrary() {
  const [symbols, setSymbols] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRateId, setEditingRateId] = useState(null);
  const [rateInput, setRateInput] = useState('');

  // Teach modal state
  const [showTeachModal, setShowTeachModal] = useState(false);
  const [teachName, setTeachName] = useState('');
  const [teachCategory, setTeachCategory] = useState('Custom Lighting');
  const [teachRate, setTeachRate] = useState('450.00');
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [syms, projs] = await Promise.all([
        api.getSymbols(),
        api.getProjects()
      ]);
      setSymbols(syms);
      setProjects(projs);

      if (projs.length > 0) {
        const firstProj = projs[0];
        const details = await api.getProjectDetails(firstProj.id);
        if (details.sheets && details.sheets.length > 0) {
          setAvailableSheets(details.sheets);
          setSelectedSheetId(details.sheets[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRate = async (symbolId) => {
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val >= 0) {
      await api.updateSymbol(symbolId, { rate: val });
      setSymbols(prev => prev.map(s => s.id === symbolId ? { ...s, default_unit_rate: val } : s));
    }
    setEditingRateId(null);
  };

  const handleTeachSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSheetId || !teachName) return;

    try {
      // Default crop sample area
      const crop_box = [0.24, 0.31, 0.27, 0.34];
      await api.teachSymbol({
        sheet_id: parseInt(selectedSheetId),
        name: teachName,
        category: teachCategory,
        unit_rate: parseFloat(teachRate) || 45.0,
        crop_box
      });
      setShowTeachModal(false);
      setTeachName('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Error teaching symbol');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Symbol Library</h2>
          <p className="text-sm text-slate-500 mt-1">
            Standard electrical symbols and custom taught visual templates for computer vision matching.
          </p>
        </div>

        <button
          onClick={() => setShowTeachModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Teach a Symbol</span>
        </button>
      </div>

      {/* Symbol Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {symbols.map((sym) => {
          const isEditing = editingRateId === sym.id;
          return (
            <div key={sym.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {sym.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{sym.name}</h3>
                  </div>
                  {sym.is_builtin ? (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Standard
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Custom Taught
                    </span>
                  )}
                </div>

                {/* Template Thumbnail */}
                <div className="h-32 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-4 mb-4">
                  <img
                    src={`/api/symbols/${sym.id}/template.png`}
                    alt={sym.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Editable Rate and Threshold */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit Rate</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-bold border border-blue-500 rounded-lg"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRate(sym.id)}
                        className="p-1 bg-emerald-600 text-white rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingRateId(sym.id);
                        setRateInput(sym.default_unit_rate);
                      }}
                      className="flex items-center gap-1 cursor-pointer group mt-0.5"
                    >
                      <span className="text-base font-bold text-slate-900">₹{sym.default_unit_rate.toFixed(2)}</span>
                      <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Min Confidence</span>
                  <span className="text-sm font-bold text-slate-700 mt-0.5 block">{Math.round(sym.default_threshold * 100)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Teach Modal */}
      {showTeachModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Teach a New Symbol</h3>
            <p className="text-xs text-slate-500 mb-4">
              Capture a custom symbol directly from a drawing to expand the takeoff detector.
            </p>

            <form onSubmit={handleTeachSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Symbol Name</label>
                <input
                  type="text"
                  required
                  value={teachName}
                  onChange={(e) => setTeachName(e.target.value)}
                  placeholder="e.g. Emergency Exit Light"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={teachCategory}
                  onChange={(e) => setTeachCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Unit Rate (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={teachRate}
                  onChange={(e) => setTeachRate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Source Sheet</label>
                <select
                  value={selectedSheetId}
                  onChange={(e) => setSelectedSheetId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {availableSheets.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeachModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition"
                >
                  Capture & Train Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
