// Simple logging middleware for client-side logging requirements.
// Stores logs in localStorage under 'app_logs' and prints to console.
// Each log: { time, level, action, details }
export function log(level, action, details) {
  try {
    const entry = { time: new Date().toISOString(), level, action, details };
    console[level?.toLowerCase?.()]?.("[LOG]", entry);
    const arr = JSON.parse(localStorage.getItem('app_logs') || '[]');
    arr.unshift(entry);
    localStorage.setItem('app_logs', JSON.stringify(arr.slice(0, 500))); // keep recent 500
  } catch (e) {
    console.error('Logging failed', e);
  }
}

export function getLogs(limit=100) {
  return JSON.parse(localStorage.getItem('app_logs') || '[]').slice(0, limit);
}
