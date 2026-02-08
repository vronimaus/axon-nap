import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Target } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import SessionFeedbackForm from '../components/performance/SessionFeedbackForm';
import PerformanceGoalCard from '../components/performance/PerformanceGoalCard';
import ExerciseActionCard from '../components/performance/ExerciseActionCard';

export default function PerformanceChat() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPlanCreating, setIsPlanCreating] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [workflowStep, setWorkflowStep] = useState('analysis'); // 'analysis' | 'exercises' | 'chat'
  const [goalAnalysis, setGoalAnalysis] = useState(null);
  const [exercisePhases, setExercisePhases] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          window.location.href = createPageUrl('Landing');
          return;
        }

        // Get goal from Dashboard input, body map data from sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        let goal = urlParams.get('goal');
        let mapDataStr = urlParams.get('mapData');
        
        // Get stored data from Dashboard (goal + tension markers)
        const bodyMapData = sessionStorage.getItem('bodyMapData');
        if (bodyMapData) {
          const parsedData = JSON.parse(bodyMapData);
          // Check if goal was passed via Dashboard's selectedBodyRegion
          if (!goal && parsedData.dashboardGoal) {
            goal = parsedData.dashboardGoal;
          }
          // Use the body map data with tension markers
          if (parsedData.mode === 'performance') {
            mapDataStr = JSON.stringify(parsedData);
          }
        }

        setGoalName(goal || 'Dein Ziel');

        // Fetch existing performance baselines
        let baselines = [];
        try {
          const baselinesData = await base44.entities.PerformanceBaseline.filter({
            user_email: user.email
          });
          baselines = Array.isArray(baselinesData) ? baselinesData : [];
        } catch (e) {
          console.error('Fehler beim Laden von Baselines:', e);
        }

        // Fetch UserNeuroProfile to get complaint_history or current_complaints
        let complaintHistory = [];
        let currentComplaints = '';
        try {
          const neuroProfiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
          console.log('Fetched neuroProfiles:', neuroProfiles);
          if (Array.isArray(neuroProfiles) && neuroProfiles.length > 0) {
            const profile = neuroProfiles[0];
            // Versuche complaint_history zu laden, fallback auf current_complaints
            if (profile?.complaint_history && Array.isArray(profile.complaint_history) && profile.complaint_history.length > 0) {
              complaintHistory = profile.complaint_history;
              console.log('Loaded complaint_history:', complaintHistory);
            } else if (profile?.current_complaints) {
              currentComplaints = profile.current_complaints;
              console.log('Using current_complaints fallback:', currentComplaints);
            }
          }
        } catch (e) {
          console.error('Fehler beim Laden von Beschwerdehistorie:', e);
        }

        // Create new conversation
        const newConversation = await base44.agents.createConversation({
          agent_name: 'performance_coach',
          metadata: {
            goal: goal,
            has_tension_map: !!mapDataStr,
            baseline_count: baselines.length,
            complaint_history_summary: complaintHistory.length > 0 ? `${complaintHistory.length} Beschwerden` : 'Keine'
          }
        });

        setConversation(newConversation);

        // Build initial prompt with goal, baseline data, and optional tension data
        let initialPrompt = `Mein nächstes Ziel ist: ${goal}`;

        // Add baseline test results if available
        if (baselines.length > 0) {
          const baselineInfo = baselines.map(b => {
            const testLabel = {
              'Deep Squat Test': 'Tiefe Kniebeuge',
              'Shoulder Reach Test': 'Schulterreichweite',
              'Max Pull-ups': 'Klimmzüge',
              'Max Push-ups': 'Liegestütze',
              'Forward Fold Test': 'Vorwärtsbeuge',
              'Shoulder Flexibility': 'Schulterbeweglichkeit',
              'Vertical Jump': 'Vertikalsprung',
              'Plank Hold': 'Planke halten'
            }[b.test_name] || b.test_name;
            
            return `- ${testLabel}: ${b.result_value} ${b.result_unit} (Level: ${b.baseline_level})`;
          }).join('\n');
          initialPrompt += `\n\nMeine Performance Baselines aus den bisherigen Tests:\n${baselineInfo}\n\nDiese sind meine aktuellen Fähigkeiten - bitte plane das Training basierend darauf.`;
        }

        // Add complaint history or current_complaints if available
        if (complaintHistory.length > 0) {
          const complaintInfo = complaintHistory.map(c => 
            `- ${c.location}${c.intensity ? ` (${c.intensity}/10)` : ''}${c.status ? ` [${c.status}]` : ''}`
          ).join('\n');
          const complaintPrompt = `\n\n⚠️ Aktuelle Beschwerden:\n${complaintInfo}\n\nBitte beachte diese bei der Planung.`;
          initialPrompt += complaintPrompt;
          console.log('Added complaint history to prompt:', complaintPrompt);
        } else if (currentComplaints) {
          const complaintPrompt = `\n\n⚠️ Aktuelle Beschwerde: ${currentComplaints}\n\nBitte beachte diese bei der Planung des Trainings.`;
          initialPrompt += complaintPrompt;
          console.log('Added current_complaints to prompt:', complaintPrompt);
        }

        if (mapDataStr) {
          const mapData = JSON.parse(mapDataStr);
          
          // Map coordinates to body regions
          const getBodyRegion = (x, y, view) => {
            if (view === 'front') {
              if (y < 20) return 'Kopf/Nacken';
              if (y < 35) return 'Schultern/Brust';
              if (y < 50) return 'Oberer Rücken/Arme';
              if (y < 65) return 'Bauchmuskeln/Seiten';
              if (y < 75) return 'Unterer Rücken/Hüfte';
              return 'Beine/Füße';
            } else {
              if (y < 20) return 'Nacken/oberer Rücken';
              if (y < 40) return 'mittlerer Rücken';
              if (y < 60) return 'unterer Rücken/Gesäß';
              if (y < 80) return 'Oberschenkel/Hamstrings';
              return 'Waden/Füße';
            }
          };

          const tensionRegions = mapData.markers.map(m => {
            const region = getBodyRegion(m.x, m.y, mapData.view);
            if (m.type === 'line') return `${region} (Linie)`;
            return region;
          });

          const uniqueRegions = [...new Set(tensionRegions)];

          initialPrompt += `\n\nAußerdem habe ich folgende Spannungsbereiche markiert, die ich berücksichtigen möchte:\n- ${uniqueRegions.join('\n- ')}\n\nBitte plane das Training so, dass diese Spannungen gelöst werden und das Ziel nicht behindert wird.`;
        }

        // Send initial message
        await base44.agents.addMessage(newConversation, {
          role: 'user',
          content: initialPrompt
        });

      } catch (error) {
        console.error('Fehler beim Chat-Start:', error);
        toast.error('Fehler beim Starten des Chats');
      }
    };

    initChat();
  }, []);

  // Subscribe to conversation updates and detect workflow triggers
  useEffect(() => {
    if (!conversation?.id) return;

    console.log('🔄 Subscribing to conversation:', conversation.id);

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      console.log('📨 Messages update received, count:', data.messages?.length);
      const newMessages = data.messages || [];
      setMessages(newMessages);
      
      // Detect workflow triggers from last assistant message
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.content) {
        console.log('🔍 Checking last message for triggers:', lastMessage.content.substring(0, 100));
        
        // Check for [SHOW_GOAL_ANALYSIS] trigger
        if (lastMessage.content.includes('[SHOW_GOAL_ANALYSIS]')) {
          console.log('✅ Found SHOW_GOAL_ANALYSIS trigger');
          const content = lastMessage.content.replace('[SHOW_GOAL_ANALYSIS]', '').trim();
          setGoalAnalysis({
            title: `Ziel: ${goalName}`,
            analysis: content,
            expertInsight: 'Dieses Ziel erfordert eine Balance aus Mobilität, Kraft und neuromuskulärer Kontrolle. Wir arbeiten in Phasen: Hardware (Beweglichkeit), Software (Neuro-Reset) und Integration (Kraft).',
            callToAction: 'Übungen starten'
          });
        }
        
        // Check for [SHOW_EXERCISES] trigger - allow from any workflow step
        if (lastMessage.content.includes('[SHOW_EXERCISES]')) {
          console.log('✅ Found SHOW_EXERCISES trigger, parsing...');
          try {
            const content = lastMessage.content.replace('[SHOW_EXERCISES]', '').trim();
            // Parse exercises from structured text
            const phases = parseExercisesFromText(content);
            console.log('📋 Parsed phases:', phases);
            setExercisePhases(phases);
            setWorkflowStep('exercises');
          } catch (e) {
            console.error('❌ Error parsing exercises:', e);
            // Show exercises anyway with fallback
            setExercisePhases([
              {
                type: 'hardware',
                title: '⚙️ Hardware - Mobilität',
                duration: '10 Min',
                exercises: [{ name: 'Übungen werden geladen...', instruction: 'Bitte warten', sets_reps: '' }]
              }
            ]);
            setWorkflowStep('exercises');
          }
        }
      }
      
      setIsLoading(prev => prev === true ? false : prev);
    });

    return () => {
      console.log('🔌 Unsubscribing from conversation');
      unsubscribe();
    };
  }, [conversation?.id, workflowStep, goalName]);

  // Helper function to parse exercises from AI text
  const parseExercisesFromText = (text) => {
    console.log('📝 Parsing exercise text:', text.substring(0, 200));

    const phases = [
      {
        type: 'hardware',
        title: '⚙️ Hardware - Mobilität',
        duration: '10 Min',
        exercises: []
      },
      {
        type: 'software',
        title: '🧠 Software - Neuro-Reset',
        duration: '5 Min',
        exercises: []
      },
      {
        type: 'integration',
        title: '💪 Integration - Kraft',
        duration: '15 Min',
        exercises: []
      }
    ];

    const lines = text.split('\n').filter(l => l.trim());
    let currentPhaseIdx = 0;

    lines.forEach(line => {
      const trimmed = line.trim();

      // Skip hints, notes, or markdown formatting
      if (trimmed.startsWith('*') || trimmed.startsWith('**') || trimmed.toLowerCase().includes('hinweis')) {
        return; // Skip this line
      }

      // Detect phase headers
      if (trimmed.includes('HARDWARE') || trimmed.includes('Hardware') || trimmed.includes('Mobilität')) {
        currentPhaseIdx = 0;
        console.log('📍 Detected Hardware phase');
      } else if (trimmed.includes('SOFTWARE') || trimmed.includes('Software') || trimmed.includes('Neuro')) {
        currentPhaseIdx = 1;
        console.log('📍 Detected Software phase');
      } else if (trimmed.includes('INTEGRATION') || trimmed.includes('Integration') || trimmed.includes('Kraft')) {
        currentPhaseIdx = 2;
        console.log('📍 Detected Integration phase');
      }
      // Detect exercise lines: Must start with number followed by dot
      else if (trimmed.match(/^\d+\.\s/)) {
        const exText = trimmed.replace(/^\d+\.\s*/, '').trim();

        // Expected format: "Exercise Name - 3x10: Instruction"
        // Split by " - " to separate name from sets/instruction
        const dashParts = exText.split(' - ');
        if (dashParts.length >= 2) {
          const name = dashParts[0].trim();
          const restText = dashParts.slice(1).join(' - ');

          // Split by colon to separate sets from instruction
          const colonParts = restText.split(':');
          const sets_reps = colonParts[0]?.trim() || '3x10';
          const instruction = colonParts.slice(1).join(':').trim() || 'Führe die Übung kontrolliert durch';

          phases[currentPhaseIdx].exercises.push({
            name,
            sets_reps,
            instruction
          });
          console.log(`✅ Added exercise to phase ${currentPhaseIdx}:`, name, sets_reps);
        }
      }
    });

    console.log('✅ Parsed phases with exercises:', phases.map(p => `${p.title}: ${p.exercises.length} exercises`));
    return phases;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Fehler beim Senden:', error);
      toast.error('Fehler beim Senden der Nachricht');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFrequencySelect = async (frequency) => {
    // Send frequency selection to AI
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: frequency
      });
    } catch (error) {
      console.error('Error sending frequency:', error);
    }
  };

  const handleGoalAnalysisNext = async () => {
    // Request exercises from AI
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: 'Ja, lass uns mit den Übungen starten!'
      });
    } catch (error) {
      console.error('Error requesting exercises:', error);
    }
  };

  const handleExercisesComplete = async () => {
    // Direkt Trainingsplan erstellen ohne weitere Chat-Interaktion
    setIsPlanCreating(true);
    
    try {
      // Extract training frequency from conversation
      const conversationText = messages.map(m => m.content).join(' ');

      let frequency = '2_3_times_week'; // default
      if (conversationText.toLowerCase().includes('4-5') || conversationText.toLowerCase().includes('4 bis 5')) {
        frequency = '4_5_times_week';
      } else if (conversationText.toLowerCase().includes('täglich') || conversationText.toLowerCase().includes('jeden tag')) {
        frequency = 'daily';
      } else if (conversationText.toLowerCase().includes('2') && (conversationText.toLowerCase().includes('2 mal') || conversationText.toLowerCase().includes('2x'))) {
        frequency = '2_3_times_week';
      }

      console.log('📋 Creating training plan with frequency:', frequency, 'Goal:', goalName);

      // Call createTrainingPlan function
      const response = await base44.functions.invoke('createTrainingPlan', {
        goal_description: goalName,
        training_frequency: frequency
      });

      console.log('✅ Training plan response:', response);

      if (response.data?.success) {
        console.log('✨ Training plan created successfully:', response.data.plan?.id);
        toast.success('Trainingsplan erfolgreich erstellt! 🎉');
        
        // Warte kurz für Animation, dann weiterleiten zum Performance Tab
        setTimeout(() => {
          window.location.href = createPageUrl('TrainingPlan') + '?tab=performance';
        }, 2000);
      } else {
        toast.error('Fehler beim Erstellen des Plans');
        setIsPlanCreating(false);
      }
    } catch (error) {
      console.error('❌ Error creating training plan:', error);
      toast.error('Fehler beim Erstellen des Trainingsplans');
      setIsPlanCreating(false);
    }
  };

  const handleDoneClick = () => {
    setShowFeedbackForm(true);
  };

  const handleFeedbackSaved = async () => {
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: '[FEEDBACK_SUBMITTED] Session abgeschlossen. Frage, ob ein vollständiger Trainingsplan erstellt werden soll.'
      });
      toast.success('Session erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Senden der Follow-up-Nachricht:', error);
    }
  };

  const shouldShowDoneButton = workflowStep === 'chat' && messages.length > 0 && 
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content?.includes('[SHOW_DONE_BUTTON]');

  // Check if training plan should be created and trigger it
  useEffect(() => {
    if (!conversation || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant') return;

    // Check if message contains plan creation trigger (only once per conversation)
      const hasCreatePlanTrigger = lastMessage?.content?.includes('[CREATE_PLAN]');
      const planCreatedKey = `plan_created_${conversation.id}`;
      const planAlreadyCreated = localStorage.getItem(planCreatedKey) === 'true';

      console.log('Plan trigger check:', {
        hasCreatePlanTrigger,
        isPlanCreating,
        planAlreadyCreated,
        lastMessageContent: lastMessage?.content?.substring(0, 100)
      });

      if (hasCreatePlanTrigger && !planAlreadyCreated && !isPlanCreating) {
        console.log('🎯 TRIGGERING PLAN CREATION');
        setIsPlanCreating(true);
        const createPlan = async () => {
          try {
            localStorage.setItem(planCreatedKey, 'true');
            // Extract training frequency from conversation
            const conversationText = messages.map(m => m.content).join(' ');

            let frequency = '2_3_times_week'; // default
            if (conversationText.toLowerCase().includes('4-5') || conversationText.toLowerCase().includes('4 bis 5')) {
              frequency = '4_5_times_week';
            } else if (conversationText.toLowerCase().includes('täglich') || conversationText.toLowerCase().includes('jeden tag')) {
              frequency = 'daily';
            } else if (conversationText.toLowerCase().includes('2') && (conversationText.toLowerCase().includes('2 mal') || conversationText.toLowerCase().includes('2x'))) {
              frequency = '2_3_times_week';
            }

            console.log('📋 Creating training plan with frequency:', frequency, 'Goal:', goalName);

            // Call createTrainingPlan function
            const response = await base44.functions.invoke('createTrainingPlan', {
              goal_description: goalName,
              training_frequency: frequency
            });

            console.log('✅ Training plan response:', response);

            if (response.data?.success) {
              console.log('✨ Training plan created successfully:', response.data.plan?.id);
            }
            } catch (error) {
            console.error('❌ Error creating training plan:', error);
            localStorage.removeItem(planCreatedKey);
            } finally {
            setIsPlanCreating(false);
            }
            };

            createPlan();
            }
  }, [messages, conversation, goalName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="text-slate-400 hover:text-amber-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-amber-400">Performance Coach</h1>
              <p className="text-xs text-slate-500">Dein Weg zum athletischen Meilenstein</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Step 1: Goal Analysis Card (show as soon as trigger arrives) */}
              {workflowStep === 'analysis' && goalAnalysis && (
                <PerformanceGoalCard
                  title={goalAnalysis.title}
                  analysis={goalAnalysis.analysis}
                  expertInsight={goalAnalysis.expertInsight}
                  callToAction={goalAnalysis.callToAction}
                  onActionClick={handleGoalAnalysisNext}
                  onFrequencySelect={handleFrequencySelect}
                />
              )}

              {/* Step 2: Exercise Action Cards */}
              {workflowStep === 'exercises' && exercisePhases && !isPlanCreating && (
                <ExerciseActionCard
                  phases={exercisePhases}
                  onComplete={handleExercisesComplete}
                  infoText={`Perfekt! Du hast die vorgeschlagenen Übungen gesichtet.

              Möchtest du nun einen vollständigen Trainingsplan basierend darauf erstellen lassen?

              Dieser beinhaltet dann:
              ✓ Alle Übungen mit ausführlichen Anleitungen und detaillierten Hintergrundinformationen von Experten
              ✓ Dein persönliches Progressions-Tracking
              ✓ Dein Plan kann jederzeit an deine Bedürfnisse angepasst werden
              ✓ Du findest ihn nach der Erstellung im Tab TRAINING und kannst ihn jederzeit abrufen.`}
                />
              )}

              {/* Loading Animation während Plan-Erstellung */}
              {isPlanCreating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Target className="w-12 h-12 text-amber-400" />
                    </motion.div>
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-amber-400">
                      Dein Trainingsplan wird erstellt...
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Wir generieren deinen personalisierten Plan mit allen Details
                    </p>
                  </div>

                  <div className="glass rounded-xl p-6 max-w-md space-y-3">
                    {[
                      { icon: '⚙️', text: 'Hardware-Übungen werden angepasst', delay: 0 },
                      { icon: '🧠', text: 'Software-Drills werden integriert', delay: 0.5 },
                      { icon: '💪', text: 'Kraft-Progressionen werden geplant', delay: 1 },
                      { icon: '📊', text: 'Experten-Insights werden hinzugefügt', delay: 1.5 }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.delay }}
                        className="flex items-center gap-3 text-slate-300"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-sm">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Simplified Chat for Follow-up */}
              {workflowStep === 'chat' && (
                <div className="space-y-4">
                  {messages
                    .filter(msg => !msg.content?.includes('[SHOW_GOAL_ANALYSIS]') && !msg.content?.includes('[SHOW_EXERCISES]'))
                    .map((msg, idx) => (
                      <SimpleChatBubble key={idx} message={msg} />
                    ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input - only show in chat step */}
      {workflowStep === 'chat' && (
        <div className="sticky bottom-0 glass border-t border-amber-500/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Deine Nachricht..."
                className="resize-none bg-slate-800/50 border-slate-700 text-white min-h-[44px] max-h-32"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 h-auto"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {showFeedbackForm && (
          <SessionFeedbackForm
            goalName={goalName}
            onClose={() => setShowFeedbackForm(false)}
            onSaved={handleFeedbackSaved}
          />
        )}
      </AnimatePresence>
      </div>
      );
      }

function SimpleChatBubble({ message }) {
  const isUser = message.role === 'user';
  
  // Hide internal triggers
  if (isUser && message.content?.includes('[FEEDBACK_SUBMITTED]')) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser && 'flex flex-col items-end'}`}>
        <div className={`rounded-xl px-4 py-3 ${
          isUser 
            ? 'bg-slate-800 text-white' 
            : 'glass border border-amber-500/30 text-slate-200'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content?.replace(/\[SHOW_DONE_BUTTON\]/g, '').replace(/\[CREATE_PLAN\]/g, '').trim()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}