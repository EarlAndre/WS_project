import React, { useEffect, useState, useRef } from 'react';

export default function HealthIndicator() {
  // status: loading | ok | unreachable
  const [status, setStatus] = useState('loading');
  const [info, setInfo] = useState(null);
  const failureCountRef = useRef(0);

  async function check() {
    try {
      const res = await fetch('/api/health/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      failureCountRef.current = 0;
      setInfo(json);
      setStatus('ok');
    } catch (err) {
      // increment failure counter, only mark unreachable after 2 consecutive failures
      failureCountRef.current = (failureCountRef.current || 0) + 1;
      if (failureCountRef.current >= 2) {
        setStatus('unreachable');
      }
    }
  }

  useEffect(() => {
    let mounted = true;
    // initial check
    check();
    const id = setInterval(() => {
      if (!mounted) return;
      check();
    }, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const color = status === 'loading' ? '#999' : (status === 'ok' ? '#26a65b' : '#c41e3a');
  const title = status === 'loading' ? 'Checking backend...' : (status === 'ok' ? 'Backend connected' : 'Backend unreachable');
  // Hide the indicator unless the backend is healthy to avoid noisy UI.
  if (status !== 'ok') return null;

  return (
    <div title={title} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: '0 0 6px rgba(0,0,0,0.08)' }} />
      <span style={{ color: '#666', fontSize: '0.9rem' }}>{title}</span>
    </div>
  );
}
