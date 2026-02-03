import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Target, Wrench, Brain, Dumbbell, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import SessionFeedbackForm from '../components/performance/SessionFeedbackForm';

export default function PerformanceChat() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [goalName, setGoalName] = useState('');
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

        // Fetch UserNeuroProfile to get complaint_history
        let complaintHistory = [];
        try {
          const neuroProfiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
          console.log('Fetched neuroProfiles:', neuroProfiles);
          if (Array.isArray(neuroProfiles) && neuroProfiles.length > 0 && neuroProfiles[0]?.complaint_history) {
            complaintHistory = neuroProfiles[0].complaint_history;
            console.log('Loaded complaint_history:', complaintHistory);
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

        // Add complaint history from Rehab mode if available
        if (complaintHistory.length > 0) {
          const complaintInfo = complaintHistory.map(c => 
            `- ${c.location}: ${c.description}${c.intensity ? ` (Intensität: ${c.intensity}/10)` : ''}${c.status ? ` [${c.status}]` : ''}`
          ).join('\n');
          initialPrompt += `\n\nIch habe folgende Beschwerden aus dem Rehab-Bereich:\n${complaintInfo}\n\nBerücksichtige bitte diese Spannungen und Schmerzen bei der Planung des Trainings.`;
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

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      // Only set loading false once at the start
      setIsLoading(prev => prev === true ? false : prev);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

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

  const handleDoneClick = () => {
    setShowFeedbackForm(true);
  };

  const handleFeedbackSaved = async () => {
    // Send follow-up message from coach
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: '[FEEDBACK_SUBMITTED] Session abgeschlossen und Feedback gespeichert. Frage ob ich weitermachen will oder mich entspannen möchte.'
      });
      toast.success('Session erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Senden der Follow-up-Nachricht:', error);
    }
  };

  // Check if last assistant message contains [SHOW_DONE_BUTTON]
  const shouldShowDoneButton = messages.length > 0 && 
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content?.includes('[SHOW_DONE_BUTTON]');

  // Check if training plan should be created and trigger it
  useEffect(() => {
    if (!conversation || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant') return;

    // Check if message contains plan creation trigger
    if (lastMessage?.content?.includes('[CREATE_PLAN]')) {
      const createPlan = async () => {
        try {
          // Extract training frequency from conversation
          const conversationText = messages.map(m => m.content).join(' ');
          
          let frequency = '2_3_times_week'; // default
          if (conversationText.toLowerCase().includes('4-5') || conversationText.toLowerCase().includes('4 bis 5')) {
            frequency = '4_5_times_week';
          } else if (conversationText.toLowerCase().includes('täglich') || conversationText.toLowerCase().includes('jeden tag')) {
            frequency = 'daily';
          }

          // Call createTrainingPlan function
          const response = await base44.functions.invoke('createTrainingPlan', {
            goal_description: goalName,
            training_frequency: frequency
          });

          if (response.data?.success) {
            console.log('Training plan created:', response.data.plan);
            // Clear the trigger from message display by updating it
            const cleanedMessage = lastMessage.content.replace('[CREATE_PLAN]', '').trim();
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: cleanedMessage };
              return updated;
            });
          }
        } catch (error) {
          console.error('Error creating training plan:', error);
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
      </div>

      {/* Done Button - shown after training plan */}
      {shouldShowDoneButton && !showFeedbackForm && (
        <div className="sticky bottom-20 z-10 px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Button
                onClick={handleDoneClick}
                className="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/50"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ja, ich habe das Training geschafft.
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Input */}
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

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  // Hide internal feedback trigger messages
  if (isUser && message.content?.includes('[FEEDBACK_SUBMITTED]')) {
    return null;
  }
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">💪</span>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser && 'flex flex-col items-end'}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-slate-800 text-white' 
              : 'glass-cyan border border-amber-500/30 text-white'
          }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown 
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => {
                    // Replace icon codes with Lucide icons and filter [SHOW_DONE_BUTTON]
                    const processContent = (content) => {
                      if (typeof content === 'string') {
                        // Remove [SHOW_DONE_BUTTON] from display
                        const cleanContent = content.replace(/\[SHOW_DONE_BUTTON\]/g, '').trim();

                        const parts = [];
                        const iconMap = {
                          '[TARGET]': <Target className="w-4 h-4 inline-block text-amber-400 mr-1" />,
                          '[WRENCH]': <Wrench className="w-4 h-4 inline-block text-cyan-400 mr-1" />,
                          '[BRAIN]': <Brain className="w-4 h-4 inline-block text-purple-400 mr-1" />,
                          '[DUMBBELL]': <Dumbbell className="w-4 h-4 inline-block text-green-400 mr-1" />,
                          '[CHECKMARK]': <CheckCircle2 className="w-4 h-4 inline-block text-green-400 mr-1" />,
                          '[ALERT]': <AlertCircle className="w-4 h-4 inline-block text-red-400 mr-1" />
                        };

                        let lastIndex = 0;
                        const regex = /\[(TARGET|WRENCH|BRAIN|DUMBBELL|CHECKMARK|ALERT)\]/g;
                        let match;

                        while ((match = regex.exec(cleanContent)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(cleanContent.substring(lastIndex, match.index));
                          }
                          parts.push(iconMap[match[0]]);
                          lastIndex = match.index + match[0].length;
                        }

                        if (lastIndex < cleanContent.length) {
                          parts.push(cleanContent.substring(lastIndex));
                        }

                        return parts.length > 0 ? parts : cleanContent;
                      }
                      return content;
                    };

                    return <p className="my-1 leading-relaxed">{processContent(children)}</p>;
                  },
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-1">{children}</li>,
                  strong: ({ children }) => <strong className="text-amber-400">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-lg font-bold my-2 text-amber-400">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold my-2 text-amber-400">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-2 text-amber-400">{children}</h3>,
                  code: ({ inline, children }) => (
                    inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-slate-800 rounded p-2 text-xs font-mono my-2">
                        {children}
                      </code>
                    )
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        
        {message.tool_calls?.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.tool_calls.map((toolCall, idx) => (
              <div key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{toolCall.name || 'Tool wird ausgeführt...'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}