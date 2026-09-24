import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { OperationItem, OperationStatus, StatusColor } from '../types';
import { StatusBadge } from './StatusBadge';
import { cleanTimeString } from '../utils/formatters';
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Plane, 
  Building2, 
  Check, 
  AlertCircle,
  LayoutGrid,
  List,
  Navigation,
  Sparkles,
  RotateCcw,
  Undo2
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { 
    operations, 
    currentUser, 
    driverPerformAction,
    revertOperationToPrevious,
    resetOperationTask,
    viewMode,
    setViewMode,
    currentTimeStr
  } = useOperations();

  const [filterMyJobsOnly, setFilterMyJobsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to determine operation category for contextual buttons
  const getOpCategory = (op: OperationItem): 'klinik_gelis' | 'klinik_donus' | 'havalimani_gelis' | 'havalimani_gidis' => {
    const typeClean = op.operationType.toLowerCase();
    const pickClean = op.pickupLocation.toLowerCase();
    const dropClean = op.dropLocation.toLowerCase();

    if (typeClean.includes('yeni geliş') || pickClean.includes('ayt') || pickClean.includes('xq') || pickClean.includes('ls')) {
      return 'havalimani_gelis';
    }
    if (typeClean.includes('gidiş') || dropClean.includes('ayt') || dropClean.includes('xq') || dropClean.includes('ls') || dropClean.includes('havaliman')) {
      return 'havalimani_gidis';
    }
    if (op.status === 'klinikte' || op.status === 'hazir' || dropClean.includes('otel') || dropClean.includes('hotel')) {
      return 'klinik_donus';
    }
    return 'klinik_gelis';
  };

  // Helper to check if the job belongs to currently logged-in driver
  const isMyJob = (op: OperationItem): boolean => {
    if (!op.driver) return false;
    const driverClean = op.driver.trim().toLowerCase();
    const userClean = currentUser.name.trim().toLowerCase();
    return driverClean.includes(userClean) || userClean.includes(driverClean);
  };

  // 1. KLİNİKTE OLANLAR (Tüm klinikte olanlar veya atanmışlar, tahmini çıkışa göre sıralı)
  const clinicSection = useMemo(() => {
    return operations
      .filter(op => op.status === 'klinikte' || op.status === 'hazir' || op.statusColor === 'sari' || op.statusColor === 'fistik_yesili')
      .sort((a, b) => {
        if (a.estimatedExitTime && b.estimatedExitTime) {
          return a.estimatedExitTime.localeCompare(b.estimatedExitTime);
        }
        if (a.estimatedExitTime) return -1;
        if (b.estimatedExitTime) return 1;
        return a.pickupTime.localeCompare(b.pickupTime);
      });
  }, [operations]);

  // 2. GELECEK HASTALAR (Henüz kliniğe/otele ulaşmamış bekleyen ve yoldaki transferler)
  const upcomingSection = useMemo(() => {
    return operations.filter(op => {
      const isNotDone = op.status !== 'tamamlandi' && op.status !== 'donus_alindi' && op.statusColor !== 'kirmizi';
      const isNotInClinic = op.status !== 'klinikte' && op.status !== 'hazir';
      return isNotDone && isNotInClinic;
    }).sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
  }, [operations]);

  // 3. İŞLEMİ BİTENLER (Tamamlanmış transferler)
  const completedSection = useMemo(() => {
    return operations.filter(op => {
      return op.status === 'tamamlandi' || op.status === 'donus_alindi' || op.statusColor === 'kirmizi';
    });
  }, [operations]);

  // Filter helper based on search and "Sadece Benim Görevlerim"
  const filterList = (list: OperationItem[]) => {
    return list.filter(op => {
      if (filterMyJobsOnly && !isMyJob(op)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        op.patientName.toLowerCase().includes(q) ||
        op.pickupLocation.toLowerCase().includes(q) ||
        op.dropLocation.toLowerCase().includes(q) ||
        op.driver.toLowerCase().includes(q) ||
        op.procedure.toLowerCase().includes(q)
      );
    });
  };

  const filteredClinic = filterList(clinicSection);
  const filteredUpcoming = filterList(upcomingSection);
  const filteredCompleted = filterList(completedSection);

  // Smart Contextual Action Button Renderer
  const renderActionButtons = (op: OperationItem) => {
    const category = getOpCategory(op);
    const { status } = op;
    let forwardBtn: React.ReactNode = null;

    // 1. KLİNİK GELİŞ TRANSFERİ: Otel -> Klinik
    if (category === 'klinik_gelis') {
      if (status === 'bekliyor') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Otelden Alındı', 'alindi', 'mavi')}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2"
          >
            <Car className="w-5 h-5" />
            <span>OTELDEN ALINDI</span>
          </button>
        );
      } else if (status === 'alindi') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Kliniğe Bırakıldı', 'klinikte', 'sari')}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            <span>KLİNİĞE BIRAKILDI (SARI)</span>
          </button>
        );
      }
    }

    // 2. KLİNİK DÖNÜŞ TRANSFERİ: Klinik -> Otel
    if (category === 'klinik_donus' || status === 'klinikte' || status === 'hazir') {
      if (status === 'klinikte' || status === 'hazir') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Klinikten Alındı (Dönüş)', 'donus_alindi', 'kirmizi')}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
          >
            <Car className="w-5 h-5" />
            <span>KLİNİKTEN ALINDI (KIRMIZI)</span>
          </button>
        );
      } else if (status === 'donus_alindi') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Otele Bırakıldı', 'tamamlandi', 'kirmizi')}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>OTELE BIRAKILDI (BİTTİ)</span>
          </button>
        );
      }
    }

    // 3. HAVAALANI GELİŞ: Havalimanı -> Otel
    if (category === 'havalimani_gelis') {
      if (status === 'bekliyor') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Havaalanından Alındı', 'alindi', 'mavi')}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2"
          >
            <Plane className="w-5 h-5" />
            <span>HAVAALANINDAN ALINDI</span>
          </button>
        );
      } else if (status === 'alindi') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Otele Bırakıldı', 'tamamlandi', 'kirmizi')}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            <span>OTELE BIRAKILDI (KIRMIZI)</span>
          </button>
        );
      }
    }

    // 4. HAVAALANI GİDİŞ: Otel -> Havalimanı
    if (category === 'havalimani_gidis') {
      if (status === 'bekliyor') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Otelden Alındı (Havalimanı Transfer)', 'alindi', 'mavi')}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2"
          >
            <Car className="w-5 h-5" />
            <span>OTELDEN ALINDI</span>
          </button>
        );
      } else if (status === 'alindi') {
        forwardBtn = (
          <button
            onClick={() => driverPerformAction(op.appId, 'Havaalanına Bırakıldı', 'tamamlandi', 'kirmizi')}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
          >
            <Plane className="w-5 h-5" />
            <span>HAVAALANINA BIRAKILDI (BİTTİ)</span>
          </button>
        );
      }
    }

    // If no forward button, show completed tag
    if (!forwardBtn) {
      forwardBtn = (
        <div className="py-2.5 px-4 bg-slate-800/80 rounded-2xl text-center text-xs text-slate-300 font-semibold border border-slate-700/60">
          Durum: {op.lastAction || 'Tamamlandı'}
        </div>
      );
    }

    const canRevert = op.status !== 'bekliyor' || !!op.lastAction;

    return (
      <div className="space-y-2">
        {forwardBtn}

        {/* Zamansız Geri Alma ve Görevi Sıfırlama Butonları */}
        {canRevert && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => revertOperationToPrevious(op.appId)}
              className="flex-1 py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              title="Bir önceki duruma geri dön (Örn: Otelden Alındı ise Bekliyor yap)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {op.status === 'alindi'
                  ? 'Geri Al (Alınmadı / Bekliyor Yap)'
                  : op.status === 'klinikte'
                  ? 'Geri Al (Araca / Yola Al)'
                  : op.status === 'donus_alindi'
                  ? 'Geri Al (Kliniğe Döndür)'
                  : 'Önceki Adıma Geri Al'}
              </span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`${op.patientName} görevini tamamen sıfırlayıp başa almak istediğinize emin misiniz?`)) {
                  resetOperationTask(op.appId);
                }
              }}
              className="py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 active:scale-98 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              title="Görevi tamamen sıfırla ve başa al"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Görevi Sıfırla</span>
              <span className="sm:hidden">Sıfırla</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Driver Header & Quick Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Şoför Paneli
                </span>
                <span className="text-xs text-slate-400 font-mono">Saat: {currentTimeStr}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {currentUser.name}
              </h1>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMyJobsOnly(!filterMyJobsOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMyJobsOnly
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{filterMyJobsOnly ? 'Sadece Benim Görevlerim' : 'Tüm Görevler'}</span>
            </button>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-amber-400' : 'text-slate-500'}`}
                title="Liste Görünümü"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <input
            type="text"
            placeholder="Hasta adı, otel veya şoför ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* SINGLE SCREEN WITH 3 CORE SECTIONS */}

      {/* SECTION 1: KLİNİKTE OLANLAR (Aktif Klinikte & Çıkış Yaklaşanlar) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              1. KLİNİKTE OLAN HASTALAR
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
              {filteredClinic.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Tahmini çıkışa göre sıralı</span>
        </div>

        {filteredClinic.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-center text-slate-500 text-sm">
            Klinikte şu an aktif hasta bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredClinic.map(op => {
              const mine = isMyJob(op);
              const ready = op.isReady || op.statusColor === 'fistik_yesili';

              return (
                <div
                  key={op.appId}
                  className={`rounded-3xl border p-4 sm:p-5 transition-all shadow-md ${
                    ready
                      ? 'bg-lime-950/30 border-lime-500/60 shadow-lime-950/40 ring-1 ring-lime-500/30'
                      : mine
                      ? 'bg-slate-900 border-amber-500/50 shadow-amber-950/20'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          status={op.status}
                          statusColor={op.statusColor}
                          isReady={op.isReady}
                          estimatedExitTime={op.estimatedExitTime}
                        />
                        {mine && (
                          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-bold text-[11px] rounded-md">
                            GÖREVİM
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1.5">{op.patientName}</h3>
                    </div>

                    <div className="text-right">
                      {op.estimatedExitTime ? (
                        <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 block uppercase">Tahmini Çıkış</span>
                          <span className="text-base font-bold font-mono text-amber-300">{op.estimatedExitTime}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Saat belirtilmedi</span>
                      )}
                    </div>
                  </div>

                  {/* Route & Pax Details */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5 my-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold text-white truncate">{op.pickupLocation}</span>
                      </div>
                      <span className="text-slate-400 font-mono">PAX: <b className="text-white">{op.pax || '1'}</b></span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Şoför: <b className="text-slate-200">{op.driver}</b></span>
                      <span>Guest: <b className="text-teal-300">{op.guest}</b></span>
                    </div>
                  </div>

                  {/* Smart Action Buttons (Big for mobile touch) */}
                  <div className="mt-2">
                    {renderActionButtons(op)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: GELECEK HASTALAR (Bekleyen ve Alınan Yaklaşan Transferler) */}
      <section className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              2. GELECEK HASTALAR / TRANSFERLER
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs">
              {filteredUpcoming.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Alınış saatine göre sıralı</span>
        </div>

        {filteredUpcoming.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-center text-slate-500 text-sm">
            Yaklaşan bekleyen transfer bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredUpcoming.map(op => {
              const mine = isMyJob(op);
              const onTheWay = op.status === 'alindi';

              return (
                <div
                  key={op.appId}
                  className={`rounded-3xl border p-4 sm:p-5 transition-all shadow-md ${
                    onTheWay
                      ? 'bg-sky-950/20 border-sky-500/50 ring-1 ring-sky-500/30'
                      : mine
                      ? 'bg-slate-900 border-teal-500/50'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-teal-300">
                          {cleanTimeString(op.pickupTime) || '-'}
                        </span>
                        <StatusBadge
                          status={op.status}
                          statusColor={op.statusColor}
                          size="sm"
                        />
                        {mine && (
                          <span className="px-2 py-0.5 bg-teal-400 text-slate-950 font-bold text-[11px] rounded-md">
                            GÖREVİM
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-2">{op.patientName}</h3>
                      <p className="text-xs text-slate-400">{op.procedure || op.operationType}</p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <span>PAX: <b className="text-white font-mono">{op.pax || '1'}</b></span>
                    </div>
                  </div>

                  {/* Route points */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5 my-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="font-semibold text-white truncate">Alınış: {op.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                      <span className="text-slate-300 truncate">Bırakılış: {op.dropLocation}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60 text-[11px]">
                      <span>Şoför: <b className="text-slate-200">{op.driver}</b></span>
                      <span>Guest: <b className="text-teal-300">{op.guest}</b></span>
                    </div>
                  </div>

                  {/* Big Touch Action Button */}
                  <div className="mt-2">
                    {renderActionButtons(op)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: İŞLEMİ BİTENLER */}
      <section className="space-y-3 pt-4 border-t border-slate-800">
        <details className="group">
          <summary className="cursor-pointer flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-300">
                3. İŞLEMİ BİTENLER / TAMAMLANANLAR
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs">
                {filteredCompleted.length}
              </span>
            </div>
            <span className="text-xs text-slate-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>

          <div className="grid grid-cols-1 gap-2 mt-3">
            {filteredCompleted.map(op => (
              <div
                key={op.appId}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{op.patientName}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900/60 text-[10px] font-bold">
                      {op.lastAction || 'Tamamlandı'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs mt-0.5 block">{op.pickupLocation} → {op.dropLocation}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="text-[11px] font-mono text-slate-500 mr-1">{op.lastActionTime}</span>
                  <button
                    onClick={() => revertOperationToPrevious(op.appId)}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    title="Teslimatı geri al (Araçta / Yolda yap)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Geri Al</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`${op.patientName} görevini başa sıfırlamak istediğinize emin misiniz?`)) {
                        resetOperationTask(op.appId);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    title="Görevi başa sıfırla"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Sıfırla</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
};
