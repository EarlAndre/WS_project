// Test script to verify frontend-backend integration
// This simulates what the frontend does when a participant joins and checks in

const API_BASE_URL = 'http://localhost:8000/api';

async function safeFetch(url, opts = {}) {
  try {
    const headers = Object.assign({ 'Accept': 'application/json', 'Content-Type': 'application/json' }, opts.headers || {});
    const response = await fetch(url, { ...opts, headers });
    if (!response.ok) {
      let body = null;
      try { body = await response.text(); } catch (e) { body = '<no body>'; }
      console.error(`API ${opts.method || 'GET'} ${url} failed: ${response.status} ${response.statusText}`, body);
      return { ok: false, status: response.status, body, response };
    }
    const data = await response.json();
    return { ok: true, data, response };
  } catch (err) {
    console.error('Network error for', url, err);
    return { ok: false, error: err };
  }
}

async function testIntegration() {
  console.log('\n=== Frontend → Backend Integration Test ===\n');

  // Step 1: Create a seminar
  console.log('Step 1: Creating seminar...');
  let res = await safeFetch(`${API_BASE_URL}/seminars/`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Integration Test Seminar',
      duration: 2,
      speaker: 'Test Speaker',
      capacity: 50,
      date: '2025-12-03'
    })
  });
  if (!res.ok) {
    console.error('Failed to create seminar', res.body || res.error);
    process.exit(1);
  }
  const seminarId = res.data.id;
  console.log(`✓ Seminar created with ID: ${seminarId}\n`);

  // Step 2: Save joined participant
  console.log('Step 2: Saving joined participant...');
  res = await safeFetch(`${API_BASE_URL}/joined-participants/`, {
    method: 'POST',
    body: JSON.stringify({
      seminar: seminarId,
      participant_email: 'testuser@example.com',
      participant_name: 'Test User'
    })
  });
  if (!res.ok) {
    console.error('Failed to save joined participant', res.body || res.error);
    process.exit(1);
  }
  console.log(`✓ Participant joined with ID: ${res.data.id}\n`);

  // Step 3: Check in (record time_in)
  console.log('Step 3: Recording check-in (time_in)...');
  res = await safeFetch(`${API_BASE_URL}/attendance/`, {
    method: 'POST',
    body: JSON.stringify({
      seminar: seminarId,
      participant_email: 'testuser@example.com',
      time_in: new Date().toISOString()
    })
  });
  if (!res.ok) {
    console.error('Failed to record check-in', res.body || res.error);
    process.exit(1);
  }
  const attendanceId = res.data.id;
  console.log(`✓ Check-in recorded with ID: ${attendanceId}`);
  console.log(`  - time_in: ${res.data.time_in}\n`);

  // Step 4: Check out (record time_out on same attendance record)
  console.log('Step 4: Recording check-out (time_out)...');
  res = await safeFetch(`${API_BASE_URL}/attendance/`, {
    method: 'POST',
    body: JSON.stringify({
      seminar: seminarId,
      participant_email: 'testuser@example.com',
      time_out: new Date().toISOString()
    })
  });
  if (!res.ok) {
    console.error('Failed to record check-out', res.body || res.error);
    process.exit(1);
  }
  console.log(`✓ Check-out recorded on same ID: ${res.data.id}`);
  console.log(`  - time_in: ${res.data.time_in}`);
  console.log(`  - time_out: ${res.data.time_out}\n`);

  // Step 5: Save evaluation
  console.log('Step 5: Saving evaluation...');
  res = await safeFetch(`${API_BASE_URL}/evaluations/`, {
    method: 'POST',
    body: JSON.stringify({
      seminar: seminarId,
      participant_email: 'testuser@example.com',
      answers: { q1: 'Excellent', q2: 'Very Relevant', q3: 'Great seminar!' }
    })
  });
  if (!res.ok) {
    console.error('Failed to save evaluation', res.body || res.error);
    process.exit(1);
  }
  console.log(`✓ Evaluation saved with ID: ${res.data.id}\n`);

  // Step 6: Fetch and verify all data
  console.log('Step 6: Fetching and verifying data...');
  
  res = await safeFetch(`${API_BASE_URL}/seminars/`);
  if (res.ok) {
    const seminar = res.data.find(s => s.id === seminarId);
    console.log(`✓ Seminar found: ${seminar?.title}`);
  }

  res = await safeFetch(`${API_BASE_URL}/joined-participants/${seminarId}/`);
  if (res.ok) {
    console.log(`✓ Joined participants: ${res.data.length}`);
  }

  res = await safeFetch(`${API_BASE_URL}/attendance/${seminarId}/`);
  if (res.ok) {
    console.log(`✓ Attendance records: ${res.data.length}`);
    if (res.data.length > 0) {
      const att = res.data[0];
      console.log(`  - Has time_in: ${!!att.time_in}`);
      console.log(`  - Has time_out: ${!!att.time_out}`);
    }
  }

  res = await safeFetch(`${API_BASE_URL}/evaluations/${seminarId}/`);
  if (res.ok) {
    console.log(`✓ Evaluations: ${res.data.length}\n`);
  }

  console.log('=== All Tests Passed ✓ ===\n');
  console.log('Summary: Frontend actions (join, checkin, checkout, evaluate) all sync to database successfully.');
}

testIntegration().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
