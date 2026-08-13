import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Brauche ich spezielles Equipment?',
    a: 'Ein Lacrosse-Ball oder Faszienball reicht für die meisten Protokolle. Für einige Nodes brauchst du eine Faszienrolle. AXON zeigt dir vor jeder Session, was du brauchst.',
  },
  {
    q: 'Was, wenn es mir nicht hilft?',
    a: 'Du hast 30 Tage Geld-zurück-Garantie. Wenn AXON nicht funktioniert, schreib uns — du bekommst dein Geld zurück. Ohne Wenn und Aber.',
  },
  {
    q: 'Ist das ein Abo?',
    a: 'Nein. Du zahlst einmalig 59,90 € und hast lebenslangen Zugriff auf alle Protokolle, Updates und den Audio-Coach. Keine versteckten Gebühren, keine Kündigung nötig.',
  },
  {
    q: 'Wie lange dauert eine Session?',
    a: 'Ein vollständiges 3-Schritt-Protokoll dauert 5–10 Minuten. Du kannst auch einzelne Schritte machen, wenn du wenig Zeit hast.',
  },
  {
    q: 'Ersetzt das einen Physiotherapeuten?',
    a: 'AXON ist ein Performance- und Mobility-Tool, keine medizinische Behandlung. Bei akuten oder anhaltenden Beschwerden konsultiere eine medizinische Fachperson. AXON ergänzt Therapie — ersetzt sie nicht.',
  },
];

function FAQItem({ faq, isOpen, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="text-white font-semibold text-sm md:text-base">{faq.q}</span>
        <ChevronDown
          className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
      </motion.div>
    </motion.div>
  );
}

export default function InlineFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-16 md:py-24 px-6"
      style={{ background: 'linear-gradient(to bottom, #0b0f0f 0%, #0e1414 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight text-white mb-3">
            Häufige Fragen
          </h2>
          <p className="text-slate-400 text-sm">
            Alles, was du vor dem Start wissen musst.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}