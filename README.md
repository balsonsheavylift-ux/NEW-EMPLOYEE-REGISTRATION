# BALSONS Heavy Lift & Shift — Employee Registration Portal

A static, mobile-friendly employee registration portal with project-specific forms, client-side validation, Google Drive document uploads, and a Google Sheets backend via Google Apps Script.

## Project Structure

```
├── index.html                   # Project selector portal (English / Hindi / Odia)
├── register-jtrwf-schuler.html  # JTRWF – Schuler Project form
├── register-heg-amc.html        # HEG Ltd – AMC form
├── apps-script/
│   └── Code.gs                  # Google Apps Script Web App backend
└── assets/
    ├── css/styles.css           # Shared responsive UI styles
    └── js/
        ├── config.js            # Project definitions & Apps Script Web App URL
        └── app.js               # Shared form rendering, validation & submission
```

---

## 1. Google Sheet & Apps Script Setup

1. Create a new Google Sheet in your Google Drive (e.g., **BALSONS Employee Registration**).
2. Open **Extensions → Apps Script**.
3. Replace the default code in `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
4. *(Optional)* Run `setupSheets` once in the Apps Script editor and grant permissions to pre-create `All_Registrations`, `JTRWF_Schuler`, and `HEG_AMC` tabs (they are also created automatically on the first submission).
5. Click **Deploy → New deployment**:
   - **Select type**: `Web app`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
6. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).
7. Paste that URL into [`assets/js/config.js`](assets/js/config.js) as `APPS_SCRIPT_URL`:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
   ```

Uploaded photos and documents are automatically saved to Google Drive under:
`BALSONS Employee Documents / <ProjectCode> / <RegistrationID> /`

---

## 2. Host the Frontend via Git (GitHub Pages)

This folder is initialized as a Git repository. To publish it on GitHub Pages:

1. Create a new repository on GitHub (e.g. `balsons-employee-registration`).
2. Add the remote and push:
   ```bash
   git remote add origin https://github.com/<your-username>/balsons-employee-registration.git
   git push -u origin main
   ```
3. In the GitHub repository, go to **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Your portal will be live at `https://<your-username>.github.io/balsons-employee-registration/`.

---

## 3. Adding a New Project

1. Add a new entry to `PROJECTS` in [`assets/js/config.js`](assets/js/config.js).
2. Copy `register-heg-amc.html` to `register-<new-id>.html` and update `<body data-project="<new-id>">` and `<title>`.
