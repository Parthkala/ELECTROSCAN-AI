import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
  Building,
  Home,
  Factory
} from 'lucide-react';
import { api } from '../api';

export default function Upload({ onTakeoffReady }) {
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Poll job status if processing
  useEffect(() => {
    let interval;
    if (isProcessing && activeProjectId) {
      interval = setInterval(async () => {
        try {
          const status = await api.getJobStatus(activeProjectId);
          setJobStatus(status);
          if (status.status === 'completed') {
            setIsProcessing(false);
            clearInterval(interval);
            setTimeout(() => {
              onTakeoffReady(activeProjectId);
            }, 800);
          } else if (status.status === 'failed') {
            setIsProcessing(false);
            setError(status.error || 'Takeoff processing failed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error(e);
        }
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isProcessing, activeProjectId, onTakeoffReady]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!projectName) {
        setProjectName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!projectName) {
        setProjectName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartUpload = async () => {
    if (!file && !projectName) {
      setError('Please select a drawing file or choose a sample project');
      return;
    }
    setError('');
    setIsProcessing(true);
    setJobStatus({
      progress_pct: 10,
      current_step: 'Reading document',
      steps: [
        { name: 'Reading document', completed: false, active: true },
        { name: 'Rendering sheets', completed: false },
        { name: 'Detecting symbols', completed: false },
        { name: 'Scoring confidence', completed: false },
        { name: 'Building takeoff', completed: false }
      ]
    });

    try {
      let projId;
      if (file) {
        const uploadRes = await api.uploadProject(projectName || 'Custom Blueprint Takeoff', file);
        projId = uploadRes.project_id;
      } else {
        const sampleRes = await api.createSampleProject();
        projId = sampleRes.project_id;
      }
      setActiveProjectId(projId);
      await api.processProject(projId);
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Processing failed to start');
    }
  };

  const handleSelectSample = (sampleType) => {
    setFile(null);
    setProjectName(`Commercial Office Level 2 (${sampleType})`);
    handleStartSampleDirect(`Commercial Office Level 2 (${sampleType})`);
  };

  const handleStartSampleDirect = async (name) => {
    setError('');
    setIsProcessing(true);
    setJobStatus({
      progress_pct: 10,
      current_step: 'Reading document',
      steps: [
        { name: 'Reading document', completed: false, active: true },
        { name: 'Rendering sheets', completed: false },
        { name: 'Detecting symbols', completed: false },
        { name: 'Scoring confidence', completed: false },
        { name: 'Building takeoff', completed: false }
      ]
    });

    try {
      const sampleRes = await api.createSampleProject();
      setActiveProjectId(sampleRes.project_id);
      await api.processProject(sampleRes.project_id);
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Sample processing failed');
    }
  };

  if (isProcessing) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Analyzing your blueprint...</h3>
          <p className="text-xs text-slate-500 mt-1">Multi-scale symbol detection in progress</p>

          {/* Progress Bar */}
          <div className="my-6">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>{jobStatus?.current_step || 'Processing...'}</span>
              <span>{jobStatus?.progress_pct || 15}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${jobStatus?.progress_pct || 15}%` }}
              ></div>
            </div>
          </div>

          {/* Steps Checklist */}
          <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs">
            {(jobStatus?.steps || [
              { name: 'Reading document', completed: true },
              { name: 'Rendering sheets', completed: true },
              { name: 'Detecting symbols', active: true },
              { name: 'Scoring confidence', completed: false },
              { name: 'Building takeoff', completed: false }
            ]).map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : step.active ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                )}
                <span className={`font-medium ${
                  step.completed ? 'text-slate-800' : (step.active ? 'text-blue-700 font-bold' : 'text-slate-400')
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            This may take a few moments. All operations run locally offline on your CPU.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload & Process</h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide an electrical drawing to extract symbol counts and generate a verified takeoff.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Name Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Commercial Office - Level 2"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition group mb-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
            <UploadCloud className="w-6 h-6" />
          </div>
          {file ? (
            <div>
              <p className="text-sm font-bold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800">Drag & drop your blueprint here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse files</p>
              <p className="text-[11px] text-slate-400 mt-2">Supports PDF, JPG, PNG (Max 50MB)</p>
            </div>
          )}
        </div>

        {/* Or Try a Sample */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Or try a sample blueprint
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'Commercial', icon: Building, label: 'Commercial L2' },
              { type: 'Residential', icon: Home, label: 'Residential Plan' },
              { type: 'Industrial', icon: Factory, label: 'Industrial Layout' },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s.type)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-center transition group"
                >
                  <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 mx-auto mb-1.5 transition" />
                  <span className="text-xs font-bold text-slate-800 block truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Process Blueprint Button */}
        <button
          onClick={handleStartUpload}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-150"
        >
          <span>Process Blueprint</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
