import React, { useState, useMemo } from 'react';
import { WorkoutSession, FileMakerExerciseTemplate } from '../types/workout';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Dumbbell,
  Clock,
  CheckCircle2,
  Share2,
  Trash2,
  Flame,
  ArrowRight
} from 'lucide-react';

interface CalendarViewProps {
  sessions: WorkoutSession[];
  templates: FileMakerExerciseTemplate[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenSession: (session: WorkoutSession) => void;
  onCreateSession: (dateStr: string, giorno: number) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (session: WorkoutSession) => void;
}

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  templates,
  selectedDate,
  onSelectDate,
  onOpenSession,
  onCreateSession,
  onDeleteSession,
  onExportSession,
}) => {
  // Current visible calendar year/month
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date(selectedDate || Date.now());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'ALL'>('ALL');

  // Available days in the imported template
  const availableDays = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const t of templates) {
      if (!map.has(t.giorno)) {
        map.set(t.giorno, []);
      }
      if (!map.get(t.giorno)!.includes(t.gruppo_muscolare)) {
        map.get(t.giorno)!.push(t.gruppo_muscolare);
      }
    }
    return Array.from(map.entries())
      .map(([giorno, groups]) => ({
        giorno,
        label: `Giorno ${giorno}`,
        groups: groups.join(', '),
      }))
      .sort((a, b) => a.giorno - b.giorno);
  }, [templates]);

  // Selected giorno for creating a new session
  const [chosenGiorno, setChosenGiorno] = useState<number>(() => {
    return availableDays[0]?.giorno ?? 1;
  });

  // Map of sessions by date YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map: Record<string, WorkoutSession[]> = {};
    for (const s of sessions) {
      if (!map[s.data_seduta]) {
        map[s.data_seduta] = [];
      }
      map[s.data_seduta].push(s);
    }
    return map;
  }, [sessions]);

  // Calendar days grid computation
  const { daysInMonth, startWeekday, prevMonthDays } = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    // getDay returns 0 for Sunday, 1 for Monday... We want 0 for Monday
    let start = firstDay.getDay() - 1;
    if (start === -1) start = 6;

    const daysCount = new Date(year, month + 1, 0).getDate();
    const prevDaysCount = new Date(year, month, 0).getDate();

    return {
      daysInMonth: daysCount,
      startWeekday: start,
      prevMonthDays: prevDaysCount,
    };
  }, [currentMonthDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = today.toISOString().split('T')[0];
    onSelectDate(todayStr);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = new Date().toISOString().split('T')[0];

  const sessionsForSelectedDate = sessionsByDate[selectedDate] || [];

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGoToday}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Oggi
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`text-[11px] font-semibold uppercase tracking-wider py-1 ${
                i >= 5 ? 'text-amber-500/70' : 'text-slate-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Previous month trailing days */}
          {Array.from({ length: startWeekday }).map((_, i) => {
            const dayNum = prevMonthDays - startWeekday + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="h-16 rounded-xl border border-dashed border-slate-800/40 p-1 text-slate-600 text-xs flex flex-col opacity-40"
              >
                <span>{dayNum}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const daySessions = sessionsByDate[dateStr] || [];
            const hasWorkout = daySessions.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`h-16 rounded-xl p-1 text-left flex flex-col justify-between transition relative border ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                    : hasWorkout
                    ? 'border-emerald-600/40 bg-slate-800/90 hover:bg-slate-800'
                    : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-semibold px-1 rounded ${
                      isToday
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isSelected
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {hasWorkout && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                {/* Workout badge in day cell */}
                {hasWorkout ? (
                  <div className="w-full flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                    {daySessions.map(s => (
                      <span
                        key={s.id}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate block w-full text-center"
                      >
                        G{s.giorno_allenamento}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-700 self-center opacity-0 group-hover:opacity-100">+</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Workout Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Data Selezionata
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{selectedDate === todayStr ? 'Oggi, ' : ''}{selectedDate}</span>
              {sessionsForSelectedDate.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  {sessionsForSelectedDate.length} {sessionsForSelectedDate.length === 1 ? 'seduta registrata' : 'sedute registrate'}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Existing sessions for this date */}
        {sessionsForSelectedDate.length > 0 ? (
          <div className="mt-4 space-y-3">
            {sessionsForSelectedDate.map(session => {
              const totalSets = session.esercizi.reduce((acc, ex) => acc + ex.dettagli_serie.length, 0);
              const completedSets = session.esercizi.reduce(
                (acc, ex) => acc + ex.dettagli_serie.filter(s => s.completata).length,
                0
              );
              const totalWeightKg = session.esercizi.reduce(
                (acc, ex) => acc + ex.dettagli_serie.reduce((w, s) => w + (s.completata ? s.peso_kg * s.reps_effettive : 0), 0),
                0
              );

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs">
                        GIORNO {session.giorno_allenamento}
                      </span>
                      <span className="font-bold text-white text-base">
                        {session.nome_giorno || `Scheda Giorno ${session.giorno_allenamento}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                        {session.esercizi.length} Esercizi
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {completedSets}/{totalSets} Serie Svolte
                      </span>
                      {totalWeightKg > 0 && (
                        <span className="flex items-center gap-1 font-mono-nums text-amber-300">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          {Math.round(totalWeightKg)} kg volume tot.
                        </span>
                      )}
                    </div>

                    {session.note_generali_atleta && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/60 px-2 py-1 rounded">
                        "{session.note_generali_atleta}"
                      </p>
                    )}
                  </div>

                  {/* Actions for this session */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onExportSession(session)}
                      className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Esporta questa seduta per FileMaker"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 transition"
                      title="Elimina seduta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenSession(session)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
                    >
                      <span>Apri Seduta</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400">
              Nessun allenamento registrato per il <strong className="text-slate-200">{selectedDate}</strong>.
            </p>
          </div>
        )}

        {/* Start / Create a new session for this date */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            {sessionsForSelectedDate.length > 0
              ? 'Vuoi aggiungere un altra seduta per questa data? Scegli il giorno della scheda:'
              : 'Seleziona quale giorno della scheda FileMaker vuoi svolgere per questa data:'}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {availableDays.map(item => (
              <button
                key={item.giorno}
                onClick={() => setChosenGiorno(item.giorno)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  chosenGiorno === item.giorno
                    ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    GIORNO {item.giorno}
                  </span>
                  {chosenGiorno === item.giorno && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2 truncate">
                  {item.groups || 'Esercizi previsti'}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => onCreateSession(selectedDate, chosenGiorno)}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Inizia & Compila Scheda Giorno {chosenGiorno} ({selectedDate})</span>
          </button>
        </div>
      </div>

      {/* History of all logged sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Storico Sedute Registrate</span>
            <span className="text-xs text-slate-400 font-normal">({sessions.length} totali)</span>
          </h3>

          {/* Filter by Day */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedDayFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tutti
            </button>
            {availableDays.map(d => (
              <button
                key={d.giorno}
                onClick={() => setSelectedDayFilter(d.giorno)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedDayFilter === d.giorno
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                G{d.giorno}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nessuna seduta ancora registrata.</p>
        ) : (
          <div className="space-y-2">
            {sessions
              .filter(s => selectedDayFilter === 'ALL' || s.giorno_allenamento === selectedDayFilter)
              .map(s => (
                <div
                  key={s.id}
                  onClick={() => onOpenSession(s)}
                  className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono-nums font-bold text-xs px-2 py-1 rounded bg-slate-700 text-amber-400">
                      G{s.giorno_allenamento}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {s.data_seduta}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                        {s.nome_giorno}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-semibold font-mono-nums hidden sm:inline">
                      {s.esercizi.reduce((acc, ex) => acc + ex.dettagli_serie.filter(x => x.completata).length, 0)} serie
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
