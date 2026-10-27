import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  Crosshair,
  Layers,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function CanvasViewer({
  sheets = [],
  detections = [],
  symbols = [],
  activeSheetId,
  setActiveSheetId,
  onUpdateDetection,
  onAddManualDetection,
  focusedDetection,
  setFocusedDetection,
  isManualMode,
  setIsManualMode,
  manualSymbolId,
  setManualSymbolId
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const sheetDetections = detections.filter(d => d.sheet_id === activeSheet?.id);

  // Focus and zoom when focusedDetection changes
  useEffect(() => {
    if (focusedDetection && focusedDetection.sheet_id === activeSheet?.id && containerRef.current) {
      const container = containerRef.current;
      const cW = container.clientWidth;
      const cH = container.clientHeight;

      const dX = (focusedDetection.bbox_x0 + focusedDetection.bbox_x1) / 2.0;
      const dY = (focusedDetection.bbox_y0 + focusedDetection.bbox_y1) / 2.0;

      const targetScale = 2.4;
      setScale(targetScale);
      setPosition({
        x: cW / 2 - dX * (activeSheet.width_px * (cW / activeSheet.width_px)) * targetScale,
        y: cH / 2 - dY * (activeSheet.height_px * (cW / activeSheet.width_px)) * targetScale
      });
    }
  }, [focusedDetection, activeSheet]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 6.0));
  };

  const handleMouseDown = (e) => {
    if (isManualMode) {
      handleManualAddClick(e);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    if (containerRef.current && activeSheet) {
      const cW = containerRef.current.clientWidth;
      const imgW = activeSheet.width_px / 1.5;
      const fitScale = Math.min(cW / imgW, 1);
      setScale(fitScale);
    } else {
      setScale(0.5);
    }
    setPosition({ x: 0, y: 0 });
    setFocusedDetection(null);
  };

  const handleManualAddClick = (e) => {
    if (!containerRef.current || !activeSheet) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - position.x) / scale;
    const clickY = (e.clientY - rect.top - position.y) / scale;

    const normX = clickX / rect.width;
    const normY = clickY / rect.height;

    const boxSize = 0.025; // standard box size
    const bbox = [
      Math.max(0, normX - boxSize / 2),
      Math.max(0, normY - boxSize / 2),
      Math.min(1, normX + boxSize / 2),
      Math.min(1, normY + boxSize / 2)
    ];

    onAddManualDetection(activeSheet.id, manualSymbolId || symbols[0]?.id, bbox);
    setIsManualMode(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'auto':
        return 'border-blue-600 bg-blue-500/15 text-blue-700';
      case 'flagged':
        return 'border-amber-500 border-dashed bg-amber-500/20 text-amber-900 animate-pulse';
      case 'kept':
        return 'border-emerald-600 bg-emerald-500/20 text-emerald-800';
      case 'rejected':
        return 'border-red-500 bg-red-500/20 text-red-700 line-through';
      case 'manual':
        return 'border-cyan-500 bg-cyan-500/25 text-cyan-800';
      default:
        return 'border-slate-500 bg-slate-500/15 text-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative select-none">
      {/* Top Sheet Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sheets.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSheetId(s.id);
                setFocusedDetection(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSheet?.id === s.id
                  ? 'bg-[#0B3D91] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{s.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSheet?.id === s.id ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
              }`}>
                {detections.filter(d => d.sheet_id === s.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Manual Pin Tool */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setIsManualMode(!isManualMode)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                isManualMode ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isManualMode ? 'Click drawing to pin' : 'Add Missing Symbol'}</span>
            </button>
            {isManualMode && (
              <select
                value={manualSymbolId}
                onChange={(e) => setManualSymbolId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 font-medium text-slate-800"
              >
                {symbols.map(sym => (
                  <option key={sym.id} value={sym.id}>{sym.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700">
            <button
              onClick={() => setScale(s => Math.max(s * 0.8, 0.4))}
              className="p-1.5 hover:bg-white rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-slate-700">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(s * 1.25, 6.0))}
              className="p-1.5 hover:bg-white rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-white rounded transition border-l border-slate-200 ml-0.5"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Pan/Zoom Stage */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative overflow-auto bg-slate-950 ${
          isManualMode ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')
        }`}
      >
        {activeSheet ? (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="relative shadow-2xl rounded-sm overflow-hidden"
          >
            <img
              src={`/api/sheets/${activeSheet.id}/image`}
              alt={activeSheet.name}
              onLoad={() => setImageLoaded(true)}
              className="max-w-none pointer-events-none select-none block"
              style={{ width: `${activeSheet.width_px / 1.5}px` }}
            />

            {/* Bounding Boxes Layer */}
            {sheetDetections.map((det) => {
              const isSelected = focusedDetection?.id === det.id;
              const x0Pct = det.bbox_x0 * 100;
              const y0Pct = det.bbox_y0 * 100;
              const wPct = (det.bbox_x1 - det.bbox_x0) * 100;
              const hPct = (det.bbox_y1 - det.bbox_y0) * 100;

              return (
                <div
                  key={det.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedDetection(det);
                  }}
                  style={{
                    left: `${x0Pct}%`,
                    top: `${y0Pct}%`,
                    width: `${wPct}%`,
                    height: `${hPct}%`,
                  }}
                  className={`absolute border-2 cursor-pointer transition-all duration-150 rounded-sm ${getStatusColor(det.status)} ${
                    isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 z-30 scale-110 shadow-lg' : 'hover:scale-105 hover:z-20'
                  }`}
                  title={`${det.symbol_name} (${Math.round(det.confidence * 100)}%) - Grid ${det.grid_ref}`}
                >
                  {/* Subtle Grid / Confidence Tag */}
                  <span className="absolute -top-3.5 left-0 text-[8px] font-mono font-bold px-1 rounded bg-slate-900/90 text-white pointer-events-none whitespace-nowrap">
                    {det.grid_ref} · {Math.round(det.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No sheet selected</div>
        )}

        {/* Selected Box Inspection Popover */}
        {focusedDetection && (
          <div className="absolute bottom-6 left-6 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Click-to-Source Verification
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  {focusedDetection.symbol_name}
                </h4>
              </div>
              <button
                onClick={() => setFocusedDetection(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-semibold block">Grid Coordinate</span>
                <span className="font-bold text-slate-800 text-sm">{focusedDetection.grid_ref}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-semibold block">AI Confidence</span>
                <span className={`font-bold text-sm ${focusedDetection.confidence >= 0.8 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {Math.round(focusedDetection.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Quick Actions: Keep / Reject / Reclassify */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  onUpdateDetection(focusedDetection.id, { status: 'kept' });
                  setFocusedDetection(prev => ({ ...prev, status: 'kept' }));
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  focusedDetection.status === 'kept'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Keep</span>
              </button>

              <button
                onClick={() => {
                  onUpdateDetection(focusedDetection.id, { status: 'rejected' });
                  setFocusedDetection(prev => ({ ...prev, status: 'rejected' }));
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  focusedDetection.status === 'rejected'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <select
                value={focusedDetection.symbol_id}
                onChange={(e) => {
                  const newSymId = e.target.value;
                  const symObj = symbols.find(s => s.id === newSymId);
                  onUpdateDetection(focusedDetection.id, { symbol_id: newSymId });
                  setFocusedDetection(prev => ({ ...prev, symbol_id: newSymId, symbol_name: symObj?.name }));
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
              >
                {symbols.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
