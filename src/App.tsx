import React, { useState } from 'react';
import { OperationsProvider, useOperations } from './context/OperationsContext';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { GuestDashboard } from './components/GuestDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { UndoBanner } from './components/UndoBanner';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ActionLogModal } from './components/ActionLogModal';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, isUltraWide, isSheetsModalOpen, setIsSheetsModalOpen } = useOperations();
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Header Navigation */}
      <Header
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenLogsModal={() => setIsLogsModalOpen(true)}
      />

      {/* Main Role-Based Dashboard View with Wide Fluid Layout */}
      <main className={`flex-1 w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 transition-all duration-300 ${
        isUltraWide ? 'max-w-[1920px]' : 'max-w-7xl'
      }`}>
        {currentUser.role === 'admin' && <AdminDashboard />}
        {currentUser.role === 'guest' && <GuestDashboard />}
        {currentUser.role === 'driver' && <DriverDashboard />}
      </main>

      {/* Floating Action Undo Toast */}
      <UndoBanner />

      {/* Google Sheets Integration & Code Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Audit Logs Modal */}
      <ActionLogModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className={`mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 transition-all ${
          isUltraWide ? 'max-w-[1920px]' : 'max-w-7xl'
        }`}>
          <span>HealthTour Canlı Operasyon Takip Sistemi &copy; 2026</span>
          <span className="text-slate-400 font-mono">Google Sheets Source of Truth • Satır Numarasından Bağımsız ID • Saniye Saniye Canlı Senkronize</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <OperationsProvider>
      <MainLayout />
    </OperationsProvider>
  );
}
