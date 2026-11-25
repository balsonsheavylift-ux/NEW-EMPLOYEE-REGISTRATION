/**
 * BALSONS Heavy Lift & Shift — Employee Registration Backend (Google Apps Script)
 *
 * Features:
 *  - Saves every registration to both `All_Registrations` and the project-specific tab
 *  - Creates a structured Google Drive Vault:
 *      BALSONS Employee Vault / <ProjectCode> / <RegistrationID>_<EmployeeName> /
 *  - Generates a printable PDF copy of the submitted form inside the employee's Vault folder
 *  - Saves all uploaded documents (Photo, Aadhaar, PAN/Bank Passbook) into the same folder
 *
 * Setup:
 *  1. Open your Google Sheet -> Extensions -> Apps Script -> paste this code.
 *  2. Run `setupAll()` once to create the Sheet tabs and Google Drive Vault folders.
 *  3. Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).
 */

const MASTER_TAB = "All_Registrations";
const DRIVE_VAULT_NAME = "BALSONS Employee Vault";

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
  "PAN / Bank Doc URL",
  "Saved Form PDF URL",
  "Drive Vault Folder URL"
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "BALSONS Employee Registration API",
    vault: DRIVE_VAULT_NAME,
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
    const files = payload.files || {};

    if (!emp.fullName || !emp.mobile || !emp.aadhaar) {
      throw new Error("Missing required employee fields.");
    }
    if (!files.photo || !files.aadhaar || !files.bankDoc) {
      throw new Error("All 3 compulsory documents (Photo, Aadhaar, PAN/Bank) are required.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectTab = sanitizeName(payload.sheetTab || payload.projectCode || "General");
    const regId = generateRegistrationId(payload.projectCode);
    const submittedAt = payload.submittedAt || new Date().toISOString();

    // 1. Create Employee Vault folder in Google Drive
    const empFolder = createEmployeeVaultFolder(
      payload.projectCode || "PROJECT",
      regId,
      emp.fullName
    );

    // 2. Save uploaded documents into the Vault folder
    const fileUrls = saveUploadedFiles(files, empFolder);

    // 3. Generate and save printable PDF of the submitted form into the Vault folder
    const formPdfUrl = saveRegistrationPdf(empFolder, {
      regId,
      submittedAt,
      projectCode: payload.projectCode || "",
      projectName: payload.projectName || "",
      projectLocation: payload.projectLocation || "",
      emp,
      fileUrls
    });

    const vaultFolderUrl = empFolder.getUrl();

    // 4. Append row to Master tab & Project-specific tab
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
      fileUrls.bankDoc || "",
      formPdfUrl,
      vaultFolderUrl
    ];

    appendToTab(ss, MASTER_TAB, row);
    if (projectTab !== MASTER_TAB) {
      appendToTab(ss, projectTab, row);
    }

    return jsonResponse({
      ok: true,
      registrationId: regId,
      timestamp: submittedAt,
      formPdfUrl,
      vaultFolderUrl,
      files: fileUrls
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Run once from the Apps Script editor to pre-create Sheet tabs and Drive Vault folders.
 */
function setupAll() {
  setupSheets();
  setupVault();
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureTab(ss, MASTER_TAB);
  ensureTab(ss, "JTRWF_Schuler");
  ensureTab(ss, "HEG_AMC");
}

function setupVault() {
  const vault = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_VAULT_NAME);
  getOrCreateFolder(vault, "PRJ-JTRWF-SCHULER");
  getOrCreateFolder(vault, "HEG LTD AMC");
  return vault.getUrl();
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

function createEmployeeVaultFolder(projectCode, regId, fullName) {
  const vault = getOrCreateFolder(DriveApp.getRootFolder(), DRIVE_VAULT_NAME);
  const projFolder = getOrCreateFolder(vault, sanitizeName(projectCode));
  const safeEmp = sanitizeName(fullName).replace(/\s+/g, "_").slice(0, 40);
  return getOrCreateFolder(projFolder, `${regId}_${safeEmp}`);
}

function saveUploadedFiles(filesObj, empFolder) {
  const urls = {};
  const keys = Object.keys(filesObj || {});
  keys.forEach((key) => {
    const f = filesObj[key];
    if (!f || !f.base64) return;
    const bytes = Utilities.base64Decode(f.base64);
    const blob = Utilities.newBlob(
      bytes,
      f.mimeType || "application/octet-stream",
      key + "_" + (f.name || "file")
    );
    const created = empFolder.createFile(blob);
    urls[key] = created.getUrl();
  });
  return urls;
}

function saveRegistrationPdf(empFolder, info) {
  const e = info.emp || {};
  const esc = (v) =>
    String(v || "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const row = (label, value) =>
    `<tr><td class="lbl">${esc(label)}</td><td class="val">${esc(value)}</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; color: #102D35; font-size: 12px; margin: 24px; }
  .head { border-bottom: 3px solid #0097B2; padding-bottom: 10px; margin-bottom: 16px; }
  .eyebrow { color: #08798d; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
  h1 { margin: 4px 0; font-size: 18px; }
  .meta { color: #64748b; font-size: 11px; }
  h2 { background: #eaf6f8; color: #08798d; font-size: 12px; padding: 6px 10px; margin: 14px 0 6px; border-left: 4px solid #0097B2; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  td.lbl { width: 34%; font-weight: bold; color: #334155; }
  .foot { margin-top: 20px; font-size: 10px; color: #64748b; text-align: center; }
</style>
</head>
<body>
  <div class="head">
    <div class="eyebrow">BALSONS HEAVY LIFT &amp; SHIFT — CONFIDENTIAL EMPLOYEE RECORD</div>
    <h1>Employee Registration Form</h1>
    <div class="meta">Registration ID: <strong>${esc(info.regId)}</strong> | Project: <strong>${esc(info.projectName)} (${esc(info.projectCode)})</strong> | Submitted: ${esc(info.submittedAt)}</div>
  </div>

  <h2>1. Personal Details</h2>
  <table>
    ${row("Full Name", e.fullName)}
    ${row("Father / Spouse Name", e.fatherSpouseName)}
    ${row("Date of Birth", e.dob)}
    ${row("Gender", e.gender)}
    ${row("Mobile", e.mobile)}
    ${row("Email", e.email)}
    ${row("Blood Group", e.bloodGroup)}
    ${row("Marital Status", e.maritalStatus)}
  </table>

  <h2>2. Address Details</h2>
  <table>
    ${row("Present Address", e.presentAddress)}
    ${row("Permanent Address", e.permanentAddress)}
  </table>

  <h2>3. Work &amp; Site Assignment</h2>
  <table>
    ${row("Designation / Trade", e.designation)}
    ${row("Skill Category", e.skillCategory)}
    ${row("Date of Joining", e.joiningDate)}
    ${row("Supervisor / Contractor", e.supervisor)}
  </table>

  <h2>4. Statutory &amp; ID Details</h2>
  <table>
    ${row("Aadhaar Number", e.aadhaar)}
    ${row("PAN Number", e.pan)}
    ${row("UAN / PF Number", e.uan)}
    ${row("ESIC Number", e.esic)}
    ${row("Gate Pass No.", e.gatePass)}
  </table>

  <h2>5. Bank Details</h2>
  <table>
    ${row("Account Holder", e.bankHolder)}
    ${row("Bank Name", e.bankName)}
    ${row("Account Number", e.accountNumber)}
    ${row("IFSC Code", e.ifsc)}
  </table>

  <h2>6. Emergency Contact</h2>
  <table>
    ${row("Contact Name", e.emergencyName)}
    ${row("Relationship", e.emergencyRelation)}
    ${row("Emergency Phone", e.emergencyPhone)}
  </table>

  <div class="foot">Saved automatically to BALSONS Employee Vault · ${esc(info.regId)}</div>
</body>
</html>`;

  const pdfBlob = Utilities.newBlob(html, "text/html", "form.html").getAs("application/pdf");
  pdfBlob.setName(`Registration_Form_${info.regId}.pdf`);
  const created = empFolder.createFile(pdfBlob);
  return created.getUrl();
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

function sanitizeName(name) {
  return String(name || "Sheet").replace(/[\\/?*\[\]:]/g, "_").slice(0, 80);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
