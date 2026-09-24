import { OperationItem, UserProfile } from '../types';
import { cleanTimeString } from '../utils/formatters';

export const INITIAL_USERS: UserProfile[] = [
  // ADMINS
  { id: 'admin-1', name: 'Mitat Aslan', role: 'admin', subRole: 'transfer_sorumlusu', phone: '0532 000 0001', avatarColor: 'bg-emerald-600' },
  { id: 'admin-2', name: 'Klinik Koordinatörü', role: 'admin', subRole: 'klinik_sorumlusu', phone: '0532 000 0002', avatarColor: 'bg-indigo-600' },
  
  // GUESTS (Hasta Danışmanları / Hostesler)
  { id: 'guest-1', name: 'Furkan Yılmaz', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0001', avatarColor: 'bg-blue-600' },
  { id: 'guest-2', name: 'Kursat', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0002', avatarColor: 'bg-teal-600' },
  { id: 'guest-3', name: 'RADMİLA', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0003', avatarColor: 'bg-purple-600' },
  { id: 'guest-4', name: 'Mehmet Ali Güler', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0004', avatarColor: 'bg-amber-600' },
  { id: 'guest-5', name: 'AYÇA BOYACI', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0005', avatarColor: 'bg-rose-600' },
  { id: 'guest-6', name: 'Hazal Koç', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0006', avatarColor: 'bg-fuchsia-600' },
  { id: 'guest-7', name: 'Çağdaş Çırak', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0007', avatarColor: 'bg-cyan-600' },
  { id: 'guest-8', name: 'Ali Essam', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0008', avatarColor: 'bg-emerald-700' },
  { id: 'guest-9', name: 'FIRAT GÖNCÜ', role: 'guest', subRole: 'guest_relations', phone: '0533 111 0009', avatarColor: 'bg-sky-600' },

  // DRIVERS (Şoförler)
  { id: 'driver-1', name: 'OSMAN BEY', role: 'driver', phone: '0534 222 0001', avatarColor: 'bg-orange-600' },
  { id: 'driver-2', name: 'Burak Güleç', role: 'driver', phone: '0534 222 0002', avatarColor: 'bg-amber-700' },
  { id: 'driver-3', name: 'Adnan Coşkun', role: 'driver', phone: '0534 222 0003', avatarColor: 'bg-violet-600' },
  { id: 'driver-4', name: 'Ertan Acar', role: 'driver', phone: '0534 222 0004', avatarColor: 'bg-blue-700' },
  { id: 'driver-5', name: 'CUMA ÇÜRÜK', role: 'driver', phone: '0534 222 0005', avatarColor: 'bg-red-600' },
  { id: 'driver-6', name: 'Metin bey', role: 'driver', phone: '0534 222 0006', avatarColor: 'bg-teal-700' },
  { id: 'driver-7', name: 'Ramazan Taskın', role: 'driver', phone: '0534 222 0007', avatarColor: 'bg-pink-600' },
  { id: 'driver-8', name: 'Kiralama ( 533-611-3235)', role: 'driver', phone: '0533 611 3235', avatarColor: 'bg-zinc-600' },
  { id: 'driver-9', name: 'DIŞ KİRALAMA TEK YÖN', role: 'driver', phone: '0533 000 9999', avatarColor: 'bg-stone-600' }
];

export const RAW_CSV_DATA = `OPERASYON TİPİ,HASTA İSMİ,PAX,ALINIŞ SAATİ,BIRAKILIŞ SAATİ,KONUM,BIRAKILIŞ YERİ,ŞOFÖR,İŞLEM,GUEST,DOKTOR,AGENT
Türkiye'ye Yeni Geliş,Maria Mirabela Muntean / 2. Visit,,00:55,01:55,MAN-AYT / AYT- MAN,NUN HOTEL,Kiralama ( 533-611-3235),,FIRAT GÖNCÜ,DT.M.GÖKMEN KAYA,Doğukan Demirkaya
Klinik İşlemi,Rebecca Gregory,2* rebecca,07:59,08:50,Win Of Lara,Smiles Clinic,OSMAN BEY,BEYAZLATMA,Kursat,DT.MELDA ESRA DÖNMEZ,TALİP BAŞOĞLU
Klinik İşlemi,Liam Edward Purdie / Kontrol,2*rebecca,08:00,08:50,Wind of Lara,SMILES CLINIC,OSMAN BEY,KONTROL YAKINI BEYAZLATMA,Kursat,DT.MELDA ESRA DÖNMEZ,Gökhan Altunbey
Klinik İşlemi,Kovalova Vira / TK Smiles 2. Visit,2*yurii,08:00,09:00,NFK The House Hotel,SMILES CLINIC,Burak Güleç,"ÖLÇÜ + KESİM // 11:00 ÇEKİM 28,38 NUMARA DT EMRE",RADMİLA,DOĞAN HOCA,TK SMILES
Klinik İşlemi,Mykhailenko Oleksandra / TK Smiles,2,08:00,09:00,The Corner Park Hotel,SMILES CLINIC,Burak Güleç,EVRAK HAZIR 6 NEODENT 8 ZIRKON,RADMİLA,EMRE KARACİF,TK SMILES
Klinik İşlemi,KRISHNA BHATT / 2. Visit,2,08:10,09:00,LARA HOTEL,SMILES CLINIC,OSMAN BEY,TEKRAR REÇİNE,Mehmet Ali Güler,DT.SELVANUR ŞİMŞİT,MERVE EHLİZ
Klinik İşlemi,Stuart Taylor / RPT,2,08:20,09:00,Lorem Otel,SMILES CLINIC,Adnan Coşkun,KONTROL +BİTİM,AYÇA BOYACI,DT. ZİYA YILDIRIM,Mert Sezer
Klinik İşlemi,Lee Tottey,2* tottey,09:10,10:00,Falcon,SMILES CLINIC,Ertan Acar,PMMA BİTİM,Kursat,ELİF AYDOĞDU,Mert Sezer
Klinik İşlemi,Angela Helen Tottey,2*TOTTEY,09:10,11:00,Falcon,SMILES CLINIC,Ertan Acar,PMMA BİTİM,Kursat,ELİF AYDOĞDU,Mert Sezer
Klinik İşlemi,Alison Mchamish / 2. Visit,,09:20,09:45,Aspen Otel Kaleiçi,SMILES CLINIC,CUMA ÇÜRÜK,ÖLÇÜ 25 AİDİTE,Çağdaş Çırak,DOĞAN HOCA,Sıla Özdemir
Klinik İşlemi,Vivienne Leach,2,09:30,10:00,OPTIMUM,SMILES CLINIC,Metin bey,PMMA BİTİM,Hazal Koç,DT.SELVANUR ŞİMŞİT,Vahap
Klinik İşlemi,Alla Andrusenko / TK Smiles,1,09:35,10:00,Avion Suite Hotel,SMILES CLINIC,Metin bey,PMMA BİTİM,RADMİLA,DT. ZİYA YILDIRIM,RADMILA
Klinik İşlemi,Timothy Edward Chubb,2*chubb,10:20,11:00,Wyndham Garden Lara Otel,SMILES CLINIC,Burak Güleç,MUMLU PROVA YA DA 19:00 PMMA REÇİNE DT ELİF,Mehmet Ali Güler,DT.MELDA ESRA DÖNMEZ,Kevser Bilgin
Klinik İşlemi,Mark Howell / RPT,,10:45,10:45,OTEL VE TRANSFER YOK,SMILES CLINIC,ATAMA YAPILMADI,RPT SESBİ HASTANIN ÜST ÇENE PROTEZİ SALLANIYOR,AYÇA BOYACI,DT.SELVANUR ŞİMŞİT,Yaman Doryan
Klinik İşlemi,Adam Summers / RPT,6 pax,10:55,11:00,AG Hotels,SMILES CLINIC,Adnan Coşkun,BİTİM,FIRAT GÖNCÜ,DT. ZİYA YILDIRIM,Vahap
Klinik İşlemi,Johnathan Dreijers / 2. Visit,1,11:00,12:00,GRAND PARK LARA,SMILES CLINIC,OSMAN BEY,BAR + DENTİN,Furkan Yılmaz,DT. ZİYA YILDIRIM,Akif Çınar
Klinik İşlemi,Sonata Žiogienė / TK Smiles Kontrol,2*Arunas,11:15,12:00,ADONİS HOTEL,SMILES CLINIC,Ramazan Taskın,KONTROL,RADMİLA,EMRE KARACİF,TK SMILES
Klinik İşlemi,Arūnas Žiogas / TK Smile / RPT,2*arunas,11:15,12:15,ADONİS HOTEL,SMILES CLINIC,Ramazan Taskın,RPT 5 ZIRCONIUM 3 MULTİ,RADMİLA,ELİF AYDOĞDU,TK SMILES
Klinik İşlemi,Marius Veresezan,1,11:15,12:00,OPTIMUM,SMILES CLINIC,OSMAN BEY,DİŞLİ PROVA,Mehmet Ali Güler,DT.MELDA ESRA DÖNMEZ,Vahap
Klinik İşlemi,Jessie Manlulu / RPT,null,11:30,12:00,Lorem Otel,SMILES CLINIC,CUMA ÇÜRÜK,KONTROL,Ali Essam,ELİF AYDOĞDU,UĞUR ABALI
Klinik İşlemi,Viktoriaa Kutepova / RPT,,11:50,12:30,Lara Park Hotel,SMILES CLINIC,Kiralama ( 533-611-3235),KONTROL,RADMİLA,DT.M.GÖKMEN KAYA,Emil
Klinik İşlemi,Kutepov Andrii,1,11:50,13:00,Lara Park Hotel,SMILES CLINIC,Kiralama ( 533-611-3235),EVRAK HAZIR 6 ÇEKİM,RADMİLA,EMRE KARACİF,RADMILA
Klinik İşlemi,Keith Chinn / 2. Visit,2 TEKERLEKLİ SANDALYE,12:00,13:00,LARA HOTEL,SMILES CLINIC,Metin bey,TEKRAR REÇİNE,Hazal Koç,DOĞAN HOCA,Mehti Abed
Türkiye'ye Yeni Geliş,Vaskin Oleksandr / 2. Visit,1,12:05,13:05,XQ321 / XQ320,Gvar Otel,Kiralama ( 533-611-3235),,RADMİLA,DT.M.GÖKMEN KAYA,Emil
Klinik İşlemi,Maria Mirabela Muntean / 2. Visit,2,12:15,13:15,NUN HOTEL,SMILES CLINIC,Metin bey,ÖLÇÜ 28 ZİRKON,FIRAT GÖNCÜ,DT. ZİYA YILDIRIM,Doğukan Demirkaya
Klinik İşlemi,Karen Calvert / 2. Visit,2*Dogukan,12:30,13:00,GRAND PARK LARA,SMILES CLINIC,DIŞ KİRALAMA TEK YÖN,BİTİM,AYÇA BOYACI,DT.SELVANUR ŞİMŞİT,Doğukan Demirkaya
Klinik İşlemi,Simon Calvert / 2. Visit,2*Dogukan,12:30,14:00,GRAND PARK LARA,SMILES CLINIC,DIŞ KİRALAMA TEK YÖN,BİTİM,AYÇA BOYACI,ELİF AYDOĞDU,Doğukan Demirkaya
Klinik İşlemi,Lindsay Denholm / 2. Visit,2* denholm,12:45,14:30,GRAND PARK LARA,SMILES CLINIC,Adnan Coşkun,BAR +DENTİN,Hazal Koç,DOĞAN HOCA,Vahap
Klinik İşlemi,Gary Stocking (Gary King) / RPT,,13:00,13:30,Kaleiçi Sabah Pansiyon,SMILES CLINIC,Kiralama ( 533-611-3235),KONTROL,Çağdaş Çırak,DT.M.GÖKMEN KAYA,Murat Tunç
Klinik İşlemi,Gary Cox,2,13:00,14:00,OPTIMUM,SMILES CLINIC,Adnan Coşkun,KONTROL,Ali Essam,DT.SELVANUR ŞİMŞİT,Mert Sezer
Klinik İşlemi,Julian Bradley / 2. Visit,2,13:20,14:30,RAMADA RESORT LARA,SMILES CLINIC,Burak Güleç,KONTROL,Mehmet Ali Güler,DT.SELVANUR ŞİMŞİT,Işıl Gündoğdu
Klinik İşlemi,Craig Miller,2,13:30,14:00,NUN HOTEL,SMILES CLINIC,CUMA ÇÜRÜK,4 UYE PMMA BİTİM + DTT,Mehmet Ali Güler,DT.MELDA ESRA DÖNMEZ,Nuray Can
Klinik İşlemi,Monika Janas,2* monika,14:00,17:30,Lorem Otel,SMILES CLINIC,Ramazan Taskın,EVRAK HAZIR 6 MEDENTİKA -PRP VAR -UK IMZA DT EMRE,Çağdaş Çırak,EMRE KARACIF,Mert Sezer
Klinik İşlemi,Daniel Borowski,2* monika,14:00,14:30,Lorem Otel,SMILES CLINIC,Ramazan Taskın,EVRAK HAZIR PMMA IMZA -PRP VAR - IMPLANT// 17:00 PMMA ÖLÇÜ DT DOĞAN,Çağdaş Çırak,EMRE KARACIF,Mert Sezer
Klinik İşlemi,Shelly Hallawell,2*hallawell,14:10,16:00,OPTIMUM,SMILES CLINIC,OSMAN BEY,BİTİM,Ali Essam,ELİF AYDOĞDU,Akif Çınar
Klinik İşlemi,Stephanie Gargett,1,14:10,15:00,OPTIMUM,SMILES CLINIC,OSMAN BEY,PMMA ÖLÇÜ,Kursat,ELİF AYDOĞDU,Vahap
Klinik İşlemi,June Hallawell,2*hallawell,14:10,15:00,OPTIMUM,SMILES CLINIC,OSMAN BEY,DİŞLİ PROVA,Ali Essam,DT.MELDA ESRA DÖNMEZ,Akif Çınar
Klinik İşlemi,Karen Wood,2,14:25,15:00,Lorem Otel,SMILES CLINIC,OSMAN BEY,PMMA REÇİNE ?,Furkan Yılmaz,DT.SELVANUR ŞİMŞİT,Mehti Abed
Klinik İşlemi,Paul Dobbing / 2. Visit,3,15:20,16:00,GRAND PARK LARA,SMILES CLINIC,CUMA ÇÜRÜK,BİTİM,Mehmet Ali Güler,DT.SELVANUR ŞİMŞİT,Vahap
Klinik İşlemi,Wayne Adams / 2. Visit,1,15:20,16:30,LARA HOTEL,SMILES CLINIC,Metin bey,BİTİM,Çağdaş Çırak,DT. ZİYA YILDIRIM,Kevser Bilgin
Klinik İşlemi,Aidan Byrne,1,15:20,16:00,OPTIMUM,SMILES CLINIC,Metin bey,DİŞLİ PROVA,Furkan Yılmaz,DT.MELDA ESRA DÖNMEZ,Sıla Özdemir
Klinik İşlemi,David Roger Needs / MSD,,15:20,16:00,LARA HOTEL,SMILES CLINIC,Metin bey,PMMA BİTİM,Hazal Koç,DOĞAN HOCA,Sıla MSD
Klinik İşlemi,Kezban Baldemir,2*AHMET BALDEMİR,16:00,16:00,OTEL VE TRANSFER YOK,SMILES CLINIC,ATAMA YAPILMADI,KONSULTASYON + KONTROL,Kursat,DT.M.GÖKMEN KAYA,PINAR HANIM (GUEST)
Klinik İşlemi,Serhii Konar/ RPT,,16:20,17:00,PORTO BELLO HOTEL RESORT,SMILES CLINIC,Kiralama ( 533-611-3235),KONTROL,RADMİLA,EMRE KARACIF,Emil
Klinik İşlemi,Sam Evans / 2. Visit,yoh,16:20,17:30,GRAND PARK LARA,SMILES CLINIC,Adnan Coşkun,REÇİNE PROVA,AYÇA BOYACI,ELİF AYDOĞDU,Mert Sezer
Klinik İşlemi,JOSH ELLIS,1,16:20,17:00,QINN HOTEL,SMILES CLINIC,Kiralama ( 533-611-3235),DİREKT BİTİM,AYÇA BOYACI,DT.M.GÖKMEN KAYA,Sıla Özdemir
Klinik İşlemi,Salim Afzali / 2. Visit,1,17:00,17:00,E1-101 SMILES HOME,SMILES CLINIC,ATAMA YAPILMADI,DENTİN PROVA ?,Hazal Koç,DT.SELVANUR ŞİMŞİT,YÜKSEL YAKAR
Türkiye'den Gidiş,Haleema Bibi / 3. Visit,,17:00,22:55,Granada Luxury Belek Otel,XQ585 / XQ584,Kiralama ( 533-611-3235),,Mehmet Ali Güler,,Vahap
Klinik İşlemi,Haleema Bibi / 3. Visit,2,17:00,18:00,Granada Luxury Belek Otel,SMILES CLINIC,Kiralama ( 533-611-3235),KONTROL SONRASINDA HAVALIMANI,Mehmet Ali Güler,DT.SELVANUR ŞİMŞİT,Vahap
Klinik İşlemi,Miriam Davies / 2. Visit,2,17:10,18:30,GRAND PARK LARA,SMILES CLINIC,Metin bey,KONTROL,Furkan Yılmaz,ELİF AYDOĞDU,Vahap
Klinik İşlemi,Bailey page,5,17:10,18:00,GRAND PARK LARA,SMILES CLINIC,Metin bey,BİTİM,Çağdaş Çırak,DOĞAN HOCA,TALİP BAŞOĞLU
Klinik İşlemi,Lee waterman,2*waterman,17:10,19:30,GRAND PARK LARA,SMILES CLINIC,Metin bey,PMMA BİTİM,Kursat,DT. ZİYA YILDIRIM,TALİP BAŞOĞLU
Klinik İşlemi,Sarah Dean,2*waterman,17:10,18:00,GRAND PARK LARA,SMILES CLINIC,Metin bey,BİTİM // BOTOKS DT GOKMEN,Kursat,DT. ZİYA YILDIRIM,TALİP BAŞOĞLU
Klinik İşlemi,Maya Varga / 2. Visit,2,17:25,18:30,LARA HOTEL,SMILES CLINIC,Burak Güleç,BİTİM,AYÇA BOYACI,DT.SELVANUR ŞİMŞİT,AHMET DENİZHAN ALTUN
Türkiye'den Gidiş,Stuart Taylor / RPT,,18:15,21:15,Lorem Otel,LS653 / LS654,Kiralama ( 533-611-3235),,Kursat,DT.M.GÖKMEN KAYA,Mert Sezer
Türkiye'den Gidiş,Lisa Fenn / Kontrol,,19:15,22:15,Palmora Lara Hotel,HAVALİMANI TRANSFERİ YOK,ATAMA YAPILMADI,,AYÇA BOYACI,DT.M.GÖKMEN KAYA,Fırat Balbozan
Türkiye'den Gidiş,Nicole Fenn,,19:15,22:15,Palmora Lara Hotel,HAVALİMANI TRANSFERİ YOK,ATAMA YAPILMADI,,AYÇA BOYACI,,Ayça Boyacı
Türkiye'ye Yeni Geliş,Paulina Karolina Kajak / 2. Visit,,20:05,21:05,XQ593 / XQ594,GRAND PARK LARA,OSMAN BEY,,Çağdaş Çırak,DOKTOR ATANMADI,Vahap
Türkiye'ye Yeni Geliş,Bozena Kajak,,20:05,21:05,XQ593 / XQ594,GRAND PARK LARA,Ertan Acar,,FIRAT GÖNCÜ,,YÜKSEL YAKAR
Türkiye'ye Yeni Geliş,Daniel Gordon Mitchell / RPT,,21:30,22:30,LS1557 / XQ524,GRAND PARK LARA,Kiralama ( 533-611-3235),,Çağdaş Çırak,DT.M.GÖKMEN KAYA,Mert Sezer
Türkiye'ye Yeni Geliş,Emilia Magdalena Kranz / RPT,,21:35,22:35,HAVALİMANI TRANSFERİ YOK,OTEL VE TRANSFER YOK,ATAMA YAPILMADI,,Kursat,DT.M.GÖKMEN KAYA,Mert Sezer
Türkiye'ye Yeni Geliş,Darrel Ward,1,23:05,23:55,LS291 / LS292,NUN HOTEL,Kiralama ( 533-611-3235),,Ali Essam,,Mert Sezer`;

// Satır numarasına asla bağımlı olmayan deterministik APP_ID üretici
export function generateAppId(patientName: string, pickupTime: string, opType: string, pickupLoc: string): string {
  const clean = `${patientName}_${pickupTime}_${opType}_${pickupLoc}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `OP_${hex}_${clean.slice(0, 16)}`;
}

// CSV Satırını ayrıştırıcı (tırnak içindeki virgülleri bozmaz)
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvToOperations(csvText: string): OperationItem[] {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toUpperCase());
  
  const getColIndex = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const idxOpType = getColIndex(['OPERASYON', 'TİP']);
  const idxPatient = getColIndex(['HASTA', 'PATIENT']);
  const idxPax = getColIndex(['PAX', 'KİŞİ']);
  const idxPickupTime = getColIndex(['ALINIŞ SAATİ', 'ALINIŞ', 'PICKUP_TIME']);
  const idxDropTime = getColIndex(['BIRAKILIŞ SAATİ', 'BIRAKILIŞ', 'DROP_TIME']);
  const idxPickupLoc = getColIndex(['KONUM', 'ALINIŞ YERİ', 'PICKUP_LOC']);
  const idxDropLoc = getColIndex(['BIRAKILIŞ YERİ', 'DROP_LOC', 'HEDEF']);
  const idxDriver = getColIndex(['ŞOFÖR', 'SOFOR', 'DRIVER']);
  const idxProc = getColIndex(['İŞLEM', 'ISLEM', 'PROCEDURE']);
  const idxGuest = getColIndex(['GUEST', 'HOSTES', 'DANIŞMAN']);
  const idxDoctor = getColIndex(['DOKTOR', 'DOCTOR', 'HEKİM']);
  const idxAgent = getColIndex(['AGENT', 'ACENTE', 'TEMSİLCİ']);

  const operations: OperationItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const opType = (idxOpType >= 0 ? cols[idxOpType] : cols[0]) || 'Klinik İşlemi';
    const patientName = (idxPatient >= 0 ? cols[idxPatient] : cols[1]) || `Hasta ${i}`;
    const pax = (idxPax >= 0 ? cols[idxPax] : cols[2]) || '';
    const rawPickupTime = (idxPickupTime >= 0 ? cols[idxPickupTime] : cols[3]) || '09:00';
    const rawDropTime = (idxDropTime >= 0 ? cols[idxDropTime] : cols[4]) || '';
    const pickupTime = cleanTimeString(rawPickupTime) || '09:00';
    const dropTime = cleanTimeString(rawDropTime);
    const pickupLoc = (idxPickupLoc >= 0 ? cols[idxPickupLoc] : cols[5]) || '';
    const dropLoc = (idxDropLoc >= 0 ? cols[idxDropLoc] : cols[6]) || '';
    const driver = (idxDriver >= 0 ? cols[idxDriver] : cols[7]) || 'ATAMA YAPILMADI';
    const procedure = (idxProc >= 0 ? cols[idxProc] : cols[8]) || '';
    const guest = (idxGuest >= 0 ? cols[idxGuest] : cols[9]) || '';
    const doctor = (idxDoctor >= 0 ? cols[idxDoctor] : cols[10]) || '';
    const agent = (idxAgent >= 0 ? cols[idxAgent] : cols[11]) || '';

    const appId = generateAppId(patientName, pickupTime, opType, pickupLoc);

    // Initial default mock states with intelligent distribution for demo fidelity
    let status: OperationItem['status'] = 'bekliyor';
    let statusColor: OperationItem['statusColor'] = 'default';
    let estimatedExitTime: string | null = null;
    let isReady = false;
    let lastAction: string | null = null;
    let lastActionTime: string | null = null;
    let lastActionUser: string | null = null;

    // Simulate realistic morning/afternoon clinic states for realistic operation experience
    if (i === 1) {
      status = 'tamamlandi';
      statusColor = 'kirmizi';
      lastAction = 'Otele Bırakıldı';
      lastActionTime = '02:00';
      lastActionUser = 'Kiralama (Driver)';
    } else if (i === 2) {
      status = 'hazir';
      statusColor = 'fistik_yesili';
      isReady = true;
      estimatedExitTime = '11:10';
      lastAction = 'Hazır olarak işaretlendi';
      lastActionTime = '10:45';
      lastActionUser = 'Kursat (Guest)';
    } else if (i === 3) {
      status = 'klinikte';
      statusColor = 'sari';
      estimatedExitTime = '11:20';
      lastAction = 'Kliniğe Bırakıldı';
      lastActionTime = '08:50';
      lastActionUser = 'OSMAN BEY (Driver)';
    } else if (i === 4) {
      status = 'klinikte';
      statusColor = 'sari';
      estimatedExitTime = '12:00';
      lastAction = 'Kliniğe Bırakıldı';
      lastActionTime = '09:00';
      lastActionUser = 'Burak Güleç (Driver)';
    } else if (i === 6) {
      status = 'klinikte';
      statusColor = 'sari';
      estimatedExitTime = '12:30';
      lastAction = 'Kliniğe Bırakıldı';
      lastActionTime = '09:02';
      lastActionUser = 'OSMAN BEY (Driver)';
    } else if (i === 7) {
      status = 'klinikte';
      statusColor = 'sari';
      estimatedExitTime = '13:00';
      lastAction = 'Kliniğe Bırakıldı';
      lastActionTime = '09:05';
      lastActionUser = 'Adnan Coşkun (Driver)';
    } else if (i === 8) {
      status = 'alindi';
      statusColor = 'mavi';
      lastAction = 'Otelden Alındı';
      lastActionTime = '09:12';
      lastActionUser = 'Ertan Acar (Driver)';
    }

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
      status,
      statusColor,
      estimatedExitTime,
      isReady,
      lastAction,
      lastActionTime,
      lastActionUser,
      notes: null
    });
  }

  return operations;
}

export const INITIAL_OPERATIONS: OperationItem[] = parseCsvToOperations(RAW_CSV_DATA);
