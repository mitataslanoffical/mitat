import React, { useState } from 'react';
import { useOperations } from '../context/OperationsContext';
import { History, RotateCcw, Search, CheckCircle2, User, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ActionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionLogModal: React.FC<ActionLogModalProps> = ({ isOpen, onClose }) => {
  const { actionLogs, undoActionById } = useOperations();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLogs = actionLogs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.patientName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userRole.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                İşlem Geçmişi & Denetim Günlüğü (ACTION_LOG)
              </h2>
              <p className="text-xs text-slate-400">
                Tüm şoför ve guest hareketleri, zaman damgaları ve geri alma geçmişi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Hasta adı, işlem veya kullanıcı ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Henüz kaydedilmiş bir işlem yok.</p>
              <p className="text-xs text-slate-500 mt-1">Şoförler veya Guestler işlem yaptıkça burada listelenecektir.</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{log.patientName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[11px] font-semibold">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <b className="text-slate-300">{log.userName}</b> ({log.userRole})
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {log.timestamp}
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      {log.details}
                    </p>
                  )}
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      if (window.confirm(`"${log.action}" işlemini geri almak istediğinize emin misiniz?`)) {
                        undoActionById(log.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Bu İşlemi Geri Al</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Ana Google Sheets operasyon sayfası teknik log kolonlarıyla şişirilmez.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
