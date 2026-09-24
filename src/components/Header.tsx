import React, { useState } from 'react';
import { useOperations } from '../context/OperationsContext';
import { 
  Building2, 
  Users, 
  Car, 
  RefreshCw, 
  Bell, 
  FileSpreadsheet, 
  History, 
  Check, 
  ChevronDown, 
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface HeaderProps {
  onOpenSheetsModal: () => void;
  onOpenLogsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSheetsModal, onOpenLogsModal }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    notifications, 
    isSyncing, 
    syncWithGoogleSheets, 
    lastSyncTime,
    lastSyncSecondsAgo,
    sheetConfig,
    currentTimeStr,
    clearNotifications,
    actionLogs,
    isUltraWide,
    setIsUltraWide,
    isGoogleConnected,
    googleUser
  } = useOperations();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const adminUsers = users.filter(u => u.role === 'admin');
  const guestUsers = users.filter(u => u.role === 'guest');
  const driverUsers = users.filter(u => u.role === 'driver');

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className={`mx-auto px-2 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-3 transition-all ${
        isUltraWide ? 'max-w-[1920px]' : 'max-w-7xl'
      }`}>
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Health<span className="text-teal-400">Tour</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                <span className={`w-2 h-2 rounded-full ${sheetConfig.autoSync ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
                <span>{sheetConfig.autoSync ? `Canlı • ${sheetConfig.syncIntervalSec}s` : 'Manuel'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Google Sheets Canlı Operasyon Takibi
            </p>
          </div>
        </div>

        {/* Center Clock & Sync Ticker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>{currentTimeStr}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[11px]">Sync: <strong className="text-teal-300">{lastSyncSecondsAgo}s önce</strong></span>
        </div>

        {/* Right Tools & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Screen Width Toggle */}
          <button
            onClick={() => setIsUltraWide(!isUltraWide)}
            className="hidden sm:flex p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title={isUltraWide ? 'Normal Genişliğe Dön' : 'Geniş Ekran Modu'}
          >
            {isUltraWide ? <Minimize2 className="w-4 h-4 text-teal-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Google Connection Status Pill / Trigger */}
          <button
            onClick={onOpenSheetsModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isGoogleConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Sheets Bağlantı Durumu"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="hidden sm:inline">
              {isGoogleConnected ? 'Sheets Bağlı' : 'Google Bağla'}
            </span>
          </button>

          {/* Google Sheets Sync Button */}
          <button
            onClick={() => syncWithGoogleSheets(false)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            title="Google Sheets ile Senkronize Et"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Senkron...' : 'Sheets Sync'}</span>
          </button>

          {/* Apps Script & Sheet Integration Setup Trigger */}
          <button
            onClick={onOpenSheetsModal}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Google Apps Script ve Entegrasyon Ayarları"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Action Logs Audit Trail Trigger */}
          <button
            onClick={onOpenLogsModal}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors relative"
            title="İşlem Geçmişi (Action Log)"
          >
            <History className="w-4 h-4" />
            {actionLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {actionLogs.length > 9 ? '9+' : actionLogs.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors relative"
              title="Bildirimler"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 rounded-full text-[9px] font-extrabold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Bell className="w-3.5 h-3.5 text-teal-400" />
                    <span>Canlı Bildirimler ({notifications.length})</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">Henüz bildirim yok</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${
                            n.type === 'success' ? 'text-lime-400' :
                            n.type === 'warning' ? 'text-amber-400' :
                            n.type === 'alert' ? 'text-rose-400' : 'text-teal-300'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{n.timestamp}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all"
            >
              <div className={`w-7 h-7 rounded-xl ${currentUser.avatarColor || 'bg-teal-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <span className="text-xs font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 capitalize block leading-none">
                  {currentUser.role === 'admin' ? 'Transfer Sorumlusu' : currentUser.role === 'guest' ? 'Guest Relations' : 'Şoför'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Switch Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-3 z-50 text-xs space-y-3">
                <div className="px-2 py-1 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Kullanıcı / Rol Değiştir</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                  {/* ADMINS */}
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 block mb-1">
                      Yönetim (Admin / Sorumlu)
                    </span>
                    <div className="space-y-1">
                      {adminUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                            currentUser.id === u.id ? 'bg-indigo-600/30 text-white border border-indigo-500/50' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="font-semibold">{u.name}</span>
                          </div>
                          {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GUESTS */}
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider px-2 block mb-1">
                      Guest Danışmanları
                    </span>
                    <div className="space-y-1">
                      {guestUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                            currentUser.id === u.id ? 'bg-teal-600/30 text-white border border-teal-500/50' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            <span className="font-semibold">{u.name}</span>
                          </div>
                          {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DRIVERS */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 block mb-1">
                      Şoförler
                    </span>
                    <div className="space-y-1">
                      {driverUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                            currentUser.id === u.id ? 'bg-amber-600/30 text-white border border-amber-500/50' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="font-semibold truncate">{u.name}</span>
                          </div>
                          {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
