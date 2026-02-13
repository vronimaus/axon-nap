import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import BodyPainMap from '../components/diagnosis/BodyPainMap';
import DemoPaywall from '../components/demo/DemoPaywall';
import { useDemoTimer } from '../components/demo/useDemoTimer';
import FocusScreenContainer from '../components/diagnosis/FocusScreenContainer';
import InteractiveBodyMapInput from '../components/diagnosis/InteractiveBodyMapInput';
import PainIntensitySlider from '../components/diagnosis/PainIntensitySlider';
import BinaryChoiceButtons from '../components/diagnosis/BinaryChoiceButtons';
import DiagnosisCard from '../components/diagnosis/DiagnosisCard';
import DiagnosisLoadingAnimation from '../components/diagnosis/DiagnosisLoadingAnimation';

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
  // Workflow: body_map -> intensity -> analysis_card -> retest -> chain_scan -> follow_up
  const [workflowStep, setWorkflowStep] = useState(mapDataParam && regionParam ? 'intensity' : 'body_map');
  const [diagnosisCardData, setDiagnosisCardData] = useState(null);
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
          setLoading(true);
          const contextMsg = isContinuation 
            ? `Ich habe den Wizard durchlaufen und es ist zwar besser geworden, aber nicht vollständig weg.\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n\nWo tut es noch weh und wie können wir die verbleibenden Beschwerden angehen?`
            : `Ich habe gerade den Diagnose-Wizard abgeschlossen:\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n- Diagnose-Typ: ${wizardSession.diagnosis_type}\n\nBitte verfeinere die Diagnose und empfehle mir die spezifischen MFR-Nodes.`;
          
          await base44.agents.addMessage(conv, {
            role: 'user',
            content: contextMsg
          });
        }
        // If from Dashboard with body map, skip Body Map and go straight to intensity
        else if (mapDataParam && regionParam) {
          setLoading(true);
          const mapData = JSON.parse(mapDataParam);
          const fullRegion = regionParam;
          const markerType = mapData.markers.length === 1 && mapData.markers[0].type === 'point'
            ? 'einen Schmerzpunkt'
            : 'eine Schmerzlinie';
          
          // Send body map data as if user just completed it
          await base44.agents.addMessage(conv, {
            role: 'user',
            content: `Ich habe auf der Body Map (${mapData.view === 'front' ? 'Vorderseite' : 'Rückseite'}) ${markerType} markiert. Die Markierung ist im Bereich: ${fullRegion}`
          });
        }
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
      }
    };
    initConversation();
  }, [wizardSession, mapDataParam, regionParam]);

  // Subscribe to conversation updates and detect workflow triggers
  useEffect(() => {
   if (!conversation?.id) return;

   const unsubscribe = base44.agents.subscribeToConversation(
     conversation.id,
     (data) => {
       const newMessages = data.messages || [];
       setMessages(newMessages);
       setLoading(false);
       
       // Check last assistant message for workflow triggers
       const lastMessage = newMessages[newMessages.length - 1];
       if (lastMessage?.role === 'assistant' && lastMessage?.content) {
         const content = lastMessage.content;

         // Trigger workflow steps based on agent's response
         // Check in all workflow modes (not just 'chat') to ensure transitions work
         if (content.includes('[TRIGGER_BODY_MAP]') && workflowStep === 'chat') {
           setWorkflowStep('body_map');
         } else if (content.includes('[TRIGGER_INTENSITY]')) {
           setWorkflowStep('intensity');
         } else if (content.includes('[TRIGGER_RETEST]')) {
           setWorkflowStep('retest');
         } else if (content.includes('[SHOW_DIAGNOSIS_CARD]')) {
           // Extract full diagnosis text (everything before the trigger)
           const diagnosisText = content.split('[SHOW_DIAGNOSIS_CARD]')[0].trim();
           setDiagnosisCardData({
             title: 'Deine AXON-Diagnose',
             analysis: diagnosisText
           });
           // Move to analysis card focus screen
           setWorkflowStep('analysis_card');
         } else if (content.includes('[TRIGGER_CHAIN_SCAN]')) {
           setWorkflowStep('chain_scan');
         } else if (
           content.includes('[CREATE_REHAB_PLAN]') || 
           content.includes('Dein umfassender Reha-Plan wurde erstellt') ||
           (content.includes('Phase 3: Langfristige Prävention') && content.includes('Ich erstelle jetzt einen umfassenden Reha-Plan'))
         ) {
           setWorkflowStep('rehab_plan_created');
         }
       }
     }
   );

   return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to bottom (optimized with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
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

  const handleSpeak = (messageId, text) => {
    // Stop current audio if speaking same message
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Stop any other currently playing audio
    window.speechSynthesis.cancel();

    // Clean markdown for speech
    let cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '');

    if (!cleanText.trim()) return;

    setSpeakingMessageId(messageId);

    // Split into very small chunks (max 200 chars) to avoid browser limits
    const chunks = [];
    const sentences = cleanText.split(/([.!?]\s+)/);
    let currentChunk = '';

    sentences.forEach(part => {
      if ((currentChunk + part).length > 200) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    });
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    let currentIndex = 0;
    let isCancelled = false;

    const speakNextChunk = () => {
      if (isCancelled || currentIndex >= chunks.length) {
        if (!isCancelled) setSpeakingMessageId(null);
        return;
      }

      // Wait for voices to load
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && currentIndex === 0) {
        setTimeout(speakNextChunk, 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const germanVoice = voices.find(v => v.lang.startsWith('de')) || voices[0];
      if (germanVoice) {
        utterance.voice = germanVoice;
      }

      utterance.onend = () => {
        currentIndex++;
        setTimeout(speakNextChunk, 50); // Small delay between chunks
      };

      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        currentIndex++;
        setTimeout(speakNextChunk, 100); // Continue on error
      };

      window.speechSynthesis.speak(utterance);
    };

    // Cleanup function
    const cancel = () => {
      isCancelled = true;
      window.speechSynthesis.cancel();
    };

    // Start speaking
    speakNextChunk();
  };



  // Don't block chat with demo paywall if coming from wizard (user is mid-session)
  if (isDemoExpired && !wizardSession) {
    return <DemoPaywall />;
  }

  // === WORKFLOW STEP HANDLERS ===
  const handleBodyMapSubmitFocus = async (mapData) => {
    // Use detected region from mapData
    const region = mapData.region || 'unbekannte Region';

    console.log('Body Map submitted - Region:', region, 'Map data:', mapData);

    // Store full data in session
    sessionStorage.setItem('current_pain_map', JSON.stringify({ ...mapData, region }));

    // Move to intensity IMMEDIATELY (no chat screen)
    setWorkflowStep('intensity');

    // Send to agent in background with region info
    try {
      const markerType = mapData.markers.length === 1 && mapData.markers[0].type === 'point'
        ? 'einen Schmerzpunkt'
        : 'eine Schmerzlinie';

      base44.agents.addMessage(conversation, {
        role: 'user',
        content: `Ich habe auf der Body Map (${mapData.view === 'front' ? 'Vorderseite' : 'Rückseite'}) ${markerType} markiert. Die Markierung ist im Bereich: ${region}`
      });
    } catch (error) {
      console.error('Fehler beim Senden:', error);
    }
  };

  const handleIntensitySubmit = async (intensity) => {
    // Track diagnosis start
    base44.analytics.track({
      eventName: 'diagnosis_started',
      properties: { pain_intensity: intensity }
    });

    // Immediately switch to analysis_card with loading state
    setWorkflowStep('analysis_card');
    setLoading(true);
    
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `Schmerzintensität: ${intensity}/10. Bitte analysiere jetzt mein Problem und gib mir ein konkretes Protokoll.`
      });
      // Agent will trigger [SHOW_DIAGNOSIS_CARD] which updates diagnosisCardData
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      setLoading(false);
    }
  };

  const handleRetestPositive = async () => {
    // User feels better - but trigger chain scan instead of ending
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: 'Fühlt sich tatsächlich besser an!'
      });
      // Agent will trigger [TRIGGER_CHAIN_SCAN] to check the full chain
    } catch (error) {
      console.error('Fehler:', error);
      setLoading(false);
    }
  };

  const handleRetestNegative = async () => {
    // Need further investigation - go to minimal follow-up UI
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: 'Leider keine Veränderung. Der Schmerz ist gleich geblieben.'
      });
      // Go to minimal follow-up UI instead of full chat
      setWorkflowStep('follow_up');
    } catch (error) {
      console.error('Fehler:', error);
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!input.trim() || !conversation) return;
    
    setLoading(true);
    const messageText = input.trim();
    setInput('');

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageText
      });
      // Agent will decide next step via triggers
    } catch (error) {
      console.error('Fehler:', error);
      setLoading(false);
    }
  };

  // === RENDER WORKFLOW STEPS ===
  if (workflowStep === 'body_map') {
    return (
      <FocusScreenContainer
        title="Wo tut es weh?"
        instruction="Tippe auf die exakte Stelle oder zeichne eine Linie entlang des Schmerzes"
        showBackButton={false}
      >
        <InteractiveBodyMapInput onSubmit={handleBodyMapSubmitFocus} />
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'intensity') {
    return (
      <FocusScreenContainer
        title="Wie stark ist der Schmerz?"
        instruction="Wähle die Intensität auf einer Skala von 1-10"
        showBackButton={false}
      >
        <PainIntensitySlider onSubmit={handleIntensitySubmit} loading={loading} />
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'analysis_card') {
    return (
      <FocusScreenContainer
        title="Deine Diagnose & Protokoll"
        instruction="Folge den 3 Schritten und melde dich danach zurück"
        showBackButton={false}
      >
        {loading || !diagnosisCardData ? (
          <DiagnosisLoadingAnimation message="Erstelle dein Protokoll..." />
        ) : (
          <DiagnosisCard
            title={diagnosisCardData?.title || 'Diagnose'}
            analysis={diagnosisCardData?.analysis || ''}
            callToAction="Fertig – Übungen gemacht"
            onActionClick={async () => {
              setLoading(true);
              try {
                await base44.agents.addMessage(conversation, {
                  role: 'user',
                  content: 'Habe es gemacht'
                });
                // Agent will trigger [TRIGGER_RETEST] which moves to 'retest'
              } catch (error) {
                console.error('Fehler:', error);
                setLoading(false);
              }
            }}
          />
        )}
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'retest') {
    return (
      <FocusScreenContainer
        title="Erfolgs-Check"
        instruction="Wie fühlt sich die Bewegung jetzt an?"
        showBackButton={false}
      >
        <BinaryChoiceButtons
          onPositive={handleRetestPositive}
          onNegative={handleRetestNegative}
        />
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'chain_scan') {
    return (
      <FocusScreenContainer
        title="🔍 Erweiterte Kettenanalyse"
        instruction="Markiere weitere Bereiche mit Spannung oder Beschwerden - auch wenn sie nicht akut schmerzen"
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Show last assistant message with chain explanation */}
          {(() => {
            const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
            const lastMsgContent = lastAssistantMsg?.content?.split('[TRIGGER_CHAIN_SCAN]')[0].trim() || '';
            
            return lastMsgContent && (
              <div className="glass rounded-2xl p-6 border border-cyan-500/30">
                <ReactMarkdown
                  className="text-slate-300 prose prose-sm prose-invert max-w-none"
                  components={{
                    p: ({ children }) => <p className="mb-3">{children}</p>,
                    strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>,
                    ul: ({ children }) => <ul className="ml-4 list-disc mb-3">{children}</ul>,
                    li: ({ children }) => <li className="mb-1">{children}</li>
                  }}
                >
                  {lastMsgContent}
                </ReactMarkdown>
              </div>
            );
          })()}

          {/* Body Map for marking additional areas */}
          <InteractiveBodyMapInput
            onSubmit={async (data) => {
              const regions = data.detectedRegions?.join(', ') || 'weitere Bereiche';
              setLoading(true);
              try {
                await base44.agents.addMessage(conversation, {
                  role: 'user',
                  content: `Ich habe folgende Bereiche markiert: ${regions}`
                });
                // Agent will provide full chain protocol
                setWorkflowStep('follow_up');
              } catch (error) {
                console.error('Fehler:', error);
                setLoading(false);
              }
            }}
          />
        </motion.div>
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'rehab_plan_created') {
    // Check if plan is still being created (has tool_calls)
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const isCreating = lastAssistantMsg?.tool_calls?.some(tc => tc.status === 'running' || tc.status === 'pending');

    if (isCreating) {
      return (
        <FocusScreenContainer
          title="🏗️ Dein Reha-Plan wird erstellt..."
          instruction="Bitte warten, dies kann einen Moment dauern"
          showBackButton={false}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full mb-6"
            />
            <p className="text-slate-300 text-lg mb-2">Erstelle deinen persönlichen Reha-Plan...</p>
            <p className="text-slate-500 text-sm">Phase 1: Akut-Linderung • Phase 2: Integration • Phase 3: Prävention</p>
          </motion.div>
        </FocusScreenContainer>
      );
    }

    // Plan created - show completion screen
    const lastMsgContent = lastAssistantMsg?.content?.split('[CREATE_REHAB_PLAN]')[0].trim() || '';

    return (
      <FocusScreenContainer
        title="✅ Reha-Plan erstellt"
        instruction="Was möchtest du als nächstes tun?"
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto space-y-6"
        >
          {/* Summary */}
          {lastMsgContent && (
            <div className="glass rounded-2xl p-6 border border-cyan-500/30">
              <ReactMarkdown
                className="text-slate-300 prose prose-sm prose-invert max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>,
                  ul: ({ children }) => <ul className="ml-4 list-disc mb-3">{children}</ul>,
                  li: ({ children }) => <li className="mb-1">{children}</li>
                }}
              >
                {lastMsgContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid gap-4">
            <Button
              onClick={() => window.location.href = createPageUrl('RehabPlan')}
              className="w-full h-16 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-lg"
            >
              Zum Reha-Plan
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => setWorkflowStep('chat')}
              variant="outline"
              className="w-full h-14 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Hast du weitere Fragen?
            </Button>
          </div>
        </motion.div>
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'follow_up') {
    // Get last assistant message for context
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const lastMsgContent = lastAssistantMsg?.content || '';
    
    return (
      <FocusScreenContainer
        title="Noch eine Frage"
        instruction="Beantworte kurz, damit wir weiter analysieren können"
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto space-y-6"
        >
          {/* Last Agent Message */}
          {lastMsgContent && (
            <div className="glass rounded-2xl p-6 border border-cyan-500/30">
              <ReactMarkdown
                className="text-slate-300 prose prose-sm prose-invert max-w-none"
                components={{
                  p: ({ children }) => {
                    const cleanChildren = typeof children === 'string' 
                      ? children
                          .replace(/\[TRIGGER_BODY_MAP\]/g, '')
                          .replace(/\[TRIGGER_INTENSITY\]/g, '')
                          .replace(/\[TRIGGER_RETEST\]/g, '')
                          .replace(/\[SHOW_DIAGNOSIS_CARD\][\s\S]*/g, '')
                          .trim()
                      : children;
                    return cleanChildren ? <p className="mb-3">{cleanChildren}</p> : null;
                  },
                  strong: ({ children }) => <strong className="text-cyan-400">{children}</strong>
                }}
              >
                {lastMsgContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Minimal Input */}
          <div className="glass rounded-2xl p-4 border border-cyan-500/30">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUpSubmit();
                }
              }}
              placeholder="Deine Antwort..."
              className="w-full min-h-[80px] bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none mb-3"
              disabled={loading}
              autoFocus
            />
            <Button
              onClick={handleFollowUpSubmit}
              disabled={!input.trim() || loading}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  Senden
                  <Send className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </FocusScreenContainer>
    );
  }

  // Only show chat when in 'chat' workflow step
  if (workflowStep !== 'chat') {
    return null; // Focus screens are rendered above
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
                                p: ({ children }) => {
                                  // Filter out workflow triggers from display
                                  const cleanChildren = typeof children === 'string' 
                                    ? children
                                        .replace(/\[TRIGGER_BODY_MAP\]/g, '')
                                        .replace(/\[TRIGGER_INTENSITY\]/g, '')
                                        .replace(/\[TRIGGER_RETEST\]/g, '')
                                        .replace(/\[SHOW_DIAGNOSIS_CARD\][\s\S]*/g, '')
                                        .trim()
                                    : children;
                                  return cleanChildren ? <p className="my-1 leading-relaxed text-slate-100">{cleanChildren}</p> : null;
                                },
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
                {/* Focus Mode Trigger - Only show if NOT coming from wizard */}
                {!wizardSession && (
                  <Button
                    onClick={() => setWorkflowStep('body_map')}
                    disabled={loading || !conversation || isDemoExpired}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-[60px] px-4"
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