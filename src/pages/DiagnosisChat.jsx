import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Sparkles, Activity, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import BodyPainMap from '../components/diagnosis/BodyPainMap';
import DemoPaywall from '../components/demo/DemoPaywall';
import { useDemoTimer } from '../components/demo/useDemoTimer';



export default function DiagnosisChat() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const mapDataParam = searchParams.get('mapData');
  const regionParam = searchParams.get('region');
  const { isDemoExpired, isLoading: demoLoading, formattedTime } = useDemoTimer();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBodyMap, setShowBodyMap] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Fetch wizard results if session_id provided
  const { data: wizardSession } = useQuery({
    queryKey: ['diagnosisSession', sessionId],
    queryFn: () => sessionId 
      ? base44.entities.DiagnosisSession.filter({ id: sessionId }).then(s => s[0] || null)
      : Promise.resolve(null),
    enabled: !!sessionId
  });

  // Create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const isContinuation = sessionId && searchParams.get('continue') === 'true';

        const metadata = {
          name: 'MFR Detective Session',
          description: '4-Phasen Diagnostic Protocol: Assessment → Hardware → Software → Validation'
        };

        // If we have wizard results, add them as context
        if (wizardSession) {
          metadata.wizard_results = {
            region: wizardSession.symptom_location,
            symptom: wizardSession.symptom_description,
            diagnosis_type: wizardSession.diagnosis_type,
            tested_chains: wizardSession.tested_chains
          };
        }

        // Body map data will be sent as a user message, not metadata

        const conv = await base44.agents.createConversation({
          agent_name: 'diagnosis_reasoning',
          metadata
        });
        setConversation(conv);
        setMessages(conv.messages || []);

        // If from wizard, send initial context message
        if (wizardSession) {
          const contextMsg = isContinuation 
            ? `Ich habe den Wizard durchlaufen und es ist zwar besser geworden, aber nicht vollständig weg.\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n\nWo tut es noch weh und wie können wir die verbleibenden Beschwerden angehen?`
            : `Ich habe gerade den Diagnose-Wizard abgeschlossen:\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n- Diagnose-Typ: ${wizardSession.diagnosis_type}\n\nBitte verfeinere die Diagnose und empfehle mir die spezifischen MFR-Nodes.`;
          
          await base44.agents.addMessage(conv, {
            role: 'user',
            content: contextMsg
          });
          setLoading(false);
        }
        // If from Dashboard with body map, use the region already detected by InteractiveBodyMap
        else if (mapDataParam && regionParam) {
          setLoading(true);
          const mapData = JSON.parse(mapDataParam);
          const fullRegion = regionParam;
          const markerType = mapData.markers.length === 1 && mapData.markers[0].type === 'point'
            ? 'einen Schmerzpunkt'
            : 'eine Schmerzlinie';
          
          await base44.agents.addMessage(conv, {
            role: 'user',
            content: `Ich habe auf der Body Map (${mapData.view === 'front' ? 'Vorderseite' : 'Rückseite'}) ${markerType} markiert.\n\n📍 Die Markierung ist im Bereich: **${fullRegion}**\n\nKannst du mir sagen, welche MFR-Nodes und Neuro-Drills ich für diese Region nutzen soll?`
          });
        }
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
      }
    };
    initConversation();
  }, [wizardSession, mapDataParam, regionParam]);

  // Subscribe to conversation updates
  useEffect(() => {
   if (!conversation?.id) return;

   const unsubscribe = base44.agents.subscribeToConversation(
     conversation.id,
     (data) => {
       setMessages(data.messages || []);
       setLoading(false);
     }
   );

   return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || !conversation) return;

    setInput('');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: textToSend
      });
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      setLoading(false);
    }
  };



  const handleBodyMapSubmit = async (analysisData) => {
    setLoading(true);
    setShowBodyMap(false);
    
    try {
      const message = `Ich habe meine Schmerzbereiche auf dem Körper markiert (${analysisData.view === 'front' ? 'Vorderseite' : 'Rückseite'}). Bitte analysiere die Schmerzmarkierung und ordne sie den entsprechenden Faszien-Ketten zu.`;
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: message,
        file_urls: [analysisData.imageUrl]
      });
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      setLoading(false);
    }
  };

  const handleSpeak = async (messageId, text) => {
    // Stop current audio if speaking same message
    if (speakingMessageId === messageId) {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.stop();
      }
      setSpeakingMessageId(null);
      speechSynthesisRef.current = null;
      return;
    }

    // Stop any other currently playing audio
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }

    // Clean markdown for speech
    let cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '');

    // Smart truncation: cut at sentence end if > 800 chars
    if (cleanText.length > 800) {
      const truncated = cleanText.substring(0, 800);
      const lastPeriod = truncated.lastIndexOf('.');
      cleanText = lastPeriod > 400 ? truncated.substring(0, lastPeriod + 1) : truncated;
    }

    setSpeakingMessageId(messageId);

    try {
      const response = await base44.functions.invoke('textToSpeech', { text: cleanText });
      
      if (!response.data || !response.data.audio) {
        throw new Error('No audio data received');
      }
      
      // Decode base64 PCM data
      const pcmBase64 = response.data.audio;
      const pcmBinary = atob(pcmBase64);
      const pcmBytes = new Uint8Array(pcmBinary.length);
      for (let i = 0; i < pcmBinary.length; i++) {
        pcmBytes[i] = pcmBinary.charCodeAt(i);
      }
      
      // Create Web Audio context and buffer
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = audioContext.createBuffer(
        response.data.channels,
        pcmBytes.length / 2,
        response.data.sampleRate
      );
      
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        const sample = (pcmBytes[i * 2] | (pcmBytes[i * 2 + 1] << 8));
        channelData[i] = sample < 0x8000 ? sample / 0x8000 : (sample - 0x10000) / 0x8000;
      }
      
      // Play audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setSpeakingMessageId(null);
        speechSynthesisRef.current = null;
        audioContext.close();
      };
      
      speechSynthesisRef.current = source;
      source.start(0);
    } catch (error) {
      console.error('TTS Error:', error.message);
      setSpeakingMessageId(null);
      speechSynthesisRef.current = null;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.stop();
      }
    };
  }, []);

  // Don't block chat with demo paywall if coming from wizard (user is mid-session)
  if (isDemoExpired && !wizardSession) {
    return <DemoPaywall />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Detective Mode
            </h1>
          </div>
          <p className="text-slate-400">
            Assessment → Hardware → Software → Validation (4-Phasen-Protokoll)
          </p>
        </motion.div>

        {/* Body Pain Map Modal */}
        <AnimatePresence>
          {showBodyMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowBodyMap(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl border border-cyan-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <BodyPainMap
                  onSubmit={handleBodyMapSubmit}
                  onCancel={() => setShowBodyMap(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Container */}
        <Card className="bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-sm mb-6">
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <MessageCircle className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">Keine Nachrichten</p>
                  <p className="text-sm text-slate-400">
                    Beschreibe deine Symptome und ich führe dich durch die Diagnose
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white'
                            : 'bg-slate-800 border border-slate-700 text-slate-100'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        ) : (
                          <>
                            <ReactMarkdown
                              className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                              components={{
                                p: ({ children }) => (
                                  <p className="my-1 leading-relaxed text-slate-100">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="my-2 ml-4 list-disc text-slate-100">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="my-2 ml-4 list-decimal text-slate-100">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="my-0.5 text-slate-100">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-cyan-300">{children}</strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-purple-300">{children}</em>
                                ),
                                code: ({ inline, children }) =>
                                  inline ? (
                                    <code className="px-1 py-0.5 rounded bg-slate-900 text-cyan-300 text-xs">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-slate-900 rounded p-2 text-xs text-slate-200">
                                      {children}
                                    </code>
                                  ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>

                            {/* Text-to-Speech Button */}
                            <button
                              onClick={() => handleSpeak(msg.id, msg.content)}
                              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-xs text-slate-300 hover:text-cyan-400"
                              title={speakingMessageId === msg.id ? 'Vorlesen stoppen' : 'Absatzweise vorlesen'}
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="w-4 h-4" />
                                  <span>Stoppen</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4" />
                                  <span>Vorlesen</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Tool Calls Display - Hidden for cleaner UX */}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="glass-cyan rounded-2xl px-4 py-3 border border-cyan-500/30">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-sm text-slate-300">Analysiere...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-cyan-500/20 bg-slate-900/70">
              <div className="flex gap-2">
                {/* Only show body map button if NOT coming from wizard */}
                {!wizardSession && (
                  <Button
                    onClick={() => setShowBodyMap(true)}
                    disabled={loading || !conversation || isDemoExpired}
                    variant="outline"
                    className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10 h-[60px] px-4"
                  >
                    <Activity className="w-5 h-5" />
                  </Button>
                )}
                
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(null);
                    }
                  }}
                  placeholder={
                    isDemoExpired 
                      ? "Demo vorbei – upgraden um fortzufahren" 
                      : "Beschreibe deine Symptome..."
                  }
                  className="flex-1 min-h-[60px] max-h-[120px] bg-slate-900/50 border-cyan-500/30 text-slate-200 placeholder:text-slate-500 resize-none text-sm sm:text-base"
                  disabled={loading || !conversation || isDemoExpired}
                />
                <Button
                  onClick={() => sendMessage(null)}
                  disabled={!input.trim() || loading || !conversation || isDemoExpired}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-[60px] px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Nimm dir Zeit für AXON – dieser Prozess braucht deine volle Aufmerksamkeit. Es geht um dich.
              </p>
            </div>
          </div>
        </Card>

        {/* MFR Node Reference Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-cyan rounded-2xl border border-cyan-500/30 p-4 sm:p-6"
        >
          <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span>MFR Node Karte</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-4">
            Alle 12 MFR-Nodes auf einen Blick – verwende diese Karte zur genauen Lokalisierung
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/c7c1085f4_TEchnicalMFRCoordinates.jpg"
              alt="MFR Node Koordinaten - Front und Back"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}