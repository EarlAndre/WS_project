const API_BASE_URL = 'http://localhost:8000/api';

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

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fetchSeminars() {
  try {
    const response = await fetch(`${API_BASE_URL}/seminars/`);
    if (response.ok) {
      const data = await response.json();
      writeLocal('seminars', data);
      return { data, error: null };
    }
  } catch (err) {
    // fallback to local
  }
  const data = readLocal('seminars');
  return { data, error: null };
}

export async function createSeminar(seminar) {
  const payload = {
    ...seminar,
    duration: seminar.duration ? parseInt(seminar.duration, 10) : null,
    capacity: seminar.participants ? parseInt(seminar.participants, 10) : seminar.capacity || null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/seminars/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      const local = readLocal('seminars');
      local.push(data);
      writeLocal('seminars', local);
      return { data: [data], error: null };
    }
    throw new Error('Backend error');
  } catch (err) {
    const local = readLocal('seminars');
    const id = Date.now();
    const row = { id, ...payload, created_at: new Date().toISOString() };
    local.push(row);
    writeLocal('seminars', local);
    return { data: [row], error: { message: 'Saved locally' } };
  }
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
    try {
      const response = await fetch(`${API_BASE_URL}/seminars/${payload.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        return { data, error: null };
      }
      return { data: null, error: { message: 'Backend update failed' } };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // create new locally if no id
  const id = Date.now();
  const row = { id, ...payload, created_at: new Date().toISOString() };
  local.push(row);
  writeLocal('seminars', local);
  return { data: [row], error: null };
}

export async function recordTimeIn(seminarId, participant_email) {
  try {
    const attendance = readLocal('attendance');
    let row = attendance.find(r => r.seminar_id === seminarId && r.participant_email === participant_email);
    const now = new Date().toISOString();
    if (!row) {
      row = { id: Date.now(), seminar_id: seminarId, participant_email, time_in: now, time_out: null, created_at: now };
      attendance.push(row);
      writeLocal('attendance', attendance);
      return { data: [row], error: null };
    }
    if (!row.time_in) {
      row.time_in = now;
      writeLocal('attendance', attendance);
    }
    return { data: [row], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// Record time-out: updates existing row's time_out
export async function recordTimeOut(seminarId, participant_email) {
  try {
    const attendance = readLocal('attendance');
    let row = attendance.find(r => r.seminar_id === seminarId && r.participant_email === participant_email);
    const now = new Date().toISOString();
    if (!row) {
      row = { id: Date.now(), seminar_id: seminarId, participant_email, time_in: null, time_out: now, created_at: now };
      attendance.push(row);
      writeLocal('attendance', attendance);
      return { data: [row], error: null };
    }
    if (!row.time_out) {
      row.time_out = now;
      writeLocal('attendance', attendance);
    }
    return { data: [row], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// Fetch attendance list for a seminar
export async function fetchAttendance(seminarId) {
  try {
    const attendance = readLocal('attendance');
    const data = attendance.filter(a => a.seminar_id === seminarId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteSeminar(id) {
  try {
    const local = readLocal('seminars');
    const idx = local.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [removed] = local.splice(idx, 1);
      writeLocal('seminars', local);
      return { data: [removed], error: null };
    }
    return { data: null, error: { message: 'Not found' } };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function saveJoinedParticipant(seminarId, participant) {
  try {
    const payload = {
      id: Date.now(),
      seminar_id: seminarId,
      participant_email: participant.participant_email || null,
      participant_name: participant.participant_name || null,
      metadata: participant.metadata || null,
      joined_at: new Date().toISOString(),
    };
    const list = readLocal('joined_participants');
    list.push(payload);
    writeLocal('joined_participants', list);
    return { data: [payload], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function fetchJoinedParticipants(seminarId) {
  try {
    const list = readLocal('joined_participants');
    const data = list.filter(p => p.seminar_id === seminarId).sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function fetchEvaluations(seminarId, participant_email) {
  try {
    const list = readLocal('evaluations');
    let data = list.filter(e => e.seminar_id === seminarId);
    if (participant_email) data = data.filter(e => e.participant_email === participant_email);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function hasEvaluated(seminarId, participant_email) {
  try {
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
  try {
    const payload = { id: Date.now(), seminar_id: seminarId, participant_email, answers, created_at: new Date().toISOString() };
    const list = readLocal('evaluations');
    list.push(payload);
    writeLocal('evaluations', list);
    return { data: [payload], error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function checkInParticipant(seminarId, participant_email) {
  try {
    const list = readLocal('joined_participants');
    const row = list.find(p => p.seminar_id === seminarId && p.participant_email === participant_email);
    if (row) {
      row.present = true;
      row.check_in = new Date().toISOString();
      writeLocal('joined_participants', list);
      return { data: [row], error: null };
    }
    return { data: null, error: { message: 'Participant not found' } };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function checkOutParticipant(seminarId, participant_email) {
  try {
    const list = readLocal('joined_participants');
    const row = list.find(p => p.seminar_id === seminarId && p.participant_email === participant_email);
    if (row) {
      row.present = false;
      row.check_out = new Date().toISOString();
      writeLocal('joined_participants', list);
      return { data: [row], error: null };
    }
    return { data: null, error: { message: 'Participant not found' } };
  } catch (err) {
    return { data: null, error: err };
  }
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
};
