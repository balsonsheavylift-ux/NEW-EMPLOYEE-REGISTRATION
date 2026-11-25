/**
 * BALSONS Heavy Lift & Shift — Employee Registration Backend (Google Apps Script)
 *
 * Attach this script to your target Google Sheet (Extensions -> Apps Script),
 * run `setupSheets()` once (optional — also auto-runs on first submission),
 * then Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).
 */

const MASTER_TAB = "All_Registrations";
const DRIVE_ROOT_FOLDER = "BALSONS Employee Documents";

const HEADERS = [
  "Registration ID",
  "Submitted At",
  "Project Code",
  "Project Name",
  "Full Name",
  "Father / Spouse Name",
  "DOB",
  "Gender",
  "Mobile",
  "Email",
  "Blood Group",
  "Marital Status",
  "Present Address",
  "Permanent Address",
  "Designation / Trade",
  "Skill Category",
  "Date of Joining",
  "Supervisor / Contractor",
  "Aadhaar Number",
  "PAN Number",
  "UAN / PF Number",
  "ESIC Number",
  "Gate Pass No.",
  "Bank Account Holder",
  "Bank Name",
  "Account Number",
  "IFSC Code",
  "Emergency Contact Name",
  "Emergency Relationship",
  "Emergency Phone",
  "Photo URL",
  "Aadhaar Doc URL",
  "PAN / Bank Doc URL"
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "BALSONS Employee Registration API",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const payload = JSON.parse(raw);
    const emp = payload.employee || {};

    if (!emp.fullName || !emp.mobile || !emp.aadhaar) {
      throw new Error("Missing required employee fields.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectTab = sanitizeTabName(payload.sheetTab || payload.projectCode || "General");
    const regId = generateRegistrationId(payload.projectCode);
    const submittedAt = payload.submittedAt || new Date().toISOString();

    const fileUrls = saveUploadedFiles(payload.files || {}, payload.projectCode || "PROJECT", regId);

    const row = [
      regId,
      submittedAt,
      payload.projectCode || "",
      payload.projectName || "",
      emp.fullName || "",
      emp.fatherSpouseName || "",
      emp.dob || "",
      emp.gender || "",
      emp.mobile || "",
      emp.email || "",
      emp.bloodGroup || "",
      emp.maritalStatus || "",
      emp.presentAddress || "",
      emp.permanentAddress || "",
      emp.designation || "",
      emp.skillCategory || "",
      emp.joiningDate || "",
      emp.supervisor || "",
      "'" + (emp.aadhaar || ""),
      emp.pan || "",
      emp.uan ? "'" + emp.uan : "",
      emp.esic ? "'" + emp.esic : "",
      emp.gatePass || "",
      emp.bankHolder || "",
      emp.bankName || "",
      emp.accountNumber ? "'" + emp.accountNumber : "",
      emp.ifsc || "",
      emp.emergencyName || "",
      emp.emergencyRelation || "",
      emp.emergencyPhone || "",
      fileUrls.photo || "",
      fileUrls.aadhaar || "",
      fileUrls.bankDoc || ""
    ];

    appendToTab(ss, MASTER_TAB, row);
    if (projectTab !== MASTER_TAB) {
      appendToTab(ss, projectTab, row);
    }

    return jsonResponse({
      ok: true,
      registrationId: regId,
      timestamp: submittedAt,
      files: fileUrls
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Optional one-time setup helper to pre-create tabs and headers.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureTab(ss, MASTER_TAB);
  ensureTab(ss, "JTRWF_Schuler");
  ensureTab(ss, "HEG_AMC");
}

function ensureTab(ss, tabName) {
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange
      .setFontWeight("bold")
      .setBackground("#0097B2")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendToTab(ss, tabName, row) {
  const sheet = ensureTab(ss, tabName);
  sheet.appendRow(row);
}

function saveUploadedFiles(filesObj, projectCode, regId) {
  const urls = {};
  const keys = Object.keys(filesObj || {});
  if (keys.length === 0) return urls;

  const root = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_ROOT_FOLDER);
  const projFolder = getOrCreateFolder(root, sanitizeTabName(projectCode));
  const empFolder = getOrCreateFolder(projFolder, regId);

  keys.forEach((key) => {
    const f = filesObj[key];
    if (!f || !f.base64) return;
    const bytes = Utilities.base64Decode(f.base64);
    const blob = Utilities.newBlob(bytes, f.mimeType || "application/octet-stream", key + "_" + (f.name || "file"));
    const created = empFolder.createFile(blob);
    urls[key] = created.getUrl();
  });

  return urls;
}

function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}

function generateRegistrationId(projectCode) {
  const prefix = String(projectCode || "BAL").replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  const datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REG-${prefix}-${datePart}-${randPart}`;
}

function sanitizeTabName(name) {
  return String(name || "Sheet").replace(/[\\/?*\[\]:]/g, "_").slice(0, 80);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
