### Emergency Recovery Page

The **Recovery Page** is a dedicated, isolated troubleshooting center designed to resolve data conflicts, corrupted browser caches, broken extension states, or application crashes.

---

#### 1. How to Access the Recovery Page

You can access the Emergency Recovery Page anytime via:

- **Direct URL**: Navigate directly to [`/recovery`](https://imify.trongajtt.com/recovery) in your browser.
- **Error Fallback Screen**: If an unexpected runtime error or chunk loading failure occurs, click the **Emergency Recovery Center** link at the bottom of the error card.

---

#### 2. Key Actions & Capabilities

##### A. Primary Recovery Options

- **🧹 Clear Cache & Service Worker**:
  Wipes all browser `CacheStorage` assets and unregisters stale Service Workers. This forces your browser to fetch the latest application bundles without affecting your saved presets or workspace configurations. _(Requires active Internet connection)._
- **⚠️ Factory Reset**:
  Completely resets Imify to its original clean state by purging all `localStorage`, `sessionStorage`, `IndexedDB`, and cache storage with a 2-step confirmation guard.
- **🏠 Return to Home**:
  Safely exits recovery mode and navigates back to the main workspace.

##### B. Data Backup & Utilities

- **📥 Export Backup Data**:
  Downloads a JSON file (`imify_backup_*.json`) containing all your custom presets, workspace preferences, and configuration.
- **📤 Restore from Backup**:
  Restores your saved configuration from a previously exported backup file.
- **🐛 Report an Issue**:
  Directly opens our official GitHub Issues page to submit bug reports and feedback.

---

> [!TIP]
> We recommend clicking **Export Backup Data** before performing a **Factory Reset** so you can easily restore your custom presets afterwards.

> [!NOTE]
> The Recovery Page operates in complete isolation — it does not depend on main workspace contexts or layout state, guaranteeing access even during severe application conflicts.
