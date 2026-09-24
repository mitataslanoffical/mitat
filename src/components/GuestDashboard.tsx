import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { OperationItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { cleanTimeString } from '../utils/formatters';
import { 
  Clock, 
  CheckCircle, 
  Users, 
  Edit3, 
  RotateCcw, 
  MapPin, 
  UserCheck, 
  Car, 
  Activity, 
  AlertCircle,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  Undo2
} from 'lucide-react';

export const GuestDashboard: React.FC = () => {
  const { 
    operations, 
    currentUser, 
    guestSetEstimatedExit, 
    guestClearEstimatedExit,
    guestSetReady, 
    guestUpdatePax,
    revertOperationToPrevious,
    resetOperationTask,
    undoActionById,
    actionLogs,
    currentTimeStr,
    viewMode,
    setViewMode
  } = useOperations();

  const [activeTab, setActiveTab] = useState<'my_patients' | 'clinic_all'>('my_patients');
  const [selectedOpForEta, setSelectedOpForEta] = useState<OperationItem | null>(null);
  const [selectedOpForPax, setSelectedOpForPax] = useState<OperationItem | null>(null);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [directTimeInput, setDirectTimeInput] = useState<string>('');
  const [paxInput, setPaxInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter 1: Guest's own assigned patients
  const myPatients = useMemo(() => {
    return operations.filter(op => {
      if (!op.guest) return false;
      const guestClean = op.guest.trim().toLowerCase();
      const currentClean = currentUser.name.trim().toLowerCase();
      return guestClean.includes(currentClean) || currentClean.includes(guestClean);
    });
  }, [operations, currentUser]);

  // Filter 2: All active patients in clinic (Status === 'klinikte' || 'hazir' || statusColor in ['sari', 'fistik_yesili'])
  const clinicPatients = useMemo(() => {
    return operations
      .filter(op => op.status === 'klinikte' || op.status === 'hazir' || op.statusColor === 'sari' || op.statusColor === 'fistik_yesili')
      .sort((a, b) => {
        // Sort ascending by estimatedExitTime
        if (a.estimatedExitTime && b.estimatedExitTime) {
          return a.estimatedExitTime.localeCompare(b.estimatedExitTime);
        }
        if (a.estimatedExitTime) return -1;
        if (b.estimatedExitTime) return 1;
        return a.pickupTime.localeCompare(b.pickupTime);
      });
  }, [operations]);

  const displayedList = useMemo(() => {
    const list = activeTab === 'my_patients' ? myPatients : clinicPatients;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(op => 
      op.patientName.toLowerCase().includes(q) ||
      op.pickupLocation.toLowerCase().includes(q) ||
      op.procedure.toLowerCase().includes(q) ||
      op.driver.toLowerCase().includes(q) ||
      op.guest.toLowerCase().includes(q)
    );
  }, [activeTab, myPatients, clinicPatients, searchQuery]);

  // Helper to calculate exact clock time by adding minutes to reference time
  const calculateExactTime = (minutesToAdd: number): string => {
    const now = new Date();
    const targetDate = new Date(now.getTime() + minutesToAdd * 60000);
    const h = String(targetDate.getHours()).padStart(2, '0');
    const m = String(targetDate.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleApplyEtaPreset = (minutes: number) => {
    if (!selectedOpForEta) return;
    const calculated = calculateExactTime(minutes);
    guestSetEstimatedExit(selectedOpForEta.appId, calculated);
    setSelectedOpForEta(null);
  };

  const handleApplyDirectTime = () => {
    if (!selectedOpForEta || !directTimeInput) return;
    guestSetEstimatedExit(selectedOpForEta.appId, directTimeInput);
    setSelectedOpForEta(null);
  };

  const handleSavePax = () => {
    if (!selectedOpForPax) return;
    guestUpdatePax(selectedOpForPax.appId, paxInput);
    setSelectedOpForPax(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Profile Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-lg shadow-inner">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Guest Danışmanı
                </span>
                <span className="text-xs text-slate-400 font-mono">Canlı Saat: {currentTimeStr}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {currentUser.name}
              </h1>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-2xl text-center">
              <span className="text-xs text-slate-400 block font-medium">Benim Hastalarım</span>
              <span className="text-lg font-bold text-white">{myPatients.length}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl text-center">
              <span className="text-xs text-amber-300 block font-medium">Klinikte Aktif</span>
              <span className="text-lg font-bold text-amber-400">{clinicPatients.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('my_patients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'my_patients'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Benim Hastalarım ({myPatients.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clinic_all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'clinic_all'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Klinikteki Tüm Hastalar ({clinicPatients.length})</span>
            </button>
          </div>

          {/* Search and View Mode */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Hasta, otel veya işlem ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full sm:w-56"
            />
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-slate-800 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Liste Görünümü"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {displayedList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">Kayıt Bulunamadı</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {activeTab === 'my_patients'
              ? 'Şu anda adınıza atanmış hasta bulunmuyor veya arama kriterine uygun sonuç yok.'
              : 'Şu anda klinikte aktif olan hasta bulunmuyor.'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedList.map(op => {
            const isMyPatient = op.guest?.toLowerCase().includes(currentUser.name.toLowerCase());
            const isInClinic = op.status === 'klinikte' || op.statusColor === 'sari';
            const isReady = op.isReady || op.statusColor === 'fistik_yesili';

            return (
              <div
                key={op.appId}
                className={`rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden ${
                  isReady
                    ? 'bg-lime-950/20 border-lime-500/50 shadow-lg shadow-lime-950/30'
                    : isInClinic
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Visual accent top line */}
                {isReady && <div className="absolute top-0 left-0 right-0 h-1 bg-lime-400" />}
                {isInClinic && !isReady && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />}

                <div>
                  {/* Top Status & Times */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge
                      status={op.status}
                      statusColor={op.statusColor}
                      isReady={op.isReady}
                      estimatedExitTime={op.estimatedExitTime}
                    />
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-mono">Alınış: {cleanTimeString(op.pickupTime) || '-'}</span>
                      {op.dropTime && <span className="text-[11px] text-slate-500 font-mono">Bırakılış: {cleanTimeString(op.dropTime)}</span>}
                    </div>
                  </div>

                  {/* Patient Name & Operation Type */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                      {op.patientName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {op.operationType}
                      </span>
                      {op.procedure && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-medium truncate max-w-[200px]">
                          {op.procedure}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate" title={op.pickupLocation}>{op.pickupLocation || 'Konum Yok'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate" title={op.driver}>{op.driver || 'Şoför Yok'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className={`truncate ${isMyPatient ? 'text-teal-300 font-bold' : 'text-slate-400'}`}>
                        {op.guest || 'Guest Yok'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-200">{op.pax || '1 PAX'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOpForPax(op);
                          setPaxInput(op.pax || '1');
                        }}
                        className="text-[11px] text-teal-400 hover:underline flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" /> Değiştir
                      </button>
                    </div>
                  </div>

                  {/* Estimated exit summary */}
                  {op.estimatedExitTime && (
                    <div className="mb-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300">Tahmini Çıkış:</span>
                        <span className="text-white font-mono font-bold text-sm">{op.estimatedExitTime}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {op.estimatedExitTime <= currentTimeStr ? 'Saat doldu' : 'Bekleniyor'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Action Controls */}
                <div className="border-t border-slate-800/80 pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* ETA Button */}
                    <button
                      onClick={() => {
                        setSelectedOpForEta(op);
                        setDirectTimeInput(op.estimatedExitTime || '');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-semibold text-xs sm:text-sm transition-all border border-slate-700"
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>{op.estimatedExitTime ? `Çıkış: ${op.estimatedExitTime}` : 'Tahmini Çıkış Gir'}</span>
                    </button>

                    {/* READY Button */}
                    <button
                      onClick={() => guestSetReady(op.appId, !op.isReady)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
                        op.isReady
                          ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50'
                          : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-lime-500/20'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{op.isReady ? 'HAZIR İPTAL ET' : 'HAZIR YAP'}</span>
                    </button>
                  </div>

                  {/* Zamansız Geri Alma ve Görevi Sıfırlama Butonları */}
                  {(op.status !== 'bekliyor' || op.estimatedExitTime || op.isReady || op.lastAction) && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => revertOperationToPrevious(op.appId)}
                        className="flex-1 py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        title="Önceki adıma geri al"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Geri Al</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`${op.patientName} görevini tamamen sıfırlayıp başa almak istediğinize emin misiniz?`)) {
                            resetOperationTask(op.appId);
                          }
                        }}
                        className="flex-1 py-1.5 px-2 bg-rose-500/15 hover:bg-rose-500/25 active:scale-98 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        title="Tüm klinik ve transfer adımlarını başa sıfırla"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Görevi Sıfırla</span>
                      </button>
                    </div>
                  )}

                  {/* Last Action Note */}
                  {op.lastAction && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span className="truncate">Son: {op.lastAction} ({op.lastActionTime || ''})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SPREADSHEET-LIKE LIST VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4">Hasta Adı</th>
                  <th className="py-3.5 px-4">PAX</th>
                  <th className="py-3.5 px-4">Alınış / Hedef</th>
                  <th className="py-3.5 px-4">Şoför</th>
                  <th className="py-3.5 px-4">Guest</th>
                  <th className="py-3.5 px-4">Tahmini Çıkış</th>
                  <th className="py-3.5 px-4 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedList.map(op => {
                  const isReady = op.isReady || op.statusColor === 'fistik_yesili';
                  const isInClinic = op.status === 'klinikte' || op.statusColor === 'sari';

                  return (
                    <tr
                      key={op.appId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isReady ? 'bg-lime-950/15' : isInClinic ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge
                          status={op.status}
                          statusColor={op.statusColor}
                          isReady={op.isReady}
                          size="sm"
                          showDetail={false}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{op.patientName}</div>
                        <div className="text-[11px] text-slate-400">{op.procedure || op.operationType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedOpForPax(op);
                            setPaxInput(op.pax || '1');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-mono text-xs flex items-center gap-1"
                        >
                          <span>{op.pax || '1'}</span>
                          <Edit3 className="w-2.5 h-2.5 text-teal-400" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 truncate max-w-[160px]">{op.pickupLocation}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">→ {op.dropLocation}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {op.driver || 'Atama Yok'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${op.guest?.toLowerCase().includes(currentUser.name.toLowerCase()) ? 'text-teal-300' : 'text-slate-400'}`}>
                          {op.guest || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {op.estimatedExitTime ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                            {op.estimatedExitTime}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOpForEta(op);
                              setDirectTimeInput(op.estimatedExitTime || '');
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Tahmini Çıkış Gir"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Saat</span>
                          </button>
                          <button
                            onClick={() => guestSetReady(op.appId, !op.isReady)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              op.isReady
                                ? 'bg-slate-800 text-rose-300 border border-rose-900/50'
                                : 'bg-lime-400 text-slate-950 shadow-md'
                            }`}
                          >
                            {op.isReady ? 'İptal' : 'HAZIR'}
                          </button>
                          {(op.status !== 'bekliyor' || op.estimatedExitTime || op.isReady || op.lastAction) && (
                            <button
                              onClick={() => revertOperationToPrevious(op.appId)}
                              className="p-2 bg-slate-800 hover:bg-amber-950/60 text-amber-300 rounded-xl text-xs border border-slate-700 hover:border-amber-500/40 transition-colors cursor-pointer"
                              title="Önceki Adıma Geri Al"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`${op.patientName} görevini başa sıfırlamak istediğinize emin misiniz?`)) {
                                resetOperationTask(op.appId);
                              }
                            }}
                            className="p-2 bg-slate-800 hover:bg-rose-950/60 text-rose-300 rounded-xl text-xs border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                            title="Görevi Başa Sıfırla"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TAHMİNİ ÇIKIŞ AYARLAMA POPUP */}
      {selectedOpForEta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Tahmini Çıkış Saati</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedOpForEta.patientName}</h3>
                <p className="text-xs text-slate-400">Şu anki saat: <span className="font-mono text-white font-bold">{currentTimeStr}</span></p>
              </div>
              <button
                onClick={() => setSelectedOpForEta(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick preset buttons (15m, 30m, 45m, 1h) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">Hızlı Dakika Seçenekleri (Otomatik Saat Hesaplanır):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '+15 dk', mins: 15 },
                  { label: '+30 dk', mins: 30 },
                  { label: '+45 dk', mins: 45 },
                  { label: '+1 Saat', mins: 60 }
                ].map(preset => {
                  const previewTime = calculateExactTime(preset.mins);
                  return (
                    <button
                      key={preset.mins}
                      onClick={() => handleApplyEtaPreset(preset.mins)}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-200 border border-slate-700 font-bold transition-all text-center group active:scale-95"
                    >
                      <span className="block text-sm">{preset.label}</span>
                      <span className="block text-[11px] font-mono text-amber-300 group-hover:text-white font-normal mt-0.5">
                        ({previewTime})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct exact time input */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <label className="text-xs font-medium text-slate-300 block">Veya Net Saat Gir (HH:mm):</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={directTimeInput}
                  onChange={e => setDirectTimeInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleApplyDirectTime}
                  disabled={!directTimeInput}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  Kaydet
                </button>
              </div>
            </div>

            {/* Custom Minutes Input */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <label className="text-xs font-medium text-slate-300 block">Özel Dakika Ekle:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="360"
                  step="5"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(Number(e.target.value))}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => handleApplyEtaPreset(customMinutes)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <span>+{customMinutes} dk Ekle</span>
                  <span className="font-mono text-amber-300">({calculateExactTime(customMinutes)})</span>
                </button>
              </div>
            </div>

            {/* Çıkış Saatini Sıfırla / Kaldır veya Görevi Sıfırla */}
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2">
              {selectedOpForEta.estimatedExitTime ? (
                <button
                  type="button"
                  onClick={() => {
                    guestClearEstimatedExit(selectedOpForEta.appId);
                    setSelectedOpForEta(null);
                  }}
                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Çıkış Saatini Sıfırla (Kaldır)</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">Çıkış saati girilmemiş</span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`${selectedOpForEta.patientName} görevini başa sıfırlamak istediğinize emin misiniz?`)) {
                    resetOperationTask(selectedOpForEta.appId);
                    setSelectedOpForEta(null);
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Görevi Başa Sıfırla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAX DÜZENLEME POPUP */}
      {selectedOpForPax && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">PAX / Kişi Sayısı</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedOpForPax.patientName}</h3>
              </div>
              <button
                onClick={() => setSelectedOpForPax(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={paxInput}
                onChange={e => setPaxInput(e.target.value)}
                placeholder="Örn: 2, 2* ref, 4 pax"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-semibold text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedOpForPax(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSavePax}
                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
