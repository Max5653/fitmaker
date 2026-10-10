import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExerciseSessionLog } from '../types/workout';
import { audioTimer } from '../services/audioTimer';
import { useSpeechRecognition, VoiceCommandType } from '../hooks/useSpeechRecognition';
import {
  Timer,
  Play,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  CheckCircle2,
  RotateCcw,
  FastForward,
  Plus,
  Minus,
  X,
  Activity,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TutorModalProps {
  exercise: ExerciseSessionLog | null;
  isOpen: boolean;
  onClose: () => void;
  onFinishTutorFirstSet: (executionDurationSec: number) => void;
}

type TutorPhase = 'READY' | 'EXECUTING' | 'RESTING' | 'DONE';

export const TutorModal: React.FC<TutorModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onFinishTutorFirstSet,
}) => {
  if (!isOpen || !exercise) return null;

  const [phase, setPhase] = useState<TutorPhase>('READY');
  const [executionSeconds, setExecutionSeconds] = useState(0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(exercise.recupero_secondi || 60);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // References for timers
  const executionTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const scheduledBeepsCancelRef = useRef<(() => void) | null>(null);

  // Voice Command callback
  const handleVoiceCommand = useCallback((cmd: VoiceCommandType) => {
    if (cmd === 'START' && phase === 'READY') {
      startExecution();
    } else if (cmd === 'STOP' && phase === 'EXECUTING') {
      stopExecutionAndStartRest();
    }
  }, [phase]);

  const { isSupported: isVoiceSupported, isListening, lastTranscript, toggleListening } =
    useSpeechRecognition({
      onCommand: handleVoiceCommand,
      enabled: voiceEnabled && isOpen && (phase === 'READY' || phase === 'EXECUTING'),
    });

  // Start execution stopwatch for Set 1
  const startExecution = () => {
    audioTimer.unlockAudio();
    audioTimer.playBeep(660, 0.1); // Start acoustic feedback
    setExecutionSeconds(0);
    setPhase('EXECUTING');

    const startTime = Date.now();
    executionTimerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setExecutionSeconds(elapsed);
    }, 250);
  };

  // Stop execution and immediately initiate rest countdown
  const stopExecutionAndStartRest = () => {
    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
      executionTimerRef.current = null;
    }

    const finalExec = executionSeconds;
    audioTimer.unlockAudio();
    audioTimer.playBeep(440, 0.15); // Stop acoustic tone

    // If rest time is specified in plan
    const initialRest = exercise.recupero_secondi > 0 ? exercise.recupero_secondi : 60;
    setRestSecondsRemaining(initialRest);
    setPhase('RESTING');

    // Schedule background hardware beeps for the last 10 seconds
    if (soundEnabled) {
      if (scheduledBeepsCancelRef.current) {
        scheduledBeepsCancelRef.current();
      }
      const sched = audioTimer.scheduleCountdownBeeps(initialRest);
      scheduledBeepsCancelRef.current = sched.cancel;
    }

    const restStartTimestamp = Date.now();
    const targetEndTimestamp = restStartTimestamp + initialRest * 1000;

    restTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const remainingMs = targetEndTimestamp - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setRestSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        finishRest(finalExec);
      }
    }, 250);
  };

  const finishRest = (finalExecSeconds: number) => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    if (scheduledBeepsCancelRef.current) {
      scheduledBeepsCancelRef.current();
      scheduledBeepsCancelRef.current = null;
    }

    setPhase('DONE');
    audioTimer.notifyRestComplete(exercise.esercizio);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    onFinishTutorFirstSet(finalExecSeconds);
  };

  const adjustRestTime = (secondsDelta: number) => {
    if (phase !== 'RESTING') return;

    const newRest = Math.max(5, restSecondsRemaining + secondsDelta);
    setRestSecondsRemaining(newRest);

    // Reschedule beeps
    if (scheduledBeepsCancelRef.current) {
      scheduledBeepsCancelRef.current();
    }
    if (soundEnabled) {
      const sched = audioTimer.scheduleCountdownBeeps(newRest);
      scheduledBeepsCancelRef.current = sched.cancel;
    }

    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    const targetEndTimestamp = Date.now() + newRest * 1000;
    restTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.ceil((targetEndTimestamp - now) / 1000));
      setRestSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        finishRest(executionSeconds);
      }
    }, 250);
  };

  const handleSkipRest = () => {
    finishRest(executionSeconds);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (executionTimerRef.current) clearInterval(executionTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      if (scheduledBeepsCancelRef.current) scheduledBeepsCancelRef.current();
    };
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLast10Seconds = phase === 'RESTING' && restSecondsRemaining <= 10 && restSecondsRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-400">
              Modalità Tutor • 1ª Serie
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise Briefing Card */}
        <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {exercise.gruppo_muscolare}
            </span>
            <span className="text-xs text-slate-400">
              Target: <strong className="text-white">{exercise.ripetizioni_previste} reps</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            {exercise.esercizio}
          </h2>
          {exercise.note_scheda && (
            <p className="text-xs text-amber-300/90 mt-1 italic">
              Scheda: {exercise.note_scheda}
            </p>
          )}
        </div>

        {/* Main Interactive Stage */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-5">
          {/* PHASE 1: READY */}
          {phase === 'READY' && (
            <div className="space-y-6 w-full">
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-amber-500/40 flex flex-col items-center justify-center mx-auto bg-amber-500/5">
                <Play className="w-10 h-10 text-amber-400 ml-1" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Pronto per iniziare la prima serie?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Premi il pulsante o usa il comando vocale <strong className="text-amber-400">"START"</strong> o <strong className="text-amber-400">"VIA"</strong>.
                </p>
              </div>

              <button
                onClick={startExecution}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>START 1ª SERIE</span>
              </button>
            </div>
          )}

          {/* PHASE 2: EXECUTING STOPWATCH */}
          {phase === 'EXECUTING' && (
            <div className="space-y-6 w-full">
              <div className="relative w-36 h-36 rounded-full border-4 border-emerald-500/80 flex flex-col items-center justify-center mx-auto bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Esecuzione
                </span>
                <span className="font-mono-nums text-4xl font-black text-white tracking-tight">
                  {formatTimer(executionSeconds)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">1ª Serie</span>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300">
                  Serie in corso... Spingi!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Alla fine della serie dì <strong className="text-red-400">"STOP"</strong> o premi il pulsante rosso.
                </p>
              </div>

              <button
                onClick={stopExecutionAndStartRest}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-lg shadow-xl shadow-red-500/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Square className="w-6 h-6 fill-current" />
                <span>STOP & AVVIA RECUPERO</span>
              </button>
            </div>
          )}

          {/* PHASE 3: RESTING COUNTDOWN */}
          {phase === 'RESTING' && (
            <div className="space-y-5 w-full">
              {/* Giant Countdown Clock with Beep alert pulsing */}
              <div
                className={`relative w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center mx-auto transition-all ${
                  isLast10Seconds
                    ? 'border-red-500 bg-red-500/20 shadow-2xl shadow-red-500/40 animate-pulse'
                    : 'border-amber-500/80 bg-amber-500/10 shadow-xl shadow-amber-500/20'
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isLast10Seconds ? 'text-red-400' : 'text-amber-400'
                  }`}
                >
                  {isLast10Seconds ? 'ATTENZIONE: BEEP!' : 'Recupero'}
                </span>
                <span className="font-mono-nums text-5xl font-black text-white tracking-tight">
                  {formatTimer(restSecondsRemaining)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  1ª Serie chiusa in {executionSeconds}s
                </span>
              </div>

              {/* Status explanation */}
              <div className="text-xs text-slate-300 space-y-1">
                {isLast10Seconds ? (
                  <p className="font-bold text-red-400 flex items-center justify-center gap-1.5 animate-bounce">
                    <Activity className="w-4 h-4" />
                    Ultimi 10 secondi! Beep sonoro in corso...
                  </p>
                ) : (
                  <p className="text-slate-400">
                    Avviso con segnali sonori negli ultimi 10 secondi.
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Funziona anche con schermo bloccato in background.
                </p>
              </div>

              {/* Rest Adjustment Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => adjustRestTime(-15)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  15s
                </button>
                <button
                  onClick={() => adjustRestTime(30)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  30s
                </button>
                <button
                  onClick={handleSkipRest}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Salta
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: DONE */}
          {phase === 'DONE' && (
            <div className="space-y-5 w-full py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  Prima Serie & Recupero Completati!
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Tempo esecuzione 1ª serie:{' '}
                  <strong className="text-amber-400">{executionSeconds} secondi</strong>.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  La modalità Tutor per questo esercizio è conclusa. Completa le restanti serie nella scheda!
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition"
              >
                Torna alla Scheda Esercizio
              </button>
            </div>
          )}
        </div>

        {/* Footer Voice & Sound controls */}
        {phase !== 'DONE' && (
          <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs">
            {/* Voice Control Indicator */}
            {isVoiceSupported ? (
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                  isListening
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Voce: In Ascolto</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Voce: Disattivata</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Comandi vocali non supportati dal browser
              </span>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => {
                audioTimer.unlockAudio();
                setSoundEnabled(!soundEnabled);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-white"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Beep Attivo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Beep Disattivato</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
