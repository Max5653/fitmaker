/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, FileMakerExerciseTemplate, ExerciseSessionLog } from './types/workout';
import {
  getTemplates,
  saveTemplates,
  getSessions,
  saveSession,
  deleteSession,
  createSessionForDay,
} from './services/storage';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { SessionEditor } from './components/SessionEditor';
import { TutorModal } from './components/TutorModal';
import { FileMakerModal } from './components/FileMakerModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [templates, setTemplates] = useState<FileMakerExerciseTemplate[]>(() => getTemplates());
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => getSessions());

  // Date selection in Calendar
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Active workout session being viewed/edited
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Tutor modal state
  const [tutorExercise, setTutorExercise] = useState<ExerciseSessionLog | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // FileMaker modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<'import' | 'export' | 'templates'>('export');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Compute number of distinct days in current imported template
  const availableDaysCount = useMemo(() => {
    return new Set(templates.map(t => t.giorno)).size;
  }, [templates]);

  // Handle template import from FileMaker
  const handleImportTemplates = (newTemplates: FileMakerExerciseTemplate[]) => {
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    showToast(`Scheda FileMaker importata con successo (${newTemplates.length} esercizi)!`);
  };

  // Open existing session
  const handleOpenSession = (session: WorkoutSession) => {
    setActiveSession(session);
    setSelectedDate(session.data_seduta);
  };

  // Create new session for date and chosen day
  const handleCreateSession = (dateStr: string, giorno: number) => {
    const newSession = createSessionForDay(dateStr, giorno);
    saveSession(newSession);
    setSessions(getSessions());
    setActiveSession(newSession);
    showToast(`Seduta creata per il ${dateStr} (Giorno ${giorno})`);
  };

  // Save session updates
  const handleSaveSession = (updatedSession: WorkoutSession) => {
    saveSession(updatedSession);
    setSessions(getSessions());
    setActiveSession(updatedSession);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa seduta?')) {
      deleteSession(sessionId);
      setSessions(getSessions());
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      showToast('Seduta eliminata.');
    }
  };

  // Launch Tutor modal
  const handleOpenTutor = (exercise: ExerciseSessionLog) => {
    setTutorExercise(exercise);
    setIsTutorOpen(true);
  };

  // Finish Tutor for first set of exercise
  const handleFinishTutorFirstSet = (executionDurationSec: number) => {
    if (!activeSession || !tutorExercise) return;

    const nextExercises = activeSession.esercizi.map(ex => {
      if (ex.template_id === tutorExercise.template_id) {
        const nextSets = [...ex.dettagli_serie];
        if (nextSets.length > 0) {
          nextSets[0] = {
            ...nextSets[0],
            completata: true,
          };
        }
        return {
          ...ex,
          tutor_completato: true,
          tempo_esecuzione_prima_serie_sec: executionDurationSec,
          dettagli_serie: nextSets,
        };
      }
      return ex;
    });

    const updatedSession: WorkoutSession = {
      ...activeSession,
      esercizi: nextExercises,
    };

    handleSaveSession(updatedSession);
    showToast(`Tutor completato: prima serie registrata in ${executionDurationSec}s!`);
  };

  // Open sync modal
  const handleOpenSyncModal = (initialTab: 'import' | 'export' = 'export') => {
    setSyncModalTab(initialTab);
    setIsSyncModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenSyncModal={handleOpenSyncModal}
        templateCount={templates.length}
        availableDaysCount={availableDaysCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5">
        {activeSession ? (
          <SessionEditor
            session={activeSession}
            onSaveSession={handleSaveSession}
            onBack={() => setActiveSession(null)}
            onOpenTutor={handleOpenTutor}
            onExportCurrentSession={() => handleOpenSyncModal('export')}
          />
        ) : (
          <CalendarView
            sessions={sessions}
            templates={templates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenSession={handleOpenSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onExportSession={session => {
              setActiveSession(session);
              handleOpenSyncModal('export');
            }}
          />
        )}
      </main>

      {/* Tutor Modal for Exercise First Set */}
      <TutorModal
        exercise={tutorExercise}
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        onFinishTutorFirstSet={handleFinishTutorFirstSet}
      />

      {/* FileMaker Import / Export Hub Modal */}
      <FileMakerModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        initialTab={syncModalTab}
        onImportTemplates={handleImportTemplates}
        allSessions={sessions}
        activeSessionId={activeSession?.id}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl shadow-amber-500/20 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
