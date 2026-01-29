import { useState, useEffect, useRef } from 'react';

export function useVoiceControl({ onTranscript, onSend, autoSendCommands = ['senden', 'absenden', 'ok', 'fertig'] }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastTranscriptRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (lastTranscriptRef.current + finalTranscript).trim();
      setTranscript(fullTranscript || interimTranscript);
      
      if (onTranscript) {
        onTranscript(fullTranscript || interimTranscript);
      }

      // Check for send commands
      const lowerTranscript = (finalTranscript || interimTranscript).toLowerCase().trim();
      if (autoSendCommands.some(cmd => lowerTranscript.endsWith(cmd))) {
        if (onSend && fullTranscript) {
          // Remove the command from transcript
          const cleanTranscript = fullTranscript.split(' ').slice(0, -1).join(' ');
          onSend(cleanTranscript || fullTranscript);
          lastTranscriptRef.current = '';
          setTranscript('');
          return;
        }
      }

      // Update last transcript if final
      if (finalTranscript) {
        lastTranscriptRef.current = fullTranscript;
      }

      // Auto-send after 2 seconds of silence (only for final results)
      if (finalTranscript) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (fullTranscript && onSend) {
            onSend(fullTranscript);
            lastTranscriptRef.current = '';
            setTranscript('');
          }
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Silently restart
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if should still be listening
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      clearTimeout(silenceTimerRef.current);
    };
  }, [isListening, onTranscript, onSend, autoSendCommands]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        lastTranscriptRef.current = '';
        setTranscript('');
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
    }
  };

  const speak = (text) => {
    if (!text) return;

    // Stop current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Pause listening while speaking
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening after speaking
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Failed to resume recognition:', e);
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}