// API Configuration
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Force HTTP protocol (remove HTTPS if present)
if (API_URL.startsWith('https://')) {
  API_URL = API_URL.replace('https://', 'http://');
}

// Remove any trailing slashes to prevent double slashes when joining with paths
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

export default {
  API_URL
}; 