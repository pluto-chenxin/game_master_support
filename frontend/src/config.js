// API Configuration
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Remove any trailing slashes to prevent double slashes when joining with paths
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

// Log the API URL for debugging
console.log('API URL configured as:', API_URL);

export default {
  API_URL
}; 