import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PainIntensitySlider({ onSubmit, loading, initialValue = 5 }) {
  const [intensity, setIntensity] = useState(initialValue);

  const getIntensityLabel = (value) => {
    if (value <= 3) return { text: 'Leicht', color: 'text-green-400' };
    if (value <= 6) return { text: 'Moderat', color: 'text-yellow-400' };
    return { text: 'Stark', color: 'text-red-400' };
  };

  const label = getIntensityLabel(intensity);

  return (
    <div className="w-full space-y-8">
      {/* Visual Intensity Display */}
      <div className="text-center">
        <motion.div
          key={intensity}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-8xl font-bold ${label.color} mb-4`}
        >
          {intensity}
        </motion.div>
        <p className={`text-2xl font-semibold ${label.color}`}>
          {label.text}
        </p>
      </div>

      {/* Slider */}
      <div className="px-8">
        <Slider
          value={[intensity]}
          onValueChange={(value) => setIntensity(value[0])}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-sm text-slate-500">
          <span>1 - Kaum spürbar</span>
          <span>10 - Unerträglich</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(intensity)}
        disabled={loading}
        className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg"
      >
        Weiter
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}