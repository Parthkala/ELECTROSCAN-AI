const API_BASE = '/api';

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  // Dashboard
  getStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return res.json();
  },

  // Projects
  getProjects: async (search = '') => {
    const url = search ? `${API_BASE}/projects?search=${encodeURIComponent(search)}` : `${API_BASE}/projects`;
    const res = await fetch(url);
    return res.json();
  },

  createSampleProject: async () => {
    const res = await fetch(`${API_BASE}/projects/create-sample`, { method: 'POST' });
    return res.json();
  },

  uploadProject: async (name, file) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/projects/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  deleteProject: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
    return res.json();
  },

  processProject: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/process`, { method: 'POST' });
    return res.json();
  },

  getJobStatus: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/job-status`);
    return res.json();
  },

  getProjectDetails: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/details`);
    if (!res.ok) throw new Error('Failed to load project details');
    return res.json();
  },

  // Detections & Review
  updateDetection: async (detectionId, data) => {
    const res = await fetch(`${API_BASE}/detections/${detectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  addManualDetection: async (projectId, data) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/detections/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  reclassifyThreshold: async (projectId, autoThreshold) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/reclassify-threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_threshold: autoThreshold })
    });
    return res.json();
  },

  getAuditLog: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/audit-log`);
    return res.json();
  },

  // Symbols
  getSymbols: async () => {
    const res = await fetch(`${API_BASE}/symbols`);
    return res.json();
  },

  updateSymbol: async (symbolId, data) => {
    const query = new URLSearchParams(data).toString();
    const res = await fetch(`${API_BASE}/symbols/${symbolId}?${query}`, { method: 'PATCH' });
    return res.json();
  },

  teachSymbol: async (data) => {
    const res = await fetch(`${API_BASE}/symbols/teach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Teaching symbol failed');
    }
    return res.json();
  },

  // Benchmark
  getBenchmark: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/benchmark`);
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
