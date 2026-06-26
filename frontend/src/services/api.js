/**
 * Axios API client for Procurement Advisor Agent backend communication.
 */

import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token automatically if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const register = async (email, password, org_name = 'My Organization') => {
  try {
    const response = await apiClient.post('/auth/register', { email, password, org_name });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to get user profile');
  }
};

// ── Supplier Analysis ─────────────────────────────────────────────────────────

export const analyzeSuppliers = async (formData) => {
  try {
    const response = await apiClient.post('/suppliers/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Supplier analysis failed');
  }
};

// ── Contract Review ───────────────────────────────────────────────────────────

export const analyzeContract = async (formData) => {
  try {
    const response = await apiClient.post('/contracts/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Contract analysis failed');
  }
};

// ── Spend Analysis ────────────────────────────────────────────────────────────

export const analyzeSpend = async (formData) => {
  try {
    const response = await apiClient.post('/spend/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Spend analysis failed');
  }
};

export const analyzeSpendWithMapping = async (file, mapping = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping', JSON.stringify(mapping));
    const response = await apiClient.post('/spend/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Spend analysis failed');
  }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboard = async () => {
  try {
    const response = await apiClient.get('/dashboard');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load dashboard');
  }
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const getReport = async (type, id) => {
  try {
    const response = await apiClient.get(`/reports/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load report');
  }
};

// ── Savings Tracker ───────────────────────────────────────────────────────────

export const getSavings = async () => {
  try {
    const response = await apiClient.get('/savings');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load savings');
  }
};

export const updateSavingsStatus = async (id, status, realizedAmount = null) => {
  try {
    const response = await apiClient.patch(`/savings/${id}`, {
      status,
      realized_amount: realizedAmount,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to update savings');
  }
};

// ── Renewals ──────────────────────────────────────────────────────────────────

export const getRenewals = async () => {
  try {
    const response = await apiClient.get('/renewals');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load renewals');
  }
};

export const updateRenewalStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/renewals/${id}/status?status=${status}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to update renewal');
  }
};

export const sweepRenewalAlerts = async (daysAhead = 30) => {
  try {
    const response = await apiClient.post(`/renewals/sweep-alerts?days_ahead=${daysAhead}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to sweep alerts');
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const getNotifications = async (unreadOnly = false) => {
  try {
    const response = await apiClient.get(`/notifications${unreadOnly ? '?unread_only=true' : ''}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load notifications');
  }
};

export const markNotificationRead = async (id) => {
  try {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to mark notification read');
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await apiClient.post('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to mark all read');
  }
};

// ── Copilot Chat ──────────────────────────────────────────────────────────────

export const sendChatMessage = async (message, history = []) => {
  try {
    const response = await apiClient.post('/chat', { message, history });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Chat failed');
  }
};

// ── Sourcing: Negotiation + RFP ───────────────────────────────────────────────

export const generateNegotiation = async (context, reportType = null, reportId = null) => {
  try {
    const response = await apiClient.post('/sourcing/negotiate', {
      context,
      report_type: reportType,
      report_id: reportId,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Negotiation strategy failed');
  }
};

export const generateRfp = async (needDescription) => {
  try {
    const response = await apiClient.post('/sourcing/rfp', { need_description: needDescription });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'RFP generation failed');
  }
};

// ── Health ────────────────────────────────────────────────────────────────────

export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Health check failed');
  }
};

export default apiClient;
