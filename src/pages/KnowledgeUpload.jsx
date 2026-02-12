import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Brain, Loader2, Check, X, BookOpen, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function KnowledgeUpload() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  const { data: knowledgeItems = [] } = useQuery({
    queryKey: ['scientificKnowledge'],
    queryFn: () => base44.entities.ScientificKnowledge.list('-created_date', 50),
    enabled: !!user
  });

  const createKnowledgeMutation = useMutation({
    mutationFn: (data) => base44.entities.ScientificKnowledge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scientificKnowledge'] });
      toast.success('Paper erfolgreich zur Wissensdatenbank hinzugefügt!');
      setAnalysisResult(null);
      setSelectedFile(null);
      setTextInput('');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('text')) {
      toast.error('Bitte nur PDF oder Text-Dateien hochladen');
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let fileUrl = null;

      // Upload file if present
      if (uploadMode === 'file' && selectedFile) {
        toast.info('Datei wird hochgeladen...');
        const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
        fileUrl = uploadResult.file_url;
      }

      // Analyze paper
      toast.info('Paper wird analysiert...');
      const { data } = await base44.functions.invoke('analyzePaper', {
        text: uploadMode === 'text' ? textInput : null,
        file_url: fileUrl
      });

      if (data.success) {
        // Convert arrays to strings if needed for entity schema
        const analysis = { ...data.analysis };
        
        // key_findings must be a string (with bullet points)
        if (Array.isArray(analysis.key_findings)) {
          analysis.key_findings = analysis.key_findings.map(item => `• ${item}`).join('\n');
        }
        
        // recommended_actions must be a string
        if (Array.isArray(analysis.recommended_actions)) {
          analysis.recommended_actions = analysis.recommended_actions.map(item => `• ${item}`).join('\n');
        }
        
        // protocol_details must be a string
        if (Array.isArray(analysis.protocol_details)) {
          analysis.protocol_details = analysis.protocol_details.join('\n');
        }
        
        setAnalysisResult({
          ...analysis,
          file_url: data.original_file_url
        });
        toast.success('Analyse abgeschlossen!');
      } else {
        toast.error('Analyse fehlgeschlagen');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Fehler bei der Analyse: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!analysisResult) return;
    createKnowledgeMutation.mutate(analysisResult);
  };

  if (isChecking) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  const categoryColors = {
    hiit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    fascia: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    neuro: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    strength: 'bg-red-500/20 text-red-400 border-red-500/30',
    mobility: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    recovery: 'bg-green-500/20 text-green-400 border-green-500/30',
    hormones: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    nutrition: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  const statusColors = {
    not_implemented: 'bg-slate-500/20 text-slate-400',
    in_review: 'bg-yellow-500/20 text-yellow-400',
    partially_implemented: 'bg-blue-500/20 text-blue-400',
    fully_implemented: 'bg-green-500/20 text-green-400'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
              📚 AXON Wissensdatenbank
            </h1>
            <p className="text-slate-400">Paper hochladen, analysieren und für den AXON-Bot verfügbar machen</p>
          </div>
          <Button
            onClick={() => window.location.href = createPageUrl('AdminHub')}
            variant="outline"
            className="border-slate-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Paper hochladen
            </TabsTrigger>
            <TabsTrigger value="database">
              <BookOpen className="w-4 h-4 mr-2" />
              Datenbank ({knowledgeItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="glass border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Neues Paper hinzufügen</CardTitle>
                <CardDescription>Upload eine PDF oder füge Text ein - AXON analysiert automatisch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Mode Selector */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setUploadMode('file')}
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    className={uploadMode === 'file' ? 'bg-cyan-500/30' : ''}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Upload
                  </Button>
                  <Button
                    onClick={() => setUploadMode('text')}
                    variant={uploadMode === 'text' ? 'default' : 'outline'}
                    className={uploadMode === 'text' ? 'bg-cyan-500/30' : ''}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Text eingeben
                  </Button>
                </div>

                {/* File Upload */}
                {uploadMode === 'file' && (
                  <div>
                    <label className="block">
                      <div className="border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-lg p-8 text-center cursor-pointer transition-all">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-slate-300 font-medium mb-1">
                          {selectedFile ? selectedFile.name : 'Klicke hier oder ziehe eine Datei'}
                        </p>
                        <p className="text-sm text-slate-500">PDF oder TXT (max 10MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Text Input */}
                {uploadMode === 'text' && (
                  <Textarea
                    placeholder="Paper-Text oder Link hier einfügen..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={10}
                    className="bg-slate-800/50"
                  />
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!selectedFile && !textInput)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analysiere Paper...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Mit KI analysieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Result */}
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Analyse abgeschlossen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-1">{analysisResult.title}</h3>
                      <p className="text-sm text-slate-400">{analysisResult.source}</p>
                      {analysisResult.year && (
                        <p className="text-xs text-slate-500">Jahr: {analysisResult.year}</p>
                      )}
                    </div>

                    <div>
                      <Badge className={categoryColors[analysisResult.category] || categoryColors.other}>
                        {analysisResult.category}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-1">Zusammenfassung:</h4>
                      <p className="text-sm text-slate-400">{analysisResult.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-1">Key Findings:</h4>
                      <p className="text-sm text-slate-400 whitespace-pre-line">{analysisResult.key_findings}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-1">AXON-Relevanz:</h4>
                      <p className="text-sm text-slate-400">{analysisResult.axon_relevance}</p>
                    </div>

                    {analysisResult.tags && (
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={handleSave}
                      disabled={createKnowledgeMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {createKnowledgeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Zur Wissensdatenbank hinzufügen
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            {knowledgeItems.length === 0 ? (
              <Card className="glass border-slate-700">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">Noch keine Paper in der Wissensdatenbank</p>
                  <p className="text-sm text-slate-500 mt-2">Lade dein erstes Paper hoch!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {knowledgeItems.map((item) => (
                  <Card key={item.id} className="glass border-slate-700 hover:border-cyan-500/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                          <p className="text-xs text-slate-500">{item.source}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={categoryColors[item.category] || categoryColors.other}>
                            {item.category}
                          </Badge>
                          {item.implementation_status && (
                            <Badge className={statusColors[item.implementation_status]}>
                              {item.implementation_status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 mb-3">{item.summary}</p>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {item.target_audience && item.target_audience.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Zielgruppe: {item.target_audience.join(', ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}