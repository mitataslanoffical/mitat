export type UserRole = 'admin' | 'guest' | 'driver';

export type SubRole = 'transfer_sorumlusu' | 'klinik_sorumlusu' | 'guest_relations' | 'driver';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  subRole?: SubRole;
  phone?: string;
  avatarColor?: string;
}

export type OperationStatus =
  | 'bekliyor'        // Henüz transfer başlamadı
  | 'alindi'          // Otelden veya havalimanından alındı (yolda)
  | 'klinikte'        // Kliniğe bırakıldı (SARI)
  | 'hazir'           // Guest hazır dedi veya çıkış saati geldi (FISTIK YEŞİLİ)
  | 'donus_alindi'    // Klinikten alındı / Dönüş başladı (KIRMIZI)
  | 'tamamlandi';     // Otele/Havalimanına bırakıldı veya transfer bitti (KIRMIZI)

export type StatusColor = 'default' | 'sari' | 'fistik_yesili' | 'kirmizi' | 'mavi';

export type OperationCategory = 'klinik_transfer' | 'havalimani_gelis' | 'havalimani_gidis' | 'diger';

export interface OperationItem {
  appId: string;                 // Benzersiz operasyon ID (satır numarasına bağlı DEĞİL)
  operationType: string;         // 'Klinik İşlemi', "Türkiye'ye Yeni Geliş", "Türkiye'den Gidiş" vb.
  patientName: string;          // Hasta ismi ve visit/kontrol bilgisi
  pax: string;                  // '2', '2* rebecca', '6 pax' vb.
  pickupTime: string;           // '08:00'
  dropTime: string;             // '08:50'
  pickupLocation: string;       // 'Win Of Lara', 'XQ321', 'Lorem Otel'
  dropLocation: string;         // 'SMILES CLINIC', 'NUN HOTEL'
  driver: string;               // 'OSMAN BEY', 'Burak Güleç', 'Kiralama ( 533-611-3235)'
  procedure: string;            // 'BEYAZLATMA', 'PMMA BİTİM', 'ÖLÇÜ + KESİM'
  guest: string;                // 'Kursat', 'RADMİLA', 'Furkan Yılmaz'
  doctor: string;               // 'DT.MELDA ESRA DÖNMEZ'
  agent: string;                // 'TALİP BAŞOĞLU', 'Mert Sezer'
  
  // Dinamik operasyonel durumlar
  status: OperationStatus;
  statusColor: StatusColor;
  estimatedExitTime: string | null; // '13:30' (Tam saat olarak saklanır)
  isReady: boolean;                 // Guest 'HAZIR' butonuna bastı mı?
  readyTimestamp?: string | null;
  lastAction?: string | null;       // 'Kliniğe Bırakıldı', 'Otelden Alındı' vb.
  lastActionTime?: string | null;   // '10:42'
  lastActionUser?: string | null;   // 'Ertan Acar (Driver)'
  notes?: string | null;
  justUpdated?: boolean;            // Canlı senkronizasyon animasyonu için geçici bayrak
}

export interface ActionLog {
  id: string;
  timestamp: string;
  appId: string;
  patientName: string;
  action: string;
  details?: string;
  userName: string;
  userRole: UserRole;
  previousState: {
    status: OperationStatus;
    statusColor: StatusColor;
    estimatedExitTime: string | null;
    isReady: boolean;
    pax: string;
    lastAction?: string | null;
    lastActionTime?: string | null;
    lastActionUser?: string | null;
  };
  newState: {
    status: OperationStatus;
    statusColor: StatusColor;
    estimatedExitTime: string | null;
    isReady: boolean;
    pax: string;
    lastAction?: string | null;
    lastActionTime?: string | null;
    lastActionUser?: string | null;
  };
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  appId?: string;
}

export interface SheetConfig {
  scriptUrl: string;       // Google Apps Script Web App Deployment URL
  sheetId: string;         // Google Sheet ID
  sheetName: string;       // Varsayılan: "GÜNLÜK OPERASYON"
  syncIntervalSec: number; // Polling aralığı (sn) - 1, 2, 3, 5, 10
  autoSync: boolean;       // Canlı otomatik çekim aktif mi?
  lastSyncTime?: string | null;
  isLive: boolean;
  liveSimulation: boolean; // Gerçek URL yoksa canlı saniye saniye test simülasyonu
}

export type TableColumnKey =
  | 'index'
  | 'status'
  | 'patientName'
  | 'pax'
  | 'operationType'
  | 'pickupTime'
  | 'dropTime'
  | 'pickupLocation'
  | 'dropLocation'
  | 'driver'
  | 'procedure'
  | 'guest'
  | 'doctor'
  | 'agent'
  | 'estimatedExitTime'
  | 'actions';

export interface ColumnDefinition {
  key: TableColumnKey;
  label: string;
  shortLabel?: string;
  category: 'core' | 'timing' | 'location' | 'staff' | 'clinical' | 'actions';
  defaultVisible: boolean;
  minWidth?: string;
}

export const ALL_TABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'index', label: '# Sıra', shortLabel: '#', category: 'core', defaultVisible: true, minWidth: '40px' },
  { key: 'status', label: 'Operasyon Durumu', shortLabel: 'Durum', category: 'core', defaultVisible: true, minWidth: '140px' },
  { key: 'patientName', label: 'Hasta İsmi & Visit', shortLabel: 'Hasta Adı', category: 'core', defaultVisible: true, minWidth: '180px' },
  { key: 'pax', label: 'PAX (Kişi Sayısı)', shortLabel: 'PAX', category: 'core', defaultVisible: true, minWidth: '70px' },
  { key: 'pickupTime', label: 'Alınış Saati', shortLabel: 'Alınış', category: 'timing', defaultVisible: true, minWidth: '85px' },
  { key: 'dropTime', label: 'Bırakılış Saati', shortLabel: 'Bırakılış', category: 'timing', defaultVisible: true, minWidth: '85px' },
  { key: 'pickupLocation', label: 'Alınış Yeri / Konum', shortLabel: 'Alınış Yeri', category: 'location', defaultVisible: true, minWidth: '150px' },
  { key: 'dropLocation', label: 'Bırakılış Yeri', shortLabel: 'Bırakılış Yeri', category: 'location', defaultVisible: true, minWidth: '150px' },
  { key: 'driver', label: 'Atanan Şoför', shortLabel: 'Şoför', category: 'staff', defaultVisible: true, minWidth: '130px' },
  { key: 'procedure', label: 'İşlem / Tedavi', shortLabel: 'İşlem', category: 'clinical', defaultVisible: true, minWidth: '160px' },
  { key: 'guest', label: 'Guest Danışmanı', shortLabel: 'Guest', category: 'staff', defaultVisible: true, minWidth: '120px' },
  { key: 'doctor', label: 'Doktor / Hekim', shortLabel: 'Doktor', category: 'clinical', defaultVisible: true, minWidth: '140px' },
  { key: 'agent', label: 'Acente / Temsilci', shortLabel: 'Acente', category: 'staff', defaultVisible: true, minWidth: '120px' },
  { key: 'operationType', label: 'Operasyon Tipi', shortLabel: 'Op. Tipi', category: 'core', defaultVisible: false, minWidth: '130px' },
  { key: 'estimatedExitTime', label: 'Tahmini Çıkış Saati', shortLabel: 'Tahmini Çıkış', category: 'timing', defaultVisible: true, minWidth: '110px' },
  { key: 'actions', label: 'Hızlı Aksiyonlar', shortLabel: 'Aksiyon', category: 'actions', defaultVisible: true, minWidth: '120px' }
];

export type ColumnVisibilityMap = Record<TableColumnKey, boolean>;

export const DEFAULT_COLUMN_ORDER: TableColumnKey[] = [
  'index',
  'status',
  'patientName',
  'pax',
  'pickupTime',
  'dropTime',
  'pickupLocation',
  'dropLocation',
  'driver',
  'procedure',
  'guest',
  'doctor',
  'agent',
  'operationType',
  'estimatedExitTime',
  'actions'
];

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityMap = {
  index: true,
  status: true,
  patientName: true,
  pax: true,
  pickupTime: true,
  dropTime: true,
  pickupLocation: true,
  dropLocation: true,
  driver: true,
  procedure: true,
  guest: true,
  doctor: true,
  agent: true,
  operationType: true,
  estimatedExitTime: true,
  actions: true
};
