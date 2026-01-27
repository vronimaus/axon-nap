import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExerciseImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [offset, setOffset] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('generateExerciseImages', { 
        limit: 5, 
        offset: offset 
      });
      setResults(response.data);
      
      // Auto-increment offset for next batch
      if (response.data.success && response.data.summary.remaining > 0) {
        setOffset(offset + 5);
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Exercise Image Generator
          </h1>
          <p className="text-slate-400">
            Generate AI images for all exercises in the library
          </p>
        </div>

        <Card className="p-6 bg-[#2A2A2A] border border-slate-600 mb-6">
          <div className="text-center">
            <ImageIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <p className="text-white mb-4">
              Generates 5 images per batch. Click multiple times to generate all images.
              Each image follows the style guide: neon cyan and magenta on black background.
            </p>
            {offset > 0 && (
              <p className="text-cyan-400 mb-4 font-semibold">
                Next batch: Images {offset + 1} - {offset + 5}
              </p>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Batch...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Generate Next Batch (5 Images)
                </>
              )}
            </Button>
          </div>
        </Card>

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {results.success ? (
                <>
                  <Card className="p-6 bg-[#2A2A2A] border border-emerald-500/50 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <div>
                        <h3 className="text-xl font-bold text-emerald-400">Batch Complete!</h3>
                        <p className="text-slate-300">
                          {results.summary.successful} of {results.summary.processed} images generated successfully
                        </p>
                        {results.summary.remaining > 0 && (
                          <p className="text-cyan-400 text-sm mt-1">
                            {results.summary.remaining} images remaining - Click again to continue
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {results.results.map((result, index) => (
                      <Card key={index} className={`p-4 bg-[#2A2A2A] border ${
                        result.status === 'success' 
                          ? 'border-emerald-500/30' 
                          : 'border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.status === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <div>
                              <p className="font-medium text-white">{result.exercise_id}</p>
                              {result.message && (
                                <p className="text-xs text-slate-400">{result.message}</p>
                              )}
                            </div>
                          </div>
                          {result.image_url && (
                            <img 
                              src={result.image_url} 
                              alt={result.exercise_id}
                              className="w-16 h-16 rounded-lg object-cover border border-slate-600"
                            />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="p-6 bg-[#2A2A2A] border border-red-500/50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <h3 className="text-xl font-bold text-red-400">Error</h3>
                      <p className="text-slate-300">{results.error}</p>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}