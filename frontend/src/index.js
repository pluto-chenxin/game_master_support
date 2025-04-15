import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import config from './config';

// Set default base URL for API requests
// If URL is already HTTPS, use it, otherwise force HTTPS
let baseUrl = config.API_URL;
if (baseUrl.startsWith('http:') && window.location.protocol === 'https:') {
  baseUrl = baseUrl.replace('http:', 'https:');
}

// Ensure no trailing slash to prevent double slashes
if (baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}

axios.defaults.baseURL = baseUrl;

// Log the base URL being used
console.log('API Base URL:', axios.defaults.baseURL);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 