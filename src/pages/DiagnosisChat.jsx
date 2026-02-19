import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Sparkles, Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import BodyPainMap from '../components/diagnosis/BodyPainMap';
import DemoPaywall from '../components/demo/DemoPaywall';
import { useDemoTimer } from '../components/demo/useDemoTimer';
import FocusScreenContainer from '../components/diagnosis/FocusScreenContainer';
import InteractiveBodyMapInput from '../components/diagnosis/InteractiveBodyMapInput';
import PainIntensitySlider from '../components/diagnosis/PainIntensitySlider';
import BinaryChoiceButtons from '../components/diagnosis/BinaryChoiceButtons'; // Keep this import for now, as it might be used in other files or future changes.
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
  // Workflow: body_map -> intensity -> analysis_card -> post_exercise_feedback -> chain_scan -> follow_up
  const [workflowStep, setWorkflowStep] = useState(() => {
    // Restore from cache if available
    const cached = sessionStorage.getItem('diagnosis_workflow_step');
    return cached || (mapDataParam && regionParam ? 'intensity' : 'body_map');
  });
  const [diagnosisCardData, setDiagnosisCardData] = useState(() => {
    const cached = sessionStorage.getItem('diagnosis_card_data');
    return cached ? JSON.parse(cached) : null;
  });
  const messagesEndRef = useRef(null);

  // Persist workflow state to cache
  useEffect(() => {
    if (workflowStep) {
      sessionStorage.setItem('diagnosis_workflow_step', workflowStep);
    }
  }, [workflowStep]);

  useEffect(() => {
    if (diagnosisCardData) {
      sessionStorage.setItem('diagnosis_card_data', JSON.stringify(diagnosisCardData));
    }
  }, [diagnosisCardData]);

  // Persist conversation ID
  useEffect(() => {
    if (conversation?.id) {
      sessionStorage.setItem('diagnosis_conversation_id', conversation.id);
    }
  }, [conversation?.id]);

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
        // ALWAYS clear cache for fresh start - no conversation resume
        sessionStorage.removeItem('diagnosis_conversation_id');
        sessionStorage.removeItem('diagnosis_workflow_step');
        sessionStorage.removeItem('diagnosis_card_data');
        sessionStorage.removeItem('current_pain_map');

        setWorkflowStep(mapDataParam && regionParam ? 'intensity' : 'body_map');
        setDiagnosisCardData(null);

        // Timeout für das Archivieren (max 2 Sekunden)
        const archiveTimeout = new Promise((resolve) =>
          setTimeout(() => resolve(null), 2000)
        );

        // Archive any active RehabPlans (non-blocking)
        Promise.race([
          (async () => {
            try {
              const currentUser = await base44.auth.me();
              if (currentUser?.email) {
                const activePlans = await base44.entities.RehabPlan.filter({
                  user_email: currentUser.email,
                  status: 'active'
                });
                for (const plan of activePlans) {
                  await base44.entities.RehabPlan.update(plan.id, {
                    status: 'completed'
                  });
                }
              }
            } catch (e) {
              console.log('Archive skipped');
            }
          })(),
          archiveTimeout
        ]);

        const isContinuation = sessionId && searchParams.get('continue') === 'true';
        const metadata = {
          name: 'MFR Detective Session',
          description: '4-Phasen Diagnostic Protocol: Assessment → Hardware → Software → Validation'
        };

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

        // Send initial message only for wizard sessions
        // For mapData/region params: user goes through body_map → intensity flow,
        // the combined message is sent in handleIntensitySubmit
        if (wizardSession) {
          setLoading(true);
          const contextMsg = isContinuation 
            ? `Ich habe den Wizard durchlaufen und es ist zwar besser geworden, aber nicht vollständig weg.\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n\nWo tut es noch weh und wie können wir die verbleibenden Beschwerden angehen?`
            : `Ich habe gerade den Diagnose-Wizard abgeschlossen:\n- Region: ${wizardSession.symptom_location}\n- Symptom: ${wizardSession.symptom_description}\n- Diagnose-Typ: ${wizardSession.diagnosis_type}\n\nBitte verfeinere die Diagnose und empfehle mir die spezifischen MFR-Nodes.`;

          base44.agents.addMessage(conv, {
            role: 'user',
            content: contextMsg
          }).catch(e => console.error('Message send failed:', e));
        }
        // mapDataParam/regionParam case: no message sent here - 
        // user will go through body_map→intensity screens and send combined message
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
        setLoading(false);
      }
    };
    initConversation();
  }, [wizardSession, mapDataParam, regionParam, searchParams, sessionId]);

  // Subscribe to conversation updates and detect workflow triggers
  useEffect(() => {
   if (!conversation?.id) return;

   const unsubscribe = base44.agents.subscribeToConversation(
     conversation.id,
     (data) => {
       const newMessages = data.messages || [];
       setMessages(newMessages);

       const lastMessage = newMessages[newMessages.length - 1];
       if (!lastMessage) return;

       // Always update loading state based on message completion
       const hasActiveToolCall = lastMessage?.tool_calls?.some(
         tc => tc.status === 'running' || tc.status === 'pending' || tc.status === 'in_progress'
       );
       const isAssistantStreaming = lastMessage?.role === 'assistant' && !lastMessage?.content && !lastMessage?.tool_calls?.length;
       
       // Message is complete when it's an assistant message with no active tool calls
       const isMessageComplete = lastMessage?.role === 'assistant' && !hasActiveToolCall && !isAssistantStreaming;

       if (!isMessageComplete) return;

       setLoading(false);

       // Only check triggers on assistant messages with content
       if (lastMessage?.content) {
         const content = lastMessage.content;

         setWorkflowStep(currentStep => {
           // Never go backwards from rehab_plan_created
           if (currentStep === 'rehab_plan_created') return currentStep;

           // For rehab plan: only trigger if the message actually contains the marker
           // AND we're coming from chain_scan
           if (content.includes('[CREATE_REHAB_PLAN]') && currentStep === 'chain_scan') {
             return 'rehab_plan_created';
           } else if (content.includes('[SHOW_DIAGNOSIS_CARD]') && currentStep !== 'analysis_card') {
             const diagnosisText = content.split('[SHOW_DIAGNOSIS_CARD]')[0].trim();
             setDiagnosisCardData({
               title: 'Deine AXON-Diagnose',
               analysis: diagnosisText
             });
             return 'analysis_card';
           } else if (content.includes('[TRIGGER_CHAIN_SCAN]') && currentStep === 'post_exercise_feedback') {
             return 'chain_scan';
           } else if (content.includes('[TRIGGER_RETEST]') && currentStep === 'post_exercise_feedback') {
             return 'post_exercise_feedback';
           } else if (content.includes('[TRIGGER_INTENSITY]')) {
             return 'intensity';
           } else if (content.includes('[TRIGGER_BODY_MAP]') && currentStep === 'chat') {
             return 'body_map';
           }
           return currentStep;
         });
       }
     }
   );

   return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]); // Remove workflowStep from deps - functional updater handles current state

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

  // Removed speakingMessageId state and handleSpeak function as it was not part of the change request.
  // If it was intended to be part of the final code, it should be added back explicitly.
  // For now, adhering strictly to the provided changes.


  // Don't block chat with demo paywall if coming from wizard (user is mid-session)
  if (isDemoExpired && !wizardSession) {
    return <DemoPaywall />;
  }

  // === WORKFLOW STEP HANDLERS ===
  const handleBodyMapSubmitFocus = (mapData) => {
    const region = mapData.region || 'unbekannte Region';
    // Store region+map data for use in intensity submit - NO agent message yet
    sessionStorage.setItem('current_pain_map', JSON.stringify({ ...mapData, region }));
    setWorkflowStep('intensity');
  };

  const handleIntensitySubmit = async (intensity) => {
    base44.analytics.track({
      eventName: 'diagnosis_started',
      properties: { pain_intensity: intensity }
    });

    // Read stored map data to include region in the combined message
    const storedMap = JSON.parse(sessionStorage.getItem('current_pain_map') || '{}');
    const region = storedMap.region || 'unbekannte Region';
    const view = storedMap.view === 'front' ? 'Vorderseite' : 'Rückseite';
    const markerType = storedMap.markers?.length === 1 && storedMap.markers[0].type === 'point'
      ? 'einen Schmerzpunkt'
      : 'eine Schmerzlinie';

    // Show loading screen but stay in a neutral 'loading' step
    // so the subscriber can correctly detect [SHOW_DIAGNOSIS_CARD] and transition to analysis_card
    setWorkflowStep('waiting_analysis');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `Ich habe auf der Body Map (${view}) ${markerType} markiert. Die Markierung ist im Bereich: ${region}. Schmerzintensität: ${intensity}/10. Bitte analysiere jetzt mein Problem und gib mir ein konkretes Protokoll.`
      });
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      setLoading(false);
    }
  };

  const handlePostExerciseFeedback = async () => {
    if (!input.trim() || !conversation) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);
    // Immediately skip to chain_scan to avoid flicker back to this screen
    setWorkflowStep('chain_scan');

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageText
      });
    } catch (error) {
      console.error('Fehler:', error);
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!input.trim() || !conversation) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);

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
              // Sofort zum post_exercise_feedback wechseln
              setWorkflowStep('post_exercise_feedback');
              setLoading(false);
              try {
                await base44.agents.addMessage(conversation, {
                  role: 'user',
                  content: 'Habe es gemacht'
                });
                // Agent will trigger [TRIGGER_RETEST] which keeps us in 'post_exercise_feedback'
              } catch (error) {
                console.error('Fehler:', error);
              }
            }}
          />
        )}
      </FocusScreenContainer>
    );
  }

  if (workflowStep === 'post_exercise_feedback') {
    return (
      <FocusScreenContainer
        title="Wie fühlst du dich jetzt?"
        instruction="Fühlen sich deine Beschwerden nun leichter oder schwerer an und gab es Schwierigkeiten oder Spannungen bei der Ausführung der Übungen?"
        showBackButton={false}
      >
        {loading ? (
          <DiagnosisLoadingAnimation message="Analysiere dein Feedback..." />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="glass rounded-2xl p-4 border border-cyan-500/30">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostExerciseFeedback();
                  }
                }}
                placeholder="Z.B. 'Es fühlt sich leichter an, aber ich hatte Schwierigkeiten bei der zweiten Übung im Nacken...'"
                className="w-full min-h-[120px] bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none mb-3"
                disabled={loading}
                autoFocus
              />
              <Button
                onClick={handlePostExerciseFeedback}
                disabled={!input.trim() || loading}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold"
              >
                Weiter zur Kettenanalyse
                <Send className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
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
              const region = data.region || 'weitere Bereiche';
              setLoading(true);
              setWorkflowStep('rehab_plan_created');
              try {
                await base44.agents.addMessage(conversation, {
                  role: 'user',
                  content: `Ich habe auch im Bereich "${region}" eine Spannung. Bitte erstelle jetzt meinen personaliserten Reha-Plan basierend auf allen Ergebnissen.`
                });
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
    // Find the last assistant message that contains [CREATE_REHAB_PLAN]
    const planMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.content?.includes('[CREATE_REHAB_PLAN]'));
    
    // Plan is done when: the generateRehabPlan tool_call is completed (success/error)
    const planToolCall = planMsg?.tool_calls?.find(tc => tc.name === 'generateRehabPlan');
    const isPlanDone = planToolCall?.status === 'completed' || planToolCall?.status === 'success' || planToolCall?.status === 'error';
    
    // Still creating if: no planMsg yet, or tool is still running, or tool hasn't started
    const isCreating = !planMsg || !planToolCall || !isPlanDone;

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

    // Plan done - clear cache
    sessionStorage.removeItem('diagnosis_workflow_step');
    sessionStorage.removeItem('diagnosis_card_data');
    sessionStorage.removeItem('diagnosis_conversation_id');
    sessionStorage.removeItem('current_pain_map');

    // Plan created - show completion screen
    const lastMsgContent = planMsg?.content?.split('[CREATE_REHAB_PLAN]')[0].trim() || '';

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

  // Removed follow_up step - agent now directly triggers rehab plan creation

  // Show nothing while processing workflows - prevents dialog sticking
  if (workflowStep !== 'chat') {
    return null;
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
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"
                      />
                      <span className="text-sm text-slate-300">Verarbeite deine Eingabe...</span>
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