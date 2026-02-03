import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function DebugComplaintHistory() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('debugComplaintHistory', {});
      console.log('Full response:', res.data);
      setResult(res.data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Debug: Complaint History</h1>
        
        <Button onClick={handleFetch} disabled={loading} className="mb-4">
          {loading ? 'Lädt...' : 'Neu laden'}
        </Button>

        {result && (
          <pre className="bg-slate-800 text-cyan-400 p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}