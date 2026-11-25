/**
 * Central configuration for BALSONS Employee Registration Portal.
 * After deploying apps-script/Code.gs as a Web App, paste its URL below.
 */
window.BALSONS_CONFIG = {
  APPS_SCRIPT_URL: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
  MAX_FILE_SIZE_MB: 2,
  LOGO_LOCAL: "assets/images/balsons-logo.png",
  LOGO_FALLBACK: "https://lh3.googleusercontent.com/d/1HB7sGaQ4f2qq0NNzgBQrSpUe2DJWV4uh",
  PROJECTS: {
    "jtrwf-schuler": {
      id: "jtrwf-schuler",
      badge: "JT",
      name: "JTRWF – Schuler Project",
      location: "JTRWF Khordha, Odisha",
      code: "PRJ-JTRWF-SCHULER",
      sheetTab: "JTRWF_Schuler",
      href: "register-jtrwf-schuler.html"
    },
    "heg-amc": {
      id: "heg-amc",
      badge: "HEG",
      name: "HEG Ltd – AMC",
      location: "HEG Ltd, Mandideep, Madhya Pradesh",
      code: "HEG LTD AMC",
      sheetTab: "HEG_AMC",
      href: "register-heg-amc.html"
    }
  }
};
