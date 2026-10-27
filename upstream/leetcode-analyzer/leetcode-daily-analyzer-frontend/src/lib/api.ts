import { StudentInput } from './types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

async function fetchJson<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  return data;
}

export const api = {
  // Departments & Sections
  async getDepartments() {
    return fetchJson('/api/departments');
  },

  async getSections(departmentId: string) {
    return fetchJson(`/api/departments/${encodeURIComponent(departmentId)}/sections`);
  },

  // Students & Import
  async importStudents(formData: FormData) {
    return fetchJson('/api/students/import', {
      method: 'POST',
      body: formData,
    });
  },

  async importStudentsJson(payload: { students: StudentInput[]; department?: string; section?: string }) {
    return fetchJson('/api/students/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getStudents(params: { department?: string; section?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'ALL') query.set('department', params.department);
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    if (params.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/students${qs}`);
  },

  async getStudentById(id: string) {
    return fetchJson(`/api/students/${encodeURIComponent(id)}`);
  },

  async getStudentHistory(id: string) {
    return fetchJson(`/api/students/${encodeURIComponent(id)}/history`);
  },

  // Analysis & Queue
  async startAnalysis(payload: {
    students?: StudentInput[];
    date?: string;
    mode?: 'new' | 'update' | 'retry';
    department?: string;
    section?: string;
  }) {
    return fetchJson('/api/analyze/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAnalysisProgress() {
    return fetchJson('/api/analyze/progress');
  },

  async retryFailedProfiles(payload: { date?: string; department?: string; section?: string } = {}) {
    return fetchJson('/api/analyze/retry', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelAnalysis() {
    return fetchJson('/api/analyze/cancel', {
      method: 'POST',
    });
  },

  // Dashboard & Snapshots
  async getDashboard(params: { date?: string; department?: string; section?: string } = {}) {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.department && params.department !== 'ALL') query.set('department', params.department);
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/dashboard${qs}`);
  },

  async getSnapshots() {
    return fetchJson('/api/snapshots');
  },

  async getSnapshotByDate(date: string, params: { department?: string; section?: string } = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'ALL') query.set('department', params.department);
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/snapshots/${encodeURIComponent(date)}${qs}`);
  },

  // Leaderboard
  async getLeaderboard(params: { date?: string; department?: string; section?: string } = {}) {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.department && params.department !== 'ALL') query.set('department', params.department);
    if (params.section && params.section !== 'ALL') query.set('section', params.section);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson(`/api/leaderboard${qs}`);
  },

  // Exports & Downloads
  getExportUrl(date: string, format: 'xlsx' | 'csv' = 'xlsx', department?: string, section?: string) {
    const query = new URLSearchParams();
    query.set('format', format);
    if (department && department !== 'ALL') query.set('department', department);
    if (section && section !== 'ALL') query.set('section', section);
    return `${API_BASE_URL}/api/export/${encodeURIComponent(date)}?${query.toString()}`;
  },

  getTemplateDownloadUrl() {
    return `${API_BASE_URL}/api/template`;
  },

  async seedSampleData() {
    return fetchJson('/api/seed-sample', { method: 'POST' });
  },
};

export default api;
