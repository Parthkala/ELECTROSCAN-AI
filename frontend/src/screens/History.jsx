import React, { useState, useEffect } from 'react';
import { Search, FileText, Trash2, Eye, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function History({ onOpenProject, onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [search]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects(search);
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project and its takeoff data?')) {
      await api.deleteProject(id);
      loadProjects();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Project History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Searchable log of all processed electrical blueprint takeoffs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or title..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-slate-500 font-medium">Loading project history...</div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No Projects Found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search term or upload a new drawing.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onOpenProject(p.id);
                onNavigate('review');
              }}
              className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{p.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{p.original_filename}</span>
                    <span>·</span>
                    <span>{p.sheet_count} Sheet(s)</span>
                    <span>·</span>
                    <span>{p.total_detections || 0} Symbols</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  p.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : (p.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' : 'bg-slate-100 text-slate-700')
                }`}>
                  {p.status.toUpperCase()}
                </span>

                <a
                  href={`/api/projects/${p.id}/export/excel`}
                  onClick={(e) => e.stopPropagation()}
                  download
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                  title="Download Excel Takeoff"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </a>

                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
