// Yerelde API ayrı portta çalışır; canlıda Vercel, /api isteklerini API projesine yönlendirir
// (bkz. frontend/vercel.json), böylece tarayıcı aynı kökene istek atar.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE = isLocal ? 'http://localhost:3000/api' : '/api';
