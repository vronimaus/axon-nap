import React, { useRef, useState } from 'react';

/**
 * 3D perspective tilt card — tilts toward the cursor on mouse move.
 * Desktop only (pointer: fine); touch devices get the plain children.
 */
export default function TiltCard({ children, className = '', max = 8, glare = true, onClick }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });
  const [active, setActive] = useState(false);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`,
    });
    if (glare) {
      setGlareStyle({
        opacity: 0.18,
        background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.5), transparent 50%)`,
      });
    }
  };

  const reset = () => {
    setStyle({ transform: 'perspective(900px) rotateX(0) rotateY(0) scale(1)' });
    setGlareStyle({ opacity: 0 });
    setActive(false);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={reset}
      onClick={onClick}
      className={`relative transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d', ...style }}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
          style={glareStyle}
        />
      )}
    </div>
  );
}