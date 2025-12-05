import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function QRRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking device...');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isDeviceMobile = mobileRegex.test(userAgent.toLowerCase());
    
    setIsMobile(isDeviceMobile);

    if (isDeviceMobile) {
      setStatus('error');
      setMessage('❌ This QR attendance feature is only available on PC/Laptop.\n\nPlease use a desktop computer to scan and submit attendance.');
      return;
    }

    // If not mobile, proceed with QR processing
    const processQRData = async () => {
      try {
        // Get the data from URL hash or query params
        const hash = location.hash.substring(1); // remove '#'
        const params = new URLSearchParams(location.search);
        
        let qrData = hash || params.get('data');
        
        if (!qrData) {
          setStatus('error');
          setMessage('❌ No QR data found. Please scan again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Try to parse QR data
        let payload = null;
        try {
          payload = JSON.parse(decodeURIComponent(qrData));
        } catch (e) {
          // If not JSON, try pipe-separated format
          if (qrData.includes('|')) {
            const [seminar_id, participant_email] = qrData.split('|');
            payload = { seminar_id, participant_email };
          }
        }

        if (!payload || !payload.seminar_id || !payload.participant_email) {
          setStatus('error');
          setMessage('❌ Invalid QR code data. Please try again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Open the published Google Form for participants to fill (opens in new tab)
        try {
          window.open('https://docs.google.com/forms/d/e/1FAIpQLSeAa-p2RtaTYmuohv1r1uKfYO8bGMlk7NIcPnqYiAi6l9GD-w/viewform?usp=pp_url', '_blank');
          setStatus('success');
          setMessage('✅ Google Form opened in a new tab.\nPlease fill it out and submit.\nAttendance will be marked automatically.');
          // Redirect to home after 5 seconds
          setTimeout(() => navigate('/'), 5000);
        } catch (e) {
          console.warn('Could not open Google Form in new tab:', e);
          setStatus('error');
          setMessage('❌ Could not open the form. Please try again.');
          setTimeout(() => navigate('/'), 3000);
        }

      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('❌ Unexpected error. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processQRData();
  }, [location, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {status === 'checking' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Checking...</h2>
            <p style={{ color: '#666', fontSize: '16px', whiteSpace: 'pre-wrap' }}>{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#28a745', marginBottom: '10px' }}>Success!</h2>
            <p style={{ color: '#666', fontSize: '16px', whiteSpace: 'pre-wrap' }}>{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>{isMobile ? 'Mobile Not Supported' : 'Error'}</h2>
            <p style={{ color: '#666', fontSize: '16px', whiteSpace: 'pre-wrap' }}>{message}</p>
            {!isMobile && (
              <button 
                onClick={() => navigate('/')}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Back Home
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
