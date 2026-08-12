import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CARDS = [
  {
    key: 'protocol',
    headline: 'DAS PROTOKOLL',
    line: 'Faszien-Release · Neuro-Drill · Integration',
    image: 'https://media.base44.com/images/public/69790ebfa6f94c6c3f1450bc/bc1fda538_generated_image.png',
  },
  {
    key: 'stages',
    headline: 'DREI STUFEN',
    line: 'Soforthilfe → Flow → Goals',
    image: 'https://media.base44.com/images/public/69790ebfa6f94c6c3f1450bc/bac22bc8d_generated_image.png',
  },
  {
    key: 'audio',
    headline: 'AUDIO-COACH',
    line: 'Präzise Cues. Augen zu. Körper spüren.',
    image: 'https://media.base44.com/images/public/69790ebfa6f94c6c3f1450bc/9fce38861_generated_image.png',
  },
];

export default function BentoSection({ onCtaClick }) {
  return (
    <section
      id="system"
      className="relative py-16 md:py-24 px-6"
      style={{
        background: 'linear-gradient(to top, #0b0f0f 0%, #141c1c 100%)',
      }}
    >
      <div className="max-w-5xl mx-auto">
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
            Ein Protokoll. Drei Stufen.
            <br />
            Ein Audio-Coach.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
              style={{ aspectRatio: '3 / 4' }}
              onClick={onCtaClick}
            >
              {/* Background image */}
              <img
                src={card.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.15) 100%)',
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="text-white font-black uppercase tracking-wide text-sm md:text-base mb-1.5">
                  {card.headline}
                </h3>
                <p className="text-white/80 text-xs md:text-[13px] leading-relaxed mb-4">
                  {card.line}
                </p>
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-black transition-transform group-hover:scale-105"
                  style={{ backgroundColor: '#6de0e2', alignSelf: 'flex-start' }}
                >
                  Start
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}