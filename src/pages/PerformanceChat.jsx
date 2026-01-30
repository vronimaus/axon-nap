import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Target, Wrench, Brain, Dumbbell, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function PerformanceChat() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate(createPageUrl('Landing'));
          return;
        }

        // Get goal and bodymap data from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const goal = urlParams.get('goal');
        const mapDataStr = urlParams.get('mapData');

        // Create new conversation
        const newConversation = await base44.agents.createConversation({
          agent_name: 'performance_coach',
          metadata: {
            goal: goal,
            has_tension_map: !!mapDataStr
          }
        });

        setConversation(newConversation);

        // Build initial prompt with goal and optional tension data
        let initialPrompt = `Mein nächstes Ziel ist: ${goal}`;

        if (mapDataStr) {
          const mapData = JSON.parse(mapDataStr);
          const tensionDetails = mapData.markers.map((m, i) => {
            if (m.type === 'point') {
              return `Punkt ${i+1} bei (${Math.round(m.x)}, ${Math.round(m.y)})`;
            } else {
              return `Linie mit ${m.points?.length || 0} Punkten`;
            }
          }).join(', ');

          initialPrompt += `\n\nIch habe außerdem Spannungsbereiche auf der BodyMap markiert:\n- Ansicht: ${mapData.view === 'front' ? 'Vorderseite' : 'Rückseite'}\n- ${mapData.markers.length} Markierung(en): ${tensionDetails}\n\nBitte berücksichtige diese Spannungen bei der Trainingsplanung.`;
        } else {
          initialPrompt += `\n\nIch habe keine spezifischen Spannungen markiert.`;
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
  }, [navigate]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setIsLoading(false);
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
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
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
                    // Replace icon codes with Lucide icons
                    const processContent = (content) => {
                      if (typeof content === 'string') {
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

                        while ((match = regex.exec(content)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(content.substring(lastIndex, match.index));
                          }
                          parts.push(iconMap[match[0]]);
                          lastIndex = match.index + match[0].length;
                        }

                        if (lastIndex < content.length) {
                          parts.push(content.substring(lastIndex));
                        }

                        return parts.length > 0 ? parts : content;
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