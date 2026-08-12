import React, { useRef, useState } from 'react';

/**
 * Magnetic pull button — drifts toward the cursor while hovered.
 * Desktop only; touch devices get a normal button.
 */
export default function MagneticButton({ children, className = '', strength = 0.25, onClick, ...props }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setOffset({ x, y });
  };

  const reset = () => setOffset({ x: 0, y: 0 });

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      className={`transition-transform duration-150 ease-out ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      {...props}
    >
      {children}
    </button>
  );
}