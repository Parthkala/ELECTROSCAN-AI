import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Table as TableIcon,
  ListFilter,
  History,
  Check,
  X,
  Keyboard
} from 'lucide-react';
import { api } from '../api';
import CanvasViewer from '../components/CanvasViewer';

export default function Review({ projectId, user }) {
  const [projectData, setProjectData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'queue' | 'audit'
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [focusedDetection, setFocusedDetection] = useState(null);
  const [threshold, setThreshold] = useState(0.80);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualSymbolId, setManualSymbolId] = useState('');
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Global Keyboard shortcuts for Review Queue: 'k' to keep, 'r' to reject
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!focusedDetection) return;
      if (e.key === 'k' || e.key === 'K') {
        handleUpdateDetection(focusedDetection.id, { status: 'kept' });
      } else if (e.key === 'r' || e.key === 'R') {
        handleUpdateDetection(focusedDetection.id, { status: 'rejected' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedDetection]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await api.getProjectDetails(projectId);
      setProjectData(data);
      if (data.sheets && data.sheets.length > 0) {
        setActiveSheetId(data.sheets[0].id);
      }
      if (data.symbols && data.symbols.length > 0) {
        setManualSymbolId(data.symbols[0].id);
      }
      const logs = await api.getAuditLog(projectId);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetection = async (detId, patchData) => {
    try {
      const updated = await api.updateDetection(detId, { ...patchData, username: user?.username || 'parth' });
      // Update local state instantly
      setProjectData(prev => {
        if (!prev) return prev;
        const newDets = prev.detections.map(d => d.id === detId ? { ...d, ...patchData } : d);

        // Recompute summary
        const autoCnt = newDets.filter(d => d.status === 'auto').length;
        const flaggedCnt = newDets.filter(d => d.status === 'flagged').length;
        const keptCnt = newDets.filter(d => d.status === 'kept').length;
        const rejectedCnt = newDets.filter(d => d.status === 'rejected').length;
        const manualCnt = newDets.filter(d => d.status === 'manual').length;

        const bySym = { ...prev.summary.by_symbol };
        for (const sName of Object.keys(bySym)) {
          const sId = bySym[sName].id;
          const sDets = newDets.filter(d => d.symbol_id === sId);
          bySym[sName] = {
            ...bySym[sName],
            total: sDets.length,
            auto: sDets.filter(d => d.status === 'auto').length,
            flagged: sDets.filter(d => d.status === 'flagged').length,
            kept: sDets.filter(d => d.status === 'kept').length,
            rejected: sDets.filter(d => d.status === 'rejected').length,
            manual: sDets.filter(d => d.status === 'manual').length,
          };
        }

        return {
          ...prev,
          detections: newDets,
          summary: {
            ...prev.summary,
            auto: autoCnt,
            flagged: flaggedCnt,
            kept: keptCnt,
            rejected: rejectedCnt,
            manual: manualCnt,
            by_symbol: bySym
          }
        };
      });

      // Refresh audit logs
      const logs = await api.getAuditLog(projectId);
      setAuditLogs(logs);

      // Auto advance to next flagged item if in queue mode
      if (activeTab === 'queue' && focusedDetection?.id === detId) {
        const nextFlagged = projectData?.detections.find(d => d.status === 'flagged' && d.id !== detId);
        setFocusedDetection(nextFlagged || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualDetection = async (sheetId, symbolId, bbox) => {
    try {
      await api.addManualDetection(projectId, {
        sheet_id: sheetId,
        symbol_id: symbolId,
        bbox,
        username: user?.username || 'parth'
      });
      await loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleThresholdChange = async (newVal) => {
    setThreshold(newVal);
    try {
      await api.reclassifyThreshold(projectId, newVal);
      await loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSymbolRow = (symbolName) => {
    const symObj = projectData?.symbols.find(s => s.name === symbolName);
    if (!symObj) return;
    const firstDet = projectData?.detections.find(d => d.symbol_id === symObj.id && d.sheet_id === activeSheetId);
    if (firstDet) {
      setFocusedDetection(firstDet);
    }
  };

  if (loading) {
    return <div className="flex-1 p-8 text-slate-500 font-medium">Loading takeoff verification canvas...</div>;
  }

  if (!projectData) {
    return <div className="flex-1 p-8 text-slate-500">Project details unavailable.</div>;
  }

  const flaggedDetections = projectData.detections.filter(d => d.status === 'flagged');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Hero Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{projectData.project.name}</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              Takeoff Ready
            </span>
          </h2>
          <span className="text-xs text-slate-400">· {projectData.sheets.length} Sheet(s)</span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/projects/${projectId}/export/excel`}
            download
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </a>
          <a
            href={`/api/projects/${projectId}/export/csv`}
            download
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </a>
          <a
            href={`/api/projects/${projectId}/export/pdf`}
            download
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </a>
        </div>
      </div>

      {/* Main Workspace (Split View: Canvas Left, Inspector Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Interactive Canvas */}
        <CanvasViewer
          sheets={projectData.sheets}
          detections={projectData.detections}
          symbols={projectData.symbols}
          activeSheetId={activeSheetId}
          setActiveSheetId={setActiveSheetId}
          onUpdateDetection={handleUpdateDetection}
          onAddManualDetection={handleAddManualDetection}
          focusedDetection={focusedDetection}
          setFocusedDetection={setFocusedDetection}
          isManualMode={isManualMode}
          setIsManualMode={setIsManualMode}
          manualSymbolId={manualSymbolId}
          setManualSymbolId={setManualSymbolId}
        />

        {/* Right: Takeoff Inspector Sidebar */}
        <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col flex-shrink-0 shadow-lg z-20">
          {/* Tabs Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-1 gap-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'queue' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Review Queue</span>
              {flaggedDetections.length > 0 && (
                <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-bold">
                  {flaggedDetections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* Tab 1: Summary Counts Table */}
          {activeTab === 'summary' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Overall Counts Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-slate-500 text-[10px] block font-semibold">Total Verified</span>
                  <span className="font-bold text-blue-700 text-lg">
                    {projectData.summary.auto + projectData.summary.kept + projectData.summary.manual}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="text-slate-500 text-[10px] block font-semibold">Flagged / Pending</span>
                  <span className="font-bold text-amber-600 text-lg">{projectData.summary.flagged}</span>
                </div>
                <div className="p-2.5 bg-red-50/70 rounded-xl border border-red-100">
                  <span className="text-slate-500 text-[10px] block font-semibold">Rejected</span>
                  <span className="font-bold text-red-600 text-lg">{projectData.summary.rejected}</span>
                </div>
              </div>

              {/* Live Threshold Slider */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Auto-Accept Threshold
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{Math.round(threshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.60"
                  max="0.95"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Detections with confidence below this threshold are routed to human review.
                </p>
              </div>

              {/* Per-Symbol Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Takeoff Quantity by Symbol
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {Object.entries(projectData.summary.by_symbol || {}).map(([sName, sData]) => {
                    const verifiedQty = sData.auto + sData.kept + sData.manual;
                    const totalCost = verifiedQty * sData.rate;

                    return (
                      <div
                        key={sName}
                        onClick={() => handleSelectSymbolRow(sName)}
                        className="p-3 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{sName}</p>
                          <p className="text-[11px] text-slate-400">
                            Auto: {sData.auto} · Kept: {sData.kept} · Flagged: {sData.flagged} · Manual: {sData.manual}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{verifiedQty} units</p>
                          <p className="text-[11px] font-semibold text-emerald-600">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Review Queue */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-600">
                  {flaggedDetections.length} item(s) need human inspection
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Keyboard className="w-3.5 h-3.5" />
                  K = Keep, R = Reject
                </span>
              </div>

              {flaggedDetections.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">All Items Verified!</p>
                  <p className="text-xs text-emerald-600 mt-1">There are no pending detections in the review queue.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flaggedDetections.map((det) => (
                    <div
                      key={det.id}
                      onClick={() => setFocusedDetection(det)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                        focusedDetection?.id === det.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Grid {det.grid_ref}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{det.symbol_name}</h4>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {Math.round(det.confidence * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateDetection(det.id, { status: 'kept' });
                          }}
                          className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Keep (K)</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateDetection(det.id, { status: 'rejected' });
                          }}
                          className="flex-1 py-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject (R)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Immutable Action Log</span>
                <span>{auditLogs.length} events</span>
              </div>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No user modifications recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-[11px]">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.details}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">By: {log.username}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
