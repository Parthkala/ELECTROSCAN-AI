import React, { useState, useEffect } from 'react';
import {
  FileText,
  Cpu,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  Play,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api';

export default function Dashboard({ user, onNavigate, onOpenProject }) {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, p] = await Promise.all([
        api.getStats(),
        api.getProjects()
      ]);
      setStats(s);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSample = async () => {
    try {
      const sample = projects.find(p => p.id.startsWith('proj-sample'));
      if (sample) {
        onOpenProject(sample.id);
        onNavigate('review');
      } else {
        const created = await api.createSampleProject();
        await api.processProject(created.project_id);
        onOpenProject(created.project_id);
        onNavigate('review');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 font-medium">Loading dashboard metrics...</div>;
  }

  const kpis = [
    {
      title: 'Total Blueprints',
      value: stats?.total_drawings || projects.length,
      change: '+25%',
      isUp: true,
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Processed Symbols',
      value: stats?.symbols_detected || 0,
      change: '+33%',
      isUp: true,
      icon: Cpu,
      iconBg: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Avg. Processing Time',
      value: `${stats?.avg_processing_time_sec || 15.2}s`,
      change: '-48%',
      isUp: false,
      icon: Clock,
      iconBg: 'bg-cyan-50 text-cyan-600'
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate_pct || 98.2}%`,
      change: '+2%',
      isUp: true,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50 text-emerald-600'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F8FAFC]">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'Parth'}!
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload your blueprint, let AI analyze it, and get structured takeoff results in seconds.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                {kpi.isUp ? (
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {kpi.change}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {kpi.change}
                  </span>
                )}
                <span className="text-slate-400">vs. last 7 days</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-400">Sheets processed over the past 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-slate-600">Processed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <span className="text-slate-600">Failed</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.activity_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="processed" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-4">Jump straight into takeoff workflows</p>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('upload')}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between group transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Upload Blueprint</p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 50MB</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={handleStartSample}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between group transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Run Sample Takeoff</p>
                    <p className="text-[11px] text-slate-400">Commercial L2 Office</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('symbols')}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between group transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Explore Symbol Library</p>
                    <p className="text-[11px] text-slate-400">Manage templates & rates</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Estimator session active</span>
            <span className="font-semibold text-blue-600">Parth Kala</span>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Recent Projects</h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1">Upload a drawing or launch the sample project to begin.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <p className="text-xs text-slate-400">
                      {p.sheet_count} sheet(s) · {p.total_detections || 0} detections · {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    p.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (p.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' : 'bg-slate-100 text-slate-700')
                  }`}>
                    {p.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => {
                      onOpenProject(p.id);
                      onNavigate('review');
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Open Takeoff"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
