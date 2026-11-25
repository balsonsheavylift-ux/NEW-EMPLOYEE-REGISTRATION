(function () {
  const cfg = window.BALSONS_CONFIG || {};
  const MAX_BYTES = (cfg.MAX_FILE_SIZE_MB || 2) * 1024 * 1024;
  const REQUIRED_DOCS = ["photo", "aadhaar", "bankDoc"];
  const uploadedFiles = {};

  function setLogoFallback(img) {
    if (!img) return;
    img.src = cfg.LOGO_LOCAL || "assets/images/balsons-logo.png";
    img.onerror = function () {
      img.onerror = null;
      img.src = cfg.LOGO_FALLBACK || "";
    };
  }

  async function checkBackendHealth() {
    const dot = document.getElementById("backend-status-dot");
    const text = document.getElementById("backend-status-text");
    if (!dot || !text) return;

    if (!cfg.APPS_SCRIPT_URL || cfg.APPS_SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT")) {
      text.textContent = "Backend URL Pending";
      return;
    }

    try {
      const res = await fetch(cfg.APPS_SCRIPT_URL, { method: "GET" });
      const data = await res.json();
      if (data && data.ok) {
        dot.classList.add("online");
        text.textContent = "Google Sheets & Vault Online";
      } else {
        text.textContent = "Vault Check Failed";
      }
    } catch (_) {
      text.textContent = "Vault Ready (Offline Check)";
    }
  }

  function initPortal() {
    const list = document.getElementById("project-list");
    if (!list || !cfg.PROJECTS) return;

    setLogoFallback(document.querySelector(".logo"));
    checkBackendHealth();

    list.innerHTML = Object.values(cfg.PROJECTS)
      .map(
        (p) => `
        <a class="p" href="${p.href}">
          <span class="ic">${p.badge}</span>
          <span>
            <b>${p.name}</b>
            <small>${p.location}</small>
            <div class="p-tags">
              <code>${p.code}</code>
              <span class="status-tag">Active Site</span>
            </div>
          </span>
          <span class="go" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </span>
        </a>`
      )
      .join("");
  }

  function getMaxDobForAdult() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }

  function renderRegistrationShell(project) {
    const root = document.getElementById("app");
    if (!root) return;

    const isConfigured =
      cfg.APPS_SCRIPT_URL &&
      !cfg.APPS_SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT");

    const maxDob = getMaxDobForAdult();
    const today = new Date().toISOString().split("T")[0];

    root.innerHTML = `
      <div class="brand-topbar">
        <div class="brand-mini">
          <div class="logo-frame">
            <img class="logo" alt="BALSONS Heavy Lift &amp; Shift" />
          </div>
          <div class="brand-mini-text">
            <b>BALSONS HEAVY LIFT &amp; SHIFT</b>
            <small>Employee Registration Portal</small>
          </div>
        </div>
        <a class="back-link" href="index.html">← All Projects</a>
      </div>

      <div class="project-banner">
        <span class="ic">${project.badge}</span>
        <div class="meta">
          <b>${project.name}</b>
          <small>${project.location}</small>
          <code>${project.code}</code>
        </div>
      </div>

      <div class="progress-card" aria-label="Form completion progress">
        <div class="progress-head">
          <span>Form Completion</span>
          <span id="progress-label">0%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>

      ${
        isConfigured
          ? ""
          : `<div class="alert alert-warn">
              <strong>Backend not linked yet:</strong> Deploy <code>apps-script/Code.gs</code> as a Web App and paste its URL into <code>assets/js/config.js</code>.
            </div>`
      }

      <p class="mandatory-note">Fields and documents marked with <span class="req">*</span> are mandatory.</p>
      <div id="form-error" class="alert alert-err hidden"></div>

      <form id="reg-form" novalidate>
        <!-- 1. Personal Details -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">1</span>Personal Details · व्यक्तिगत विवरण</h2>
          <div class="grid-2">
            <div class="field">
              <label for="fullName">Full Name <span class="req">*</span></label>
              <input id="fullName" name="fullName" type="text" required autocomplete="name" placeholder="As per Aadhaar Card" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="fatherSpouseName">Father's / Spouse's Name <span class="req">*</span></label>
              <input id="fatherSpouseName" name="fatherSpouseName" type="text" required placeholder="Full name" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="dob">Date of Birth (18+ years) <span class="req">*</span></label>
              <input id="dob" name="dob" type="date" required max="${maxDob}" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="gender">Gender <span class="req">*</span></label>
              <select id="gender" name="gender" required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="mobile">Mobile Number <span class="req">*</span></label>
              <input id="mobile" name="mobile" type="tel" inputmode="numeric" maxlength="10" required autocomplete="tel-national" placeholder="10-digit mobile number" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="email">Email Address</label>
              <input id="email" name="email" type="email" autocomplete="email" placeholder="Optional" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="bloodGroup">Blood Group</label>
              <select id="bloodGroup" name="bloodGroup">
                <option value="">Select</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="maritalStatus">Marital Status</label>
              <select id="maritalStatus" name="maritalStatus">
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Other</option>
              </select>
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 2. Address -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">2</span>Address Details · पता</h2>
          <div class="grid-2">
            <div class="field full">
              <label for="presentAddress">Present / Local Address <span class="req">*</span></label>
              <textarea id="presentAddress" name="presentAddress" rows="2" required placeholder="House/Plot, Street, Village/Town, District, State, PIN"></textarea>
              <span class="field-err"></span>
            </div>
            <div class="full">
              <label class="check-row">
                <input type="checkbox" id="sameAddress" />
                <span>Permanent address is the same as present address</span>
              </label>
            </div>
            <div class="field full">
              <label for="permanentAddress">Permanent Address <span class="req">*</span></label>
              <textarea id="permanentAddress" name="permanentAddress" rows="2" required placeholder="Permanent home address with PIN code"></textarea>
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 3. Work & Site Info -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">3</span>Work &amp; Site Assignment · कार्य विवरण</h2>
          <div class="grid-2">
            <div class="field">
              <label for="designation">Designation / Trade <span class="req">*</span></label>
              <select id="designation" name="designation" required>
                <option value="">Select Trade</option>
                <option>Rigger</option>
                <option>Fitter</option>
                <option>Welder</option>
                <option>Gas Cutter</option>
                <option>Crane Operator</option>
                <option>Hydra / Forklift Operator</option>
                <option>Signalman</option>
                <option>Helper</option>
                <option>Site Supervisor</option>
                <option>Safety Officer</option>
                <option>Engineer</option>
                <option>Driver</option>
                <option value="Other">Other</option>
              </select>
              <span class="field-err"></span>
            </div>
            <div class="field hidden" id="designation-other-wrap">
              <label for="designationOther">Specify Designation / Trade <span class="req">*</span></label>
              <input id="designationOther" name="designationOther" type="text" placeholder="Enter your trade/role" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="skillCategory">Skill Category <span class="req">*</span></label>
              <select id="skillCategory" name="skillCategory" required>
                <option value="">Select Category</option>
                <option>Unskilled</option>
                <option>Semi-Skilled</option>
                <option>Skilled</option>
                <option>Highly Skilled</option>
                <option>Staff / Supervisory</option>
              </select>
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="joiningDate">Date of Joining <span class="req">*</span></label>
              <input id="joiningDate" name="joiningDate" type="date" required value="${today}" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="supervisor">Reporting Supervisor / Contractor</label>
              <input id="supervisor" name="supervisor" type="text" placeholder="Supervisor name (if known)" />
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 4. Statutory & IDs -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">4</span>Statutory &amp; ID Details · पहचान पत्र</h2>
          <div class="grid-2">
            <div class="field">
              <label for="aadhaar">Aadhaar Number <span class="req">*</span></label>
              <input id="aadhaar" name="aadhaar" type="text" inputmode="numeric" maxlength="12" required placeholder="12-digit Aadhaar number" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="pan">PAN Number</label>
              <input id="pan" name="pan" type="text" maxlength="10" placeholder="e.g. ABCDE1234F" style="text-transform:uppercase" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="uan">UAN / PF Number</label>
              <input id="uan" name="uan" type="text" maxlength="12" inputmode="numeric" placeholder="12-digit UAN (if available)" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="esic">ESIC Number</label>
              <input id="esic" name="esic" type="text" maxlength="17" inputmode="numeric" placeholder="10 or 17-digit ESIC (if available)" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="gatePass">Safety / Gate Pass No.</label>
              <input id="gatePass" name="gatePass" type="text" placeholder="If already issued" />
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 5. Bank Details -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">5</span>Bank Details · बैंक विवरण</h2>
          <div class="grid-2">
            <div class="field">
              <div class="field-label-row">
                <label for="bankHolder">Account Holder Name <span class="req">*</span></label>
                <button type="button" class="mini-btn" id="copy-name-btn">Same as Full Name</button>
              </div>
              <input id="bankHolder" name="bankHolder" type="text" required placeholder="As per bank passbook" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="bankName">Bank Name <span class="req">*</span></label>
              <input id="bankName" name="bankName" type="text" required placeholder="e.g. State Bank of India" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="accountNumber">Account Number <span class="req">*</span></label>
              <input id="accountNumber" name="accountNumber" type="text" inputmode="numeric" maxlength="18" required placeholder="9 to 18 digit account number" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="ifsc">IFSC Code <span class="req">*</span></label>
              <input id="ifsc" name="ifsc" type="text" maxlength="11" required placeholder="e.g. SBIN0001234" style="text-transform:uppercase" />
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 6. Emergency Contact -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">6</span>Emergency Contact · आपातकालीन संपर्क</h2>
          <div class="grid-3">
            <div class="field">
              <label for="emergencyName">Contact Name <span class="req">*</span></label>
              <input id="emergencyName" name="emergencyName" type="text" required placeholder="Relative / Guardian" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="emergencyRelation">Relationship <span class="req">*</span></label>
              <input id="emergencyRelation" name="emergencyRelation" type="text" required placeholder="e.g. Father, Spouse, Brother" />
              <span class="field-err"></span>
            </div>
            <div class="field">
              <label for="emergencyPhone">Emergency Phone <span class="req">*</span></label>
              <input id="emergencyPhone" name="emergencyPhone" type="tel" inputmode="numeric" maxlength="10" required placeholder="10-digit mobile" />
              <span class="field-err"></span>
            </div>
          </div>
        </section>

        <!-- 7. Compulsory Document Uploads -->
        <section class="card">
          <h2 class="card-title"><span class="step-badge">7</span>Mandatory Document Uploads · अनिवार्य दस्तावेज़ (Max ${cfg.MAX_FILE_SIZE_MB || 2} MB each)</h2>
          <div class="grid-3">
            <div class="file-box" id="box-photo">
              <label for="filePhoto"><strong>Passport Photo</strong> <span class="req">*</span></label>
              <input id="filePhoto" type="file" accept="image/*" data-doc="photo" required />
              <img id="preview-photo" class="file-preview hidden" alt="Passport photo preview" />
              <div class="file-status" id="status-photo">Required · JPG / PNG</div>
              <span class="field-err" id="err-photo"></span>
            </div>
            <div class="file-box" id="box-aadhaar">
              <label for="fileAadhaar"><strong>Aadhaar Card</strong> <span class="req">*</span></label>
              <input id="fileAadhaar" type="file" accept="image/*,.pdf" data-doc="aadhaar" required />
              <div class="file-status" id="status-aadhaar">Required · Image or PDF</div>
              <span class="field-err" id="err-aadhaar"></span>
            </div>
            <div class="file-box" id="box-bankDoc">
              <label for="fileBank"><strong>PAN / Bank Passbook</strong> <span class="req">*</span></label>
              <input id="fileBank" type="file" accept="image/*,.pdf" data-doc="bankDoc" required />
              <div class="file-status" id="status-bankDoc">Required · Image or PDF</div>
              <span class="field-err" id="err-bankDoc"></span>
            </div>
          </div>
        </section>

        <!-- 8. Declaration -->
        <section class="card">
          <label class="check-row">
            <input type="checkbox" id="declaration" required />
            <span>I hereby declare that the information and documents provided above are true and correct to the best of my knowledge. <span class="req">*</span></span>
          </label>
          <div id="decl-err" class="field-err" style="margin-top:6px"></div>

          <div class="actions">
            <button type="reset" class="btn btn-ghost" id="reset-btn">Clear Form</button>
            <button type="submit" class="btn btn-primary" id="submit-btn">Submit Registration</button>
          </div>
        </section>
      </form>

      <section id="success-panel" class="card success-panel hidden">
        <div class="success-icon">✓</div>
        <h2>Registration Submitted!</h2>
        <p class="sub" style="margin-top:6px">Your form PDF &amp; documents are safely stored in the BALSONS Google Drive Vault.</p>
        <div class="reg-id" id="reg-id-display"></div>
        <p class="hint" id="success-meta"></p>
        <div class="actions" style="justify-content:center;margin-top:20px">
          <a class="btn btn-ghost hidden" id="view-pdf-btn" target="_blank" rel="noopener">View Saved Form PDF</a>
          <button type="button" class="btn btn-ghost" id="print-btn">Print Confirmation</button>
          <button type="button" class="btn btn-primary" id="new-reg-btn">Register Another Employee</button>
          <a class="btn btn-ghost" href="index.html">Back to Projects</a>
        </div>
      </section>
    `;

    setLogoFallback(root.querySelector(".logo"));
    bindRegistrationEvents(project);
  }

  function setFieldError(input, msg) {
    const field = input.closest(".field");
    if (field) {
      const errEl = field.querySelector(".field-err");
      if (errEl) errEl.textContent = msg || "";
    }
    input.classList.toggle("invalid", Boolean(msg));
  }

  function setDocError(key, msg) {
    const box = document.getElementById(`box-${key}`);
    const errEl = document.getElementById(`err-${key}`);
    if (box) box.classList.toggle("invalid", Boolean(msg));
    if (errEl) errEl.textContent = msg || "";
  }

  function updateProgress(form) {
    const fill = document.getElementById("progress-fill");
    const label = document.getElementById("progress-label");
    if (!fill || !label) return;

    const reqInputs = Array.from(form.querySelectorAll("[required]")).filter(
      (el) => !el.closest(".hidden") && el.type !== "file"
    );
    const total = reqInputs.length + REQUIRED_DOCS.length;
    let done = 0;

    reqInputs.forEach((el) => {
      if (el.type === "checkbox") {
        if (el.checked) done += 1;
      } else if (el.value.trim()) {
        done += 1;
      }
    });

    REQUIRED_DOCS.forEach((key) => {
      if (uploadedFiles[key]) done += 1;
    });

    const pct = total ? Math.round((done / total) * 100) : 0;
    fill.style.width = `${pct}%`;
    label.textContent = `${pct}% (${done}/${total})`;
  }

  function validateField(el) {
    if (el.type === "file" || el.type === "checkbox" || el.closest(".hidden")) return true;
    const val = el.value.trim();
    if (el.name === "pan" || el.name === "ifsc") el.value = val.toUpperCase();

    if (el.required && !val) {
      setFieldError(el, "This field is required");
      return false;
    }

    const rules = {
      mobile: { re: /^[6-9]\d{9}$/, msg: "Enter a valid 10-digit Indian mobile number" },
      emergencyPhone: { re: /^[6-9]\d{9}$/, msg: "Enter a valid 10-digit mobile number" },
      aadhaar: { re: /^\d{12}$/, msg: "Aadhaar must be exactly 12 digits" },
      pan: { re: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, msg: "Format: ABCDE1234F", optional: true },
      uan: { re: /^\d{12}$/, msg: "UAN must be 12 digits", optional: true },
      esic: { re: /^(\d{10}|\d{17})$/, msg: "ESIC must be 10 or 17 digits", optional: true },
      accountNumber: { re: /^\d{9,18}$/, msg: "Account number must be 9 to 18 digits" },
      ifsc: { re: /^[A-Z]{4}0[A-Z0-9]{6}$/, msg: "Format: 11-char IFSC (e.g. SBIN0001234)" },
      email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "Enter a valid email", optional: true }
    };

    if (el.name === "dob" && val && el.max && val > el.max) {
      setFieldError(el, "Employee must be at least 18 years old");
      return false;
    }

    const rule = rules[el.name];
    if (rule && (val || !rule.optional)) {
      if (!rule.re.test(el.value.trim())) {
        setFieldError(el, rule.msg);
        return false;
      }
    }

    setFieldError(el, "");
    return true;
  }

  function validateForm(form) {
    let valid = true;

    form.querySelectorAll("input, select, textarea").forEach((el) => {
      if (!validateField(el)) valid = false;
    });

    REQUIRED_DOCS.forEach((key) => {
      if (!uploadedFiles[key]) {
        setDocError(key, "This document is compulsory");
        valid = false;
      } else {
        setDocError(key, "");
      }
    });

    const decl = document.getElementById("declaration");
    const declErr = document.getElementById("decl-err");
    if (!decl.checked) {
      declErr.textContent = "Please accept the declaration to submit.";
      valid = false;
    } else {
      declErr.textContent = "";
    }

    return valid;
  }

  function bindRegistrationEvents(project) {
    const form = document.getElementById("reg-form");
    const sameAddr = document.getElementById("sameAddress");
    const present = document.getElementById("presentAddress");
    const permanent = document.getElementById("permanentAddress");
    const desigSelect = document.getElementById("designation");
    const desigOtherWrap = document.getElementById("designation-other-wrap");
    const desigOtherInput = document.getElementById("designationOther");
    const formErr = document.getElementById("form-error");
    const submitBtn = document.getElementById("submit-btn");

    const numericFields = ["mobile", "emergencyPhone", "aadhaar", "uan", "esic", "accountNumber"];
    numericFields.forEach((name) => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener("input", () => {
        el.value = el.value.replace(/\D/g, "");
      });
    });

    ["pan", "ifsc"].forEach((name) => {
      const el = form.elements[name];
      if (!el) return;
      el.addEventListener("input", () => {
        el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      });
    });

    document.getElementById("copy-name-btn").addEventListener("click", () => {
      const full = document.getElementById("fullName").value.trim();
      const holder = document.getElementById("bankHolder");
      if (full) {
        holder.value = full;
        validateField(holder);
        updateProgress(form);
      }
    });

    desigSelect.addEventListener("change", () => {
      const isOther = desigSelect.value === "Other";
      desigOtherWrap.classList.toggle("hidden", !isOther);
      desigOtherInput.required = isOther;
      if (!isOther) {
        desigOtherInput.value = "";
        setFieldError(desigOtherInput, "");
      }
      updateProgress(form);
    });

    sameAddr.addEventListener("change", () => {
      if (sameAddr.checked) {
        permanent.value = present.value;
        permanent.readOnly = true;
        setFieldError(permanent, "");
      } else {
        permanent.readOnly = false;
      }
      updateProgress(form);
    });

    present.addEventListener("input", () => {
      if (sameAddr.checked) permanent.value = present.value;
    });

    form.addEventListener("input", (e) => {
      if (e.target.classList.contains("invalid")) validateField(e.target);
      updateProgress(form);
    });

    form.addEventListener("change", (e) => {
      if (e.target.id === "declaration" && e.target.checked) {
        document.getElementById("decl-err").textContent = "";
      }
      updateProgress(form);
    });

    const defaultDocLabels = {
      photo: "Required · JPG / PNG",
      aadhaar: "Required · Image or PDF",
      bankDoc: "Required · Image or PDF"
    };

    form.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.dataset.doc;
        const box = document.getElementById(`box-${key}`);
        const statusEl = document.getElementById(`status-${key}`);
        const preview = document.getElementById(`preview-${key}`);
        const file = input.files && input.files[0];

        if (!file) {
          delete uploadedFiles[key];
          box.classList.remove("ready");
          if (preview) preview.classList.add("hidden");
          statusEl.textContent = defaultDocLabels[key] || "Required";
          statusEl.style.color = "var(--muted)";
          updateProgress(form);
          return;
        }

        if (file.size > MAX_BYTES) {
          input.value = "";
          delete uploadedFiles[key];
          box.classList.remove("ready");
          if (preview) preview.classList.add("hidden");
          statusEl.textContent = `Exceeds ${cfg.MAX_FILE_SIZE_MB || 2} MB limit`;
          statusEl.style.color = "var(--err)";
          setDocError(key, `File must be under ${cfg.MAX_FILE_SIZE_MB || 2} MB`);
          updateProgress(form);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result);
          const base64 = dataUrl.split(",")[1];
          uploadedFiles[key] = {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            base64
          };
          box.classList.add("ready");
          setDocError(key, "");
          statusEl.textContent = `Ready: ${file.name} (${Math.round(file.size / 1024)} KB)`;
          statusEl.style.color = "var(--ok)";
          if (preview && file.type.startsWith("image/")) {
            preview.src = dataUrl;
            preview.classList.remove("hidden");
          }
          updateProgress(form);
        };
        reader.readAsDataURL(file);
      });
    });

    form.addEventListener("reset", () => {
      Object.keys(uploadedFiles).forEach((k) => delete uploadedFiles[k]);
      form.querySelectorAll(".field-err").forEach((e) => (e.textContent = ""));
      form.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
      form.querySelectorAll(".file-box").forEach((b) => b.classList.remove("ready"));
      Object.keys(defaultDocLabels).forEach((k) => {
        const s = document.getElementById(`status-${k}`);
        if (s) {
          s.textContent = defaultDocLabels[k];
          s.style.color = "var(--muted)";
        }
        const p = document.getElementById(`preview-${k}`);
        if (p) p.classList.add("hidden");
      });
      desigOtherWrap.classList.add("hidden");
      desigOtherInput.required = false;
      formErr.classList.add("hidden");
      permanent.readOnly = false;
      setTimeout(() => updateProgress(form), 0);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formErr.classList.add("hidden");

      if (!validateForm(form)) {
        const firstInvalid = form.querySelector(".invalid");
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        formErr.textContent = "Please complete all mandatory (*) fields and upload all 3 required documents.";
        formErr.classList.remove("hidden");
        return;
      }

      if (!cfg.APPS_SCRIPT_URL || cfg.APPS_SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT")) {
        formErr.textContent =
          "Google Apps Script URL is not configured in assets/js/config.js yet.";
        formErr.classList.remove("hidden");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading Documents & Saving...";

      const data = Object.fromEntries(new FormData(form).entries());
      if (data.designation === "Other" && data.designationOther) {
        data.designation = data.designationOther.trim();
      }

      const payload = {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        projectLocation: project.location,
        sheetTab: project.sheetTab,
        submittedAt: new Date().toISOString(),
        employee: data,
        files: uploadedFiles
      };

      try {
        const res = await fetch(cfg.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!result.ok) throw new Error(result.error || "Submission failed");

        document.getElementById("reg-id-display").textContent = result.registrationId;
        document.getElementById("success-meta").textContent =
          `${data.fullName} · ${project.name} (${project.code})`;

        const pdfBtn = document.getElementById("view-pdf-btn");
        if (result.formPdfUrl) {
          pdfBtn.href = result.formPdfUrl;
          pdfBtn.classList.remove("hidden");
        } else {
          pdfBtn.classList.add("hidden");
        }

        form.classList.add("hidden");
        document.getElementById("success-panel").classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        formErr.textContent = `Could not submit registration: ${err.message}`;
        formErr.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Registration";
      }
    });

    document.getElementById("print-btn").addEventListener("click", () => window.print());

    document.getElementById("new-reg-btn").addEventListener("click", () => {
      form.reset();
      document.getElementById("success-panel").classList.add("hidden");
      form.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    updateProgress(form);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const projectKey = document.body.dataset.project;
    if (projectKey && cfg.PROJECTS && cfg.PROJECTS[projectKey]) {
      renderRegistrationShell(cfg.PROJECTS[projectKey]);
    } else {
      initPortal();
    }
  });
})();
