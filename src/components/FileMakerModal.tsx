import React, { useState, useId } from 'react';
import {
  FileMakerExerciseTemplate,
  WorkoutSession
} from '../types/workout';
import {
  parseFileMakerJSON,
  parseFileMakerCSV,
  exportSessionsToJSON,
  exportSessionsToCSV,
  getSampleFileMakerJSON,
  getSampleFileMakerCSV,
  SAMPLE_FILEMAKER_TEMPLATE,
} from '../services/filemakerSync';
import {
  X,
  Upload,
  Download,
  Copy,
  Check,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Database,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface FileMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'import' | 'export' | 'templates';
  onImportTemplates: (templates: FileMakerExerciseTemplate[]) => void;
  allSessions: WorkoutSession[];
  activeSessionId?: string;
}

export const FileMakerModal: React.FC<FileMakerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'export',
  onImportTemplates,
  allSessions,
  activeSessionId,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'templates'>(initialTab);

  // --- IMPORT STATE ---
  const [importFormat, setImportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [importRawText, setImportRawText] = useState('');
  const [importPreview, setImportPreview] = useState<FileMakerExerciseTemplate[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // --- EXPORT STATE ---
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('CSV');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [exportScope, setExportScope] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [selectedSingleSessionId, setSelectedSingleSessionId] = useState<string>(() => {
    return activeSessionId || allSessions[0]?.id || '';
  });
  const [selectedMultiSessionIds, setSelectedMultiSessionIds] = useState<string[]>(() => {
    return allSessions.map(s => s.id);
  });
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const fileInputId = useId();

  // --- IMPORT ACTIONS ---
  const handleParseImport = () => {
    setImportError(null);
    setImportPreview(null);
    if (!importRawText.trim()) {
      setImportError('Incolla il contenuto o carica un file.');
      return;
    }

    try {
      let parsed: FileMakerExerciseTemplate[] = [];
      if (importFormat === 'JSON') {
        parsed = parseFileMakerJSON(importRawText);
      } else {
        parsed = parseFileMakerCSV(importRawText);
      }
      setImportPreview(parsed);
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect format by extension
    if (file.name.endsWith('.csv')) {
      setImportFormat('CSV');
    } else if (file.name.endsWith('.json')) {
      setImportFormat('JSON');
    }

    const reader = new FileReader();
    reader.onload = evt => {
      const text = (evt.target?.result as string) || '';
      setImportRawText(text);
      setImportError(null);
      // Auto-parse on file upload
      try {
        const isJson = file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[');
        const parsed = isJson ? parseFileMakerJSON(text) : parseFileMakerCSV(text);
        setImportFormat(isJson ? 'JSON' : 'CSV');
        setImportPreview(parsed);
      } catch (err) {
        setImportError((err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importPreview || importPreview.length === 0) return;
    onImportTemplates(importPreview);
    onClose();
  };

  const handleLoadDemoTemplate = () => {
    setImportFormat('JSON');
    setImportRawText(JSON.stringify(SAMPLE_FILEMAKER_TEMPLATE, null, 2));
    setImportPreview(SAMPLE_FILEMAKER_TEMPLATE);
    setImportError(null);
  };

  // --- EXPORT COMPUTATION ---
  const getSessionsToExport = (): WorkoutSession[] => {
    if (exportScope === 'SINGLE') {
      const single = allSessions.find(s => s.id === selectedSingleSessionId);
      return single ? [single] : [];
    } else {
      return allSessions.filter(s => selectedMultiSessionIds.includes(s.id));
    }
  };

  const exportPayloadString = (): string => {
    const targetSessions = getSessionsToExport();
    if (targetSessions.length === 0) return '';

    if (exportFormat === 'JSON') {
      return exportSessionsToJSON(targetSessions);
    } else {
      return exportSessionsToCSV(targetSessions, csvDelimiter);
    }
  };

  const handleDownloadExportFile = () => {
    const content = exportPayloadString();
    if (!content) return;

    const mime = exportFormat === 'JSON' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;';
    const ext = exportFormat === 'JSON' ? 'json' : 'csv';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `filemaker_export_${exportScope === 'SINGLE' ? 'seduta' : 'sedute'}_${timestamp}.${ext}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const content = exportPayloadString();
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {
      // Fallback
    }
  };

  const toggleSelectAllMulti = () => {
    if (selectedMultiSessionIds.length === allSessions.length) {
      setSelectedMultiSessionIds([]);
    } else {
      setSelectedMultiSessionIds(allSessions.map(s => s.id));
    }
  };

  const toggleSelectSession = (id: string) => {
    if (selectedMultiSessionIds.includes(id)) {
      setSelectedMultiSessionIds(selectedMultiSessionIds.filter(x => x !== id));
    } else {
      setSelectedMultiSessionIds([...selectedMultiSessionIds, id]);
    }
  };

  // Sample downloads
  const handleDownloadSample = (type: 'JSON' | 'CSV') => {
    const content = type === 'JSON' ? getSampleFileMakerJSON() : getSampleFileMakerCSV(';');
    const mime = type === 'JSON' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;';
    const ext = type === 'JSON' ? 'json' : 'csv';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema_scheda_filemaker_esempio.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">
                Sincronizzazione FileMaker
              </h2>
              <p className="text-xs text-slate-400">
                Importa schede o esporta i dati delle sedute (JSON / CSV)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta per FileMaker</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importa da FileMaker</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-slate-800 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Formati & Esempi</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: EXPORT TO FILEMAKER */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Scope selection: Single vs Multiple */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cosa desideri esportare?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportScope('SINGLE')}
                    className={`p-3 rounded-xl border text-left transition ${
                      exportScope === 'SINGLE'
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">Singola Seduta</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Esporta solo la seduta selezionata
                    </div>
                  </button>

                  <button
                    onClick={() => setExportScope('MULTI')}
                    className={`p-3 rounded-xl border text-left transition ${
                      exportScope === 'MULTI'
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">Più Sedute Selezionabili</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Scegli più sedute o tutte insieme
                    </div>
                  </button>
                </div>
              </div>

              {/* Single Session Picker */}
              {exportScope === 'SINGLE' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">
                    Seleziona la seduta da esportare:
                  </label>
                  <select
                    value={selectedSingleSessionId}
                    onChange={e => setSelectedSingleSessionId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                  >
                    {allSessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.data_seduta} — Giorno {s.giorno_allenamento} ({s.nome_giorno})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi Session Checklist */}
              {exportScope === 'MULTI' && (
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-300 font-bold">
                      Sedute Selezionate ({selectedMultiSessionIds.length}/{allSessions.length})
                    </span>
                    <button
                      onClick={toggleSelectAllMulti}
                      className="text-amber-400 hover:underline text-xs font-semibold"
                    >
                      {selectedMultiSessionIds.length === allSessions.length
                        ? 'Deseleziona Tutte'
                        : 'Seleziona Tutte'}
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {allSessions.map(s => {
                      const isChecked = selectedMultiSessionIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectSession(s.id)}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0"
                            />
                            <span className="font-bold text-slate-200">{s.data_seduta}</span>
                            <span className="text-slate-400">G{s.giorno_allenamento}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {s.nome_giorno}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Export Format (JSON or CSV) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Formato di Esportazione
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat('CSV')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                      exportFormat === 'CSV'
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <div className="font-bold text-xs">Formato CSV</div>
                      <div className="text-[10px] text-slate-400">Ideale per Tabelle FileMaker</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat('JSON')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                      exportFormat === 'JSON'
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <FileCode className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <div className="font-bold text-xs">Formato JSON</div>
                      <div className="text-[10px] text-slate-400">Ideale per FileMaker Data API</div>
                    </div>
                  </button>
                </div>

                {exportFormat === 'CSV' && (
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                    <span>Separatore CSV:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={csvDelimiter === ';'}
                        onChange={() => setCsvDelimiter(';')}
                        className="text-amber-500 focus:ring-0"
                      />
                      <span>; (Punto e virgola - FileMaker Italia)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={csvDelimiter === ','}
                        onChange={() => setCsvDelimiter(',')}
                        className="text-amber-500 focus:ring-0"
                      />
                      <span>, (Virgola standard)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Data Preview Box */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Anteprima dati generati ({getSessionsToExport().length} sedute):</span>
                  <button
                    onClick={handleCopyToClipboard}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copia tutto</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={exportPayloadString()}
                  rows={6}
                  className="w-full text-[11px] font-mono-nums bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:outline-none resize-none"
                />
              </div>

              {/* Main Export Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDownloadExportFile}
                  disabled={getSessionsToExport().length === 0}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Scarica File per FileMaker (.{exportFormat.toLowerCase()})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT FROM FILEMAKER */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Format selection */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Formato del file da importare
                </label>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setImportFormat('JSON')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      importFormat === 'JSON' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setImportFormat('CSV')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      importFormat === 'CSV' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* File Drop / Upload */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-4 text-center transition bg-slate-950/40">
                <input
                  type="file"
                  id={fileInputId}
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2"
                >
                  <Upload className="w-8 h-8 text-amber-400" />
                  <div className="text-xs font-bold text-white">
                    Tocca per selezionare il file esportato da FileMaker
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supporta file .JSON o .CSV da FileMaker
                  </div>
                </label>
              </div>

              {/* Direct Paste */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Oppure incolla direttamente il testo JSON o CSV:</span>
                  <button
                    onClick={handleLoadDemoTemplate}
                    className="text-amber-400 hover:underline text-xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Carica Scheda Demo FileMaker
                  </button>
                </div>
                <textarea
                  value={importRawText}
                  onChange={e => {
                    setImportRawText(e.target.value);
                    setImportError(null);
                    setImportPreview(null);
                  }}
                  placeholder={
                    importFormat === 'JSON'
                      ? 'Incolla qui JSON FileMaker (array di esercizi con giorno, esercizio, serie, recupero)...'
                      : 'Incolla qui CSV FileMaker con intestazioni (Giorno;Gruppo;Esercizio;Serie;Reps;Recupero)...'
                  }
                  rows={4}
                  className="w-full text-xs font-mono-nums bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Parse preview button if not parsed yet */}
              {!importPreview && (
                <button
                  onClick={handleParseImport}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  Verifica & Analizza Scheda
                </button>
              )}

              {/* Import Error Message */}
              {importError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Preview */}
              {importPreview && (
                <div className="space-y-2 bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-900/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Scheda riconosciuta con successo!
                    </span>
                    <span className="text-slate-400">
                      {importPreview.length} esercizi trovati
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs text-slate-300 divide-y divide-slate-800/60">
                    {importPreview.slice(0, 10).map((ex, idx) => (
                      <div key={idx} className="pt-1 first:pt-0 flex justify-between">
                        <span className="font-medium text-white truncate max-w-[220px]">
                          G{ex.giorno}: {ex.esercizio}
                        </span>
                        <span className="text-slate-400 font-mono-nums">
                          {ex.serie_previste}s × {ex.ripetizioni_previste} ({ex.recupero_secondi}s rec.)
                        </span>
                      </div>
                    ))}
                    {importPreview.length > 10 && (
                      <p className="text-[11px] text-slate-500 pt-1 italic">
                        ...e altri {importPreview.length - 10} esercizi.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleApplyImport}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                  >
                    Conferma & Importa Scheda nell'App
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEMPLATES & SPECIFICATIONS */}
          {activeTab === 'templates' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  Campi Scheda FileMaker Riconosciuti
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  L'app mappa automaticamente i campi esportati da FileMaker sia in formato <strong>JSON</strong> che in <strong>CSV</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 block">Dati Scheda (In entrata):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px] mt-1">
                      <li>Giorno di allenamento (1..6)</li>
                      <li>Gruppo muscolare</li>
                      <li>Esercizio</li>
                      <li>Serie previste</li>
                      <li>Ripetizioni previste</li>
                      <li>Tempo recupero (sec)</li>
                      <li>Note scheda trainer</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block">Dati Atleta (In uscita):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px] mt-1">
                      <li>Data seduta (es. 2026-10-10)</li>
                      <li>Pesi per singola serie (kg)</li>
                      <li>Serie effettivamente svolte</li>
                      <li>Tempo 1ª serie Tutor (sec)</li>
                      <li>Note atleta per esercizio</li>
                      <li>Note generali della seduta</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download demo schemas */}
              <div className="space-y-2 pt-1">
                <div className="font-bold text-white text-xs">
                  Scarica Modelli FileMaker di Esempio (Pronti per il test):
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadSample('CSV')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modello FileMaker (.csv)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSample('JSON')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modello FileMaker (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
