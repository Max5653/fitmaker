import { FileMakerExerciseTemplate, WorkoutSession } from '../types/workout';

// Preset sample workout plan from FileMaker
export const SAMPLE_FILEMAKER_TEMPLATE: FileMakerExerciseTemplate[] = [
  // Giorno 1 - Pettorali & Bicipiti
  {
    id: 'ex-1-1',
    giorno: 1,
    gruppo_muscolare: 'Pettorali',
    esercizio: 'Panca Piana Bilanciere',
    serie_previste: 4,
    ripetizioni_previste: '10-8-8-6',
    recupero_secondi: 90,
    note_scheda: 'Fermo al petto 1 sec, traiettoria controllata',
    ordine: 1,
  },
  {
    id: 'ex-1-2',
    giorno: 1,
    gruppo_muscolare: 'Pettorali',
    esercizio: 'Distensioni Manubri su Panca Inclinata',
    serie_previste: 3,
    ripetizioni_previste: '10',
    recupero_secondi: 75,
    note_scheda: 'Inclinazione 30 gradi, massimo allungamento',
    ordine: 2,
  },
  {
    id: 'ex-1-3',
    giorno: 1,
    gruppo_muscolare: 'Pettorali',
    esercizio: 'Croci ai Cavi Alti',
    serie_previste: 3,
    ripetizioni_previste: '12-15',
    recupero_secondi: 60,
    note_scheda: 'Picco di contrazione 1.5s',
    ordine: 3,
  },
  {
    id: 'ex-1-4',
    giorno: 1,
    gruppo_muscolare: 'Bicipiti',
    esercizio: 'Curl con Bilanciere Sagomato EZ',
    serie_previste: 4,
    ripetizioni_previste: '8-10',
    recupero_secondi: 75,
    note_scheda: 'Gomiti fermi aderenti ai fianchi',
    ordine: 4,
  },
  {
    id: 'ex-1-5',
    giorno: 1,
    gruppo_muscolare: 'Bicipiti',
    esercizio: 'Hammer Curl con Manubri',
    serie_previste: 3,
    ripetizioni_previste: '12',
    recupero_secondi: 60,
    note_scheda: 'Brachioradiale, salita esplosiva',
    ordine: 5,
  },

  // Giorno 2 - Dorso & Tricipiti
  {
    id: 'ex-2-1',
    giorno: 2,
    gruppo_muscolare: 'Dorsali',
    esercizio: 'Trazioni alla Sbarra (o Lat Machine)',
    serie_previste: 4,
    ripetizioni_previste: '8',
    recupero_secondi: 90,
    note_scheda: 'Presa prona, adduzione scapolare completa',
    ordine: 1,
  },
  {
    id: 'ex-2-2',
    giorno: 2,
    gruppo_muscolare: 'Dorsali',
    esercizio: 'Rematore Bilanciere a 45°',
    serie_previste: 4,
    ripetizioni_previste: '8-10',
    recupero_secondi: 90,
    note_scheda: 'Tirare verso l ombelico, schiena piatta',
    ordine: 2,
  },
  {
    id: 'ex-2-3',
    giorno: 2,
    gruppo_muscolare: 'Dorsali',
    esercizio: 'Pulley Basso Presa Stretta',
    serie_previste: 3,
    ripetizioni_previste: '12',
    recupero_secondi: 60,
    note_scheda: 'Allungamento profondo in fase eccentrica',
    ordine: 3,
  },
  {
    id: 'ex-2-4',
    giorno: 2,
    gruppo_muscolare: 'Tricipiti',
    esercizio: 'French Press su Panca con EZ',
    serie_previste: 4,
    ripetizioni_previste: '10',
    recupero_secondi: 75,
    note_scheda: 'Scendere dietro la testa',
    ordine: 4,
  },
  {
    id: 'ex-2-5',
    giorno: 2,
    gruppo_muscolare: 'Tricipiti',
    esercizio: 'Push Down ai Cavi con Corda',
    serie_previste: 3,
    ripetizioni_previste: '12-15',
    recupero_secondi: 60,
    note_scheda: 'Aprire la corda in basso',
    ordine: 5,
  },

  // Giorno 3 - Gambe & Spalle & Addome
  {
    id: 'ex-3-1',
    giorno: 3,
    gruppo_muscolare: 'Gambe',
    esercizio: 'Squat con Bilanciere',
    serie_previste: 4,
    ripetizioni_previste: '8-8-6-6',
    recupero_secondi: 120,
    note_scheda: 'Profondità parallelo, respirazione diaframmatica',
    ordine: 1,
  },
  {
    id: 'ex-3-2',
    giorno: 3,
    gruppo_muscolare: 'Gambe',
    esercizio: 'Leg Press a 45°',
    serie_previste: 3,
    ripetizioni_previste: '10-12',
    recupero_secondi: 90,
    note_scheda: 'Piedi a larghezza spalle',
    ordine: 2,
  },
  {
    id: 'ex-3-3',
    giorno: 3,
    gruppo_muscolare: 'Gambe',
    esercizio: 'Leg Curl Sdraiato',
    serie_previste: 3,
    ripetizioni_previste: '12',
    recupero_secondi: 60,
    note_scheda: 'Isocrurali, discesa 3 secondi',
    ordine: 3,
  },
  {
    id: 'ex-3-4',
    giorno: 3,
    gruppo_muscolare: 'Spalle',
    esercizio: 'Military Press con Bilanciere',
    serie_previste: 4,
    ripetizioni_previste: '8-10',
    recupero_secondi: 90,
    note_scheda: 'In piedi, glutei e addome contratti',
    ordine: 4,
  },
  {
    id: 'ex-3-5',
    giorno: 3,
    gruppo_muscolare: 'Spalle',
    esercizio: 'Alzate Laterali con Manubri',
    serie_previste: 4,
    ripetizioni_previste: '12-15',
    recupero_secondi: 60,
    note_scheda: 'Non dondolare col busto',
    ordine: 5,
  },
  {
    id: 'ex-3-6',
    giorno: 3,
    gruppo_muscolare: 'Addome',
    esercizio: 'Crunch al Cavo o su Panca Declinata',
    serie_previste: 3,
    ripetizioni_previste: '15-20',
    recupero_secondi: 45,
    note_scheda: 'Espirare forte in chiusura',
    ordine: 6,
  },
];

// Helper to normalize strings for header mapping
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses FileMaker JSON input
 */
export function parseFileMakerJSON(rawJson: string): FileMakerExerciseTemplate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson.trim());
  } catch (err) {
    throw new Error('Il file JSON non è valido. Verifica la sintassi JSON esportata da FileMaker: ' + (err as Error).message);
  }

  // Support array, or object with data/scheda/records/portalData
  let items: unknown[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.scheda)) items = obj.scheda;
    else if (Array.isArray(obj.esercizi)) items = obj.esercizi;
    else if (Array.isArray(obj.data)) items = obj.data;
    else if (Array.isArray(obj.records)) items = obj.records;
    else if (obj.response && typeof obj.response === 'object' && Array.isArray((obj.response as Record<string, unknown>).data)) {
      items = (obj.response as Record<string, unknown>).data as unknown[];
    } else {
      // Find the first array property
      for (const val of Object.values(obj)) {
        if (Array.isArray(val)) {
          items = val;
          break;
        }
      }
    }
  }

  if (!items || items.length === 0) {
    throw new Error('Nessun esercizio trovato nel file JSON. Assicurati che contenga un array di esercizi.');
  }

  const templates: FileMakerExerciseTemplate[] = [];

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const raw = item as Record<string, unknown>;
    // Handle FileMaker Data API format where fields are nested in fieldData
    const data = (raw.fieldData && typeof raw.fieldData === 'object' ? raw.fieldData : raw) as Record<string, unknown>;

    // Field search with synonyms
    let giorno = 1;
    let gruppo = '';
    let esercizio = '';
    let serie = 3;
    let reps = '10';
    let recupero = 60;
    let note = '';

    for (const [k, v] of Object.entries(data)) {
      const norm = normalizeKey(k);
      const valStr = String(v ?? '').trim();
      const valNum = Number(v);

      if (norm.includes('giorno') || norm === 'day' || norm === 'gdiallenamento') {
        giorno = parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 1;
      } else if (norm.includes('gruppo') || norm.includes('muscol') || norm === 'muscle') {
        gruppo = valStr;
      } else if (norm.includes('es') || norm.includes('nome') || norm === 'exercise') {
        esercizio = valStr;
      } else if (norm.includes('serie') || norm === 'sets') {
        serie = !isNaN(valNum) && valNum > 0 ? valNum : parseInt(valStr, 10) || 3;
      } else if (norm.includes('rip') || norm.includes('rep')) {
        reps = valStr;
      } else if (norm.includes('recupero') || norm.includes('rest') || norm.includes('pausa')) {
        recupero = !isNaN(valNum) && valNum > 0 ? valNum : parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 60;
      } else if (norm.includes('not') || norm.includes('istruzion') || norm === 'coach') {
        note = valStr;
      }
    }

    if (!esercizio) {
      esercizio = `Esercizio ${index + 1}`;
    }
    if (!gruppo) {
      gruppo = 'Generale';
    }

    templates.push({
      id: `fm-import-${Date.now()}-${index}`,
      giorno: Math.max(1, Math.min(10, giorno)),
      gruppo_muscolare: gruppo,
      esercizio,
      serie_previste: Math.max(1, serie),
      ripetizioni_previste: reps || '10',
      recupero_secondi: Math.max(10, recupero),
      note_scheda: note,
      ordine: index + 1,
    });
  });

  return templates;
}

/**
 * Parses FileMaker CSV input (handles both , and ; delimiters, quoted strings)
 */
export function parseFileMakerCSV(rawCsv: string): FileMakerExerciseTemplate[] {
  // Strip BOM if present
  const clean = rawCsv.replace(/^\uFEFF/, '').trim();
  if (!clean) {
    throw new Error('Il file CSV è vuoto.');
  }

  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Il CSV deve contenere almeno una riga di intestazione e una riga di dati.');
  }

  // Auto-detect delimiter: ; or ,
  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount >= commaCount && semicolonCount > 0) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  // CSV line splitter respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => normalizeKey(h));
  const templates: FileMakerExerciseTemplate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length <= 1 && values[0] === '') continue;

    let giorno = 1;
    let gruppo = 'Generale';
    let esercizio = '';
    let serie = 3;
    let reps = '10';
    let recupero = 60;
    let note = '';

    headers.forEach((header, colIdx) => {
      const val = values[colIdx] ?? '';
      if (!val) return;

      if (header.includes('giorno') || header === 'day') {
        giorno = parseInt(val.replace(/[^0-9]/g, ''), 10) || 1;
      } else if (header.includes('gruppo') || header.includes('muscol') || header === 'muscle') {
        gruppo = val;
      } else if (header.includes('es') || header.includes('nome') || header === 'exercise') {
        esercizio = val;
      } else if (header.includes('serie') || header === 'sets') {
        serie = parseInt(val.replace(/[^0-9]/g, ''), 10) || 3;
      } else if (header.includes('rip') || header.includes('rep')) {
        reps = val;
      } else if (header.includes('recupero') || header.includes('rest') || header.includes('pausa')) {
        recupero = parseInt(val.replace(/[^0-9]/g, ''), 10) || 60;
      } else if (header.includes('not') || header.includes('istruzion')) {
        note = val;
      }
    });

    if (!esercizio && values[0]) {
      esercizio = values[0];
    }
    if (!esercizio) continue;

    templates.push({
      id: `fm-csv-${Date.now()}-${i}`,
      giorno: Math.max(1, Math.min(10, giorno)),
      gruppo_muscolare: gruppo,
      esercizio,
      serie_previste: Math.max(1, serie),
      ripetizioni_previste: reps || '10',
      recupero_secondi: Math.max(10, recupero),
      note_scheda: note,
      ordine: i,
    });
  }

  if (templates.length === 0) {
    throw new Error('Nessun esercizio valido trovato nel file CSV. Controlla le colonne dell intestazione.');
  }

  return templates;
}

/**
 * Builds FileMaker compatible JSON export for one or multiple sessions
 */
export function exportSessionsToJSON(sessions: WorkoutSession[]): string {
  const exportPayload = sessions.map(session => ({
    id_seduta: session.id,
    data_seduta: session.data_seduta,
    giorno_allenamento: session.giorno_allenamento,
    nome_giorno: session.nome_giorno || `Giorno ${session.giorno_allenamento}`,
    note_generali_atleta: session.note_generali_atleta || '',
    durata_minuti: session.durata_minuti || null,
    creata_il: session.creata_il,
    aggiornata_il: session.aggiornata_il,
    esercizi: session.esercizi.map(ex => {
      // Summarize sets and weights for single-column FileMaker reports
      const pesiList = ex.dettagli_serie.map(s => `${s.peso_kg}kg`).join(' / ');
      const repsList = ex.dettagli_serie.map(s => `${s.reps_effettive}`).join(' / ');
      const completatiCount = ex.dettagli_serie.filter(s => s.completata).length;

      return {
        esercizio: ex.esercizio,
        gruppo_muscolare: ex.gruppo_muscolare,
        serie_previste: ex.serie_previste,
        serie_effettive: ex.serie_effettive,
        ripetizioni_previste: ex.ripetizioni_previste,
        tempo_recupero_secondi: ex.recupero_secondi,
        note_scheda: ex.note_scheda || '',

        // Dati atleta registrati
        pesi_serie_sintesi: pesiList,
        ripetizioni_effettive_sintesi: repsList,
        serie_completate: completatiCount,
        note_atleta: ex.note_atleta || '',
        tempo_prima_serie_secondi: ex.tempo_esecuzione_prima_serie_sec || null,
        dettaglio_singole_serie: ex.dettagli_serie.map(s => ({
          set_numero: s.set_numero,
          peso_kg: s.peso_kg,
          reps_effettive: s.reps_effettive,
          completata: s.completata,
        })),
      };
    }),
  }));

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Builds FileMaker compatible CSV export for one or multiple sessions
 */
export function exportSessionsToCSV(sessions: WorkoutSession[], delimiter: ';' | ',' = ';'): string {
  const headers = [
    'ID_Seduta',
    'Data_Seduta',
    'Giorno_Allenamento',
    'Gruppo_Muscolare',
    'Esercizio',
    'Serie_Previste',
    'Serie_Effettive',
    'Ripetizioni_Previste',
    'Ripetizioni_Effettive_Sintesi',
    'Pesi_Effettivi_Serie_Kg',
    'Tempo_Recupero_Sec',
    'Tempo_Prima_Serie_Tutor_Sec',
    'Note_Scheda',
    'Note_Atleta',
    'Note_Generali_Seduta',
  ];

  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [headers.join(delimiter)];

  for (const session of sessions) {
    for (const ex of session.esercizi) {
      const pesiList = ex.dettagli_serie.map(s => `${s.peso_kg}kg`).join(' / ');
      const repsList = ex.dettagli_serie.map(s => `${s.reps_effettive}`).join(' / ');

      const row = [
        escapeField(session.id),
        escapeField(session.data_seduta),
        escapeField(session.giorno_allenamento),
        escapeField(ex.gruppo_muscolare),
        escapeField(ex.esercizio),
        escapeField(ex.serie_previste),
        escapeField(ex.serie_effettive),
        escapeField(ex.ripetizioni_previste),
        escapeField(repsList),
        escapeField(pesiList),
        escapeField(ex.recupero_secondi),
        escapeField(ex.tempo_esecuzione_prima_serie_sec || ''),
        escapeField(ex.note_scheda || ''),
        escapeField(ex.note_atleta || ''),
        escapeField(session.note_generali_atleta || ''),
      ];
      rows.push(row.join(delimiter));
    }
  }

  // Prepend UTF-8 BOM so Excel & FileMaker automatically recognize accents
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Generate a template CSV that the user can import into FileMaker or directly back into the app
 */
export function getSampleFileMakerCSV(delimiter: ';' | ',' = ';'): string {
  const headers = [
    'Giorno_Allenamento',
    'Gruppo_Muscolare',
    'Esercizio',
    'Serie_Previste',
    'Ripetizioni_Previste',
    'Tempo_Recupero_Sec',
    'Note_Scheda',
  ];

  const rows = [headers.join(delimiter)];
  for (const item of SAMPLE_FILEMAKER_TEMPLATE) {
    rows.push(
      [
        item.giorno,
        `"${item.gruppo_muscolare}"`,
        `"${item.esercizio}"`,
        item.serie_previste,
        `"${item.ripetizioni_previste}"`,
        item.recupero_secondi,
        `"${item.note_scheda || ''}"`,
      ].join(delimiter)
    );
  }

  return '\uFEFF' + rows.join('\r\n');
}

export function getSampleFileMakerJSON(): string {
  return JSON.stringify(SAMPLE_FILEMAKER_TEMPLATE, null, 2);
}
