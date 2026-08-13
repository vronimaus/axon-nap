import React, { useEffect, useRef } from 'react';

/**
 * Floating neural-network style particle field for the Hero section.
 * Lightweight canvas 2D — drifting nodes + connecting lines on proximity,
 * subtle mouse parallax. Matches the neuro-athletic / fascia-chain aesthetic.
 */
export default function HeroParticles() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({
    particles: [],
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;

    const PARTICLE_COLOR = '6, 224, 226'; // cyan-400
    const LINE_COLOR = '6, 224, 226';
    const CONNECT_DIST = 130;

    const init = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const state = stateRef.current;
      state.width = w;
      state.height = h;

      // density scales with area, capped for perf
      const count = Math.min(70, Math.max(28, Math.floor((w * h) / 16000)));
      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    init();

    if (!isCoarse) {
      const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        stateRef.current.targetMouseX = e.clientX - rect.left;
        stateRef.current.targetMouseY = e.clientY - rect.top;
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      var cleanup = () => window.removeEventListener('mousemove', onMove);
    }

    const onResize = () => init();
    window.addEventListener('resize', onResize);

    const draw = () => {
      const { width: w, height: h, particles } = stateRef.current;
      const s = stateRef.current;
      // ease mouse
      s.mouseX += (s.targetMouseX - s.mouseX) * 0.05;
      s.mouseY += (s.targetMouseY - s.mouseY) * 0.05;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.015;

        // wrap
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // subtle parallax pull toward mouse
        if (!isCoarse) {
          const dx = s.mouseX - p.x;
          const dy = s.mouseY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 160 && dist > 0.01) {
            const force = (1 - dist / 160) * 0.015;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
          // friction
          p.vx *= 0.985;
          p.vy *= 0.985;
          // keep base drift alive
          if (Math.abs(p.vx) < 0.03) p.vx += (Math.random() - 0.5) * 0.04;
          if (Math.abs(p.vy) < 0.03) p.vy += (Math.random() - 0.5) * 0.04;
        }

        // connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const d = Math.hypot(ddx, ddy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.35;
            ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // node
        const glow = 0.5 + Math.sin(p.pulse) * 0.25;
        ctx.fillStyle = `rgba(${PARTICLE_COLOR},${0.55 * glow + 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    if (!prefersReduced) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      // single static frame for reduced motion
      draw();
      cancelAnimationFrame(rafRef.current);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
    />
  );
}