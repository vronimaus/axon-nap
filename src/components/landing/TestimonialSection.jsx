import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TestimonialSection() {
  const [testimonials, setTestimonials] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    base44.entities.Testimonial.filter({ is_featured: true }, 'order', 10)
      .then(setTestimonials)
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  // Don't render the section at all if no testimonials exist yet
  if (!loading && testimonials.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="py-16 md:py-24 px-6 relative"
      style={{ background: 'linear-gradient(to bottom, #0b0f0f 0%, #0e1414 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2
            className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight"
            style={{ color: '#a5c4c4' }}
          >
            Was Athleten sagen
          </h2>
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-cyan-500/40 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-6 border border-white/[0.06] flex flex-col"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <Quote className="w-7 h-7 text-cyan-500/30 mb-3 shrink-0" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="w-3.5 h-3.5"
                      style={{
                        fill: idx < (t.rating || 5) ? '#6de0e2' : 'transparent',
                        color: idx < (t.rating || 5) ? '#6de0e2' : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/90 text-sm leading-relaxed mb-5 flex-1">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-black"
                      style={{ backgroundColor: '#6de0e2' }}
                    >
                      {t.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-bold leading-tight">{t.name}</p>
                    <p className="text-cyan-400/70 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}