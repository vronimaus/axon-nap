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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser && 'flex flex-col items-end'}`}>
        <div className={`rounded-xl px-4 py-3 ${
          isUser 
            ? 'bg-slate-800 text-white' 
            : 'glass border border-purple-500/30 text-slate-200'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content?.trim()}</p>
          ) : (
            <ReactMarkdown
              className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
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
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-400">Dein Coach</h3>
      </div>
      <div className="h-80 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {messages.map((msg, idx) => (
          <SimpleChatBubble key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Frage deinen Coach..."
          className="resize-none bg-slate-800/50 border-slate-700 text-white min-h-[44px] max-h-32"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-4 h-auto"
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </motion.div>
  );
}