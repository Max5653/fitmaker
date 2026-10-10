import React, { useState } from 'react';
import { WorkoutSession, ExerciseSessionLog, SetDetail } from '../types/workout';
import {
  ArrowLeft,
  Calendar,
  Save,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
  Timer,
  Check,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles
} from 'lucide-react';

interface SessionEditorProps {
  session: WorkoutSession;
  onSaveSession: (updatedSession: WorkoutSession) => void;
  onBack: () => void;
  onOpenTutor: (exercise: ExerciseSessionLog) => void;
  onExportCurrentSession: () => void;
}

export const SessionEditor: React.FC<SessionEditorProps> = ({
  session,
  onSaveSession,
  onBack,
  onOpenTutor,
  onExportCurrentSession,
}) => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession>(session);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('ALL');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get distinct muscle groups in this session
  const muscleGroups = Array.from(new Set(currentSession.esercizi.map(e => e.gruppo_muscolare)));

  // Progress metrics
  const totalSets = currentSession.esercizi.reduce((acc, ex) => acc + ex.dettagli_serie.length, 0);
  const completedSets = currentSession.esercizi.reduce(
    (acc, ex) => acc + ex.dettagli_serie.filter(s => s.completata).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const updateSessionState = (newSession: WorkoutSession) => {
    setCurrentSession(newSession);
    setHasUnsavedChanges(true);
    // Autosave silently to local storage
    onSaveSession(newSession);
  };

  // Change session date
  const handleDateChange = (newDate: string) => {
    updateSessionState({
      ...currentSession,
      data_seduta: newDate,
    });
  };

  // Change general athlete notes
  const handleGeneralNotesChange = (text: string) => {
    updateSessionState({
      ...currentSession,
      note_generali_atleta: text,
    });
  };

  // Update a specific set's weight, reps, or completion
  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    partial: Partial<SetDetail>
  ) => {
    const nextEsercizi = [...currentSession.esercizi];
    const targetEx = { ...nextEsercizi[exIndex] };
    const nextSets = [...targetEx.dettagli_serie];

    nextSets[setIndex] = {
      ...nextSets[setIndex],
      ...partial,
    };

    targetEx.dettagli_serie = nextSets;
    nextEsercizi[exIndex] = targetEx;

    updateSessionState({
      ...currentSession,
      esercizi: nextEsercizi,
    });
  };

  // Quick weight increment/decrement
  const handleAdjustWeight = (exIndex: number, setIndex: number, delta: number) => {
    const curWeight = currentSession.esercizi[exIndex].dettagli_serie[setIndex].peso_kg || 0;
    const nextWeight = Math.max(0, parseFloat((curWeight + delta).toFixed(1)));
    handleUpdateSet(exIndex, setIndex, { peso_kg: nextWeight });
  };

  // Quick reps increment/decrement
  const handleAdjustReps = (exIndex: number, setIndex: number, delta: number) => {
    const curReps = currentSession.esercizi[exIndex].dettagli_serie[setIndex].reps_effettive || 0;
    const nextReps = Math.max(0, curReps + delta);
    handleUpdateSet(exIndex, setIndex, { reps_effettive: nextReps });
  };

  // Toggle completion of a set
  const handleToggleComplete = (exIndex: number, setIndex: number) => {
    const cur = currentSession.esercizi[exIndex].dettagli_serie[setIndex].completata;
    handleUpdateSet(exIndex, setIndex, { completata: !cur });
  };

  // Add an extra actual set to the exercise
  const handleAddSet = (exIndex: number) => {
    const nextEsercizi = [...currentSession.esercizi];
    const targetEx = { ...nextEsercizi[exIndex] };
    const lastSet = targetEx.dettagli_serie[targetEx.dettagli_serie.length - 1];

    const newSet: SetDetail = {
      set_numero: targetEx.dettagli_serie.length + 1,
      peso_kg: lastSet ? lastSet.peso_kg : 0,
      reps_effettive: lastSet ? lastSet.reps_effettive : 10,
      completata: false,
    };

    targetEx.dettagli_serie = [...targetEx.dettagli_serie, newSet];
    targetEx.serie_effettive = targetEx.dettagli_serie.length;
    nextEsercizi[exIndex] = targetEx;

    updateSessionState({
      ...currentSession,
      esercizi: nextEsercizi,
    });
  };

  // Remove a set from the exercise
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const nextEsercizi = [...currentSession.esercizi];
    const targetEx = { ...nextEsercizi[exIndex] };

    if (targetEx.dettagli_serie.length <= 1) return; // Keep at least one set

    const nextSets = targetEx.dettagli_serie
      .filter((_, idx) => idx !== setIndex)
      .map((s, idx) => ({ ...s, set_numero: idx + 1 }));

    targetEx.dettagli_serie = nextSets;
    targetEx.serie_effettive = nextSets.length;
    nextEsercizi[exIndex] = targetEx;

    updateSessionState({
      ...currentSession,
      esercizi: nextEsercizi,
    });
  };

  // Copy weight from set 1 to all subsequent sets of this exercise
  const handleCopyWeightToAll = (exIndex: number) => {
    const nextEsercizi = [...currentSession.esercizi];
    const targetEx = { ...nextEsercizi[exIndex] };
    const firstWeight = targetEx.dettagli_serie[0]?.peso_kg || 0;

    targetEx.dettagli_serie = targetEx.dettagli_serie.map(s => ({
      ...s,
      peso_kg: firstWeight,
    }));
    nextEsercizi[exIndex] = targetEx;

    updateSessionState({
      ...currentSession,
      esercizi: nextEsercizi,
    });
  };

  // Update athlete notes for a specific exercise
  const handleUpdateExerciseNote = (exIndex: number, note: string) => {
    const nextEsercizi = [...currentSession.esercizi];
    nextEsercizi[exIndex] = {
      ...nextEsercizi[exIndex],
      note_atleta: note,
    };
    updateSessionState({
      ...currentSession,
      esercizi: nextEsercizi,
    });
  };

  const toggleNoteExpanded = (templateId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  const filteredExercises = currentSession.esercizi
    .map((ex, originalIdx) => ({ ex, originalIdx }))
    .filter(
      ({ ex }) =>
        selectedMuscleFilter === 'ALL' || ex.gruppo_muscolare === selectedMuscleFilter
    );

  return (
    <div className="space-y-5 pb-24">
      {/* Top Sticky Session Navigation & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Calendario</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCurrentSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold transition"
              title="Esporta questa seduta per FileMaker"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Esporta FileMaker</span>
            </button>

            <button
              onClick={() => onSaveSession(currentSession)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salva</span>
            </button>
          </div>
        </div>

        {/* Date and Day Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs">
                GIORNO {currentSession.giorno_allenamento}
              </span>
              <h2 className="text-lg font-bold text-white">
                {currentSession.nome_giorno}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compila pesi utilizzati, serie svolte ed esecuzione prima serie con il Tutor.
            </p>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-amber-400" />
            <label className="text-xs text-slate-400 font-medium">Data:</label>
            <input
              type="date"
              value={currentSession.data_seduta}
              onChange={e => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Progresso Serie: <strong className="text-white">{completedSets} di {totalSets}</strong>
            </span>
            <span className="font-mono-nums font-bold text-amber-400">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* General session notes */}
        <div>
          <textarea
            value={currentSession.note_generali_atleta || ''}
            onChange={e => handleGeneralNotesChange(e.target.value)}
            placeholder="Note generali sulla seduta (es. energia, riscaldamento, sensazioni muscolari)..."
            rows={2}
            className="w-full text-xs bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none transition"
          />
        </div>
      </div>

      {/* Muscle Group Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
        <button
          onClick={() => setSelectedMuscleFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedMuscleFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Tutti i Gruppi ({currentSession.esercizi.length})
        </button>
        {muscleGroups.map(grp => {
          const count = currentSession.esercizi.filter(e => e.gruppo_muscolare === grp).length;
          return (
            <button
              key={grp}
              onClick={() => setSelectedMuscleFilter(grp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedMuscleFilter === grp
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {grp} ({count})
            </button>
          );
        })}
      </div>

      {/* Exercise Cards List */}
      <div className="space-y-4">
        {filteredExercises.map(({ ex, originalIdx }) => {
          const hasRestTime = ex.recupero_secondi > 0;
          const isTutorDone = !!ex.tutor_completato;
          const isNotesOpen = !!expandedNotes[ex.template_id];
          const allCompleted = ex.dettagli_serie.every(s => s.completata);

          return (
            <div
              key={ex.template_id}
              className={`rounded-2xl border transition-all p-4 sm:p-5 shadow-lg ${
                allCompleted
                  ? 'bg-slate-900/90 border-emerald-900/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {ex.gruppo_muscolare}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Scheda:{' '}
                      <strong className="text-slate-200">
                        {ex.serie_previste} serie × {ex.ripetizioni_previste} reps
                      </strong>
                    </span>
                    {hasRestTime && (
                      <span className="text-xs text-amber-400 font-mono-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ex.recupero_secondi}s rec.
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {ex.esercizio}
                  </h3>
                  {ex.note_scheda && (
                    <div className="flex items-start gap-1.5 text-xs text-amber-300/80 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 mt-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <span>{ex.note_scheda}</span>
                    </div>
                  )}
                </div>

                {/* MODALITÀ TUTOR BUTTON (Only 1st Set & If Rest Time is Specified) */}
                <div className="self-start sm:self-auto">
                  {hasRestTime ? (
                    isTutorDone ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Tutor 1ª Serie ({ex.tempo_esecuzione_prima_serie_sec}s)
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenTutor(ex)}
                          className="text-[11px] text-slate-400 hover:text-amber-400 underline"
                          title="Ripeti Tutor prima serie"
                        >
                          Ripeti
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenTutor(ex)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
                        title="Avvia cronometro prima serie e recupero con comandi vocali e beep sonori negli ultimi 10s"
                      >
                        <Timer className="w-4 h-4 stroke-[2.5]" />
                        <span>Avvia Tutor (1ª Serie)</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Recupero non indicato
                    </span>
                  )}
                </div>
              </div>

              {/* Set Tracker Table for Rapid Gym Input */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] uppercase font-bold text-slate-400 px-1">
                  <span className="col-span-1 text-center">Set</span>
                  <span className="col-span-5 text-center">Carico (kg)</span>
                  <span className="col-span-4 text-center">Reps Svolte</span>
                  <span className="col-span-2 text-center">Stato</span>
                </div>

                {ex.dettagli_serie.map((set, sIdx) => (
                  <div
                    key={set.set_numero}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                      set.completata
                        ? 'bg-emerald-950/30 border border-emerald-900/50'
                        : 'bg-slate-950/60 border border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-1 text-center font-bold text-xs text-slate-300">
                      #{set.set_numero}
                    </div>

                    {/* Weight Input with Quick Stepper Chips */}
                    <div className="col-span-5 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAdjustWeight(originalIdx, sIdx, -2.5)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                        title="-2.5 kg"
                      >
                        -
                      </button>

                      <div className="relative flex-1 min-w-[50px] max-w-[80px]">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={set.peso_kg === 0 ? '' : set.peso_kg}
                          onChange={e =>
                            handleUpdateSet(originalIdx, sIdx, {
                              peso_kg: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1 px-1 text-xs font-mono-nums font-bold text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        onClick={() => handleAdjustWeight(originalIdx, sIdx, 2.5)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                        title="+2.5 kg"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps Input with Stepper */}
                    <div className="col-span-4 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAdjustReps(originalIdx, sIdx, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                        title="-1 rep"
                      >
                        -
                      </button>

                      <div className="relative flex-1 min-w-[40px] max-w-[60px]">
                        <input
                          type="number"
                          min="0"
                          value={set.reps_effettive}
                          onChange={e =>
                            handleUpdateSet(originalIdx, sIdx, {
                              reps_effettive: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-1 px-1 text-xs font-mono-nums font-bold text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        onClick={() => handleAdjustReps(originalIdx, sIdx, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                        title="+1 rep"
                      >
                        +
                      </button>
                    </div>

                    {/* Complete Button & Delete */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleComplete(originalIdx, sIdx)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-90 ${
                          set.completata
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border border-slate-700'
                        }`}
                        title={set.completata ? 'Serie completata' : 'Segna serie completata'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      {ex.dettagli_serie.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(originalIdx, sIdx)}
                          className="p-1 text-slate-600 hover:text-red-400 transition"
                          title="Rimuovi questa serie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Add Set, Copy Weight, Athlete Notes */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddSet(originalIdx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aggiungi Serie</span>
                  </button>

                  {ex.dettagli_serie[0]?.peso_kg > 0 && ex.dettagli_serie.length > 1 && (
                    <button
                      onClick={() => handleCopyWeightToAll(originalIdx)}
                      className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition text-[11px]"
                      title="Copia il carico del set 1 a tutti i set successivi"
                    >
                      Copia {ex.dettagli_serie[0].peso_kg}kg a tutti
                    </button>
                  )}
                </div>

                {/* Athlete note toggle */}
                <button
                  onClick={() => toggleNoteExpanded(ex.template_id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition"
                >
                  <span>Note Atleta</span>
                  {isNotesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expandable Athlete's Exercise Note */}
              {isNotesOpen && (
                <div className="mt-2.5 pt-2">
                  <input
                    type="text"
                    value={ex.note_atleta || ''}
                    onChange={e => handleUpdateExerciseNote(originalIdx, e.target.value)}
                    placeholder="Note su questo esercizio (es. aumentato carico, buffer 2, fastidio gomito)..."
                    className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Save / Complete Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Serie: <strong className="text-emerald-400">{completedSets}/{totalSets}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCurrentSession}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Esporta</span>
            </button>
            <button
              onClick={() => {
                onSaveSession(currentSession);
                onBack();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              Concludi & Torna al Calendario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
