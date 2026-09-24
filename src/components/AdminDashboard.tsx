import React, { useState, useMemo } from 'react';
import { useOperations } from '../context/OperationsContext';
import { OperationItem, OperationStatus, StatusColor, TableColumnKey } from '../types';
import { StatusBadge } from './StatusBadge';
import { ColumnManager } from './ColumnManager';
import { cleanTimeString } from '../utils/formatters';
import { 
  Users, 
  Clock, 
  Car, 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Download, 
  Upload, 
  Layers,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Edit2,
  Check,
  X,
  Monitor,
  LayoutGrid,
  Undo2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    operations, 
    currentUser, 
    actionLogs, 
    currentTimeStr,
    guestSetEstimatedExit,
    guestSetReady,
    guestUpdatePax,
    driverPerformAction,
    updateOperationField,
    resetOperationTask,
    revertOperationToPrevious,
    addNewPatient,
    undoActionById,
    columnVisibility,
    setColumnVisibility,
    resetColumnVisibility,
    columnOrder,
    setColumnOrder,
    moveColumn,
    resetColumnOrder,
    isCompactTable,
    setIsCompactTable,
    applyFitToScreenPreset,
    isUltraWide,
    setIsUltraWide,
    isSyncing,
    syncWithGoogleSheets,
    lastSyncTime,
    lastSyncSecondsAgo,
    syncPingMs,
    sheetConfig,
    toggleLiveSyncInterval,
    toggleLiveSimulation,
    isGoogleConnected,
    googleUser,
    syncError,
    setIsSheetsModalOpen
  } = useOperations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('ALL');
  const [selectedGuestFilter, setSelectedGuestFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedOpTypeFilter, setSelectedOpTypeFilter] = useState('ALL');

  // Quick Inline Edit State
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{
    estimatedExitTime?: string;
    pax?: string;
    driver?: string;
    guest?: string;
  }>({});

  // Add Patient Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Partial<OperationItem>>({
    operationType: 'Klinik İşlemi',
    patientName: '',
    pax: '1',
    pickupTime: '09:00',
    dropTime: '',
    pickupLocation: 'Otel',
    dropLocation: 'SMILES CLINIC',
    driver: 'OSMAN BEY',
    procedure: 'KONTROL',
    guest: 'Furkan Yılmaz',
    doctor: 'DT.MELDA ESRA DÖNMEZ',
    agent: 'Mert Sezer'
  });

  // 1. Prominent Section: KLİNİKTEKİ HASTALAR (Ascending by estimatedExitTime)
  const clinicPatients = useMemo(() => {
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

  // Unique Lists for Dropdown Filters
  const uniqueDrivers = useMemo(() => {
    const list = Array.from(new Set(operations.map(o => o.driver).filter(Boolean)));
    return list.sort();
  }, [operations]);

  const uniqueGuests = useMemo(() => {
    const list = Array.from(new Set(operations.map(o => o.guest).filter(Boolean)));
    return list.sort();
  }, [operations]);

  const uniqueOpTypes = useMemo(() => {
    const list = Array.from(new Set(operations.map(o => o.operationType).filter(Boolean)));
    return list.sort();
  }, [operations]);

  // 2. Full Operations Table Filtering
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      // Driver filter
      if (selectedDriverFilter !== 'ALL' && op.driver !== selectedDriverFilter) return false;
      // Guest filter
      if (selectedGuestFilter !== 'ALL' && op.guest !== selectedGuestFilter) return false;
      // Op Type filter
      if (selectedOpTypeFilter !== 'ALL' && op.operationType !== selectedOpTypeFilter) return false;
      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'klinikte' && op.status !== 'klinikte' && op.status !== 'hazir') return false;
        if (selectedStatusFilter === 'tamamlandi' && op.status !== 'tamamlandi' && op.status !== 'donus_alindi') return false;
        if (selectedStatusFilter === 'bekliyor' && op.status !== 'bekliyor' && op.status !== 'alindi') return false;
      }

      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          op.patientName.toLowerCase().includes(q) ||
          op.pickupLocation.toLowerCase().includes(q) ||
          op.dropLocation.toLowerCase().includes(q) ||
          op.driver.toLowerCase().includes(q) ||
          op.guest.toLowerCase().includes(q) ||
          op.procedure.toLowerCase().includes(q) ||
          op.doctor.toLowerCase().includes(q) ||
          op.agent.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [operations, selectedDriverFilter, selectedGuestFilter, selectedStatusFilter, selectedOpTypeFilter, searchQuery]);

  // Operational KPI counts
  const kpis = useMemo(() => {
    const total = operations.length;
    const inClinic = clinicPatients.filter(o => !o.isReady).length;
    const ready = clinicPatients.filter(o => o.isReady || o.statusColor === 'fistik_yesili').length;
    const onWay = operations.filter(o => o.status === 'alindi').length;
    const completed = operations.filter(o => o.status === 'tamamlandi' || o.status === 'donus_alindi' || o.statusColor === 'kirmizi').length;
    return { total, inClinic, ready, onWay, completed };
  }, [operations, clinicPatients]);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.patientName) {
      alert('Lütfen hasta ismini girin.');
      return;
    }
    addNewPatient(newPatientData);
    setShowAddModal(false);
    setNewPatientData({
      operationType: 'Klinik İşlemi',
      patientName: '',
      pax: '1',
      pickupTime: '09:00',
      dropTime: '',
      pickupLocation: 'Otel',
      dropLocation: 'SMILES CLINIC',
      driver: 'OSMAN BEY',
      procedure: 'KONTROL',
      guest: 'Furkan Yılmaz',
      doctor: 'DT.MELDA ESRA DÖNMEZ',
      agent: 'Mert Sezer'
    });
  };

  const handleStartInlineEdit = (op: OperationItem) => {
    setEditingAppId(op.appId);
    setInlineEditData({
      estimatedExitTime: op.estimatedExitTime || '',
      pax: op.pax || '',
      driver: op.driver || '',
      guest: op.guest || ''
    });
  };

  const handleSaveInlineEdit = (appId: string) => {
    if (inlineEditData.estimatedExitTime !== undefined) {
      guestSetEstimatedExit(appId, inlineEditData.estimatedExitTime);
    }
    if (inlineEditData.pax !== undefined) {
      guestUpdatePax(appId, inlineEditData.pax);
    }
    if (inlineEditData.driver !== undefined) {
      updateOperationField(appId, 'driver', inlineEditData.driver);
    }
    if (inlineEditData.guest !== undefined) {
      updateOperationField(appId, 'guest', inlineEditData.guest);
    }
    setEditingAppId(null);
  };

  // Sütunların güncel sıralama ve görünürlük listesi
  const visibleOrderedColumns = useMemo(() => {
    return columnOrder.filter(key => columnVisibility[key]);
  }, [columnOrder, columnVisibility]);

  const columnLabels: Record<TableColumnKey, { label: string; short: string; compactWidth: string; standardWidth: string }> = {
    index: { label: '# Sıra', short: '#', compactWidth: 'w-7 text-center', standardWidth: 'w-10 text-center' },
    status: { label: 'Durum', short: 'Durum', compactWidth: 'min-w-[105px]', standardWidth: 'min-w-[130px]' },
    patientName: { label: 'Hasta İsmi & Visit', short: 'Hasta Adı', compactWidth: 'min-w-[140px]', standardWidth: 'min-w-[180px]' },
    pax: { label: 'PAX', short: 'PAX', compactWidth: 'min-w-[45px]', standardWidth: 'min-w-[70px]' },
    pickupTime: { label: 'Alınış', short: 'Alınış', compactWidth: 'min-w-[65px]', standardWidth: 'min-w-[85px]' },
    dropTime: { label: 'Bırakılış', short: 'Bırakılış', compactWidth: 'min-w-[65px]', standardWidth: 'min-w-[85px]' },
    pickupLocation: { label: 'Alınış Yeri', short: 'Alınış Yeri', compactWidth: 'min-w-[105px] max-w-[130px]', standardWidth: 'min-w-[140px]' },
    dropLocation: { label: 'Bırakılış Yeri', short: 'Bırakılış Yeri', compactWidth: 'min-w-[105px] max-w-[130px]', standardWidth: 'min-w-[140px]' },
    driver: { label: 'Şoför', short: 'Şoför', compactWidth: 'min-w-[95px]', standardWidth: 'min-w-[130px]' },
    procedure: { label: 'İşlem / Tedavi', short: 'İşlem', compactWidth: 'min-w-[105px] max-w-[135px]', standardWidth: 'min-w-[160px]' },
    guest: { label: 'Guest', short: 'Guest', compactWidth: 'min-w-[90px]', standardWidth: 'min-w-[120px]' },
    doctor: { label: 'Doktor', short: 'Doktor', compactWidth: 'min-w-[95px]', standardWidth: 'min-w-[140px]' },
    agent: { label: 'Agent', short: 'Agent', compactWidth: 'min-w-[90px]', standardWidth: 'min-w-[120px]' },
    operationType: { label: 'Op. Tipi', short: 'Tip', compactWidth: 'min-w-[85px]', standardWidth: 'min-w-[130px]' },
    estimatedExitTime: { label: 'Tahmini Çıkış (M)', short: 'Çıkış (M)', compactWidth: 'min-w-[90px]', standardWidth: 'min-w-[110px]' },
    actions: { label: 'İşlemler', short: 'İşlem', compactWidth: 'min-w-[65px] text-right', standardWidth: 'min-w-[90px] text-right' }
  };

  const renderColumnHeader = (key: TableColumnKey, index: number, totalVisible: number) => {
    const colInfo = columnLabels[key];
    const isFirst = index === 0;
    const isLast = index === totalVisible - 1;
    const widthClass = isCompactTable ? colInfo.compactWidth : colInfo.standardWidth;

    return (
      <th
        key={key}
        className={`group py-2.5 px-2 font-bold tracking-tight select-none relative ${widthClass} ${
          isCompactTable ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="truncate" title={colInfo.label}>
            {isCompactTable ? colInfo.short : colInfo.label}
          </span>
          {/* Sütun Sırası Değiştirme Butonları */}
          <div className="flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                moveColumn(key, 'left');
              }}
              className={`p-0.5 rounded hover:bg-slate-800 transition-colors ${
                isFirst ? 'opacity-20 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-teal-300 cursor-pointer'
              }`}
              title="Sola Taşı"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                moveColumn(key, 'right');
              }}
              className={`p-0.5 rounded hover:bg-slate-800 transition-colors ${
                isLast ? 'opacity-20 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-teal-300 cursor-pointer'
              }`}
              title="Sağa Taşı"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </th>
    );
  };

  const renderCell = (key: TableColumnKey, op: OperationItem, idx: number) => {
    const isEditing = editingAppId === op.appId;
    const cellPadding = isCompactTable ? 'py-1.5 px-2' : 'py-2.5 px-3';

    switch (key) {
      case 'index':
        return (
          <td key={key} className={`${cellPadding} text-center text-slate-500 font-mono text-[10px]`}>
            {idx + 1}
          </td>
        );
      case 'status':
        return (
          <td key={key} className={`${cellPadding} whitespace-nowrap`}>
            <StatusBadge
              status={op.status}
              statusColor={op.statusColor}
              isReady={op.isReady}
              size="sm"
              showDetail={false}
            />
          </td>
        );
      case 'patientName':
        return (
          <td key={key} className={`${cellPadding} font-bold text-white whitespace-nowrap`}>
            <div className="flex items-center gap-1.5">
              <span className="truncate max-w-[160px]" title={op.patientName}>{op.patientName}</span>
              {op.justUpdated && (
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0" />
              )}
            </div>
          </td>
        );
      case 'pax':
        return (
          <td key={key} className={`${cellPadding} font-mono text-slate-300 whitespace-nowrap`}>
            {isEditing ? (
              <input
                type="text"
                value={inlineEditData.pax}
                onChange={e => setInlineEditData({ ...inlineEditData, pax: e.target.value })}
                className="w-12 bg-slate-900 border border-teal-500 rounded px-1 py-0.5 text-xs text-white"
              />
            ) : (
              op.pax || '-'
            )}
          </td>
        );
      case 'pickupTime':
        return (
          <td key={key} className={`${cellPadding} font-mono text-teal-300 font-semibold whitespace-nowrap`}>
            {cleanTimeString(op.pickupTime) || '-'}
          </td>
        );
      case 'dropTime':
        return (
          <td key={key} className={`${cellPadding} font-mono text-slate-400 whitespace-nowrap`}>
            {cleanTimeString(op.dropTime) || '-'}
          </td>
        );
      case 'pickupLocation':
        return (
          <td key={key} className={`${cellPadding} text-slate-300 truncate max-w-[130px]`} title={op.pickupLocation}>
            {op.pickupLocation}
          </td>
        );
      case 'dropLocation':
        return (
          <td key={key} className={`${cellPadding} text-slate-300 truncate max-w-[130px]`} title={op.dropLocation}>
            {op.dropLocation}
          </td>
        );
      case 'driver':
        return (
          <td key={key} className={`${cellPadding} font-semibold text-amber-200 whitespace-nowrap`}>
            {isEditing ? (
              <input
                type="text"
                value={inlineEditData.driver}
                onChange={e => setInlineEditData({ ...inlineEditData, driver: e.target.value })}
                className="w-24 bg-slate-900 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white"
              />
            ) : (
              op.driver || 'Atama Yok'
            )}
          </td>
        );
      case 'procedure':
        return (
          <td key={key} className={`${cellPadding} text-slate-300 truncate max-w-[135px]`} title={op.procedure}>
            {op.procedure || '-'}
          </td>
        );
      case 'guest':
        return (
          <td key={key} className={`${cellPadding} font-semibold text-teal-400 whitespace-nowrap`}>
            {isEditing ? (
              <input
                type="text"
                value={inlineEditData.guest}
                onChange={e => setInlineEditData({ ...inlineEditData, guest: e.target.value })}
                className="w-24 bg-slate-900 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white"
              />
            ) : (
              op.guest || '-'
            )}
          </td>
        );
      case 'doctor':
        return (
          <td key={key} className={`${cellPadding} text-slate-400 truncate max-w-[130px]`} title={op.doctor}>
            {op.doctor || '-'}
          </td>
        );
      case 'agent':
        return (
          <td key={key} className={`${cellPadding} text-slate-400 truncate max-w-[110px]`} title={op.agent}>
            {op.agent || '-'}
          </td>
        );
      case 'operationType':
        return (
          <td key={key} className={`${cellPadding} text-slate-400 whitespace-nowrap text-[10px]`}>
            {op.operationType}
          </td>
        );
      case 'estimatedExitTime':
        return (
          <td key={key} className={`${cellPadding} whitespace-nowrap font-mono`}>
            {isEditing ? (
              <input
                type="time"
                value={inlineEditData.estimatedExitTime}
                onChange={e => setInlineEditData({ ...inlineEditData, estimatedExitTime: e.target.value })}
                className="w-20 bg-slate-900 border border-teal-500 rounded px-1 py-0.5 text-xs text-white font-mono"
              />
            ) : op.estimatedExitTime ? (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-lime-300 font-bold border border-lime-500/30">
                {op.estimatedExitTime}
              </span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
          </td>
        );
      case 'actions':
        return (
          <td key={key} className={`${cellPadding} whitespace-nowrap text-right`}>
            {isEditing ? (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => handleSaveInlineEdit(op.appId)}
                  className="p-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg cursor-pointer"
                  title="Kaydet"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  onClick={() => setEditingAppId(null)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  title="İptal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                {/* 1. Önceki Duruma Geri Al */}
                {(op.status !== 'bekliyor' || op.estimatedExitTime) && (
                  <button
                    onClick={() => revertOperationToPrevious(op.appId)}
                    className="p-1.5 bg-slate-900 hover:bg-amber-950/60 text-amber-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer border border-slate-800 hover:border-amber-500/40"
                    title="Önceki Adıma Geri Al"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 2. Görevi Sıfırla (Başa Döndür) */}
                <button
                  onClick={() => resetOperationTask(op.appId)}
                  className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-slate-800 hover:border-rose-500/40"
                  title="Görevi Sıfırla (Başa Döndür)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>

                {/* 3. Hızlı Düzenle */}
                <button
                  onClick={() => handleStartInlineEdit(op)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-teal-300 rounded-lg transition-colors cursor-pointer border border-slate-800"
                  title="Hızlı Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Google Sheets Connection Prompt / Warning if not connected */}
      {(!isGoogleConnected && !sheetConfig.scriptUrl) && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Google Sheets Henüz Bağlı Değil (Yerel Önizleme Modu)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                M sütununa çıkış sürelerini anlık yazdırmak ve tablonuzdaki gerçek hasta verilerini otomatik çekmek için lütfen Google Sheets tablonuzu bağlayın.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Google Sheets'e Bağlan</span>
          </button>
        </div>
      )}

      {/* Sync Error Banner if any */}
      {syncError && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-4 text-xs text-rose-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span><strong>Google Sheets Senkronizasyon Uyarısı:</strong> {syncError}</span>
          </div>
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Bağlantıyı Düzelt
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. REAL-TIME LIVE SYNC & SYSTEM METRICS BAR (Saniye Saniye Entegrasyon)  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status badge & live ticker */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center">
              <div className={`w-3.5 h-3.5 rounded-full ${
                (isGoogleConnected && sheetConfig.sheetId) || sheetConfig.scriptUrl
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-amber-400'
              }`} />
              <div className={`absolute w-3 h-3 rounded-full ${
                (isGoogleConnected && sheetConfig.sheetId) || sheetConfig.scriptUrl
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  Google Sheets Canlı Entegrasyon
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  (isGoogleConnected && sheetConfig.sheetId) || sheetConfig.scriptUrl
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {(isGoogleConnected && sheetConfig.sheetId)
                    ? `🟢 Canlı Bağlı (M Sütunu Aktif • ${sheetConfig.syncIntervalSec}s)`
                    : sheetConfig.scriptUrl
                    ? `🟢 Apps Script Bağlı (${sheetConfig.syncIntervalSec}s)`
                    : '⚠️ Bağlantı Bekleniyor (Yerel Mod)'}
                </span>
                {sheetConfig.liveSimulation && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                    ⚡ Test Simülatörü Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                <span>Son Güncelleme: <strong className="text-teal-300">{lastSyncSecondsAgo} sn önce</strong> ({lastSyncTime || currentTimeStr})</span>
                <span>•</span>
                <span>Gecikme: <strong className="text-slate-300">{syncPingMs !== null ? `${syncPingMs} ms` : '~'}</strong></span>
                <span>•</span>
                <span>Kaynak Sayfa: <strong className="text-slate-300">{sheetConfig.sheetName}</strong></span>
                {googleUser && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{googleUser.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Real-time sync controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sync interval picker */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 px-2">Hız:</span>
              {[1, 2, 3, 5, 0].map(sec => (
                <button
                  key={sec}
                  onClick={() => toggleLiveSyncInterval(sec)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                    sheetConfig.syncIntervalSec === sec && (sec === 0 ? !sheetConfig.autoSync : sheetConfig.autoSync)
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={sec === 0 ? 'Senkronizasyonu Durdur' : `Her ${sec} saniyede bir senkronize et`}
                >
                  {sec === 0 ? 'Durdur' : `${sec}s`}
                </button>
              ))}
            </div>

            {/* Test simulation toggle button */}
            <button
              onClick={toggleLiveSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                sheetConfig.liveSimulation
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-2 ring-purple-500/20'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              title="Google Sheets olmadan saniye saniye canlı aktivite simülasyonunu aç/kapat"
            >
              <Zap className={`w-3.5 h-3.5 ${sheetConfig.liveSimulation ? 'text-purple-400 animate-spin' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Canlı Test Simülatörü</span>
            </button>

            {/* Manual Trigger */}
            <button
              onClick={() => syncWithGoogleSheets(false)}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 shrink-0"
              title="Şimdi Google Sheets'ten Çek"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Çekiliyor...' : 'Şimdi Çek'}</span>
            </button>

            {/* Ultra-wide expand toggle */}
            <button
              onClick={() => setIsUltraWide(!isUltraWide)}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              title={isUltraWide ? 'Normal Genişliğe Dön' : 'Geniş Ekran Modu (Tam Ekran)'}
            >
              {isUltraWide ? <Minimize2 className="w-4 h-4 text-teal-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Top Header & Executive Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {currentUser.subRole === 'transfer_sorumlusu' ? 'Transfer Sorumlusu Paneli' : 'Klinik Sorumlusu Paneli'}
              </span>
              <span className="text-xs font-mono text-slate-400">Canlı Sistem Saati: <b className="text-white font-mono">{currentTimeStr}</b></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Sağlık Turizmi Canlı Operasyon Masası
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Google Sheets ana veri kaynağı (Source of Truth). Satır numaralarından bağımsız, saniye saniye canlı senkronize.
            </p>
          </div>

          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Toplam</span>
              <span className="text-xl font-bold text-white">{kpis.total}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-amber-300 block font-medium">Klinikte</span>
              <span className="text-xl font-bold text-amber-400">{kpis.inClinic}</span>
            </div>
            <div className="bg-lime-500/15 border border-lime-500/40 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-lime-300 block font-bold">Hazır</span>
              <span className="text-xl font-extrabold text-lime-400 animate-pulse">{kpis.ready}</span>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-2xl text-center">
              <span className="text-[11px] text-sky-300 block font-medium">Yolda</span>
              <span className="text-xl font-bold text-sky-400">{kpis.onWay}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-rose-300 block font-medium">Tamamlanan</span>
              <span className="text-xl font-bold text-rose-400">{kpis.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GÜNLÜK OPERASYON TABLOSU (Google Sheets Görünümü & Sütun Sıralama)     */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Table Top Controls & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Günlük Operasyon Tablosu</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                  {filteredOperations.length} / {operations.length} Kayıt
                </span>
                {isCompactTable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <span>Tek Ekran Modu</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Sütun başlıklarındaki <b>‹ ›</b> oklarıyla sırayı değiştirebilir, <b>Tek Ekrana Sığdır</b> butonu ile yatay kaydırma olmadan okuyabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click Tek Ekrana Sığdır Şablonu */}
            <button
              type="button"
              onClick={applyFitToScreenPreset}
              className="px-3 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Yatay kaydırma olmadan tüm tabloyu tek ekranda okuyun"
            >
              <Monitor className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Tek Ekrana Sığdır</span>
            </button>

            {/* Kompakt / Geniş Modu Toggle */}
            <button
              type="button"
              onClick={() => setIsCompactTable(!isCompactTable)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isCompactTable
                  ? 'bg-slate-800 text-teal-300 border-teal-500/30 shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
              title={isCompactTable ? 'Geniş hücre görünümüne geç' : 'Kompakt (tek ekran) görünümüne geç'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
              <span>{isCompactTable ? 'Kompakt (Açık)' : 'Geniş Mod'}</span>
            </button>

            {/* SÜTUN YÖNETİCİSİ (Sıralama + Görünürlük) */}
            <ColumnManager
              visibility={columnVisibility}
              onChange={setColumnVisibility}
              onReset={resetColumnVisibility}
              order={columnOrder}
              onOrderChange={setColumnOrder}
              onMoveColumn={moveColumn}
              onResetOrder={resetColumnOrder}
              isCompact={isCompactTable}
              onToggleCompact={setIsCompactTable}
              onApplyFitToScreen={applyFitToScreenPreset}
            />

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Hasta Ekle</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-slate-800">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Hasta adı, konum, işlem, doktor veya acente ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Şoför Filter */}
          <select
            value={selectedDriverFilter}
            onChange={e => setSelectedDriverFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Tüm Şoförler ({uniqueDrivers.length})</option>
            {uniqueDrivers.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Guest Filter */}
          <select
            value={selectedGuestFilter}
            onChange={e => setSelectedGuestFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Tüm Guest Danışmanları ({uniqueGuests.length})</option>
            {uniqueGuests.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="klinikte">Klinikte / Hazır (Sarı/Yeşil)</option>
            <option value="bekliyor">Bekleyen / Yolda (Mavi/Varsayılan)</option>
            <option value="tamamlandi">Tamamlanan (Kırmızı)</option>
          </select>
        </div>

        {/* Clean Dense Spreadsheet Table with Dynamic Column Ordering & Single-screen Fit */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 shadow-inner">
          <div className="overflow-x-auto max-h-[680px] overflow-y-auto custom-scrollbar">
            <table className={`w-full text-left border-collapse font-sans ${isCompactTable ? 'text-xs' : 'text-xs'}`}>
              <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-slate-300 uppercase tracking-wider font-bold select-none">
                <tr>
                  {visibleOrderedColumns.map((colKey, index) => 
                    renderColumnHeader(colKey, index, visibleOrderedColumns.length)
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={visibleOrderedColumns.length} className="py-12 text-center text-slate-500">
                      Arama kriterlerine uygun operasyon kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op, idx) => {
                    const isReady = op.isReady || op.statusColor === 'fistik_yesili';
                    const isInClinic = op.status === 'klinikte' || op.statusColor === 'sari';
                    const isDone = op.status === 'tamamlandi' || op.status === 'donus_alindi' || op.statusColor === 'kirmizi';
                    const isOnWay = op.status === 'alindi' || op.statusColor === 'mavi';

                    // Row background matching requirement
                    let rowBg = 'hover:bg-slate-800/40';
                    if (isReady) rowBg = 'bg-lime-950/25 hover:bg-lime-950/40 border-l-4 border-l-lime-400';
                    else if (isInClinic) rowBg = 'bg-amber-950/20 hover:bg-amber-950/35 border-l-4 border-l-amber-400';
                    else if (isDone) rowBg = 'bg-rose-950/15 hover:bg-rose-950/30 border-l-4 border-l-rose-500';
                    else if (isOnWay) rowBg = 'bg-sky-950/15 hover:bg-sky-950/30 border-l-4 border-l-sky-400';

                    return (
                      <tr 
                        key={op.appId} 
                        className={`transition-all duration-300 ${rowBg} ${
                          op.justUpdated ? 'bg-teal-900/30 ring-1 ring-teal-400' : ''
                        }`}
                      >
                        {visibleOrderedColumns.map(colKey => renderCell(colKey, op, idx))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ÖZEL BÖLÜM: KLİNİKTEKİ HASTALAR (Tahmini Çıkış Saatine Göre Artan Sıralı) */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-400/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                  KLİNİKTEKİ HASTALAR
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                  {clinicPatients.length} HASTA
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Tahmini çıkış saatine göre artan sırada listelenir — ilk çıkacak hastayı 2-3 saniyede tespit edin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Sarı: Klinikte</span>
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 ml-2" />
              <span className="font-bold text-lime-300">Fıstık Yeşili: Hazır</span>
            </div>
          </div>
        </div>

        {clinicPatients.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            Şu anda klinikte aktif hasta bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
            {clinicPatients.map(op => {
              const isReady = op.isReady || op.statusColor === 'fistik_yesili';

              return (
                <div
                  key={op.appId}
                  className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                    op.justUpdated ? 'ring-4 ring-teal-400 bg-teal-950/40 scale-[1.01]' : ''
                  } ${
                    isReady
                      ? 'bg-lime-950/30 border-lime-400 ring-2 ring-lime-500/40 shadow-lg shadow-lime-950/50'
                      : 'bg-slate-950/80 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div>
                    {/* Header: ETA & Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge
                          status={op.status}
                          statusColor={op.statusColor}
                          isReady={op.isReady}
                          estimatedExitTime={null}
                          size="sm"
                          showDetail={false}
                        />
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {op.pax || '1 PAX'}
                        </span>
                      </div>

                      {/* Prominent ETA pill */}
                      <div className="text-right">
                        {op.estimatedExitTime ? (
                          <div className={`px-2.5 py-1 rounded-xl border text-center ${
                            isReady
                              ? 'bg-lime-400 text-slate-950 border-lime-300 font-extrabold'
                              : 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                          }`}>
                            <span className="text-[10px] block leading-none opacity-80">Tahmini Çıkış</span>
                            <span className="text-sm sm:text-base font-mono leading-tight">{op.estimatedExitTime}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            Saat girilmedi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Patient Name */}
                    <h3 className="text-base font-bold text-white leading-snug">
                      {op.patientName}
                    </h3>
                    {op.procedure && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {op.procedure}
                      </p>
                    )}

                    {/* Compact Meta */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 my-2.5">
                      <div className="truncate">
                        <span className="text-slate-500 block text-[10px]">Guest:</span>
                        <span className="font-semibold text-teal-300 truncate">{op.guest || '-'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 block text-[10px]">Şoför:</span>
                        <span className="font-semibold text-amber-200 truncate">{op.driver || '-'}</span>
                      </div>
                      <div className="col-span-2 truncate text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        {op.pickupLocation} → {op.dropLocation}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Note & Controls: Geri Al & Sıfırla */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                    <div className="text-[11px] text-slate-500 truncate flex-1">
                      <span className="truncate">{op.lastAction || 'Klinikte'}</span>
                      {op.lastActionTime && <span className="font-mono ml-1 text-slate-600">({op.lastActionTime})</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => revertOperationToPrevious(op.appId)}
                        className="px-2 py-1 bg-slate-900 hover:bg-amber-950/60 text-amber-300 border border-slate-800 hover:border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Önceki Adıma Geri Al"
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
                        className="px-2 py-1 bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-slate-800 hover:border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Görevi Başa Sıfırla"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Sıfırla</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL: YENİ HASTA EKLEME */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Yeni Günlük Operasyon Kaydı</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Hasta İsmi & Visit Bilgisi *</label>
                  <input
                    type="text"
                    required
                    value={newPatientData.patientName}
                    onChange={e => setNewPatientData({ ...newPatientData, patientName: e.target.value })}
                    placeholder="Örn: David Miller / 2. Visit"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Operasyon Tipi</label>
                  <select
                    value={newPatientData.operationType}
                    onChange={e => setNewPatientData({ ...newPatientData, operationType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Klinik İşlemi">Klinik İşlemi</option>
                    <option value="Türkiye'ye Yeni Geliş">Türkiye'ye Yeni Geliş</option>
                    <option value="Türkiye'den Gidiş">Türkiye'den Gidiş</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">PAX (Kişi)</label>
                  <input
                    type="text"
                    value={newPatientData.pax}
                    onChange={e => setNewPatientData({ ...newPatientData, pax: e.target.value })}
                    placeholder="1, 2* ref vb."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Alınış Saati</label>
                  <input
                    type="time"
                    value={newPatientData.pickupTime}
                    onChange={e => setNewPatientData({ ...newPatientData, pickupTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bırakılış Saati</label>
                  <input
                    type="time"
                    value={newPatientData.dropTime}
                    onChange={e => setNewPatientData({ ...newPatientData, dropTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Konum / Alınış Yeri</label>
                  <input
                    type="text"
                    value={newPatientData.pickupLocation}
                    onChange={e => setNewPatientData({ ...newPatientData, pickupLocation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Bırakılış Yeri</label>
                  <input
                    type="text"
                    value={newPatientData.dropLocation}
                    onChange={e => setNewPatientData({ ...newPatientData, dropLocation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Şoför</label>
                  <input
                    type="text"
                    value={newPatientData.driver}
                    onChange={e => setNewPatientData({ ...newPatientData, driver: e.target.value })}
                    placeholder="OSMAN BEY vb."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Guest</label>
                  <input
                    type="text"
                    value={newPatientData.guest}
                    onChange={e => setNewPatientData({ ...newPatientData, guest: e.target.value })}
                    placeholder="Furkan Yılmaz vb."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">İşlem / Tedavi</label>
                  <input
                    type="text"
                    value={newPatientData.procedure}
                    onChange={e => setNewPatientData({ ...newPatientData, procedure: e.target.value })}
                    placeholder="ÖLÇÜ, BİTİM, BEYAZLATMA vb."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Kaydet & Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
