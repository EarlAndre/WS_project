// Determine API base URL. Prefer Vite env `VITE_API_BASE_URL` when available.
// Fallbacks:
// - during local development, use http://localhost:8000/api
// - in production (deployed with Django), use relative `/api`
// Allow an explicit override via `window.VITE_API_BASE_URL` (useful in dev),
// otherwise use localhost backend during local dev, or relative `/api` in prod.
// Default resolution rules:
// - If `window.VITE_API_BASE_URL` is set and is an absolute URL (starts with http), use it.
// - During local dev (hostname localhost or 127.0.0.1) prefer a RELATIVE `/api` path
//   so the Vite dev server proxy (configured in `vite.config.js`) can forward requests
//   to the backend and avoid CORS issues.
// - Otherwise use relative `/api` in production.
let API_BASE_URL = '/api';
if (typeof window !== 'undefined' && window.VITE_API_BASE_URL) {
  const candidate = String(window.VITE_API_BASE_URL).replace(/\/+$/g, '');
  if (/^https?:\/\//i.test(candidate)) {
    API_BASE_URL = candidate;
  }
} else if (typeof window !== 'undefined' && !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  API_BASE_URL = '/api';
}

// All frontend data is stored locally (localStorage) and synced with the
// Django backend where applicable. There is no Supabase usage in the
// frontend anymore.

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (err) {
    return [];
  }
}

async function safeFetch(url, opts = {}) {
  try {
    const headers = Object.assign({ 'Accept': 'application/json', 'Content-Type': 'application/json' }, opts.headers || {});
    const response = await fetch(url, { ...opts, headers });
    if (!response.ok) {
      let body = null;
      try { body = await response.text(); } catch (e) { body = '<no body>'; }
      const errMsg = `API ${opts.method || 'GET'} failed: ${response.status} ${response.statusText}`;
      console.error(errMsg, body);
      // Dispatch event so UI can show the error as a banner
      window.dispatchEvent(new CustomEvent('app-banner', { detail: `⚠️ Server error: ${response.status} ${response.statusText}. Using local fallback.` }));
      return { ok: false, status: response.status, body, response };
    }
    const data = await response.json();
    return { ok: true, data, response };
  } catch (err) {
    console.error('Network error for', url, err);
    // Dispatch event for network errors with helpful guidance
    const msg = `⚠️ Network error contacting API (${API_BASE_URL}). Using local fallback.` +
      (err && err.message ? ` (${err.message})` : '');
    window.dispatchEvent(new CustomEvent('app-banner', { detail: msg }));
    return { ok: false, error: err };
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fetchSeminars() {
  const res = await safeFetch(`${API_BASE_URL}/seminars/`);
  if (res.ok && res.data) {
    writeLocal('seminars', res.data);
    return { data: res.data, error: null };
  }
  // Fallback to local storage
  const data = readLocal('seminars');
  return { data, error: null };
}

export async function createSeminar(seminar) {
  const payload = {
    ...seminar,
    duration: seminar.duration ? parseInt(seminar.duration, 10) : null,
    capacity: seminar.participants ? parseInt(seminar.participants, 10) : seminar.capacity || null,
  };

  const res = await safeFetch(`${API_BASE_URL}/seminars/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.ok && res.data) {
    const local = readLocal('seminars');
    local.push(res.data);
    writeLocal('seminars', local);
    return { data: [res.data], error: null };
  }

  // Fallback to localStorage if backend failed
  const local = readLocal('seminars');
  const id = Date.now();
  const row = { id, ...payload, created_at: new Date().toISOString() };
  local.push(row);
  writeLocal('seminars', local);
  return { data: [row], error: { message: 'Saved locally' } };
}

export async function upsertSeminar(seminar) {
  const payload = {
    id: seminar.id,
    title: seminar.title,
    duration: seminar.duration ? parseInt(seminar.duration, 10) : null,
    speaker: seminar.speaker || null,
    capacity: seminar.participants ? parseInt(seminar.participants, 10) : seminar.capacity || null,
    date: seminar.date || null,
    start_datetime: seminar.start_datetime || null,
    end_datetime: seminar.end_datetime || null,
    start_time: seminar.start_time || null,
    end_time: seminar.end_time || null,
    questions: seminar.questions || null,
    metadata: seminar.metadata || null,
    certificate_template_url: seminar.certificate_template_url || null,
    updated_at: new Date().toISOString(),
  };

  const local = readLocal('seminars');
  if (payload.id) {
    const idx = local.findIndex(s => s.id === payload.id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...payload };
      writeLocal('seminars', local);
    }
    const res = await safeFetch(`${API_BASE_URL}/seminars/${payload.id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.ok && res.data) {
      return { data: res.data, error: null };
    }
    return { data: null, error: { message: 'Backend update failed' } };
  }

  // create new locally if no id
  const id = Date.now();
  const row = { id, ...payload, created_at: new Date().toISOString() };
  local.push(row);
  writeLocal('seminars', local);
  return { data: [row], error: null };
}

export async function recordTimeIn(seminarId, participant_email) {
  const now = new Date().toISOString();
  const payload = { seminar: seminarId, participant_email, time_in: now };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/attendance/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to local
  const attendance = readLocal('attendance');
  let row = attendance.find(r => r.seminar_id === seminarId && r.participant_email === participant_email);
  if (!row) {
    row = { id: Date.now(), seminar_id: seminarId, participant_email, time_in: now, time_out: null, created_at: now };
    attendance.push(row);
    writeLocal('attendance', attendance);
  } else if (!row.time_in) {
    row.time_in = now;
    writeLocal('attendance', attendance);
  }
  return { data: [row], error: null };
}

export async function recordTimeOut(seminarId, participant_email) {
  const now = new Date().toISOString();
  const payload = { seminar: seminarId, participant_email, time_out: now };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/attendance/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to local
  const attendance = readLocal('attendance');
  let row = attendance.find(r => r.seminar_id === seminarId && r.participant_email === participant_email);
  if (!row) {
    row = { id: Date.now(), seminar_id: seminarId, participant_email, time_in: null, time_out: now, created_at: now };
    attendance.push(row);
    writeLocal('attendance', attendance);
  } else if (!row.time_out) {
    row.time_out = now;
    writeLocal('attendance', attendance);
  }
  return { data: [row], error: null };
}

export async function fetchAttendance(seminarId) {
  const res = await safeFetch(`${API_BASE_URL}/attendance/${seminarId}/`);
  if (res.ok && res.data) {
    return { data: res.data, error: null };
  }
  // Fallback to local storage
  const attendance = readLocal('attendance');
  const data = attendance.filter(a => a.seminar_id === seminarId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return { data, error: null };
}

export async function deleteSeminar(id) {
  // Try deleting on backend first, fall back to local removal
  if (!id) return { data: null, error: { message: 'id required' } };

  const res = await safeFetch(`${API_BASE_URL}/seminars/${id}/`, { method: 'DELETE' });
  if (res.ok) {
    // remove from local copy too
    const local = readLocal('seminars');
    const idx = local.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [removed] = local.splice(idx, 1);
      writeLocal('seminars', local);
      return { data: [removed], error: null };
    }
    return { data: null, error: null };
  }

  // Backend delete failed or offline — remove locally and notify user
  const local = readLocal('seminars');
  const idx = local.findIndex(s => s.id === id);
  if (idx !== -1) {
    const [removed] = local.splice(idx, 1);
    writeLocal('seminars', local);
    window.dispatchEvent(new CustomEvent('app-banner', { detail: 'Seminar deleted locally (offline or API error).' }));
    return { data: [removed], error: { message: 'Deleted locally' } };
  }
  return { data: null, error: { message: 'Not found' } };
}

export async function saveJoinedParticipant(seminarId, participant) {
  const payload = {
    seminar: seminarId,
    participant_email: participant.participant_email || null,
    participant_name: participant.participant_name || null,
    metadata: participant.metadata || null,
  };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/joined-participants/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to localStorage
  const list = readLocal('joined_participants');
  const row = { id: Date.now(), ...payload, seminar_id: seminarId, joined_at: new Date().toISOString() };
  list.push(row);
  writeLocal('joined_participants', list);
  return { data: [row], error: { message: 'Saved locally' } };
}

export async function fetchJoinedParticipants(seminarId) {
  const res = await safeFetch(`${API_BASE_URL}/joined-participants/${seminarId}/`);
  if (res.ok && res.data) {
    return { data: res.data, error: null };
  }
  // Fallback to local storage
  const list = readLocal('joined_participants');
  const participant_email = localStorage.getItem('participantEmail') || localStorage.getItem('userEmail') || 'participant@example.com';
  const data = list.filter(p => p.seminar_id === seminarId && p.participant_email === participant_email).sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
  return { data, error: null };
}

export async function fetchEvaluations(seminarId, participant_email) {
  const res = await safeFetch(`${API_BASE_URL}/evaluations/${seminarId}/`);
  if (res.ok && res.data) {
    let data = res.data;
    if (participant_email) data = data.filter(e => e.participant_email === participant_email);
    return { data, error: null };
  }
  // Fallback to local storage
  const list = readLocal('evaluations');
  let data = list.filter(e => e.seminar_id === seminarId && (participant_email ? e.participant_email === participant_email : true));
  if (participant_email) data = data.filter(e => e.participant_email === participant_email);
  return { data, error: null };
}

export async function hasEvaluated(seminarId, participant_email) {
  try {
    if (!participant_email) participant_email = localStorage.getItem('participantEmail') || localStorage.getItem('userEmail') || 'participant@example.com';
    
    // Check backend first
    const res = await safeFetch(`${API_BASE_URL}/evaluations/${seminarId}/`);
    if (res.ok && res.data) {
      const found = res.data.find(e => e.participant_email === participant_email);
      if (found) return { evaluated: true, error: null };
    }
    
    // Fallback to local storage
    const list = readLocal('evaluations');
    const found = list.find(e => e.seminar_id === seminarId && e.participant_email === participant_email);
    return { evaluated: !!found, error: null };
  } catch (err) {
    return { evaluated: false, error: err };
  }
}

export async function uploadCertificateTemplate(seminarId, file) {
  try {
    // read file as data URL and save into seminar record
    const reader = new FileReader();
    const dataUrl = await new Promise((res, rej) => {
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    const seminars = readLocal('seminars');
    const idx = seminars.findIndex(s => s.id === seminarId);
    if (idx !== -1) {
      seminars[idx].certificate_template_url = dataUrl;
      writeLocal('seminars', seminars);
      return { data: [seminars[idx]], error: null };
    }
    return { data: null, error: { message: 'Seminar not found' } };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function saveEvaluation(seminarId, participant_email, answers) {
  const payload = { seminar: seminarId, participant_email, answers };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/evaluations/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to localStorage
  const list = readLocal('evaluations');
  const row = { id: Date.now(), ...payload, seminar_id: seminarId, created_at: new Date().toISOString() };
  list.push(row);
  writeLocal('evaluations', list);
  return { data: [row], error: { message: 'Saved locally' } };
}

export async function checkInParticipant(seminarId, participant_email) {
  const payload = { seminar: seminarId, participant_email, time_in: new Date().toISOString() };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/attendance/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to localStorage
  const list = readLocal('joined_participants');
  let row = list.find(p => p.seminar_id === seminarId && p.participant_email === participant_email);
  if (row) {
    row.present = true;
    row.check_in = new Date().toISOString();
    writeLocal('joined_participants', list);
    return { data: [row], error: null };
  }

  // If no joined_participants local record exists, create one so we can persist the check-in locally
  const newRow = { id: Date.now(), seminar_id: seminarId, participant_email, participant_name: null, metadata: null, joined_at: new Date().toISOString(), present: true, check_in: new Date().toISOString(), check_out: null };
  list.push(newRow);
  writeLocal('joined_participants', list);
  return { data: [newRow], error: null };
}

export async function checkOutParticipant(seminarId, participant_email) {
  const payload = { seminar: seminarId, participant_email, time_out: new Date().toISOString() };
  
  // Try backend first
  const res = await safeFetch(`${API_BASE_URL}/attendance/`, { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok && res.data) {
    return { data: [res.data], error: null };
  }
  
  // Fallback to localStorage
  const list = readLocal('joined_participants');
  let row = list.find(p => p.seminar_id === seminarId && p.participant_email === participant_email);
  if (row) {
    row.present = false;
    row.check_out = new Date().toISOString();
    writeLocal('joined_participants', list);
    return { data: [row], error: null };
  }

  // If no local joined_participants record exists (e.g., the join was only saved on server or in joinedSeminars),
  // create a local record so the time-out is preserved offline.
  const newRow = { id: Date.now(), seminar_id: seminarId, participant_email, participant_name: null, metadata: null, joined_at: new Date().toISOString(), present: false, check_in: null, check_out: new Date().toISOString() };
  list.push(newRow);
  writeLocal('joined_participants', list);
  return { data: [newRow], error: null };
}

export async function saveAllSeminars(seminars) {
  if (!Array.isArray(seminars)) return { data: null, error: new Error('seminars must be an array') };
  const payload = seminars.map(s => ({
    id: s.id || Date.now(),
    title: s.title,
    duration: s.duration ? parseInt(s.duration, 10) : null,
    speaker: s.speaker || null,
    capacity: s.participants ? parseInt(s.participants, 10) : s.capacity || null,
    date: s.date || null,
    start_datetime: s.start_datetime || null,
    end_datetime: s.end_datetime || null,
    start_time: s.start_time || null,
    end_time: s.end_time || null,
    certificate_template_url: s.certificate_template_url || null,
    questions: s.questions || null,
    metadata: s.metadata || null,
  }));
  writeLocal('seminars', payload);
  return { data: payload, error: null };
}

/**
 * Sort seminars by various criteria
 * @param {Array} seminars - Array of seminar objects
 * @param {string} sortBy - Sort field: 'date', 'title', 'year', 'semester', 'speaker', 'created_at', 'duration', 'capacity'
 * @param {string} order - Sort order: 'asc' (ascending) or 'desc' (descending)
 * @returns {Array} - Sorted array of seminars
 */
export function sortSeminars(seminars = [], sortBy = 'date', order = 'desc') {
  if (!Array.isArray(seminars) || seminars.length === 0) {
    return seminars;
  }

  const sorted = [...seminars].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy.toLowerCase()) {
      case 'year': {
        // Extract year from date or start_datetime
        const getYear = (seminar) => {
          if (seminar.date) {
            return new Date(seminar.date).getFullYear();
          }
          if (seminar.start_datetime) {
            return new Date(seminar.start_datetime).getFullYear();
          }
          return 0;
        };
        valueA = getYear(a);
        valueB = getYear(b);
        break;
      }

      case 'semester': {
        // Extract semester from date or start_datetime (1-2)
        const getSemester = (seminar) => {
          let month = 0;
          if (seminar.date) {
            month = new Date(seminar.date).getMonth();
          } else if (seminar.start_datetime) {
            month = new Date(seminar.start_datetime).getMonth();
          }
          // Semester 1: Jan-Jun (months 0-5), Semester 2: Jul-Dec (months 6-11)
          return month < 6 ? 1 : 2;
        };
        valueA = getSemester(a);
        valueB = getSemester(b);
        break;
      }

      case 'date':
        valueA = new Date(a.date || a.start_datetime || 0).getTime();
        valueB = new Date(b.date || b.start_datetime || 0).getTime();
        break;

      case 'title':
        valueA = (a.title || '').toLowerCase();
        valueB = (b.title || '').toLowerCase();
        break;

      case 'speaker':
        valueA = (a.speaker || '').toLowerCase();
        valueB = (b.speaker || '').toLowerCase();
        break;

      case 'created_at':
        valueA = new Date(a.created_at || 0).getTime();
        valueB = new Date(b.created_at || 0).getTime();
        break;

      case 'duration':
        valueA = a.duration || 0;
        valueB = b.duration || 0;
        break;

      case 'capacity':
        valueA = a.capacity || 0;
        valueB = b.capacity || 0;
        break;

      default:
        return 0;
    }

    // Handle comparison
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Sort seminars by multiple criteria (year > semester > date)
 * @param {Array} seminars - Array of seminar objects
 * @param {string} order - Sort order: 'asc' or 'desc'
 * @returns {Array} - Sorted array of seminars
 */
export function sortSeminarsByYearSemesterDate(seminars = [], order = 'desc') {
  if (!Array.isArray(seminars) || seminars.length === 0) {
    return seminars;
  }

  const sorted = [...seminars].sort((a, b) => {
    // Helper functions
    const getDateInfo = (seminar) => {
      const date = seminar.date ? new Date(seminar.date) : new Date(seminar.start_datetime || 0);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        semester: date.getMonth() < 6 ? 1 : 2,
        timestamp: date.getTime(),
      };
    };

    const infoA = getDateInfo(a);
    const infoB = getDateInfo(b);

    // Compare year first
    if (infoA.year !== infoB.year) {
      return order === 'desc' ? infoB.year - infoA.year : infoA.year - infoB.year;
    }

    // Then semester
    if (infoA.semester !== infoB.semester) {
      return order === 'desc' ? infoB.semester - infoA.semester : infoA.semester - infoB.semester;
    }

    // Finally date
    return order === 'desc' 
      ? infoB.timestamp - infoA.timestamp 
      : infoA.timestamp - infoB.timestamp;
  });

  return sorted;
}

/**
 * Group seminars by year and semester
 * @param {Array} seminars - Array of seminar objects
 * @returns {Object} - Grouped seminars: { '2025': { 1: [...], 2: [...] }, ... }
 */
export function groupSeminarsByYearSemester(seminars = []) {
  if (!Array.isArray(seminars)) {
    return {};
  }

  const grouped = {};

  seminars.forEach((seminar) => {
    const date = seminar.date ? new Date(seminar.date) : new Date(seminar.start_datetime || 0);
    const year = date.getFullYear();
    const semester = date.getMonth() < 6 ? 1 : 2;

    if (!grouped[year]) {
      grouped[year] = { 1: [], 2: [] };
    }

    grouped[year][semester].push(seminar);
  });

  // Sort within each group by date
  Object.keys(grouped).forEach((year) => {
    Object.keys(grouped[year]).forEach((semester) => {
      grouped[year][semester].sort((a, b) => {
        const timeA = new Date(a.date || a.start_datetime || 0).getTime();
        const timeB = new Date(b.date || b.start_datetime || 0).getTime();
        return timeB - timeA; // descending order
      });
    });
  });

  return grouped;
}

export default {
  fetchSeminars,
  createSeminar,
  upsertSeminar,
  recordTimeIn,
  recordTimeOut,
  fetchAttendance,
  deleteSeminar,
  saveJoinedParticipant,
  fetchJoinedParticipants,
  fetchEvaluations,
  hasEvaluated,
  uploadCertificateTemplate,
  saveEvaluation,
  saveAllSeminars,
  checkInParticipant,
  checkOutParticipant,
  sortSeminars,
  sortSeminarsByYearSemesterDate,
  groupSeminarsByYearSemester,
};
