import React, { useEffect, useState } from 'react';
import { useOperations } from '../context/OperationsContext';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

export const UndoBanner: React.FC = () => {
  const { lastUndoableAction, undoLastAction, clearLastUndoBanner } = useOperations();
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    if (!lastUndoableAction) return;

    setTimeLeft(8);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          clearLastUndoBanner();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUndoableAction, clearLastUndoBanner]);

  if (!lastUndoableAction) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/80 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">İşlem Kaydedildi</p>
            <p className="text-sm font-semibold truncate text-slate-100">
              <span className="text-emerald-300 font-bold">{lastUndoableAction.patientName}:</span> {lastUndoableAction.action}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={undoLastAction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4 animate-spin-reverse" />
            <span>GERİ AL ({timeLeft}s)</span>
          </button>
          <button
            onClick={clearLastUndoBanner}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
