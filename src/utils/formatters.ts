/**
 * Saat ve Metin Temizleme Yardımcıları
 * Google Sheets'ten gelen uzun Date nesnelerini (örn: "Sat Dec 30 1899 08:00:00 GMT+0300"
 * veya "1899-12-30T08:00:00.000Z" veya "08:00:00") her zaman sade ve direkt "08:00" formatına dönüştürür.
 */

export function cleanTimeString(val: any): string {
  if (val === null || val === undefined) return '';
  
  // Date nesnesi geldiyse
  if (val instanceof Date) {
    const hours = String(val.getHours()).padStart(2, '0');
    const minutes = String(val.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '';

  // Eğer doğrudan "08:00" formatındaysa hemen döndür
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  // "8:00" formatındaysa başa 0 ekle -> "08:00"
  if (/^\d{1}:\d{2}$/.test(str)) {
    return `0${str}`;
  }

  // "08:00:00" veya "08:00:00.000" formatındaysa saniyeyi kırp -> "08:00"
  if (/^\d{1,2}:\d{2}:\d{2}/.test(str)) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }

  // Eğer Google Sheets Date string'i geldiyse:
  // Örnek 1: "Sat Dec 30 1899 08:00:00 GMT+0300 (GMT+03:00)"
  // Örnek 2: "1899-12-30T08:00:00.000Z"
  // Örnek 3: "24.09.2026 08:00"
  const match = str.match(/(?:T|\s|^)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }

  // Hiçbir saat eşleşmezse orijinal temiz metni döndür
  return str;
}
