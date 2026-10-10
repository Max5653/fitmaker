import React, { useState, useEffect } from 'react';
import { Dumbbell, Database, Moon, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { audioTimer } from '../services/audioTimer';

interface HeaderProps {
  onOpenSyncModal: (initialTab?: 'import' | 'export') => void;
  templateCount: number;
  availableDaysCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSyncModal,
  templateCount,
  availableDaysCount,
}) => {
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const toggleWakeLock = async () => {
    // Also unlock audio context on this touch
    audioTimer.unlockAudio();

    if (wakeLockActive) {
      audioTimer.releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const ok = await audioTimer.requestWakeLock();
      if (ok) {
        setWakeLockActive(true);
      }
    }
  };

  useEffect(() => {
    // Request notification permission once early
    audioTimer.requestNotificationPermission();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Dumbbell className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                FitMaker
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  FM Sync
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">
              Scheda: <strong className="text-slate-300">{availableDaysCount} Giorni</strong> ({templateCount} es.)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Wake Lock Screen On Button */}
          <button
            onClick={toggleWakeLock}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              wakeLockActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title={wakeLockActive ? 'Schermo sempre attivo (attivo)' : 'Mantieni schermo acceso durante l allenamento'}
          >
            {wakeLockActive ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline">Schermo On</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Schermo</span>
              </>
            )}
          </button>

          {/* FileMaker Hub Button */}
          <button
            onClick={() => onOpenSyncModal('export')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition active:scale-95"
            title="Importa o Esporta per Filemaker (JSON / CSV)"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>FileMaker</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
