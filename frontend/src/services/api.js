/**
 * Axios API client for Procurement Advisor Agent backend communication.
 */

import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Analyze supplier quotes (multiple PDFs)
 * @param {FormData} formData - Form data with multiple PDF files
 * @returns {Promise} - Supplier analysis result
 */
export const analyzeSuppliers = async (formData) => {
  try {
    const response = await apiClient.post('/suppliers/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Supplier analysis failed');
  }
};

/**
 * Analyze a contract (single PDF)
 * @param {FormData} formData - Form data with a single PDF file
 * @returns {Promise} - Contract analysis result
 */
export const analyzeContract = async (formData) => {
  try {
    const response = await apiClient.post('/contracts/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Contract analysis failed');
  }
};

/**
 * Analyze spend data (CSV file)
 * @param {FormData} formData - Form data with a CSV file
 * @returns {Promise} - Spend analysis result
 */
export const analyzeSpend = async (formData) => {
  try {
    const response = await apiClient.post('/spend/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Spend analysis failed');
  }
};

/**
 * Get dashboard data (historical reports and metrics)
 * @returns {Promise} - Dashboard data with summary and historical reports
 */
export const getDashboard = async () => {
  try {
    const response = await apiClient.get('/dashboard');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to load dashboard');
  }
};

/**
 * Health check endpoint
 * @returns {Promise} - Health status
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Health check failed');
  }
};

export default apiClient;
