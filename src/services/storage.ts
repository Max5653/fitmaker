import { FileMakerExerciseTemplate, WorkoutSession, ExerciseSessionLog } from '../types/workout';
import { SAMPLE_FILEMAKER_TEMPLATE } from './filemakerSync';

const STORAGE_KEYS = {
  TEMPLATES: 'fitmaker_filemaker_templates_v1',
  SESSIONS: 'fitmaker_workout_sessions_v1',
  ACTIVE_SESSION_ID: 'fitmaker_active_session_id_v1',
  WAKE_LOCK_PREF: 'fitmaker_wake_lock_enabled_v1',
};

export function getTemplates(): FileMakerExerciseTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load templates from localStorage:', e);
  }
  // Fallback to sample FileMaker plan
  return SAMPLE_FILEMAKER_TEMPLATE;
}

export function saveTemplates(templates: FileMakerExerciseTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates to localStorage:', e);
  }
}

export function getSessions(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.data_seduta.localeCompare(a.data_seduta));
      }
    }
  } catch (e) {
    console.error('Failed to load sessions from localStorage:', e);
  }

  // If initial load and empty, let's create a seed workout so the athlete sees how it works
  const initial = seedInitialSessions();
  saveSessions(initial);
  return initial;
}

export function saveSessions(sessions: WorkoutSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to localStorage:', e);
  }
}

export function getSessionById(id: string): WorkoutSession | undefined {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
}

export function saveSession(session: WorkoutSession): void {
  const sessions = getSessions();
  const existingIdx = sessions.findIndex(s => s.id === session.id);
  const now = new Date().toISOString();

  const toSave: WorkoutSession = {
    ...session,
    aggiornata_il: now,
  };

  if (existingIdx >= 0) {
    sessions[existingIdx] = toSave;
  } else {
    sessions.unshift(toSave);
  }

  saveSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  saveSessions(filtered);
}

/**
 * Creates a brand new workout session for a given date and chosen day (1, 2, 3...)
 */
export function createSessionForDay(dateStr: string, giorno: number): WorkoutSession {
  const templates = getTemplates();
  const dayTemplates = templates
    .filter(t => t.giorno === giorno)
    .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0));

  const muscleGroups = Array.from(new Set(dayTemplates.map(t => t.gruppo_muscolare)));
  const dayTitle = `Giorno ${giorno}${muscleGroups.length ? ' - ' + muscleGroups.join(', ') : ''}`;

  const now = new Date().toISOString();
  const id = `session-${dateStr}-g${giorno}-${Date.now().toString(36)}`;

  const esercizi: ExerciseSessionLog[] = dayTemplates.map(tmpl => {
    // initialize default sets matching planned sets
    const dettagli_serie = Array.from({ length: tmpl.serie_previste }, (_, idx) => ({
      set_numero: idx + 1,
      peso_kg: 0,
      reps_effettive: parseInt(tmpl.ripetizioni_previste.replace(/[^0-9]/g, ''), 10) || 10,
      completata: false,
    }));

    return {
      template_id: tmpl.id,
      esercizio: tmpl.esercizio,
      gruppo_muscolare: tmpl.gruppo_muscolare,
      serie_previste: tmpl.serie_previste,
      serie_effettive: tmpl.serie_previste,
      ripetizioni_previste: tmpl.ripetizioni_previste,
      recupero_secondi: tmpl.recupero_secondi,
      note_scheda: tmpl.note_scheda,
      dettagli_serie,
      note_atleta: '',
      tempo_esecuzione_prima_serie_sec: undefined,
      tutor_completato: false,
    };
  });

  return {
    id,
    data_seduta: dateStr,
    giorno_allenamento: giorno,
    nome_giorno: dayTitle,
    esercizi,
    note_generali_atleta: '',
    durata_minuti: 0,
    creata_il: now,
    aggiornata_il: now,
  };
}

function seedInitialSessions(): WorkoutSession[] {
  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Yesterday date
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const dateYesterday = formatDate(yesterday);

  // Today date
  const dateToday = formatDate(now);

  const templates = SAMPLE_FILEMAKER_TEMPLATE;

  // Seed Day 1 for yesterday
  const g1Templates = templates.filter(t => t.giorno === 1);
  const session1: WorkoutSession = {
    id: `session-${dateYesterday}-g1-seed`,
    data_seduta: dateYesterday,
    giorno_allenamento: 1,
    nome_giorno: 'Giorno 1 - Pettorali, Bicipiti',
    durata_minuti: 55,
    note_generali_atleta: 'Ottimo feeling alla panca piana, carichi stabili.',
    creata_il: yesterday.toISOString(),
    aggiornata_il: yesterday.toISOString(),
    esercizi: g1Templates.map((t, idx) => {
      const baseWeight = idx === 0 ? 80 : idx === 1 ? 26 : idx === 2 ? 15 : idx === 3 ? 32 : 16;
      return {
        template_id: t.id,
        esercizio: t.esercizio,
        gruppo_muscolare: t.gruppo_muscolare,
        serie_previste: t.serie_previste,
        serie_effettive: t.serie_previste,
        ripetizioni_previste: t.ripetizioni_previste,
        recupero_secondi: t.recupero_secondi,
        note_scheda: t.note_scheda,
        note_atleta: idx === 0 ? 'Chiuso con buffer 1' : '',
        tempo_esecuzione_prima_serie_sec: idx === 0 ? 38 : undefined,
        tutor_completato: idx === 0,
        dettagli_serie: Array.from({ length: t.serie_previste }, (_, sIdx) => ({
          set_numero: sIdx + 1,
          peso_kg: baseWeight + sIdx * 2.5,
          reps_effettive: 8,
          completata: true,
        })),
      };
    }),
  };

  // Seed Day 2 for today (in progress)
  const g2Templates = templates.filter(t => t.giorno === 2);
  const session2: WorkoutSession = {
    id: `session-${dateToday}-g2-seed`,
    data_seduta: dateToday,
    giorno_allenamento: 2,
    nome_giorno: 'Giorno 2 - Dorsali, Tricipiti',
    durata_minuti: 40,
    note_generali_atleta: 'Seduta in corso',
    creata_il: now.toISOString(),
    aggiornata_il: now.toISOString(),
    esercizi: g2Templates.map((t, idx) => {
      const isCompleted = idx < 2;
      return {
        template_id: t.id,
        esercizio: t.esercizio,
        gruppo_muscolare: t.gruppo_muscolare,
        serie_previste: t.serie_previste,
        serie_effettive: t.serie_previste,
        ripetizioni_previste: t.ripetizioni_previste,
        recupero_secondi: t.recupero_secondi,
        note_scheda: t.note_scheda,
        note_atleta: '',
        tempo_esecuzione_prima_serie_sec: idx === 0 ? 42 : undefined,
        tutor_completato: idx === 0,
        dettagli_serie: Array.from({ length: t.serie_previste }, (_, sIdx) => ({
          set_numero: sIdx + 1,
          peso_kg: idx === 0 ? 0 : 70, // 0 for bodyweight trazioni, 70 for rematore
          reps_effettive: 8,
          completata: isCompleted,
        })),
      };
    }),
  };

  return [session2, session1];
}
