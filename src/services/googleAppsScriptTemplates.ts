export interface AppsScriptFile {
  name: string;
  description: string;
  code: string;
}

export const APPS_SCRIPT_CONFIG_GS = `/**
 * ============================================================================
 * HEALTH TOUR OPERASYON MERKEZİ - CONFIG.GS
 * ============================================================================
 * Tüm yapılandırma ayarları, kolon eşleştirmeleri ve sayfa isimleri burada toplanmıştır.
 * Kolonlar asla A, B, C gibi sabit harflerle değil, dinamik BAŞLIK adlarıyla bulunur.
 */

var CONFIG = {
  // EĞER BU SCRİPT BAĞIMSIZ (STANDALONE) ÇALIŞTIRILIYORSA AŞAĞIYA GOOGLE SHEET ID'NİZİ GİRİN.
  // EĞER E-TABLO İÇİNDEN (Uzantılar -> Apps Script) ÇALIŞIYORSA BOŞ BIRAKABİLİRSİNİZ.
  SPREADSHEET_ID: "", 

  // SAYFA İSİMLERİ
  SHEETS: {
    OPERATIONS: "GÜNLÜK OPERASYON", // Ana günlük operasyon tablonuz (Kullanıcılarınızın kullandığı sayfa)
    APP_STATE: "APP_STATE",           // Gizli sistem durumu sayfası (Teknik APP_ID, Durum, Tahmini Çıkış)
    ACTION_LOG: "ACTION_LOG",         // Gizli işlem geçmişi & denetim sayfası
    USERS: "USERS",                   // Kullanıcı & Rol listesi
    SETTINGS: "SETTINGS"              // Sistem ayarları
  },

  // KOLON BAŞLIK İSİMLERİ (Türkçe ve alternatif eşleşmeler)
  // Sheets'teki başlık isimleriniz bunlardan biriyle eşleştiği sürece kolon sırası değişse bile kod çalışır.
  COLUMNS: {
    OPERATION_TYPE: ["OPERASYON TİPİ", "OPERASYON", "TRANSFER TİPİ", "OPERATION_TYPE"],
    PATIENT_NAME:   ["HASTA İSMİ", "HASTA", "PATIENT", "PATIENT_NAME", "HASTA ADI"],
    PAX:            ["PAX", "KİŞİ", "KİŞİ SAYISI", "YOLCU"],
    PICKUP_TIME:    ["ALINIŞ SAATİ", "ALINIŞ", "SAAT", "PICKUP_TIME", "BAŞLANGIÇ"],
    DROP_TIME:      ["BIRAKILIŞ SAATİ", "BIRAKILIŞ", "BİTİŞ", "DROP_TIME"],
    PICKUP_LOCATION:["KONUM", "ALINIŞ YERİ", "ALINIŞ NOKTASI", "PICKUP_LOCATION"],
    DROP_LOCATION:  ["BIRAKILIŞ YERİ", "HEDEF", "GİDİLECEK YER", "DROP_LOCATION"],
    DRIVER:         ["ŞOFÖR", "SOFOR", "DRIVER", "SÜRÜCÜ"],
    PROCEDURE:      ["İŞLEM", "ISLEM", "TEDAVİ", "PROCEDURE"],
    GUEST:          ["GUEST", "HOSTES", "DANIŞMAN", "GUEST_RELATIONS", "REHBER"],
    DOCTOR:         ["DOKTOR", "DOCTOR", "HEKİM", "DT"],
    AGENT:          ["AGENT", "ACENTE", "TEMSİLCİ"],
    ESTIMATED_EXIT: ["TAHMİNİ ÇIKIŞ", "TAHMİNİ ÇIKIŞ BUTONU", "TAHMİNİ ÇIKIŞ SAATİ", "TAHMİNİ ÇIKIŞ SÜRESİ", "ÇIKIŞ SAATİ", "ESTIMATED_EXIT", "ESTIMATED EXIT", "ÇIKIŞ SÜRESİ", "ÇIKIŞ", "M"]
  },

  // RENK KODLARI (Google Sheets satır arka plan boyama)
  COLORS: {
    KLINIKTE:     "#FEF08A", // SARI: Hasta klinikte
    HAZIR:        "#BEF264", // FISTIK YEŞİLİ: Hasta çıkmaya hazır
    TAMAMLANDI:   "#FECACA", // KIRMIZI: Operasyon tamamlandı / Klinikten alındı
    ALINDI:       "#BAE6FD", // AÇIK MAVİ: Otelden/Havalimanından alındı
    TEMIZLE:      "#FFFFFF"  // BEYAZ / ORİJİNAL
  }
};
`;

export const APPS_SCRIPT_UTILS_GS = `/**
 * ============================================================================
 * UTILS.GS - YARDIMCI FONKSİYONLAR & HASH ÜRETİCİ
 * ============================================================================
 */

var Utils = {
  /**
   * Aktif E-Tabloyu getirir
   */
  getSpreadsheet: function() {
    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * Sayfayı getirir veya yoksa oluşturur
   */
  getOrCreateSheet: function(sheetName) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (sheetName === CONFIG.SHEETS.APP_STATE) {
        sheet.appendRow(["APP_ID", "PATIENT_NAME", "STATUS", "STATUS_COLOR", "ESTIMATED_EXIT", "IS_READY", "PAX", "LAST_ACTION", "LAST_USER", "UPDATED_AT"]);
        sheet.hideSheet();
      } else if (sheetName === CONFIG.SHEETS.ACTION_LOG) {
        sheet.appendRow(["LOG_ID", "TIMESTAMP", "APP_ID", "PATIENT_NAME", "ACTION", "USER_NAME", "USER_ROLE", "PREV_STATE_JSON", "NEW_STATE_JSON"]);
        sheet.hideSheet();
      }
    }
    return sheet;
  },

  /**
   * Satır numarasına asla bağımlı olmayan benzersiz APP_ID üretici
   */
  generateAppId: function(patientName, pickupTime, opType, pickupLoc) {
    var clean = (patientName + "_" + pickupTime + "_" + opType + "_" + pickupLoc)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    var hash = 0;
    for (var i = 0; i < clean.length; i++) {
      var char = clean.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    var hex = Math.abs(hash).toString(16);
    while (hex.length < 8) hex = '0' + hex;
    return "OP_" + hex + "_" + clean.substring(0, 16);
  },

  /**
   * Başlık satırını tarayarak anahtar kelimelere göre kolon indeksini (0 tabanlı) bulur
   */
  findColumnIndex: function(headerRow, candidateKeywords) {
    for (var i = 0; i < headerRow.length; i++) {
      var val = String(headerRow[i] || "").trim().toUpperCase();
      for (var k = 0; k < candidateKeywords.length; k++) {
        if (val.indexOf(candidateKeywords[k].toUpperCase()) !== -1) {
          return i;
        }
      }
    }
    return -1;
  },

  /**
   * Saat değerini sade "HH:mm" (örn: 08:00) formatına getirir.
   * Google Sheets Date nesnesi veya uzun metin döndürse bile kısaltır.
   */
  cleanTime: function(val) {
    if (!val) return "";
    var str = String(val).trim();
    if (str === "" || str === "-" || str === "null") return "";
    var match = str.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      var h = match[1].length === 1 ? "0" + match[1] : match[1];
      return h + ":" + match[2];
    }
    return str;
  },

  /**
   * JSON response döndürür
   */
  jsonResponse: function(data) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
};
`;

export const APPS_SCRIPT_SHEET_SERVICE_GS = `/**
 * ============================================================================
 * SHEETSERVICE.GS - E-TABLO OKUMA VE YAZMA SERVİSİ
 * ============================================================================
 */

var SheetService = {
  /**
   * Ana operasyon sayfasındaki tüm verileri okur ve APP_STATE ile birleştirir.
   */
  getOperations: function() {
    var ss = Utils.getSpreadsheet();
    var mainSheet = ss.getSheetByName(CONFIG.SHEETS.OPERATIONS);
    if (!mainSheet) {
      // Eğer belirtilen isimde sayfa bulunamazsa ilk sayfayı kullanır
      mainSheet = ss.getSheets()[0];
    }

    // getDisplayValues(): Hücredeki metni doğrudan ekranda göründüğü gibi alır ("08:00")
    // getValues() kullanılırsa Google Sheets Date nesnesi üretip uzun tarih stringi döndürür!
    var data = mainSheet.getDataRange().getDisplayValues();
    if (data.length < 2) return [];

    var headers = data[0];
    var colMap = {
      opType:     Utils.findColumnIndex(headers, CONFIG.COLUMNS.OPERATION_TYPE),
      patient:    Utils.findColumnIndex(headers, CONFIG.COLUMNS.PATIENT_NAME),
      pax:        Utils.findColumnIndex(headers, CONFIG.COLUMNS.PAX),
      pickupTime: Utils.findColumnIndex(headers, CONFIG.COLUMNS.PICKUP_TIME),
      dropTime:   Utils.findColumnIndex(headers, CONFIG.COLUMNS.DROP_TIME),
      pickupLoc:  Utils.findColumnIndex(headers, CONFIG.COLUMNS.PICKUP_LOCATION),
      dropLoc:    Utils.findColumnIndex(headers, CONFIG.COLUMNS.DROP_LOCATION),
      driver:     Utils.findColumnIndex(headers, CONFIG.COLUMNS.DRIVER),
      proc:       Utils.findColumnIndex(headers, CONFIG.COLUMNS.PROCEDURE),
      guest:      Utils.findColumnIndex(headers, CONFIG.COLUMNS.GUEST),
      doctor:     Utils.findColumnIndex(headers, CONFIG.COLUMNS.DOCTOR),
      agent:      Utils.findColumnIndex(headers, CONFIG.COLUMNS.AGENT),
      estimatedExit: Utils.findColumnIndex(headers, CONFIG.COLUMNS.ESTIMATED_EXIT)
    };

    // Gizli APP_STATE sayfasındaki dinamik durumları oku
    var appStateMap = this.getAppStateMap();

    var operations = [];

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var patientName = colMap.patient >= 0 ? String(row[colMap.patient] || "").trim() : "";
      if (!patientName) continue; // Boş satırları atla

      var opType     = colMap.opType >= 0 ? String(row[colMap.opType] || "") : "Klinik İşlemi";
      var pax        = colMap.pax >= 0 ? String(row[colMap.pax] || "") : "";
      var pickupTime = colMap.pickupTime >= 0 ? Utils.cleanTime(row[colMap.pickupTime]) : "";
      var dropTime   = colMap.dropTime >= 0 ? Utils.cleanTime(row[colMap.dropTime]) : "";
      var pickupLoc  = colMap.pickupLoc >= 0 ? String(row[colMap.pickupLoc] || "") : "";
      var dropLoc    = colMap.dropLoc >= 0 ? String(row[colMap.dropLoc] || "") : "";
      var driver     = colMap.driver >= 0 ? String(row[colMap.driver] || "") : "ATAMA YAPILMADI";
      var procedure  = colMap.proc >= 0 ? String(row[colMap.proc] || "") : "";
      var guest      = colMap.guest >= 0 ? String(row[colMap.guest] || "") : "";
      var doctor     = colMap.doctor >= 0 ? String(row[colMap.doctor] || "") : "";
      var agent      = colMap.agent >= 0 ? String(row[colMap.agent] || "") : "";
      // M Sütunu (13. sütun / index 12) veya başlıktan eşleşen sütun
      var sheetExitTime = colMap.estimatedExit >= 0 ? Utils.cleanTime(row[colMap.estimatedExit]) : (row.length > 12 ? Utils.cleanTime(row[12]) : "");

      var appId = Utils.generateAppId(patientName, pickupTime, opType, pickupLoc);
      var state = appStateMap[appId] || {
        status: "bekliyor",
        statusColor: "default",
        estimatedExitTime: null,
        isReady: false,
        lastAction: null,
        lastActionTime: null,
        lastActionUser: null
      };

      var finalExitTime = state.estimatedExitTime || sheetExitTime || null;

      operations.push({
        appId: appId,
        operationType: opType,
        patientName: patientName,
        pax: state.pax || pax,
        pickupTime: pickupTime,
        dropTime: dropTime,
        pickupLocation: pickupLoc,
        dropLocation: dropLoc,
        driver: driver,
        procedure: procedure,
        guest: guest,
        doctor: doctor,
        agent: agent,
        status: state.status,
        statusColor: state.statusColor,
        estimatedExitTime: finalExitTime,
        isReady: state.isReady,
        lastAction: state.lastAction,
        lastActionTime: state.lastActionTime,
        lastActionUser: state.lastActionUser
      });
    }

    return operations;
  },

  /**
   * APP_STATE sayfasını bir harita (Key: AppId) olarak okur
   */
  getAppStateMap: function() {
    var sheet = Utils.getOrCreateSheet(CONFIG.SHEETS.APP_STATE);
    var data = sheet.getDataRange().getValues();
    var map = {};
    if (data.length <= 1) return map;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var appId = String(row[0]);
      if (!appId) continue;
      map[appId] = {
        appId: appId,
        patientName: row[1],
        status: row[2],
        statusColor: row[3],
        estimatedExitTime: row[4] ? String(row[4]) : null,
        isReady: row[5] === true || String(row[5]).toLowerCase() === "true",
        pax: row[6] ? String(row[6]) : "",
        lastAction: row[7] ? String(row[7]) : null,
        lastActionUser: row[8] ? String(row[8]) : null,
        updatedAt: row[9]
      };
    }
    return map;
  },

  /**
   * APP_STATE tablosunda tekil kaydı günceller ve ana sayfadaki rengi ayarlar
   */
  saveAppState: function(appId, patientName, patchData) {
    var sheet = Utils.getOrCreateSheet(CONFIG.SHEETS.APP_STATE);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === appId) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    var now = new Date().toLocaleTimeString("tr-TR");

    if (rowIndex > 0) {
      // Mevcut satırı güncelle
      if (patchData.status !== undefined) sheet.getRange(rowIndex, 3).setValue(patchData.status);
      if (patchData.statusColor !== undefined) sheet.getRange(rowIndex, 4).setValue(patchData.statusColor);
      if (patchData.estimatedExitTime !== undefined) sheet.getRange(rowIndex, 5).setValue(patchData.estimatedExitTime || "");
      if (patchData.isReady !== undefined) sheet.getRange(rowIndex, 6).setValue(patchData.isReady);
      if (patchData.pax !== undefined) sheet.getRange(rowIndex, 7).setValue(patchData.pax);
      if (patchData.lastAction !== undefined) sheet.getRange(rowIndex, 8).setValue(patchData.lastAction);
      if (patchData.lastActionUser !== undefined) sheet.getRange(rowIndex, 9).setValue(patchData.lastActionUser);
      sheet.getRange(rowIndex, 10).setValue(now);
    } else {
      // Yeni durum kaydı ekle
      sheet.appendRow([
        appId,
        patientName,
        patchData.status || "bekliyor",
        patchData.statusColor || "default",
        patchData.estimatedExitTime || "",
        patchData.isReady || false,
        patchData.pax || "",
        patchData.lastAction || "",
        patchData.lastActionUser || "",
        now
      ]);
    }

    // Ana Google Sheet tablosundaki ilgili satırın rengini ve Tahmini Çıkış hücresini güvenli şekilde güncelle
    this.updateMainSheetEstimatedExitAndColor(patientName, patchData.estimatedExitTime, patchData.statusColor);
  },

  /**
   * Ana operasyon tablosunda hasta adına göre arayıp satır arka plan rengini
   * ve TAHMİNİ ÇIKIŞ hücresini günceller. Eğer kolonu yoksa otomatik olarak ekler.
   */
  updateMainSheetEstimatedExitAndColor: function(patientName, exitTime, statusColor) {
    try {
      var ss = Utils.getSpreadsheet();
      var mainSheet = ss.getSheetByName(CONFIG.SHEETS.OPERATIONS) || ss.getSheets()[0];
      var data = mainSheet.getDataRange().getValues();
      var headers = data[0];
      var pCol = Utils.findColumnIndex(headers, CONFIG.COLUMNS.PATIENT_NAME);
      if (pCol < 0) return;

      var exitCol = Utils.findColumnIndex(headers, CONFIG.COLUMNS.ESTIMATED_EXIT);

      // Eğer başlıktan bulunamazsa M Sütununu (13. sütun / 0-tabanlı indeks 12) kullan
      if (exitCol < 0) {
        exitCol = 12; // M Sütunu (getRange 1-tabanlı olduğu için 12 + 1 = 13 olur)
        if (headers.length <= 12 || !headers[12]) {
          mainSheet.getRange(1, 13).setValue("TAHMİNİ ÇIKIŞ");
        }
      }

      var colorHex = null;
      if (statusColor === "sari") colorHex = CONFIG.COLORS.KLINIKTE;
      else if (statusColor === "fistik_yesili") colorHex = CONFIG.COLORS.HAZIR;
      else if (statusColor === "kirmizi") colorHex = CONFIG.COLORS.TAMAMLANDI;
      else if (statusColor === "mavi") colorHex = CONFIG.COLORS.ALINDI;

      for (var r = 1; r < data.length; r++) {
        if (String(data[r][pCol]).trim().toLowerCase() === patientName.trim().toLowerCase()) {
          var rowNum = r + 1; // 1-based row index

          // 1. Satır arka plan rengini güncelle
          if (colorHex) {
            var rowRange = mainSheet.getRange(rowNum, 1, 1, mainSheet.getLastColumn());
            rowRange.setBackground(colorHex);
          }

          // 2. Tahmini Çıkış hücresine saati yaz
          if (exitCol >= 0 && exitTime !== undefined && exitTime !== null) {
            mainSheet.getRange(rowNum, exitCol + 1).setValue(Utils.cleanTime(exitTime));
          }
          break;
        }
      }
    } catch(e) {
      Logger.log("Update Main Sheet Error: " + e.message);
    }
  }
};
`;

export const APPS_SCRIPT_ACTION_SERVICE_GS = `/**
 * ============================================================================
 * ACTIONSERVICE.GS - KULLANICI AKSİYONLARI VE GERİ ALMA (UNDO) MANTIĞI
 * ============================================================================
 */

var ActionService = {
  /**
   * Yeni bir aksiyon gerçekleştirir ve denetim günlüğüne yazar
   */
  performAction: function(payload) {
    var appId = payload.appId;
    var patientName = payload.patientName;
    var actionType = payload.actionType;
    var userName = payload.userName || "Kullanıcı";
    var userRole = payload.userRole || "guest";
    var patchData = payload.patchData || {};

    // 1. Önceki durumu al (Geri alma için)
    var appStateMap = SheetService.getAppStateMap();
    var prevState = appStateMap[appId] || {
      status: "bekliyor",
      statusColor: "default",
      estimatedExitTime: null,
      isReady: false,
      pax: ""
    };

    // 2. Durumu güncelle
    patchData.lastAction = payload.actionTitle || actionType;
    patchData.lastActionUser = userName + " (" + userRole + ")";
    SheetService.saveAppState(appId, patientName, patchData);

    // 3. ACTION_LOG sayfasına kaydet
    this.logAction({
      appId: appId,
      patientName: patientName,
      action: payload.actionTitle || actionType,
      userName: userName,
      userRole: userRole,
      previousState: prevState,
      newState: patchData
    });

    return {
      success: true,
      message: "İşlem başarıyla kaydedildi: " + (payload.actionTitle || actionType),
      appId: appId,
      newState: patchData
    };
  },

  /**
   * Aksiyonu geri alır
   */
  undoAction: function(logId) {
    var logSheet = Utils.getOrCreateSheet(CONFIG.SHEETS.ACTION_LOG);
    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, error: "Kayıt bulunamadı" };

    var targetRow = -1;
    var targetLog = null;

    if (logId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(logId)) {
          targetRow = i + 1;
          targetLog = data[i];
          break;
        }
      }
    } else {
      // En son kaydı geri al
      targetRow = data.length;
      targetLog = data[data.length - 1];
    }

    if (!targetLog) return { success: false, error: "Geri alınacak kayıt bulunamadı." };

    var appId = targetLog[2];
    var patientName = targetLog[3];
    var prevStateJson = targetLog[7];
    var prevState = JSON.parse(prevStateJson);

    // Önceki durumu geri yükle
    prevState.lastAction = "İşlem Geri Alındı";
    prevState.lastActionUser = "Sistem (Undo)";
    SheetService.saveAppState(appId, patientName, prevState);

    return {
      success: true,
      message: "İşlem geri alındı: " + patientName,
      appId: appId,
      restoredState: prevState
    };
  },

  /**
   * ACTION_LOG tablosuna yazar
   */
  logAction: function(entry) {
    var sheet = Utils.getOrCreateSheet(CONFIG.SHEETS.ACTION_LOG);
    var logId = "LOG_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    var now = new Date().toLocaleTimeString("tr-TR");

    sheet.appendRow([
      logId,
      now,
      entry.appId,
      entry.patientName,
      entry.action,
      entry.userName,
      entry.userRole,
      JSON.stringify(entry.previousState),
      JSON.stringify(entry.newState)
    ]);
  }
};
`;

export const APPS_SCRIPT_BACKEND_GS = `/**
 * ============================================================================
 * BACKEND.GS - WEB APP API GİRİŞ NOKTASI (doGet & doPost)
 * ============================================================================
 * Bu dosya Google Apps Script Web App olarak dağıtıldığında harici web uygulamasından
 * gelen GET ve POST isteklerini işler.
 */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getOperations";

    if (action === "getOperations") {
      var operations = SheetService.getOperations();
      return Utils.jsonResponse({
        success: true,
        timestamp: new Date().toISOString(),
        total: operations.length,
        data: operations
      });
    }

    if (action === "ping") {
      return Utils.jsonResponse({ success: true, message: "HealthTour Google Sheets API Aktif", timestamp: new Date().toISOString() });
    }

    return Utils.jsonResponse({ success: false, error: "Geçersiz GET aksiyonu: " + action });
  } catch (err) {
    return Utils.jsonResponse({ success: false, error: err.toString(), stack: err.stack });
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action;

    if (action === "performAction") {
      var result = ActionService.performAction(payload);
      return Utils.jsonResponse(result);
    }

    if (action === "undoAction") {
      var undoResult = ActionService.undoAction(payload.logId);
      return Utils.jsonResponse(undoResult);
    }

    return Utils.jsonResponse({ success: false, error: "Bilinmeyen POST aksiyonu: " + action });
  } catch (err) {
    return Utils.jsonResponse({ success: false, error: err.toString(), stack: err.stack });
  }
}
`;

export const ALL_APPS_SCRIPT_FILES: AppsScriptFile[] = [
  {
    name: "Config.gs",
    description: "Merkezi yapılandırma, Google Sheet ID, sayfa isimleri ve dinamik kolon başlık eşleştirmeleri.",
    code: APPS_SCRIPT_CONFIG_GS
  },
  {
    name: "Utils.gs",
    description: "Satır numarasına bağımsız hash AppID üretici, kolon bulucu ve yardımcı araçlar.",
    code: APPS_SCRIPT_UTILS_GS
  },
  {
    name: "SheetService.gs",
    description: "Ana Google Sheets'i bozmadan okuma, APP_STATE yönetimi ve satır arka plan renklendirme.",
    code: APPS_SCRIPT_SHEET_SERVICE_GS
  },
  {
    name: "ActionService.gs",
    description: "Şoför ve Guest aksiyon durum makineleri, tam geri alma (Undo) ve ACTION_LOG denetim kaydı.",
    code: APPS_SCRIPT_ACTION_SERVICE_GS
  },
  {
    name: "Backend.gs",
    description: "Web App API uç noktaları (doGet, doPost) - Web uygulaması ile çift yönlü senkronizasyon.",
    code: APPS_SCRIPT_BACKEND_GS
  }
];
