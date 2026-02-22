import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

function SimpleChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="h-6 w-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Target className="w-3 h-3 text-cyan-400" />
        </div>
      )}
      <div className={`max-w-[90%] ${isUser && 'flex flex-col items-end'}`}>
        <div className={`rounded-lg px-3 py-2 text-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/10 ${
          isUser 
            ? 'bg-slate-800 text-slate-200' 
            : 'bg-slate-900/40 text-slate-300'
        }`}>
          {isUser ? (
            <p className="leading-relaxed">{message.content?.trim()}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none [&>p]:leading-relaxed [&>p]:mb-2 last:[&>p]:mb-0"
            >
              {message.content?.trim()}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TrainingPlanChat({ activePlan }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        // Create new conversation for plan discussion
        const newConversation = await base44.agents.createConversation({
          agent_name: 'performance_coach',
          metadata: {
            plan_id: activePlan.id,
            goal: activePlan.goal_description,
            current_phase: activePlan.current_phase,
            has_complementary_drills: activePlan.complementary_drills_accepted,
            context: 'plan_discussion'
          }
        });

        setConversation(newConversation);

        // Initial message to the agent
        await base44.agents.addMessage(newConversation, {
          role: 'user',
          content: `Ich habe Fragen zu meinem Trainingsplan "${activePlan.goal_description}". Kannst du mir helfen?`
        });

      } catch (error) {
        console.error('Fehler beim Chat-Start:', error);
        toast.error('Fehler beim Starten des Chats');
      }
    };

    if (activePlan?.id) {
      initChat();
    }
  }, [activePlan?.id]);

  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation?.id]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 border-t border-slate-800 pt-6"
    >
      <div className="flex items-center gap-2 mb-4 px-1">
         <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Performance Coach</h3>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 mb-4 px-1">
        {messages.length === 0 ? (
           <p className="text-xs text-slate-600 italic">Keine Nachrichten vorhanden.</p>
        ) : (
           messages.map((msg, idx) => (
             <SimpleChatBubble key={idx} message={msg} />
           ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 relative group">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Frage zum Plan..."
          className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500/50 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}