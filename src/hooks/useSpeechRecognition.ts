import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type VoiceCommandType = 'START' | 'STOP';

interface UseSpeechRecognitionProps {
  onCommand: (cmd: VoiceCommandType) => void;
  enabled?: boolean;
}

export function useSpeechRecognition({ onCommand, enabled = false }: UseSpeechRecognitionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      setIsSupported(true);
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'it-IT'; // Italian primary, with fallback to standard English words like START/STOP

      rec.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          currentTranscript = transcript;

          // Check for START commands
          if (
            transcript.includes('start') ||
            transcript.includes('via') ||
            transcript.includes('vai') ||
            transcript.includes('inizia') ||
            transcript.includes('parti')
          ) {
            setLastTranscript(transcript);
            onCommand('START');
            break;
          }

          // Check for STOP commands
          if (
            transcript.includes('stop') ||
            transcript.includes('ferma') ||
            transcript.includes('basta') ||
            transcript.includes('fine') ||
            transcript.includes('pausa')
          ) {
            setLastTranscript(transcript);
            onCommand('STOP');
            break;
          }
        }
        if (currentTranscript) {
          setLastTranscript(currentTranscript);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition event error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Permesso microfono non concesso. Puoi usare i tasti manuali.');
            setIsListening(false);
          }
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Automatically restart if user left it enabled (continuous listening during workout)
        if (enabledRef.current) {
          try {
            rec.start();
          } catch {
            // Wait for next trigger
          }
        }
      };

      recognitionRef.current = rec;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, [onCommand]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
    } else {
      try {
        setErrorMessage(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
      }
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    lastTranscript,
    errorMessage,
    toggleListening,
  };
}
