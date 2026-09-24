import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns3, 
  Check, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Monitor,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  TableColumnKey, 
  ColumnVisibilityMap, 
  ALL_TABLE_COLUMNS, 
  DEFAULT_COLUMN_VISIBILITY,
  DEFAULT_COLUMN_ORDER
} from '../types';

interface ColumnManagerProps {
  visibility: ColumnVisibilityMap;
  onChange: (newVisibility: ColumnVisibilityMap) => void;
  onReset: () => void;
  order: TableColumnKey[];
  onMoveColumn: (key: TableColumnKey, direction: 'left' | 'right') => void;
  onOrderChange: (newOrder: TableColumnKey[]) => void;
  onResetOrder: () => void;
  isCompact: boolean;
  onToggleCompact: (compact: boolean) => void;
  onApplyFitToScreen: () => void;
}

export const ColumnManager: React.FC<ColumnManagerProps> = ({
  visibility,
  onChange,
  onReset,
  order,
  onMoveColumn,
  onOrderChange,
  onResetOrder,
  isCompact,
  onToggleCompact,
  onApplyFitToScreen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'visibility'>('order');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = ALL_TABLE_COLUMNS.length;

  const toggleColumn = (key: TableColumnKey) => {
    onChange({
      ...visibility,
      [key]: !visibility[key]
    });
  };

  const applyPreset = (preset: 'all' | 'minimal' | 'field' | 'clinical') => {
    const next: ColumnVisibilityMap = { ...visibility };
    
    if (preset === 'all') {
      ALL_TABLE_COLUMNS.forEach(c => { next[c.key] = true; });
    } else if (preset === 'minimal') {
      ALL_TABLE_COLUMNS.forEach(c => {
        next[c.key] = ['status', 'patientName', 'pickupTime', 'driver', 'guest', 'estimatedExitTime', 'actions'].includes(c.key);
      });
    } else if (preset === 'field') {
      ALL_TABLE_COLUMNS.forEach(c => {
        next[c.key] = ['status', 'patientName', 'pax', 'pickupTime', 'dropTime', 'pickupLocation', 'dropLocation', 'driver', 'actions'].includes(c.key);
      });
    } else if (preset === 'clinical') {
      ALL_TABLE_COLUMNS.forEach(c => {
        next[c.key] = ['status', 'patientName', 'pax', 'procedure', 'doctor', 'guest', 'estimatedExitTime', 'actions'].includes(c.key);
      });
    }

    onChange(next);
  };

  const getColDef = (key: TableColumnKey) => {
    return ALL_TABLE_COLUMNS.find(c => c.key === key) || {
      key,
      label: key,
      category: 'core',
      defaultVisible: true,
      minWidth: '100px'
    };
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shadow-sm ${
          isOpen
            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 ring-2 ring-teal-500/20'
            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
        }`}
        title="Sütunların yerini değiştir ve gizle / göster"
      >
        <Columns3 className="w-3.5 h-3.5 text-teal-400" />
        <span>Sütunları Düzenle</span>
        <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-teal-300 text-[10px] font-mono font-bold">
          {visibleCount}/{totalCount}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold text-white text-sm">Sütun Yönetimi</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Fit-to-Screen Action Banner */}
          <div className="bg-teal-950/40 border border-teal-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="font-bold text-white block text-[11px]">Tek Ekrana Sığdır Şablonu</span>
                <span className="text-[10px] text-slate-300">Yatay kaydırma olmadan tüm tabloyu göster</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onApplyFitToScreen();
                setIsOpen(false);
              }}
              className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-[10px] transition-all shrink-0 cursor-pointer shadow-sm"
            >
              Uygula
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'order'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeft className="w-3 h-3" />
              <ArrowRight className="w-3 h-3" />
              <span>Sıralama (Yer Değiştir)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('visibility')}
              className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'visibility'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Gizle / Göster</span>
            </button>
          </div>

          {/* TAB 1: SÜTUN SIRALAMASI */}
          {activeTab === 'order' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Tablodaki sütunların sırası (soldan sağa):</span>
                <button
                  type="button"
                  onClick={onResetOrder}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Varsayılan sütun sırasına dön"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sırayı Sıfırla</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {order.map((colKey, index) => {
                  const colDef = getColDef(colKey);
                  const isVisible = !!visibility[colKey];
                  const isFirst = index === 0;
                  const isLast = index === order.length - 1;

                  return (
                    <div
                      key={colKey}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all ${
                        isVisible
                          ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                          : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-mono text-[10px] text-slate-500 font-bold">
                          {index + 1}
                        </span>
                        <span className={`text-xs font-semibold ${isVisible ? 'text-white' : 'line-through text-slate-500'}`}>
                          {colDef.label}
                        </span>
                        {!isVisible && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">Gizli</span>
                        )}
                      </div>

                      {/* Direction Move Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => onMoveColumn(colKey, 'left')}
                          className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isFirst
                              ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-30'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-teal-300 hover:border-teal-500'
                          }`}
                          title="Sola (Yukarı) Taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => onMoveColumn(colKey, 'right')}
                          className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isLast
                              ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-30'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-teal-300 hover:border-teal-500'
                          }`}
                          title="Sağa (Aşağı) Taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SÜTUN GİZLE / GÖSTER */}
          {activeTab === 'visibility' && (
            <div className="space-y-3">
              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hızlı Şablonlar:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px] text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Tümünü Göster</span>
                    <span className="text-[10px] text-teal-400 font-mono">16</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('minimal')}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px] text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Sade / Temel</span>
                    <span className="text-[10px] text-amber-400 font-mono">7</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('field')}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px] text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Saha / Şoför</span>
                    <span className="text-[10px] text-sky-400 font-mono">9</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('clinical')}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-[11px] text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Klinik / Guest</span>
                    <span className="text-[10px] text-emerald-400 font-mono">8</span>
                  </button>
                </div>
              </div>

              {/* Column Checkboxes */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 border-t border-slate-800 pt-2 custom-scrollbar">
                {ALL_TABLE_COLUMNS.map(col => {
                  const isChecked = !!visibility[col.key];
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-slate-800/80 text-white font-medium hover:bg-slate-800'
                          : 'text-slate-500 hover:bg-slate-950 hover:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'border-slate-700 bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{col.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {col.minWidth}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer Reset button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">
                  <strong className="text-teal-400 font-mono">{visibleCount}</strong> sütun aktif
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
