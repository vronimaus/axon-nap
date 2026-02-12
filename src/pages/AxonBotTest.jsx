import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Brain, Loader2, BookOpen, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AxonBotTest() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        setUser(currentUser);
        
        // Create conversation
        const conv = await base44.agents.createConversation({
          agent_name: 'axon_knowledge_bot',
          metadata: {
            name: 'AXON Bot Test Session',
            description: 'Admin testing AXON knowledge bot'
          }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (e) {
        console.error('Auth error:', e);
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !conversation || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Fehler beim Senden: ' + error.message);
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

  if (isChecking) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  AXON Knowledge Bot
                </h1>
                <p className="text-xs text-slate-400">Test-Chat mit wissenschaftlicher Wissensdatenbank</p>
              </div>
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
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <Card className="glass border-purple-500/30">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-lg font-bold text-white mb-2">Willkommen beim AXON Bot Test!</h3>
                <p className="text-slate-400 mb-4">
                  Stelle Fragen zu Training, Bewegung oder Performance. AXON nutzt die wissenschaftliche Wissensdatenbank für evidenzbasierte Antworten.
                </p>
                <div className="grid gap-2 text-left max-w-md mx-auto">
                  <button
                    onClick={() => setInputMessage('Wie sollte ich HIIT-Training für Frauen gestalten?')}
                    className="glass rounded-lg border border-slate-700 p-3 hover:border-purple-500/50 transition-all text-sm text-slate-300"
                  >
                    💪 Wie sollte ich HIIT-Training für Frauen gestalten?
                  </button>
                  <button
                    onClick={() => setInputMessage('Was sagt die Wissenschaft über Faszientraining?')}
                    className="glass rounded-lg border border-slate-700 p-3 hover:border-purple-500/50 transition-all text-sm text-slate-300"
                  >
                    🧘 Was sagt die Wissenschaft über Faszientraining?
                  </button>
                  <button
                    onClick={() => setInputMessage('Wie optimiere ich Recovery nach intensivem Training?')}
                    className="glass rounded-lg border border-slate-700 p-3 hover:border-purple-500/50 transition-all text-sm text-slate-300"
                  >
                    ⚡ Wie optimiere ich Recovery nach intensivem Training?
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-cyan-500/20 border border-cyan-500/30' 
                    : 'glass border border-purple-500/30'
                } rounded-2xl p-4`}>
                  {message.content ? (
                    <ReactMarkdown 
                      className="text-sm text-slate-200 prose prose-sm prose-invert max-w-none
                        prose-p:my-1 prose-p:leading-relaxed
                        prose-strong:text-cyan-400 prose-strong:font-semibold
                        prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
                        prose-headings:text-purple-400 prose-headings:mt-4 prose-headings:mb-2
                        prose-code:text-amber-400 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AXON denkt nach...</span>
                    </div>
                  )}
                  
                  {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Verwendete Tools:
                      </p>
                      <div className="space-y-1">
                        {message.tool_calls.map((tool, tidx) => (
                          <div key={tidx} className="text-xs text-slate-400 bg-slate-800/50 rounded px-2 py-1">
                            {tool.name} {tool.status && `(${tool.status})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-cyan-500/20 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Frage AXON etwas..."
            className="flex-1 bg-slate-800/50 border-slate-700"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isSending}
            className="bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}