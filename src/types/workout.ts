export interface FileMakerExerciseTemplate {
  id: string;
  giorno: number; // 1, 2, 3, 4, 5, 6
  gruppo_muscolare: string; // es. Pettorali, Dorsali, Gambe
  esercizio: string; // es. Panca Piana Bilanciere
  serie_previste: number; // es. 4
  ripetizioni_previste: string; // es. "10", "12-10-8-6", "8-10"
  recupero_secondi: number; // es. 90
  note_scheda?: string; // Note del personal trainer/FileMaker
  ordine?: number;
}

export interface SetDetail {
  set_numero: number;
  peso_kg: number;
  reps_effettive: number;
  completata: boolean;
}

export interface ExerciseSessionLog {
  template_id: string;
  esercizio: string;
  gruppo_muscolare: string;
  serie_previste: number;
  ripetizioni_previste: string;
  recupero_secondi: number;
  note_scheda?: string;

  // Dati compilati dall'atleta
  serie_effettive: number;
  dettagli_serie: SetDetail[];
  note_atleta?: string;
  tempo_esecuzione_prima_serie_sec?: number; // Tempo registrato in Modalità Tutor
  tutor_completato?: boolean; // Se la prima serie è stata svolta in tutor mode
}

export interface WorkoutSession {
  id: string; // unique ID
  data_seduta: string; // YYYY-MM-DD
  giorno_allenamento: number; // 1, 2, 3, 4, 5, 6
  nome_giorno?: string; // es. "Giorno 1 - Pettorali & Bicipiti"
  esercizi: ExerciseSessionLog[];
  note_generali_atleta?: string;
  durata_minuti?: number;
  creata_il: string;
  aggiornata_il: string;
}

export interface FileMakerImportResult {
  templates: FileMakerExerciseTemplate[];
  scheda_nome?: string;
  giorni_disponibili: number[];
}
