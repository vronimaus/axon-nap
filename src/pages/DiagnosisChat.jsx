import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Sparkles, Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import BodyPainMap from '../components/diagnosis/BodyPainMap';
import DemoPaywall from '../components/demo/DemoPaywall';
import { useDemoTimer } from '../components/demo/useDemoTimer';
import MFRNodeDisplay from '../components/mfr/MFRNodeDisplay';

export default function DiagnosisChat() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isDemoExpired, isLoading: demoLoading, formattedTime } = useDemoTimer();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBodyMap, setShowBodyMap] = useState(false);
  const messagesEndRef = useRef(null);

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
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
      }
    };
    initConversation();
  }, [wizardSession]);

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

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
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
              🔎 Detective Mode
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
        <Card className="bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-sm">
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
                            
                            {/* Auto-detect Node references and display */}
                            {msg.content && msg.content.match(/\b(N\d{1,2})\b/g)?.map((nodeRef, idx) => (
                              <div key={idx} className="mt-3">
                                <MFRNodeDisplay nodeId={nodeRef} />
                              </div>
                            ))}
                          </>
                        )}

                        {/* Tool Calls Display */}
                        {msg.tool_calls && msg.tool_calls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.tool_calls.map((tool, toolIdx) => (
                              <div
                                key={toolIdx}
                                className="text-xs bg-slate-800/50 rounded-lg p-2 border border-slate-700"
                              >
                                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                                  <Sparkles className="w-3 h-3" />
                                  <span>{tool.name}</span>
                                </div>
                                {tool.status === 'completed' && tool.results && (
                                  <div className="mt-1 text-slate-400">
                                    ✓ {typeof tool.results === 'string' ? tool.results.substring(0, 50) + '...' : 'Completed'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
              <div className="flex gap-3">
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
                      sendMessage();
                    }
                  }}
                  placeholder={isDemoExpired ? "Demo vorbei – upgraden um fortzufahren" : "Beschreibe deine Symptome... (Enter zum Senden)"}
                  className="flex-1 min-h-[60px] max-h-[120px] bg-slate-900/50 border-cyan-500/30 text-slate-200 placeholder:text-slate-500 resize-none"
                  disabled={loading || !conversation || isDemoExpired}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || !conversation || isDemoExpired}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-[60px] px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                 💡 Der Detective analysiert deine Schmerzen und empfiehlt die spezifischen MFR-Nodes (N1-N12) + Neuro-Drills
               </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}