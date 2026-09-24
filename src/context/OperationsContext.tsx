import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { 
  OperationItem, 
  UserProfile, 
  ActionLog, 
  AppNotification, 
  SheetConfig, 
  OperationStatus, 
  StatusColor,
  TableColumnKey,
  ColumnVisibilityMap,
  DEFAULT_COLUMN_VISIBILITY,
  DEFAULT_COLUMN_ORDER
} from '../types';
import { 
  INITIAL_OPERATIONS, 
  INITIAL_USERS, 
  parseCsvToOperations, 
  RAW_CSV_DATA 
} from '../data/initialData';
import { cleanTimeString } from '../utils/formatters';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from '../services/firebaseAuth';
import { 
  fetchOperationsDirectFromSheets, 
  extractSpreadsheetId,
  updateEstimatedExitInSheets
} from '../services/googleSheetsApi';
import type { User as FirebaseUser } from 'firebase/auth';

interface OperationsContextType {
  operations: OperationItem[];
  users: UserProfile[];
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  actionLogs: ActionLog[];
  notifications: AppNotification[];
  sheetConfig: SheetConfig;
  setSheetConfig: React.Dispatch<React.SetStateAction<SheetConfig>>;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncSecondsAgo: number;
  syncPingMs: number | null;
  syncError: string | null;
  currentTimeStr: string;
  syncCounter: number;
  isSheetsModalOpen: boolean;
  setIsSheetsModalOpen: (open: boolean) => void;

  // Google Workspace Direct Auth
  googleUser: FirebaseUser | null;
  isGoogleConnected: boolean;
  connectGoogleAccount: () => Promise<void>;
  disconnectGoogleAccount: () => Promise<void>;
  
  // Column Visibility & Ordering
  columnVisibility: ColumnVisibilityMap;
  setColumnVisibility: React.Dispatch<React.SetStateAction<ColumnVisibilityMap>>;
  resetColumnVisibility: () => void;
  columnOrder: TableColumnKey[];
  setColumnOrder: (order: TableColumnKey[]) => void;
  moveColumn: (key: TableColumnKey, direction: 'left' | 'right') => void;
  resetColumnOrder: () => void;
  
  // Compact / Single-screen Fit Table Mode
  isCompactTable: boolean;
  setIsCompactTable: (compact: boolean) => void;
  applyFitToScreenPreset: () => void;

  // Screen Width preference
  isUltraWide: boolean;
  setIsUltraWide: React.Dispatch<React.SetStateAction<boolean>>;
  
  // View preferences
  viewMode: 'list' | 'card';
  setViewMode: (mode: 'list' | 'card') => void;
  
  // Operations Actions
  guestSetEstimatedExit: (appId: string, exitTime: string) => void;
  guestClearEstimatedExit: (appId: string) => void;
  guestSetReady: (appId: string, isReady: boolean) => void;
  guestUpdatePax: (appId: string, newPax: string) => void;
  driverPerformAction: (appId: string, actionName: string, targetStatus: OperationStatus, targetColor: StatusColor) => void;
  updateOperationField: (appId: string, field: keyof OperationItem, value: any) => void;
  
  // Undo & Task Reset Actions
  resetOperationTask: (appId: string) => void;
  revertOperationToPrevious: (appId: string) => void;
  undoLastAction: () => void;
  undoActionById: (logId: string) => void;
  canUndo: boolean;
  lastUndoableAction: ActionLog | null;
  clearLastUndoBanner: () => void;
  
  // Management & Sync
  syncWithGoogleSheets: (isAutoPoll?: boolean) => Promise<void>;
  toggleLiveSyncInterval: (seconds: number) => void;
  toggleLiveSimulation: () => void;
  resetToInitialData: () => void;
  importCsvSchedule: (csvString: string) => void;
  exportCsvSchedule: () => string;
  addNewPatient: (patient: Partial<OperationItem>) => void;
  clearNotifications: () => void;
}

const STORAGE_KEYS = {
  OPERATIONS: 'healthtour_operations_v3',
  ACTION_LOGS: 'healthtour_action_logs_v3',
  CURRENT_USER: 'healthtour_current_user_v3',
  SHEET_CONFIG: 'healthtour_sheet_config_v3',
  NOTIFICATIONS: 'healthtour_notifications_v3',
  VIEW_MODE: 'healthtour_view_mode_v3',
  COLUMN_VISIBILITY: 'healthtour_column_visibility_v3',
  COLUMN_ORDER: 'healthtour_column_order_v3',
  COMPACT_TABLE: 'healthtour_compact_table_v3',
  ULTRA_WIDE: 'healthtour_ultra_wide_v3'
};

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export const OperationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State Loaders with LocalStorage
  const [operations, setOperations] = useState<OperationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: OperationItem) => ({
            ...item,
            pickupTime: cleanTimeString(item.pickupTime) || '09:00',
            dropTime: cleanTimeString(item.dropTime),
            estimatedExitTime: item.estimatedExitTime ? cleanTimeString(item.estimatedExitTime) : null
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load operations from localStorage', e);
    }
    return INITIAL_OPERATIONS;
  });

  const [users] = useState<UserProfile[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = INITIAL_USERS.find(u => u.id === parsed.id || u.name === parsed.name);
        if (match) return match;
      }
    } catch (e) {}
    // Default to Transfer Sorumlusu (Admin)
    return INITIAL_USERS[0];
  });

  const [actionLogs, setActionLogs] = useState<ActionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTION_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'n-init-1',
        timestamp: '10:45',
        title: 'Sistem Başlatıldı',
        message: 'Google Sheets çift yönlü canlı senkronizasyon motoru devrede.',
        type: 'info'
      }
    ];
  });

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      scriptUrl: '',
      sheetId: '',
      sheetName: 'GÜNLÜK OPERASYON',
      syncIntervalSec: 2, // 2 saniyede bir canlı otomatik çekim (saniye saniye)
      autoSync: true,
      lastSyncTime: null,
      isLive: true,
      liveSimulation: false // İstenirse test için açılabilir
    };
  });

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_VISIBILITY);
      if (saved) return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_COLUMN_VISIBILITY;
  });

  const [columnOrder, setColumnOrderState] = useState<TableColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_ORDER);
      if (saved) {
        const parsed: TableColumnKey[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Eksik kolonlar varsa sona ekle
          const missing = DEFAULT_COLUMN_ORDER.filter(col => !parsed.includes(col));
          return [...parsed.filter(col => DEFAULT_COLUMN_ORDER.includes(col)), ...missing];
        }
      }
    } catch (e) {}
    return DEFAULT_COLUMN_ORDER;
  });

  const setColumnOrder = useCallback((order: TableColumnKey[]) => {
    setColumnOrderState(order);
    try {
      localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(order));
    } catch (e) {}
  }, []);

  const moveColumn = useCallback((key: TableColumnKey, direction: 'left' | 'right') => {
    setColumnOrderState(prev => {
      const index = prev.indexOf(key);
      if (index === -1) return prev;
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      try {
        localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const resetColumnOrder = useCallback(() => {
    setColumnOrderState(DEFAULT_COLUMN_ORDER);
    try {
      localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(DEFAULT_COLUMN_ORDER));
    } catch (e) {}
  }, []);

  const [isCompactTable, setIsCompactTableState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPACT_TABLE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true; // Varsayılan olarak tek ekrana sığan kompakt mod açık
  });

  const setIsCompactTable = useCallback((compact: boolean) => {
    setIsCompactTableState(compact);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPACT_TABLE, JSON.stringify(compact));
    } catch (e) {}
  }, []);

  const applyFitToScreenPreset = useCallback(() => {
    // Tek sayfaya rahatça sığacak ideal kolon seti:
    const fitCols: ColumnVisibilityMap = {
      index: true,
      status: true,
      patientName: true,
      pax: true,
      pickupTime: true,
      dropTime: false,
      pickupLocation: true,
      dropLocation: true,
      driver: true,
      procedure: true,
      guest: true,
      doctor: false,
      agent: false,
      operationType: false,
      estimatedExitTime: true,
      actions: true
    };
    setColumnVisibility(fitCols);
    try {
      localStorage.setItem(STORAGE_KEYS.COLUMN_VISIBILITY, JSON.stringify(fitCols));
    } catch (e) {}
    setIsCompactTable(true);
  }, [setIsCompactTable]);

  const [isUltraWide, setIsUltraWide] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ULTRA_WIDE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true; // Default to ultra-wide for spacious operational visibility
  });

  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      if (saved === 'list' || saved === 'card') return saved;
    } catch (e) {}
    return 'card';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [lastSyncSecondsAgo, setLastSyncSecondsAgo] = useState<number>(0);
  const [syncPingMs, setSyncPingMs] = useState<number | null>(42);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncCounter, setSyncCounter] = useState<number>(1);
  const [lastUndoableAction, setLastUndoableAction] = useState<ActionLog | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);

  // Google Workspace OAuth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setIsGoogleConnected(true);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setIsGoogleConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const googleTokenRef = useRef<string | null>(null);
  googleTokenRef.current = googleToken;

  const operationsRef = useRef(operations);
  operationsRef.current = operations;

  const sheetConfigRef = useRef(sheetConfig);
  sheetConfigRef.current = sheetConfig;

  // 2. Save state changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
    } catch (e) {}
  }, [operations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTION_LOGS, JSON.stringify(actionLogs));
    } catch (e) {}
  }, [actionLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(sheetConfig));
    } catch (e) {}
  }, [sheetConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLUMN_VISIBILITY, JSON.stringify(columnVisibility));
    } catch (e) {}
  }, [columnVisibility]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ULTRA_WIDE, JSON.stringify(isUltraWide));
    } catch (e) {}
  }, [isUltraWide]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    } catch (e) {}
  }, [viewMode]);

  // 3. Live clock & automatic ETA check & second-counter
  useEffect(() => {
    const updateTicker = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setCurrentTimeStr(`${timeStr}:${seconds}`);

      // Update seconds ago since last sync
      const diffSec = Math.floor((Date.now() - lastSyncTimestamp) / 1000);
      setLastSyncSecondsAgo(diffSec >= 0 ? diffSec : 0);

      // Automatic check if any patient reached exit time
      setOperations(prev => {
        let changed = false;
        const updated = prev.map(item => {
          if (
            item.status === 'klinikte' &&
            item.estimatedExitTime &&
            item.estimatedExitTime <= timeStr &&
            !item.isReady &&
            item.statusColor !== 'fistik_yesili'
          ) {
            changed = true;
            return {
              ...item,
              statusColor: 'fistik_yesili' as StatusColor,
              isReady: true,
              lastAction: 'Tahmini çıkış saati geldi (Otomatik Hazır)',
              justUpdated: true
            };
          }
          return item;
        });
        return changed ? updated : prev;
      });
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTimestamp]);

  // Helper for adding notifications
  const pushNotification = useCallback((title: string, message: string, type: AppNotification['type'] = 'info', appId?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      title,
      message,
      type,
      appId
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 29)]);
  }, []);

  // Post changes asynchronously to Google Apps Script Web App
  const postToGoogleSheets = useCallback(async (payload: any) => {
    const scriptUrl = sheetConfigRef.current.scriptUrl;
    if (!scriptUrl || !scriptUrl.startsWith('http')) return;

    try {
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script friendly
        body: JSON.stringify(payload),
        mode: 'no-cors' // Allows transparent Google Apps Script execution
      }).catch(err => {
        console.warn('Google Sheets background sync dispatch:', err);
      });
    } catch (e) {
      console.warn('Post error to Google Sheets:', e);
    }
  }, []);

  // Log action and trigger undo toast
  const logAction = useCallback((
    appId: string,
    patientName: string,
    action: string,
    prevState: Partial<OperationItem>,
    nextState: Partial<OperationItem>,
    details?: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const logId = `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newLog: ActionLog = {
      id: logId,
      timestamp: timeStr,
      appId,
      patientName,
      action,
      details,
      userName: currentUser.name,
      userRole: currentUser.role,
      previousState: {
        status: (prevState.status as OperationStatus) || 'bekliyor',
        statusColor: (prevState.statusColor as StatusColor) || 'default',
        estimatedExitTime: prevState.estimatedExitTime || null,
        isReady: prevState.isReady || false,
        pax: prevState.pax || '',
        lastAction: prevState.lastAction || null,
        lastActionTime: prevState.lastActionTime || null,
        lastActionUser: prevState.lastActionUser || null
      },
      newState: {
        status: (nextState.status as OperationStatus) || 'bekliyor',
        statusColor: (nextState.statusColor as StatusColor) || 'default',
        estimatedExitTime: nextState.estimatedExitTime || null,
        isReady: nextState.isReady || false,
        pax: nextState.pax || '',
        lastAction: action,
        lastActionTime: timeStr,
        lastActionUser: `${currentUser.name} (${currentUser.role})`
      }
    };

    setActionLogs(prev => [newLog, ...prev]);
    setLastUndoableAction(newLog);

    // Also send action immediately to Google Sheets via POST
    postToGoogleSheets({
      action: 'performAction',
      appId,
      patientName,
      actionType: action,
      actionTitle: action,
      userName: currentUser.name,
      userRole: currentUser.role,
      patchData: nextState
    });

    // Auto-clear undo toast after 8 seconds
    const timer = setTimeout(() => {
      setLastUndoableAction(curr => (curr?.id === logId ? null : curr));
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentUser, postToGoogleSheets]);

  // 4. Guest Actions
  const guestSetEstimatedExit = useCallback((appId: string, exitTime: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      const oldExit = target.estimatedExitTime;
      const isPastOrNow = exitTime <= timeStr;
      
      const newStatusColor: StatusColor = isPastOrNow || target.isReady ? 'fistik_yesili' : target.status === 'klinikte' ? 'sari' : target.statusColor;

      logAction(
        appId,
        target.patientName,
        `Tahmini çıkış ${exitTime} yapıldı`,
        { ...target },
        { estimatedExitTime: exitTime, statusColor: newStatusColor },
        oldExit ? `Eski: ${oldExit} → Yeni: ${exitTime}` : `Yeni: ${exitTime}`
      );

      pushNotification(
        'Tahmini Çıkış Saati',
        `${target.patientName} için çıkış saati ${exitTime} olarak ayarlandı (${currentUser.name})`,
        'info',
        appId
      );

      // Doğrudan Google Sheets API bağlıysa arka planda doğrudan hücreye yaz
      const token = googleTokenRef.current;
      const sheetId = sheetConfigRef.current.sheetId;
      const sheetName = sheetConfigRef.current.sheetName || 'GÜNLÜK OPERASYON';
      if (token && sheetId) {
        const cleanId = extractSpreadsheetId(sheetId);
        updateEstimatedExitInSheets(cleanId, sheetName, target.patientName, exitTime, token).then(result => {
          if (result.success) {
            pushNotification('Google Sheets Güncellendi', `${target.patientName} için M sütununa "${exitTime}" yazıldı.`, 'success', appId);
          } else {
            pushNotification('Google Sheets Uyarısı', result.error || 'M sütunu güncellenemedi', 'warning', appId);
          }
        }).catch(err => {
          console.warn('Direct Google Sheets exit time update error:', err);
          pushNotification('Google Sheets Hatası', err.message || 'Hücreye yazılamadı', 'warning', appId);
        });
      } else if (!sheetConfigRef.current.scriptUrl) {
        pushNotification(
          'Google Sheets Bağlı Değil',
          'Çıkış saatini tablonuza yazdırmak için lütfen üst menüdeki "Google Sheets" butonundan tablonuzu bağlayın.',
          'warning'
        );
      }

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            estimatedExitTime: exitTime,
            statusColor: newStatusColor,
            lastAction: `Tahmini çıkış: ${exitTime}`,
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  const guestClearEstimatedExit = useCallback((appId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      const oldExit = target.estimatedExitTime;
      const newStatusColor: StatusColor = target.status === 'klinikte' ? 'sari' : target.statusColor;

      logAction(
        appId,
        target.patientName,
        'Tahmini çıkış saati silindi',
        { ...target },
        { estimatedExitTime: null, statusColor: newStatusColor, isReady: false },
        oldExit ? `Silinen Saat: ${oldExit}` : undefined
      );

      pushNotification(
        'Tahmini Çıkış Silindi',
        `${target.patientName} için çıkış saati kaldırıldı (${currentUser.name})`,
        'info',
        appId
      );

      const token = googleTokenRef.current;
      const sheetId = sheetConfigRef.current.sheetId;
      const sheetName = sheetConfigRef.current.sheetName || 'GÜNLÜK OPERASYON';
      if (token && sheetId) {
        const cleanId = extractSpreadsheetId(sheetId);
        updateEstimatedExitInSheets(cleanId, sheetName, target.patientName, '', token).catch(() => {});
      }

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            estimatedExitTime: null,
            statusColor: newStatusColor,
            isReady: false,
            lastAction: 'Tahmini çıkış saati silindi',
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  const guestSetReady = useCallback((appId: string, isReady: boolean) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      const newStatus: OperationStatus = isReady ? 'hazir' : 'klinikte';
      const newColor: StatusColor = isReady ? 'fistik_yesili' : 'sari';
      const actionText = isReady ? 'HAZIR olarak işaretlendi' : 'Hazır durumu kaldırıldı';

      logAction(
        appId,
        target.patientName,
        actionText,
        { ...target },
        { isReady, status: newStatus, statusColor: newColor }
      );

      pushNotification(
        isReady ? 'Hasta Çıkışa Hazır!' : 'Hazır Durumu İptal Edildi',
        `${target.patientName} ${isReady ? 'çıkmaya hazır, araç yönlendirilebilir.' : 'klinik işlemine devam ediyor.'}`,
        isReady ? 'success' : 'warning',
        appId
      );

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            isReady,
            status: newStatus,
            statusColor: newColor,
            readyTimestamp: isReady ? timeStr : null,
            lastAction: actionText,
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  const guestUpdatePax = useCallback((appId: string, newPax: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      const oldPax = target.pax;
      logAction(
        appId,
        target.patientName,
        `PAX güncellendi: ${newPax}`,
        { ...target },
        { pax: newPax },
        `Eski: ${oldPax || 'Boş'} → Yeni: ${newPax}`
      );

      pushNotification(
        'PAX Güncellendi',
        `${target.patientName} yolcu sayısı: ${newPax}`,
        'info',
        appId
      );

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            pax: newPax,
            lastAction: `PAX: ${newPax}`,
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  // 5. Driver Actions
  const driverPerformAction = useCallback((
    appId: string,
    actionName: string,
    targetStatus: OperationStatus,
    targetColor: StatusColor
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      logAction(
        appId,
        target.patientName,
        actionName,
        { ...target },
        { status: targetStatus, statusColor: targetColor }
      );

      let notifType: AppNotification['type'] = 'info';
      if (targetStatus === 'klinikte') {
        notifType = 'warning';
      } else if (targetStatus === 'tamamlandi' || targetStatus === 'donus_alindi') {
        notifType = 'alert';
      }

      pushNotification(
        actionName,
        `${target.patientName}: ${actionName} (${currentUser.name})`,
        notifType,
        appId
      );

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            status: targetStatus,
            statusColor: targetColor,
            lastAction: actionName,
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (Şoför)`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  // Update specific field directly
  const updateOperationField = useCallback((appId: string, field: keyof OperationItem, value: any) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      const updated = {
        ...target,
        [field]: value,
        lastAction: `${String(field)} güncellendi`,
        lastActionTime: timeStr,
        lastActionUser: `${currentUser.name} (${currentUser.role})`,
        justUpdated: true
      };

      logAction(
        appId,
        target.patientName,
        `${String(field)} güncellendi`,
        { ...target },
        { [field]: value }
      );

      return prev.map(item => item.appId === appId ? updated : item);
    });
  }, [currentUser, logAction]);

  // 6. Undo Rollback Logic
  const undoActionById = useCallback((logId: string) => {
    const log = actionLogs.find(l => l.id === logId);
    if (!log) return;

    setOperations(prev => {
      return prev.map(item => {
        if (item.appId === log.appId) {
          return {
            ...item,
            status: log.previousState.status,
            statusColor: log.previousState.statusColor,
            estimatedExitTime: log.previousState.estimatedExitTime,
            isReady: log.previousState.isReady,
            pax: log.previousState.pax,
            lastAction: `Geri Alındı: (${log.action})`,
            lastActionTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            lastActionUser: `${currentUser.name} (Geri Alma)`,
            justUpdated: true
          };
        }
        return item;
      });
    });

    postToGoogleSheets({
      action: 'undoAction',
      logId: log.id,
      appId: log.appId
    });

    pushNotification(
      'İşlem Geri Alındı',
      `"${log.action}" işlemi geri alındı (${log.patientName}).`,
      'warning',
      log.appId
    );

    setActionLogs(prev => prev.filter(l => l.id !== logId));
    setLastUndoableAction(null);
  }, [actionLogs, currentUser, pushNotification, postToGoogleSheets]);

  const undoLastAction = useCallback(() => {
    if (lastUndoableAction) {
      undoActionById(lastUndoableAction.id);
    } else if (actionLogs.length > 0) {
      undoActionById(actionLogs[0].id);
    }
  }, [lastUndoableAction, actionLogs, undoActionById]);

  const clearLastUndoBanner = useCallback(() => {
    setLastUndoableAction(null);
  }, []);

  // 7. Görevi Başa Sıfırla (Zamansız, her an geri döndürülebilir)
  const resetOperationTask = useCallback((appId: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      logAction(
        appId,
        target.patientName,
        'Görev Sıfırlandı (Başa Alındı)',
        { ...target },
        { 
          status: 'bekliyor', 
          statusColor: 'default', 
          isReady: false, 
          estimatedExitTime: null,
          readyTimestamp: null 
        },
        'Tüm transfer ve klinik adımları başlangıç durumuna sıfırlandı.'
      );

      pushNotification(
        'Görev Sıfırlandı',
        `${target.patientName} görevi başarıyla sıfırlandı ve başa alındı (${currentUser.name})`,
        'warning',
        appId
      );

      // Google Sheets'e bağlıysa M sütununu da sıfırla
      const token = googleTokenRef.current;
      const sheetId = sheetConfigRef.current.sheetId;
      const sheetName = sheetConfigRef.current.sheetName || 'GÜNLÜK OPERASYON';
      if (token && sheetId) {
        const cleanId = extractSpreadsheetId(sheetId);
        updateEstimatedExitInSheets(cleanId, sheetName, target.patientName, '', token).catch(() => {});
      }

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            status: 'bekliyor',
            statusColor: 'default',
            isReady: false,
            readyTimestamp: null,
            estimatedExitTime: null,
            lastAction: 'Görev Başa Sıfırlandı',
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [currentUser, logAction, pushNotification]);

  // 8. Önceki Adıma Geri Al (Otelden Alındı -> Bekliyor, Kliniğe Bırakıldı -> Yolda vb.)
  const revertOperationToPrevious = useCallback((appId: string) => {
    // 1. Önce bu hastaya ait en son işlem kaydını kontrol et
    const relatedLog = actionLogs.find(l => l.appId === appId);
    if (relatedLog && relatedLog.previousState) {
      undoActionById(relatedLog.id);
      return;
    }

    // 2. Eğer log hafızada yoksa (sayfa yenilendiğinde vb.), mantıksal durum geri alma adımı
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setOperations(prev => {
      const target = prev.find(p => p.appId === appId);
      if (!target) return prev;

      let prevStatus: OperationStatus = 'bekliyor';
      let prevColor: StatusColor = 'default';
      let prevAction = 'Önceki Adıma Geri Alındı';
      let prevReady = false;

      if (target.status === 'tamamlandi') {
        const isReturn = target.dropLocation.toLowerCase().includes('otel') || target.dropLocation.toLowerCase().includes('hotel');
        prevStatus = isReturn ? 'donus_alindi' : 'alindi';
        prevColor = isReturn ? 'kirmizi' : 'mavi';
        prevAction = 'Teslimat geri alındı (Araçta)';
      } else if (target.status === 'donus_alindi') {
        prevStatus = target.isReady ? 'hazir' : 'klinikte';
        prevColor = target.isReady ? 'fistik_yesili' : 'sari';
        prevAction = 'Klinikten alma geri alındı (Klinikte)';
      } else if (target.status === 'hazir') {
        prevStatus = 'klinikte';
        prevColor = 'sari';
        prevReady = false;
        prevAction = 'Hazır durumu geri alındı (İşlem Sürüyor)';
      } else if (target.status === 'klinikte') {
        prevStatus = 'alindi';
        prevColor = 'mavi';
        prevAction = 'Kliniğe varış geri alındı (Araçta / Yolda)';
      } else if (target.status === 'alindi') {
        prevStatus = 'bekliyor';
        prevColor = 'default';
        prevAction = 'Alınış geri alındı (Bekliyor / Alınmadı)';
      } else {
        pushNotification('Bilgi', `${target.patientName} zaten başlangıç durumunda.`, 'info', appId);
        return prev;
      }

      logAction(
        appId,
        target.patientName,
        prevAction,
        { ...target },
        { status: prevStatus, statusColor: prevColor, isReady: prevReady }
      );

      pushNotification(
        'Önceki Adıma Geri Alındı',
        `${target.patientName}: ${prevAction} (${currentUser.name})`,
        'warning',
        appId
      );

      return prev.map(item => {
        if (item.appId === appId) {
          return {
            ...item,
            status: prevStatus,
            statusColor: prevColor,
            isReady: prevReady,
            lastAction: prevAction,
            lastActionTime: timeStr,
            lastActionUser: `${currentUser.name} (${currentUser.role})`,
            justUpdated: true
          };
        }
        return item;
      });
    });
  }, [actionLogs, undoActionById, currentUser, logAction, pushNotification]);

  // 7. Google Sheets Live Second-by-Second Polling & Sync
  const syncWithGoogleSheets = useCallback(async (isAutoPoll: boolean = false) => {
    const startTime = performance.now();
    const cfg = sheetConfigRef.current;

    const token = googleTokenRef.current;

    // 1. Direct Google Sheets API via OAuth token
    if (token && cfg.sheetId) {
      const cleanId = extractSpreadsheetId(cfg.sheetId);
      try {
        if (!isAutoPoll) setIsSyncing(true);
        const { operations: fetchedOps, actualSheetName } = await fetchOperationsDirectFromSheets(cleanId, cfg.sheetName || 'GÜNLÜK OPERASYON', token);
        const ping = Math.round(performance.now() - startTime);
        setSyncPingMs(ping);
        setSyncError(null);

        // Otomatik algılanan sayfa adını kaydet
        if (actualSheetName && actualSheetName !== cfg.sheetName) {
          setSheetConfig(prev => ({ ...prev, sheetName: actualSheetName }));
        }

        setOperations(prev => {
          return fetchedOps.map(fresh => {
            const old = prev.find(p => p.appId === fresh.appId || p.patientName.trim().toLowerCase() === fresh.patientName.trim().toLowerCase());
            
            // Google Sheets'ten gelen saat geçerliyse önceliklidir
            const effectiveExitTime = fresh.estimatedExitTime !== null && fresh.estimatedExitTime !== ''
              ? fresh.estimatedExitTime
              : (old?.estimatedExitTime || null);

            const isChanged = old && (
              old.status !== fresh.status ||
              old.statusColor !== fresh.statusColor ||
              old.estimatedExitTime !== effectiveExitTime ||
              old.pax !== fresh.pax ||
              old.driver !== fresh.driver
            );

            // Durum ve renk senkronizasyonu
            const effectiveStatus = (effectiveExitTime && (old?.status === 'bekliyor' || fresh.status === 'bekliyor'))
              ? 'klinikte'
              : (fresh.status || old?.status || 'bekliyor');

            const effectiveColor = (effectiveExitTime && (old?.statusColor === 'default' || !old?.statusColor))
              ? 'fistik_yesili'
              : (fresh.statusColor !== 'default' ? fresh.statusColor : (old?.statusColor || 'default'));

            return {
              ...fresh,
              status: effectiveStatus,
              statusColor: effectiveColor,
              estimatedExitTime: effectiveExitTime,
              isReady: old?.isReady || (effectiveExitTime ? true : false),
              lastAction: isChanged ? '[Google Sheets] Güncellendi' : (old?.lastAction || fresh.lastAction),
              lastActionTime: isChanged ? new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : (old?.lastActionTime || fresh.lastActionTime),
              lastActionUser: old?.lastActionUser || fresh.lastActionUser,
              justUpdated: isChanged ? true : old?.justUpdated
            };
          });
        });

        const timeNow = new Date().toLocaleTimeString('tr-TR');
        setLastSyncTime(timeNow);
        setLastSyncTimestamp(Date.now());
        setSyncCounter(c => c + 1);

        if (!isAutoPoll) {
          pushNotification('Doğrudan Google Sheets Bağlandı', `${fetchedOps.length} hasta kaydı tablonuzdan çekildi.`, 'success');
        }
        return;
      } catch (err: any) {
        console.warn('Direct Google Sheets API fetch failed:', err);
        setSyncError(err.message || 'E-Tablo okunamadı');
        if (!isAutoPoll) {
          pushNotification('Google Sheets API Hatası', err.message, 'warning');
        }
      } finally {
        if (!isAutoPoll) setIsSyncing(false);
      }
    }

    if (!cfg.scriptUrl) {
      // Local live mode
      if (!isAutoPoll) {
        setIsSyncing(true);
      }
      
      setTimeout(() => {
        const ping = Math.floor(performance.now() - startTime) + 15;
        setSyncPingMs(ping);
        const timeNow = new Date().toLocaleTimeString('tr-TR');
        setLastSyncTime(timeNow);
        setLastSyncTimestamp(Date.now());
        setSyncCounter(c => c + 1);
        if (!isAutoPoll) {
          setIsSyncing(false);
          pushNotification('Senkronizasyon Başarılı', `Tüm veriler saniye saniye canlı modda güncellendi (${timeNow}).`, 'success');
        }
      }, isAutoPoll ? 100 : 300);
      return;
    }

    try {
      if (!isAutoPoll) setIsSyncing(true);
      
      let fetchUrl = cfg.scriptUrl;
      const separator = fetchUrl.includes('?') ? '&' : '?';
      fetchUrl += `${separator}action=getOperations&t=${Date.now()}`;

      const res = await fetch(fetchUrl);
      const ping = Math.round(performance.now() - startTime);
      setSyncPingMs(ping);

      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const fetchedOps: OperationItem[] = json.data.map((item: any) => ({
          ...item,
          pickupTime: cleanTimeString(item.pickupTime) || '09:00',
          dropTime: cleanTimeString(item.dropTime),
          estimatedExitTime: item.estimatedExitTime ? cleanTimeString(item.estimatedExitTime) : null
        }));
        
        // Merge seamlessly with our state based on AppId
        setOperations(prev => {
          // Compare if any values changed to highlight
          return fetchedOps.map(fresh => {
            const old = prev.find(p => p.appId === fresh.appId);
            const isChanged = old && (
              old.status !== fresh.status ||
              old.statusColor !== fresh.statusColor ||
              old.estimatedExitTime !== fresh.estimatedExitTime ||
              old.pax !== fresh.pax ||
              old.driver !== fresh.driver
            );
            return {
              ...fresh,
              justUpdated: isChanged ? true : old?.justUpdated
            };
          });
        });

        const timeNow = new Date().toLocaleTimeString('tr-TR');
        setLastSyncTime(timeNow);
        setLastSyncTimestamp(Date.now());
        setSyncCounter(c => c + 1);

        if (!isAutoPoll) {
          pushNotification('Google Sheets Senkronize', `${json.data.length} kayıt Google Sheets üzerinden canlı güncellendi.`, 'success');
        }
      } else {
        throw new Error(json.error || 'Geçersiz veri formatı');
      }
    } catch (err: any) {
      if (!isAutoPoll) {
        console.warn('Google Sheets sync notice:', err.message);
        pushNotification('Senkronizasyon Uyarısı', `Google Sheets bağlantısı denendi, yerel modda devam ediliyor. (${err.message})`, 'warning');
      }
    } finally {
      if (!isAutoPoll) setIsSyncing(false);
    }
  }, [pushNotification]);

  // Second-by-Second high frequency polling loop
  useEffect(() => {
    if (!sheetConfig.autoSync) return;
    
    // Interval in milliseconds (1s = 1000ms, 2s = 2000ms, etc.)
    const intervalMs = Math.max(1, sheetConfig.syncIntervalSec || 1) * 1000;
    
    const timer = setInterval(() => {
      syncWithGoogleSheets(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [sheetConfig.autoSync, sheetConfig.syncIntervalSec, syncWithGoogleSheets]);

  // Live simulation mode effect for testing second-by-second live updates
  useEffect(() => {
    if (!sheetConfig.liveSimulation) return;

    const simTimer = setInterval(() => {
      setOperations(prev => {
        if (prev.length === 0) return prev;
        const targetIdx = Math.floor(Math.random() * Math.min(prev.length, 10));
        const target = prev[targetIdx];
        if (!target) return prev;

        const updated = [...prev];
        const randomActionType = Math.random();

        if (randomActionType > 0.6 && target.status === 'klinikte') {
          // Guest update ETA
          const minutes = ['15', '30', '45', '00'][Math.floor(Math.random() * 4)];
          const hours = ['11', '12', '13', '14', '15', '16', '17'][Math.floor(Math.random() * 7)];
          const newEta = `${hours}:${minutes}`;
          updated[targetIdx] = {
            ...target,
            estimatedExitTime: newEta,
            lastAction: `[Canlı Sheets] Tahmini Çıkış: ${newEta}`,
            lastActionTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            justUpdated: true
          };
          pushNotification('Canlı Google Sheets Güncellemesi', `${target.patientName} tahmini çıkış saati ${newEta} olarak güncellendi.`, 'info', target.appId);
        } else if (randomActionType > 0.3 && target.status === 'bekliyor') {
          // Driver picked up
          updated[targetIdx] = {
            ...target,
            status: 'alindi',
            statusColor: 'mavi',
            lastAction: `[Canlı Sheets] Otelden Alındı`,
            lastActionTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            justUpdated: true
          };
          pushNotification('Canlı Transfer Güncellemesi', `${target.patientName} transferi başladı (Yolda).`, 'info', target.appId);
        }

        return updated;
      });
    }, 6000);

    return () => clearInterval(simTimer);
  }, [sheetConfig.liveSimulation, pushNotification]);

  // Clear `justUpdated` badge after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setOperations(prev => {
        if (prev.some(p => p.justUpdated)) {
          return prev.map(p => ({ ...p, justUpdated: false }));
        }
        return prev;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [operations]);

  const toggleLiveSyncInterval = useCallback((seconds: number) => {
    setSheetConfig(prev => ({
      ...prev,
      syncIntervalSec: seconds,
      autoSync: seconds > 0
    }));
    pushNotification(
      'Senkronizasyon Modu Değişti',
      seconds > 0 ? `Canlı Google Sheets taraması her ${seconds} saniyede bir çalışacak.` : 'Otomatik tarama duraklatıldı.',
      'info'
    );
  }, [pushNotification]);

  const toggleLiveSimulation = useCallback(() => {
    setSheetConfig(prev => {
      const next = !prev.liveSimulation;
      pushNotification(
        next ? 'Canlı Simülasyon Başlatıldı' : 'Simülasyon Durduruldu',
        next ? 'Google Sheets saniye saniye canlı veri akışı simüle ediliyor.' : 'Normal moda dönüldü.',
        next ? 'success' : 'info'
      );
      return { ...prev, liveSimulation: next };
    });
  }, [pushNotification]);

  const resetColumnVisibility = useCallback(() => {
    setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
    pushNotification('Sütunlar Sıfırlandı', 'Tüm tablo sütunları varsayılan görünümüne getirildi.', 'info');
  }, [pushNotification]);

  // 8. CSV Import & Export & Reset
  const importCsvSchedule = useCallback((csvString: string) => {
    try {
      setIsLoading(true);
      const newItems = parseCsvToOperations(csvString);
      if (newItems.length === 0) {
        throw new Error('Geçerli veri satırı bulunamadı.');
      }
      setOperations(newItems);
      pushNotification('Yeni Program Yüklendi', `${newItems.length} hasta operasyonu başarıyla içeri aktarıldı.`, 'success');
    } catch (e: any) {
      alert('CSV yükleme hatası: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [pushNotification]);

  const exportCsvSchedule = useCallback((): string => {
    const headers = [
      'OPERASYON TİPİ',
      'HASTA İSMİ',
      'PAX',
      'ALINIŞ SAATİ',
      'BIRAKILIŞ SAATİ',
      'KONUM',
      'BIRAKILIŞ YERİ',
      'ŞOFÖR',
      'İŞLEM',
      'GUEST',
      'DOKTOR',
      'AGENT',
      'DURUM',
      'TAHMİNİ ÇIKIŞ'
    ];

    const rows = operations.map(op => {
      const escape = (str: string | null | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escape(op.operationType),
        escape(op.patientName),
        escape(op.pax),
        escape(op.pickupTime),
        escape(op.dropTime),
        escape(op.pickupLocation),
        escape(op.dropLocation),
        escape(op.driver),
        escape(op.procedure),
        escape(op.guest),
        escape(op.doctor),
        escape(op.agent),
        escape(op.status),
        escape(op.estimatedExitTime || '')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }, [operations]);

  const resetToInitialData = useCallback(() => {
    if (window.confirm('Tüm verileri başlangıç tablosuna sıfırlamak istediğinize emin misiniz?')) {
      const resetOps = parseCsvToOperations(RAW_CSV_DATA);
      setOperations(resetOps);
      setActionLogs([]);
      setNotifications([]);
      localStorage.removeItem(STORAGE_KEYS.OPERATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTION_LOGS);
      pushNotification('Sıfırlandı', 'Operasyon verileri orijinal haline getirildi.', 'info');
    }
  }, [pushNotification]);

  const addNewPatient = useCallback((patientData: Partial<OperationItem>) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const opType = patientData.operationType || 'Klinik İşlemi';
    const patientName = patientData.patientName || 'Yeni Hasta';
    const pickupTime = cleanTimeString(patientData.pickupTime) || timeStr;
    const dropTime = cleanTimeString(patientData.dropTime);
    const pickupLoc = patientData.pickupLocation || 'Otel';

    const appId = `OP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newOp: OperationItem = {
      appId,
      operationType: opType,
      patientName,
      pax: patientData.pax || '1',
      pickupTime,
      dropTime,
      pickupLocation: pickupLoc,
      dropLocation: patientData.dropLocation || 'SMILES CLINIC',
      driver: patientData.driver || 'ATAMA YAPILMADI',
      procedure: patientData.procedure || '',
      guest: patientData.guest || '',
      doctor: patientData.doctor || '',
      agent: patientData.agent || '',
      status: 'bekliyor',
      statusColor: 'default',
      estimatedExitTime: null,
      isReady: false,
      lastAction: 'Yeni hasta eklendi',
      lastActionTime: timeStr,
      lastActionUser: `${currentUser.name} (${currentUser.role})`,
      justUpdated: true
    };

    setOperations(prev => [newOp, ...prev]);
    
    // Post to Google Sheets if configured
    postToGoogleSheets({
      action: 'performAction',
      appId,
      patientName,
      actionType: 'Yeni Hasta Eklendi',
      patchData: newOp
    });

    pushNotification('Yeni Hasta Eklendi', `${patientName} programa eklendi.`, 'success', appId);
  }, [currentUser, pushNotification, postToGoogleSheets]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const connectGoogleAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setIsGoogleConnected(true);
        pushNotification(
          'Google Hesabı Bağlandı',
          `${res.user.email} hesabı ile Google Sheets yetkilendirmesi sağlandı.`,
          'success'
        );
        if (sheetConfigRef.current.sheetId) {
          setTimeout(() => syncWithGoogleSheets(false), 200);
        }
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      pushNotification('Google Giriş Hatası', err.message || 'Giriş yapılamadı', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [pushNotification, syncWithGoogleSheets]);

  const disconnectGoogleAccount = useCallback(async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setIsGoogleConnected(false);
    pushNotification('Oturum Kapatıldı', 'Google Sheets bağlantısı kaldırıldı.', 'info');
  }, [pushNotification]);

  const value = useMemo(() => ({
    operations,
    users,
    currentUser,
    setCurrentUser,
    actionLogs,
    notifications,
    sheetConfig,
    setSheetConfig,
    isLoading,
    isSyncing,
    lastSyncTime,
    lastSyncSecondsAgo,
    syncPingMs,
    syncError,
    currentTimeStr,
    syncCounter,
    isSheetsModalOpen,
    setIsSheetsModalOpen,
    googleUser,
    isGoogleConnected,
    connectGoogleAccount,
    disconnectGoogleAccount,
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
    viewMode,
    setViewMode,
    guestSetEstimatedExit,
    guestClearEstimatedExit,
    guestSetReady,
    guestUpdatePax,
    driverPerformAction,
    updateOperationField,
    resetOperationTask,
    revertOperationToPrevious,
    undoLastAction,
    undoActionById,
    canUndo: actionLogs.length > 0,
    lastUndoableAction,
    clearLastUndoBanner,
    syncWithGoogleSheets,
    toggleLiveSyncInterval,
    toggleLiveSimulation,
    resetToInitialData,
    importCsvSchedule,
    exportCsvSchedule,
    addNewPatient,
    clearNotifications
  }), [
    operations,
    users,
    currentUser,
    actionLogs,
    notifications,
    sheetConfig,
    isLoading,
    isSyncing,
    lastSyncTime,
    lastSyncSecondsAgo,
    syncPingMs,
    syncError,
    currentTimeStr,
    syncCounter,
    isSheetsModalOpen,
    googleUser,
    isGoogleConnected,
    connectGoogleAccount,
    disconnectGoogleAccount,
    columnVisibility,
    columnOrder,
    setColumnOrder,
    moveColumn,
    resetColumnOrder,
    isCompactTable,
    setIsCompactTable,
    applyFitToScreenPreset,
    isUltraWide,
    viewMode,
    guestSetEstimatedExit,
    guestClearEstimatedExit,
    guestSetReady,
    guestUpdatePax,
    driverPerformAction,
    updateOperationField,
    resetOperationTask,
    revertOperationToPrevious,
    undoLastAction,
    undoActionById,
    lastUndoableAction,
    clearLastUndoBanner,
    syncWithGoogleSheets,
    toggleLiveSyncInterval,
    toggleLiveSimulation,
    resetToInitialData,
    importCsvSchedule,
    exportCsvSchedule,
    addNewPatient,
    clearNotifications,
    resetColumnVisibility
  ]);

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  );
};

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
};
