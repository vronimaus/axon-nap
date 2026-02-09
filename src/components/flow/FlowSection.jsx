import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FlowSection() {
  const [expandedImage, setExpandedImage] = useState(null);

  const flowImages = [
    {
      id: 'anterior',
      title: 'Anterior Chain Reaction',
      description: 'Vorderkettenmuster - Extension Chain Reaktionen über die ganze vordere Körperlinie',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ae46b2f6e_Anterior.png',
      teachingPoints: [
        'Cervical Extension→Shoulder Flexion',
        'Thoracic Extension→Lumbar Extension',
        'Hip Extension→Knee Extension',
        'Subtalar/Ankle Dorsiflexion'
      ]
    },
    {
      id: 'posterior',
      title: 'Posterior Chain Reaction',
      description: 'Hinterkettenmuster - Flexion Chain Reaktionen über die ganze hintere Körperlinie',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/3c99804ab_Posterior.png',
      teachingPoints: [
        'Cervical Flexion→Shoulder Plantar Flexion',
        'Thoracic Flexion→Lumbar Flexion',
        'Hip Flexion→Knee Flexion',
        'Subtalar/Ankle Plantarflexion'
      ]
    },
    {
      id: 'opposite-lateral',
      title: 'Opposite Side Lateral Chain',
      description: 'Laterale Kettenmuster - Kontralaterale Stabilität und Mobilität',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/245f37385_OppositeSideLateral.png',
      teachingPoints: [
        'Cervical Lateral Flexion (gegenüberliegen)',
        'Shoulder Adduction-Abduction (gegenüberliegen)',
        'Thoracic Lateral Flexion (gegenüberliegen)',
        'Lumbar Abduction (gegenüberliegen)',
        'Knee Adduction (gegenüberliegen)',
        'Subtalar/Ankle Inversion'
      ]
    },
    {
      id: 'opposite-rotational',
      title: 'Opposite Side Rotational',
      description: 'Rotatorische Kettenmuster - Diagonale Kraftübertragung und Rotation',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/9bb0797c8_OppositeSideRotational.png',
      teachingPoints: [
        'Cervical Extension (gegenüberliegen)',
        'Shoulder Flexion (gegenüberliegen)',
        'Thoracic Extension (gegenüberliegen)',
        'Lumbar Abduction (gegenüberliegen)',
        'Knee Adduction (gegenüberliegen)',
        'Subtalar/Ankle Eversion'
      ]
    },
    {
      id: 'same-rotational',
      title: 'Same Side Rotational',
      description: 'Rotatorische Kettenmuster - Ipsilaterale Rotation und Kraft',
      url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/deb0bded5_SameSideRotational.png',
      teachingPoints: [
        'Cervical Extension (ipsilateral)',
        'Shoulder Flexion (ipsilateral)',
        'Thoracic Extension (ipsilateral)',
        'Lumbar Adduction (ipsilateral)',
        'Knee Adduction (ipsilateral)',
        'Subtalar/Ankle Adduction'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-cyan-500/30 p-6 bg-gradient-to-r from-cyan-500/10 to-transparent"
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-3">🌊 Flow Section</h2>
        <p className="text-slate-300 mb-4">
          Die <strong>5 fundamentalen Gary Gray 3DMAPS-Bewegungsmuster</strong> bilden die Grundlage für neuronale Bewegungsintegration und Kraftübertragung. Diese Muster zeigen, wie der Körper in verschiedenen Ebenen organisiert ist und wie Kraft durch myofasziale Ketten fließt.
        </p>
        <p className="text-sm text-slate-400">
          Nutze diese Referenzen im Coaching, um Clients ihre Bewegungsmuster zu zeigen und die Wichtigkeit von ganzheitlicher Mobilität und Stabilität zu vermitteln.
        </p>
      </motion.div>

      {/* Flow Images Grid */}
      <div className="grid gap-4">
        {flowImages.map((image, idx) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-xl border border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedImage(expandedImage === image.id ? null : image.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left flex-1">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">{image.title}</h3>
                  <p className="text-sm text-slate-400">{image.description}</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${
                  expandedImage === image.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expanded Content */}
            {expandedImage === image.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-700 px-6 py-6 bg-slate-800/20 space-y-6"
              >
                {/* Image */}
                <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>

                {/* Teaching Points */}
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Gelenkbewegungen in dieser Kette:</h4>
                  <ul className="space-y-2">
                    {image.teachingPoints.map((point, pidx) => (
                      <li key={pidx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-cyan-400 font-bold mt-0.5">→</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coaching Tips */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-semibold text-cyan-400 mb-2 text-sm">💡 Coaching-Tipp</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Nutze dieses Pattern, um deinem Client zu zeigen, wie der Körper integriert funktioniert. 
                    Ein Schwachpunkt in einer Gelenkkette kann die gesamte Bewegungsqualität beeinflussen.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl border border-slate-700 p-4 bg-gradient-to-r from-purple-500/10 to-transparent"
      >
        <h4 className="font-semibold text-purple-400 mb-2">📚 Quelle</h4>
        <p className="text-sm text-slate-400">
          Diese Bewegungsmuster basieren auf Gary Grays 3DMAPS-Konzept (3-Dimensional Movement Analysis and Performance System) 
          und zeigen die neurologischen Koordinationsmuster, die für optimale Kraft- und Bewegungsintegration notwendig sind.
        </p>
      </motion.div>
    </div>
  );
}