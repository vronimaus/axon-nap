import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowRight } from 'lucide-react';
import MFRBodyMap from '@/components/mfr/MFRBodyMap';

export default function InteractiveBodyMapInput({ onSubmit }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedNode || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Simulate processing delay for effect
    setTimeout(() => {
      const mapData = {
        region: selectedNode.name_de || selectedNode.node_id,
        node_id: selectedNode.node_id,
        mode: 'rehab',
        view: 'generated' // Metadata
      };
      
      onSubmit(mapData);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center text-sm text-slate-400 mb-2">
        Tippe auf die Körperregion, die schmerzt
      </div>

      {/* New SVG Body Map */}
      <div className="relative w-full flex justify-center bg-slate-900/30 rounded-2xl py-4 border border-slate-800">
        <MFRBodyMap 
          onNodeSelect={setSelectedNode}
          selectedNode={selectedNode}
          // Let MFRBodyMap handle position toggling internally
        />
      </div>

      {/* Selected Region Feedback */}
      {selectedNode && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-block px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium">
            Ausgewählt: <span className="text-white">{selectedNode.name_de || selectedNode.node_id}</span>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setSelectedNode(null)}
          variant="outline"
          disabled={!selectedNode}
          className="flex-1 border-slate-600 text-slate-400"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedNode || isSubmitting}
          className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              <span className="ml-2">Analysiere...</span>
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}