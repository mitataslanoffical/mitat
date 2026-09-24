import React from 'react';
import { OperationStatus, StatusColor } from '../types';

interface StatusBadgeProps {
  status: OperationStatus;
  statusColor: StatusColor;
  isReady?: boolean;
  estimatedExitTime?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDetail?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  statusColor,
  isReady,
  estimatedExitTime,
  size = 'md',
  showDetail = true,
}) => {
  // Determine badge styling based on requirements:
  // SARI: Hasta klinikte (Şoför 'Kliniğe Bırakıldı' dedi)
  // FISTIK YEŞİLİ: Hasta çıkmaya hazır (Guest 'Hazır' dedi veya Tahmini Çıkış Saati geldi)
  // KIRMIZI: Operasyon tamamlandı / Klinikten alındı
  // MAVİ: Yolda / Alındı

  let bgClass = 'bg-slate-800/90 text-slate-300 border-slate-700';
  let label = 'Bekliyor';
  let dotColor = 'bg-slate-400';
  let isPulse = false;

  if (isReady || statusColor === 'fistik_yesili' || status === 'hazir') {
    bgClass = 'bg-lime-400 text-slate-950 border-lime-300 font-bold shadow-md shadow-lime-500/25';
    label = 'ÇIKIŞA HAZIR';
    dotColor = 'bg-slate-950';
    isPulse = true;
  } else if (statusColor === 'sari' || status === 'klinikte') {
    bgClass = 'bg-amber-400 text-amber-950 border-amber-300 font-bold shadow-sm shadow-amber-400/20';
    label = 'KLİNİKTE';
    dotColor = 'bg-amber-900';
  } else if (statusColor === 'kirmizi' || status === 'tamamlandi' || status === 'donus_alindi') {
    bgClass = 'bg-rose-600 text-white border-rose-500 font-semibold';
    label = status === 'donus_alindi' ? 'KLİNİKTEN ALINDI' : 'TAMAMLANDI';
    dotColor = 'bg-rose-200';
  } else if (statusColor === 'mavi' || status === 'alindi') {
    bgClass = 'bg-sky-600 text-white border-sky-500 font-semibold';
    label = 'TRANSFERDE / YOLDA';
    dotColor = 'bg-sky-200';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-xs sm:text-sm rounded-lg font-medium',
    lg: 'px-3.5 py-1.5 text-sm sm:text-base rounded-xl font-bold tracking-wide'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 border transition-all duration-200 ${bgClass} ${sizeClasses[size]}`}>
      <span className={`h-2 w-2 rounded-full ${dotColor} ${isPulse ? 'animate-ping' : ''}`} />
      <span>{label}</span>
      {showDetail && estimatedExitTime && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-black/15 text-[11px] font-mono">
          {estimatedExitTime}
        </span>
      )}
    </span>
  );
};
