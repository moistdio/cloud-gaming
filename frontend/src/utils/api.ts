// API URL configuration
export const API_URL = 'http://148.251.51.138:7200';

// Helper function to get full API endpoint URL
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`; 