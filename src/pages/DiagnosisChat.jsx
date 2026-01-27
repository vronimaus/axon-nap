import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function DiagnosisChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'diagnosis_reasoning',
          metadata: {
            name: 'Diagnose-Session',
            description: 'Intelligente Symptom-Analyse'
          }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
      }
    };
    initConversation();
  }, []);

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

    return unsubscribe;
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
              Diagnose-Chat
            </h1>
          </div>
          <p className="text-slate-400">
            Intelligente Symptom-Analyse mit Reasoning-Engine
          </p>
        </motion.div>

        {/* Chat Container */}
        <Card className="glass border border-cyan-500/30 shadow-2xl">
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <MessageCircle className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Keine Nachrichten</p>
                  <p className="text-sm text-slate-500">
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
            <div className="p-4 border-t border-cyan-500/20">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Beschreibe deine Symptome... (Enter zum Senden)"
                  className="flex-1 min-h-[60px] max-h-[120px] bg-slate-900/50 border-cyan-500/30 text-slate-200 placeholder:text-slate-500 resize-none"
                  disabled={loading || !conversation}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || !conversation}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-[60px] px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tipp: Beschreibe genau, wo es weh tut, wann es auftritt und was es besser/schlechter macht
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}