import { OperationItem, StatusColor } from '../types';
import { cleanTimeString } from '../utils/formatters';
import { generateAppId } from '../data/initialData';

// Helper to extract Spreadsheet ID from user input (can be full URL or raw ID)
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if it's a URL like https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}

// Google Sheets API Header Keywords
const HEADER_KEYWORDS = {
  OP_TYPE: ['OPERASYON', 'TİP', 'TRANSFER'],
  PATIENT: ['HASTA', 'PATIENT', 'HASTA İSMİ', 'HASTA ADI'],
  PAX: ['PAX', 'KİŞİ', 'KİŞİ SAYISI'],
  PICKUP_TIME: ['ALINIŞ SAATİ', 'ALINIŞ', 'PICKUP_TIME', 'SAAT'],
  DROP_TIME: ['BIRAKILIŞ SAATİ', 'BIRAKILIŞ', 'DROP_TIME', 'BİTİŞ'],
  PICKUP_LOC: ['KONUM', 'ALINIŞ YERİ', 'PICKUP_LOC', 'OTEL'],
  DROP_LOC: ['BIRAKILIŞ YERİ', 'DROP_LOC', 'HEDEF', 'GİDİLECEK'],
  DRIVER: ['ŞOFÖR', 'SOFOR', 'DRIVER', 'SÜRÜCÜ'],
  PROCEDURE: ['İŞLEM', 'ISLEM', 'TEDAVİ', 'PROCEDURE'],
  GUEST: ['GUEST', 'HOSTES', 'DANIŞMAN', 'REHBER'],
  DOCTOR: ['DOKTOR', 'DOCTOR', 'HEKİM'],
  AGENT: ['AGENT', 'ACENTE', 'TEMSİLCİ'],
  ESTIMATED_EXIT: [
    'TAHMİNİ ÇIKIŞ', 
    'TAHMİNİ ÇIKIŞ BUTONU', 
    'TAHMINI CIKIS BUTONU', 
    'TAHMINI CIKIS', 
    'ÇIKIŞ SAATİ', 
    'CIKIS SAATI', 
    'ESTIMATED EXIT', 
    'ÇIKIŞ SÜRESİ', 
    'TAHMİNİ ÇIKIŞ SÜRESİ', 
    'TAHMİNİ ÇIKIŞ SAATİ', 
    'ÇIKIŞ'
  ]
};

// M Sütunu Sabit İndeksi (0 tabanlı: A=0, ..., M=12)
export const COLUMN_M_INDEX = 12;

export function colIndexToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function findColIndex(headers: string[], keywords: string[]): number {
  return headers.findIndex(h => {
    const clean = String(h || '').trim().toUpperCase();
    return keywords.some(k => clean.includes(k));
  });
}

export interface SheetMetadata {
  title: string;
  sheets: { id: number; title: string }[];
}

export async function fetchSpreadsheetInfo(spreadsheetId: string, accessToken: string): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Sheets okunamadı (Kod: ${res.status})`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    id: s.properties?.sheetId,
    title: s.properties?.title
  }));

  return {
    title: data.properties?.title || 'E-Tablo',
    sheets
  };
}

export async function fetchOperationsDirectFromSheets(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<{ operations: OperationItem[]; actualSheetName: string }> {
  // 1. Belirtilen sayfa adı veya ilk aktif sayfayı dene
  let fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A1:Z500`)}?valueRenderOption=FORMATTED_VALUE`;
  let res = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Eğer belirtilen sayfa adı bulunamazsa doğrudan ilk sayfayı oku (A1:Z500)
  if (!res.ok) {
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z500?valueRenderOption=FORMATTED_VALUE`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (fallbackRes.ok) {
      res = fallbackRes;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'E-Tablo verisi okunamadı. Lütfen tablonuzun bu Google hesabına açık olduğundan emin olun.');
    }
  }

  const json = await res.json();
  const rows: string[][] = json.values || [];

  // Yanıttan gerçek sayfa adını yakala (örn: "'GÜNLÜK OPERASYON'!A1:Z500" veya "'Sayfa1'!A1:Z500")
  let actualSheetName = sheetName;
  if (json.range) {
    const matched = json.range.match(/^(?:'([^']+)'|([^!]+))!/);
    if (matched) {
      actualSheetName = matched[1] || matched[2] || sheetName;
    }
  }

  if (rows.length < 2) return { operations: [], actualSheetName };

  const headers = rows[0].map(h => String(h || '').trim());
  const colMap = {
    opType: findColIndex(headers, HEADER_KEYWORDS.OP_TYPE),
    patient: findColIndex(headers, HEADER_KEYWORDS.PATIENT),
    pax: findColIndex(headers, HEADER_KEYWORDS.PAX),
    pickupTime: findColIndex(headers, HEADER_KEYWORDS.PICKUP_TIME),
    dropTime: findColIndex(headers, HEADER_KEYWORDS.DROP_TIME),
    pickupLoc: findColIndex(headers, HEADER_KEYWORDS.PICKUP_LOC),
    dropLoc: findColIndex(headers, HEADER_KEYWORDS.DROP_LOC),
    driver: findColIndex(headers, HEADER_KEYWORDS.DRIVER),
    proc: findColIndex(headers, HEADER_KEYWORDS.PROCEDURE),
    guest: findColIndex(headers, HEADER_KEYWORDS.GUEST),
    doctor: findColIndex(headers, HEADER_KEYWORDS.DOCTOR),
    agent: findColIndex(headers, HEADER_KEYWORDS.AGENT),
    estimatedExit: findColIndex(headers, HEADER_KEYWORDS.ESTIMATED_EXIT)
  };

  const operations: OperationItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Eğer patient kolonu başlıktan bulunamazsa varsayılan 2. kolon (B sütunu)
    const pColIdx = colMap.patient >= 0 ? colMap.patient : 1;
    const patientName = String(row[pColIdx] || '').trim();
    if (!patientName) continue;

    const opType = colMap.opType >= 0 ? String(row[colMap.opType] || '') : 'Klinik İşlemi';
    const pax = colMap.pax >= 0 ? String(row[colMap.pax] || '') : '';
    const rawPickup = colMap.pickupTime >= 0 ? String(row[colMap.pickupTime] || '') : '';
    const rawDrop = colMap.dropTime >= 0 ? String(row[colMap.dropTime] || '') : '';
    const pickupTime = cleanTimeString(rawPickup) || '09:00';
    const dropTime = cleanTimeString(rawDrop);
    const pickupLoc = colMap.pickupLoc >= 0 ? String(row[colMap.pickupLoc] || '') : '';
    const dropLoc = colMap.dropLoc >= 0 ? String(row[colMap.dropLoc] || '') : '';
    const driver = colMap.driver >= 0 ? String(row[colMap.driver] || '') : 'ATAMA YAPILMADI';
    const procedure = colMap.proc >= 0 ? String(row[colMap.proc] || '') : '';
    const guest = colMap.guest >= 0 ? String(row[colMap.guest] || '') : '';
    const doctor = colMap.doctor >= 0 ? String(row[colMap.doctor] || '') : '';
    const agent = colMap.agent >= 0 ? String(row[colMap.agent] || '') : '';
    
    // M Sütunu (13. sütun / index 12) veya başlıktan eşleşen sütun
    const exitColIdx = colMap.estimatedExit >= 0 ? colMap.estimatedExit : COLUMN_M_INDEX;
    const rawExit = exitColIdx >= 0 && row.length > exitColIdx ? String(row[exitColIdx] || '') : '';
    const estimatedExitTime = cleanTimeString(rawExit) || null;

    const appId = generateAppId(patientName, pickupTime, opType, pickupLoc);

    operations.push({
      appId,
      operationType: opType,
      patientName,
      pax,
      pickupTime,
      dropTime,
      pickupLocation: pickupLoc,
      dropLocation: dropLoc,
      driver,
      procedure,
      guest,
      doctor,
      agent,
      status: estimatedExitTime ? 'klinikte' : 'bekliyor',
      statusColor: estimatedExitTime ? 'fistik_yesili' : 'default',
      estimatedExitTime,
      isReady: false
    });
  }

  return { operations, actualSheetName };
}

// Color Codes for Google Sheets Row Background
export const STATUS_ROW_COLORS: Record<StatusColor, { red: number; green: number; blue: number }> = {
  sari: { red: 0.99, green: 0.94, blue: 0.54 },         // Sarı: #FEF08A
  fistik_yesili: { red: 0.74, green: 0.95, blue: 0.39 },// Fıstık Yeşili: #BEF264
  kirmizi: { red: 0.99, green: 0.79, blue: 0.79 },      // Kırmızı: #FECACA
  mavi: { red: 0.73, green: 0.90, blue: 0.99 },         // Mavi: #BAE6FD
  default: { red: 1.0, green: 1.0, blue: 1.0 }          // Beyaz: #FFFFFF
};

export async function setRowColorInSheets(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  colorKey: StatusColor,
  accessToken: string
) {
  const color = STATUS_ROW_COLORS[colorKey] || STATUS_ROW_COLORS.default;
  const body = {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: color.red,
                green: color.green,
                blue: color.blue
              }
            }
          },
          fields: 'userEnteredFormat.backgroundColor'
        }
      }
    ]
  };

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * Tahmini Çıkış Saatini Google Sheets tablosuna doğrudan aktarır.
 * "TAHMİNİ ÇIKIŞ" başlıklı sütunu bulur; eğer tabloda henüz yoksa otomatik olarak
 * 1. satırın sonuna "TAHMİNİ ÇIKIŞ" başlığını açar ve hastanın satırına saati yazar.
 */
export async function updateEstimatedExitInSheets(
  spreadsheetId: string,
  sheetName: string,
  patientName: string,
  exitTime: string,
  accessToken: string
): Promise<{ success: boolean; actualSheetName?: string; error?: string }> {
  try {
    let encodedRange = encodeURIComponent(`${sheetName}!A1:Z500`);
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`;
    let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

    // Eğer belirtilen sayfa adına ulaşılamazsa ilk sayfayı dene
    if (!res.ok) {
      const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z500?valueRenderOption=FORMATTED_VALUE`;
      const fallbackRes = await fetch(fallbackUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (fallbackRes.ok) {
        res = fallbackRes;
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || 'E-Tabloya erişim izni yok veya tablo bulunamadı.' };
      }
    }

    const json = await res.json();
    let actualSheetName = sheetName;
    if (json.range) {
      const matched = json.range.match(/^(?:'([^']+)'|([^!]+))!/);
      if (matched) {
        actualSheetName = matched[1] || matched[2] || sheetName;
      }
    }

    const rows: string[][] = json.values || [];
    if (rows.length < 1) return { success: false, error: 'Tablo boş görünüyor.' };

    const headers = (rows[0] || []).map(h => String(h || '').trim());
    let exitCol = findColIndex(headers, HEADER_KEYWORDS.ESTIMATED_EXIT);
    const patientCol = findColIndex(headers, HEADER_KEYWORDS.PATIENT);
    const effectivePatientCol = patientCol >= 0 ? patientCol : 1; // Başlık yoksa B sütunu

    // Eğer başlıktan özel sütun bulunamazsa kullanıcı isteği üzerine doğrudan M Sütununu (index 12) kullan
    if (exitCol < 0) {
      exitCol = COLUMN_M_INDEX; // M sütunu (A=0, ..., M=12)
      
      // M sütununun 1. satır başlığı boşsa "TAHMİNİ ÇIKIŞ" yaz
      if (headers.length <= COLUMN_M_INDEX || !headers[COLUMN_M_INDEX]) {
        const headerCell = `${actualSheetName}!M1`;
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerCell)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ range: headerCell, values: [['TAHMİNİ ÇIKIŞ']] })
          }
        ).catch(() => {});
      }
    }

    // Hasta adına göre ilgili satırı bul (tam eşleşme veya içerme)
    let targetRowIndex = -1;
    const cleanTargetName = patientName.trim().toLowerCase();
    for (let r = 1; r < rows.length; r++) {
      const pName = String(rows[r][effectivePatientCol] || '').trim().toLowerCase();
      if (pName && (pName === cleanTargetName || pName.includes(cleanTargetName) || cleanTargetName.includes(pName))) {
        targetRowIndex = r + 1; // 1 tabanlı satır numarası
        break;
      }
    }

    if (targetRowIndex < 0) {
      return { 
        success: false, 
        error: `"${patientName}" hastası Google Sheets'te bulunamadı. E-Tablodaki hasta ismi ile uygulama isminin eşleştiğinden emin olun.` 
      };
    }

    const cellLetter = colIndexToLetter(exitCol);
    const cellCoord = `${actualSheetName}!${cellLetter}${targetRowIndex}`;
    const cleanTime = cleanTimeString(exitTime) || exitTime;

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellCoord)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ range: cellCoord, values: [[cleanTime]] })
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      return { success: false, error: err.error?.message || 'Google Sheets hücresi güncellenemedi.' };
    }

    return { success: true, actualSheetName };
  } catch (err: any) {
    console.warn('updateEstimatedExitInSheets error:', err);
    return { success: false, error: err.message };
  }
}

