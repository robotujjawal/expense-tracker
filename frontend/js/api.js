/**
 * api.js
 * Thin wrapper around the Django REST Framework backend.
*/

const API = (() => {
 const BASE_URL = '/api';

 function getCsrfToken() {
   const cookie = document.cookie
     .split('; ')
     .find((row) => row.startsWith('csrftoken='));
   return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
 }

 async function request(path, options = {}) {
   const method = (options.method || 'GET').toUpperCase();
   const requestOptions = {
     credentials: 'include',
     ...options,
   };

   requestOptions.headers = {
     'Content-Type': 'application/json',
     ...(method !== 'GET' ? { 'X-CSRFToken': getCsrfToken() } : {}),
     ...(options.headers || {}),
   };

   const res = await fetch(`${BASE_URL}${path}`, requestOptions);

   if (!res.ok) {
     let detail = res.statusText;
     try {
       const body = await res.json();
       detail = JSON.stringify(body);
     } catch (_) { /* no json body */ }
     throw new Error(`API error ${res.status}: ${detail}`);
   }

   if (res.status === 204) return null;
   const text = await res.text();
   return text ? JSON.parse(text) : null;
 }

 return {
   getCategories: () => request('/categories/'),

   getTransactions: (params = {}) => {
     const qs = new URLSearchParams(params).toString();
     return request(`/transactions/${qs ? `?${qs}` : ''}`);
   },

   createTransaction: (payload) =>
     request('/transactions/', { method: 'POST', body: JSON.stringify(payload) }),

   deleteTransaction: (id) =>
     request(`/transactions/${id}/`, { method: 'DELETE' }),

   getSummary: () => request('/summary/'),

   login: (payload) =>
     request('/auth/login/', { method: 'POST', body: JSON.stringify(payload) }),

   signup: (payload) =>
     request('/auth/signup/', { method: 'POST', body: JSON.stringify(payload) }),

   logout: () =>
     request('/auth/logout/', { method: 'POST' }),

   getCurrentUser: () => request('/auth/user/'),
 };
})();
