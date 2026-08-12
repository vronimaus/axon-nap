import { useEffect, useRef } from 'react';

/**
 * Subtle cyan glow that follows the cursor — desktop pointer only.
 * Sits behind all content (z-0), fades when the mouse leaves the window.
 */
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch / coarse pointers
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let raf;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      });
    };
    const onLeave = () => { el.style.opacity = '0'; };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] z-0 opacity-0 transition-opacity duration-500"
      style={{
        background: 'radial-gradient(circle, rgba(6,224,226,0.06) 0%, transparent 60%)',
        willChange: 'transform',
      }}
    />
  );
}