import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfettiEffect({ trigger }) {
  const [pieces, setPieces] = useState([]);
  
  useEffect(() => {
    if (trigger) {
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
      const newPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        size: Math.random() * 8 + 4
      }));
      setPieces(newPieces);
      
      setTimeout(() => setPieces([]), 3000);
    }
  }, [trigger]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ 
              top: -20, 
              left: `${piece.left}%`,
              opacity: 1,
              rotate: 0
            }}
            animate={{ 
              top: '110vh',
              rotate: 720,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2.5 + Math.random(),
              delay: piece.delay,
              ease: 'easeIn'
            }}
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}