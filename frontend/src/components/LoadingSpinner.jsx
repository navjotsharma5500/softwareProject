import React, { useState, useEffect } from 'react';

const searchMessages = [
  'Searching every corner…',
  'Checking lost & found…',
  'Scanning the area…',
  'Looking under the seats…',
  'Asking around campus…',
  'Almost there…',
];

const floatingItems = ['🔑', '👜', '📱', '💳', '🎒', '👓'];

const LoadingSpinner = ({ message }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % searchMessages.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center py-20 select-none">

      {/* Floating lost-item icons + magnifying glass */}
      <div className="relative mb-4" style={{ width: 200, height: 200 }}>

        {/* Orbiting icons — each starts at a different angle via negative delay */}
        {floatingItems.map((icon, i) => {
          const orbitDuration = 8; // seconds for one full orbit
          const startDelay = -(i / floatingItems.length) * orbitDuration;
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -10,
                marginTop: -10,
                fontSize: 18,
                opacity: 0.75,
                // rotate the arm, push the icon out, then counter-rotate so emoji stays upright
                animation: `orbitCCW ${orbitDuration}s linear infinite`,
                animationDelay: `${startDelay}s`,
              }}
            >
              <span style={{ display: 'inline-block', animation: `counterRotate ${orbitDuration}s linear infinite`, animationDelay: `${startDelay}s` }}>
                {icon}
              </span>
            </span>
          );
        })}

        {/* SVG magnifying glass — swings from centre */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{
            position: 'absolute',
            left: 60,
            top: 60,
            transformOrigin: '40px 40px',
            animation: 'swingGlass 2s ease-in-out infinite',
          }}
        >
          {/* Lens circle */}
          <circle cx="32" cy="32" r="22" fill="#fef2f2" stroke="#dc2626" strokeWidth="5" />
          {/* Inner pulse ring */}
          <circle cx="32" cy="32" r="14" fill="none" stroke="#fca5a5" strokeWidth="2.5"
            style={{ animation: 'pulseRing 1.4s ease-in-out infinite', transformOrigin: '32px 32px' }} />
          {/* Handle */}
          <line x1="48" y1="48" x2="68" y2="68" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>

      {/* Animated dots row */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              animation: 'dotBounce 1.1s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      {/* Cycling message — always rotates through search phrases */}
      <p
        className="text-base font-semibold text-gray-800 dark:text-white transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {searchMessages[msgIndex]}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Hang tight while we search for you
      </p>

      {/* Keyframe styles */}
      <style>{`
        @keyframes swingGlass {
          0%,100% { transform: rotate(-12deg); }
          50%      { transform: rotate(12deg); }
        }
        @keyframes pulseRing {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.25); opacity: 0.4; }
        }
        @keyframes orbitCCW {
          from { transform: rotate(0deg)   translateX(68px); }
          to   { transform: rotate(-360deg) translateX(68px); }
        }
        @keyframes counterRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dotBounce {
          0%,80%,100% { transform: scaleY(1); }
          40%          { transform: scaleY(1.7); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
