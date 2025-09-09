import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const EN_QUOTE = 'Knowledge is not just learned, it is received with humility.';
const HI_QUOTE = 'ज्ञान केवल पढ़ने से नहीं मिलता, उसे विनम्रता से ग्रहण करना पड़ता है।';

export default function SplashScreen() {
  const [typed, setTyped] = useState('');
  const [showHindi, setShowHindi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomLogo, setZoomLogo] = useState(false);

  // Typewriter effect for English quote
  useEffect(() => {
    let i = 0;
    setTyped('');
    setShowHindi(false);
    setLoading(false);
    setZoomLogo(false);
    const interval = setInterval(() => {
      setTyped(EN_QUOTE.slice(0, i + 1));
      i++;
      if (i === EN_QUOTE.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowHindi(true);
          setTimeout(() => {
            setLoading(true);
            setTimeout(() => setZoomLogo(true), 1200); // Zoom after loading dots
          }, 600);
        }, 600);
      }
    }, 32);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="splash-bg">
      <div className="splash-orbs" />
      <div className="splash-center">
        <div className={`splash-logo-aura${zoomLogo ? ' splash-logo-zoom' : ''}`}>
          <img src={process.env.PUBLIC_URL + '/Logo.png'} alt="KaMaTi Gang Logo" className={`splash-logo${zoomLogo ? ' splash-logo-zoom-img' : ''}`} />
        </div>
        <div className="splash-quote">
          <span className="en-quote">{typed}</span>
          {showHindi && (
            <span className="hi-quote">{HI_QUOTE}</span>
          )}
        </div>
        {loading && (
          <div className="splash-loading">
            <div className="splash-dot" />
            <div className="splash-dot" />
            <div className="splash-dot" />
          </div>
        )}
        <div className="splash-by-kamati">By KaMaTi Gang <span role="img" aria-label="smile">😁</span></div>
      </div>
    </div>
  );
}
