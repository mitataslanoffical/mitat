import React, { useState } from 'react';
import { useOperations } from '../context/OperationsContext';
import { ALL_APPS_SCRIPT_FILES } from '../services/googleAppsScriptTemplates';
import { extractSpreadsheetId, fetchSpreadsheetInfo } from '../services/googleSheetsApi';
import { getAccessToken } from '../services/firebaseAuth';
import { 
  FileSpreadsheet, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Settings, 
  Sparkles,
  Link,
  ShieldCheck,
  LogOut,
  Zap,
  Globe
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  const { 
    sheetConfig, 
    setSheetConfig, 
    syncWithGoogleSheets, 
    isSyncing, 
    exportCsvSchedule, 
    importCsvSchedule, 
    resetToInitialData,
    googleUser,
    isGoogleConnected,
    connectGoogleAccount,
    disconnectGoogleAccount
  } = useOperations();

  const [activeTab, setActiveTab] = useState<'direct_auth' | 'scripts' | 'config' | 'import_export' | 'guide'>('direct_auth');
  const [selectedScriptIdx, setSelectedScriptIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifyingSheet, setIsVerifyingSheet] = useState(false);
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState(sheetConfig.sheetId || '');

  if (!isOpen) return null;

  const currentScript = ALL_APPS_SCRIPT_FILES[selectedScriptIdx];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectSheetId = async () => {
    setTestResult(null);
    setIsVerifyingSheet(true);

    const cleanId = extractSpreadsheetId(spreadsheetUrlInput);
    if (!cleanId) {
      setTestResult({ success: false, message: 'Lütfen geçerli bir Google Sheets bağlantısı veya ID girin.' });
      setIsVerifyingSheet(false);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Önce lütfen "Google ile Bağlan" butonuna basarak yetki verin.');
      }

      // Verify spreadsheet access
      const info = await fetchSpreadsheetInfo(cleanId, token);
      
      // Update config
      setSheetConfig(prev => ({
        ...prev,
        sheetId: cleanId,
        autoSync: true
      }));

      // Trigger instant direct sync
      await syncWithGoogleSheets(false);

      setTestResult({
        success: true,
        message: `Bağlantı Başarılı! "${info.title}" tablosuna erişildi (${info.sheets.length} sayfa bulundu). Canlı senkronizasyon devrede.`
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Bağlantı hatası: ' + (e.message || 'Erişim sağlanamadı. Tablo linkini kontrol edin.')
      });
    } finally {
      setIsVerifyingSheet(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      await syncWithGoogleSheets(false);
      setTestResult({ success: true, message: 'Google Sheets bağlantısı başarılı ve veriler güncellendi.' });
    } catch (e: any) {
      setTestResult({ success: false, message: 'Bağlantı hatası: ' + e.message });
    }
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) {
      alert('Lütfen CSV metnini yapıştırın.');
      return;
    }
    importCsvSchedule(csvText);
    setCsvText('');
    alert('Günlük program başarıyla güncellendi!');
  };

  const handleDownloadCsv = () => {
    const csvContent = exportCsvSchedule();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gunluk_operasyon_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Google Sheets Canlı Entegrasyon Merkezi</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                  v3.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Google Sheets'e doğrudan tek tıkla bağlanın veya Apps Script webhook'unu kullanın.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 sm:px-6 overflow-x-auto custom-scrollbar">
          {[
            { id: 'direct_auth', label: '1. Tek Tıkla Google ile Doğrudan Bağlan (Önerilen)', icon: Zap },
            { id: 'scripts', label: '2. Google Apps Script Kodları (.gs)', icon: Code2 },
            { id: 'config', label: '3. Web App Bağlantı Ayarları', icon: Settings },
            { id: 'import_export', label: '4. CSV Programı Kopyala/Yapıştır', icon: Upload },
            { id: 'guide', label: '5. Kurulum Rehberi', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: DOĞRUDAN GOOGLE İLE BAĞLAN (KODSUZ & OTOMATİK) */}
          {activeTab === 'direct_auth' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Google Hesabınızla Doğrudan Entegrasyon
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Herhangi bir Apps Script dosyası açmanıza gerek kalmadan, Google Sheets tablonuza doğrudan güvenli yetkilendirme ile bağlanabilirsiniz. Değişiklikler anlık olarak senkronize edilir.
                    </p>
                  </div>
                </div>

                {/* Authentication Action Card */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Google Bağlantı Durumu:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isGoogleConnected ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-bold text-white">
                              Bağlı ({googleUser?.email})
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="text-sm font-bold text-slate-400">
                              Henüz Yetkilendirilmedi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isGoogleConnected ? (
                      <button
                        onClick={disconnectGoogleAccount}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Oturumu Kapat</span>
                      </button>
                    ) : (
                      /* Official Google Material Sign-In Button */
                      <button
                        onClick={connectGoogleAccount}
                        className="flex items-center justify-center gap-3 bg-white hover:bg-slate-100 active:scale-98 text-slate-800 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-xs sm:text-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>Google ile Bağlan</span>
                      </button>
                    )}
                  </div>

                  {/* Spreadsheet URL Input */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-xs">
                        Google Sheets E-Tablo Linki veya ID'si
                      </label>
                      <input
                        type="text"
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                        value={spreadsheetUrlInput}
                        onChange={e => setSpreadsheetUrlInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Tarayıcınızdaki Google Sheets adres çubuğundaki linki kopyalayıp buraya doğrudan yapıştırabilirsiniz.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 text-xs">
                          Operasyon Sayfa Adı
                        </label>
                        <input
                          type="text"
                          value={sheetConfig.sheetName}
                          onChange={e => setSheetConfig(prev => ({ ...prev, sheetName: e.target.value }))}
                          placeholder="GÜNLÜK OPERASYON"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleConnectSheetId}
                          disabled={isVerifyingSheet || isSyncing}
                          className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSheet ? 'animate-spin' : ''}`} />
                          <span>{isVerifyingSheet ? 'Tablo Taranıyor...' : 'Bağlantıyı Doğrula & Başlat'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status or Error Banner */}
                {testResult && (
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: APPS SCRIPT KODLARI */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  {ALL_APPS_SCRIPT_FILES.map((file, idx) => (
                    <button
                      key={file.name}
                      onClick={() => setSelectedScriptIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                        selectedScriptIdx === idx
                          ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCopyCode(currentScript.code)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Kopyalandı!' : `${currentScript.name} Kopyala`}</span>
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  <span className="font-bold text-slate-200">{currentScript.name}:</span> {currentScript.description}
                </p>
                <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
                  <pre className="p-4 overflow-x-auto text-slate-300 max-h-[380px] leading-relaxed custom-scrollbar">
                    {currentScript.code}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURATION (WEB APP URL) */}
          {activeTab === 'config' && (
            <div className="space-y-5 max-w-2xl">
              <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-2xl text-xs text-teal-200">
                💡 Google Apps Script'te <b>Web Uygulaması Olarak Dağıt (Deploy as Web App)</b> yaptıktan sonra aldığınız URL'yi buraya yapıştırabilirsiniz.
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Google Apps Script Web App Deployment URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={sheetConfig.scriptUrl}
                    onChange={e => setSheetConfig(prev => ({ ...prev, scriptUrl: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ana Operasyon Sayfa Adı
                    </label>
                    <input
                      type="text"
                      value={sheetConfig.sheetName}
                      onChange={e => setSheetConfig(prev => ({ ...prev, sheetName: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Otomatik Yenileme (Polling)
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="autoSyncCheck"
                        checked={sheetConfig.autoSync}
                        onChange={e => setSheetConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                        className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-700"
                      />
                      <label htmlFor="autoSyncCheck" className="text-slate-300 font-medium">
                        Her {sheetConfig.syncIntervalSec} saniyede bir çek
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-teal-500/20"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Bağlantıyı Test Et & Canlı Çek</span>
                  </button>
                  <button
                    onClick={resetToInitialData}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold"
                  >
                    Başlangıç Verilerine Sıfırla
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT & EXPORT CSV */}
          {activeTab === 'import_export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Günlük Program Yükle (CSV Kopyala / Yapıştır)</h3>
                  <p className="text-xs text-slate-400">
                    Google Sheets'teki yeni tablonuzu kopyalayıp buraya doğrudan yapıştırabilirsiniz.
                  </p>
                </div>
                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Mevcut Programı İndir (.csv)</span>
                </button>
              </div>

              <textarea
                rows={8}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="OPERASYON TİPİ,HASTA İSMİ,PAX,ALINIŞ SAATİ,BIRAKILIŞ SAATİ,KONUM,BIRAKILIŞ YERİ,ŞOFÖR,İŞLEM,GUEST,DOKTOR,AGENT..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleImportCsv}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/20"
                >
                  Programı Uygulamaya Yükle
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-w-3xl">
              <h3 className="text-base font-bold text-white">Google Sheets İki Yönlü Entegrasyon ve Veri Aktarımı Rehberi</h3>

              <div className="space-y-3">
                {/* Tahmini Çıkış Saati Özel Rehberi */}
                <div className="p-4 bg-teal-950/40 rounded-2xl border border-teal-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-teal-500/20 text-teal-400 font-bold">⏱️</span>
                    <span className="font-bold text-teal-300 block text-sm">Tahmini Çıkış Süresi / Saati Sheets'e Nasıl Aktarılır?</span>
                  </div>
                  <p className="text-slate-300">
                    Sistemimiz hem <b>Doğrudan Google Sheets API</b> hem de <b>Google Apps Script</b> üzerinden tam çift yönlü çalışır:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-300">
                    <li>
                      <b>M Sütunu (13. Kolon):</b> E-Tablonuzdaki <b>M Sütunu</b> doğrudan <b>"TAHMİNİ ÇIKIŞ"</b> kolonu olarak tanımlanmıştır. Başlık satırına <b>"TAHMİNİ ÇIKIŞ"</b> veya <b>"TAHMİNİ ÇIKIŞ BUTONU"</b> yazabilirsiniz.
                    </li>
                    <li>
                      <b>Otomatik Yazma:</b> Guest ekranından veya Yönetici panelindeki "Tahmini Çıkış" alanından saat (örn: <b>14:30</b>) seçildiği anda, ilgili hastanın satırındaki <b>M sütunu hücresine</b> bu saat anında yazılır.
                    </li>
                    <li>
                      <b>Akıllı Renk Değişimi:</b> Çıkış saati girildiğinde Google Sheets'teki hasta satırının arka planı otomatik olarak açık yeşil renge boyanarak sahadaki tüm ekibe hastanın çıkışa hazır olduğu hissettirilir.
                    </li>
                    <li>
                      <b>Format Koruması:</b> Saatler her zaman sade <b>HH:mm</b> (Örn: 08:00, 14:30) formatında M sütununa işlenir, uzun tarih veya timezone bozulmaları yaşanmaz.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-teal-400 block text-sm">Yöntem 1: Doğrudan Google ile Bağlan (En Kolay & Önerilen)</span>
                  <p>1. Sekmedeki <b>Google ile Bağlan</b> butonuna tıklayıp onay verin. Ardından Google Sheets e-tablo linkinizi yapıştırıp "Bağlantıyı Doğrula" butonuna basın. Hiçbir kod yazmadan sistem saniye saniye çalışmaya başlar.</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-teal-400 block text-sm">Yöntem 2: Google Apps Script Web App (Webhook)</span>
                  <p>Google Sheets tablonuzda <b>Uzantılar → Apps Script</b> açıp 2. sekmedeki hazır kodları yapıştırabilir ve <b>Web Uygulaması Olarak Dağıt</b> yapabilirsiniz. Oluşan URL'yi 3. sekmedeki alana yapıştırmanız yeterlidir.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>HealthTour Direct Sync Engine • Google Workspace OAuth & Webhook Ready</span>
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
