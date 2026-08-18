# Frequently Asked Questions

> Everything you need to know about Imify.

---

### 1. Are my photos safe while processing on your website?

Absolutely. Imify is serverless. There is no remote server storing your data; the entire processing pipeline happens locally on your machine. Your privacy isn't just a feature - it's the architecture.

---

### 2. The website feels slow or lags during conversion. Is this a bug?

Imify uses your own hardware to process images. Heavy formats like AVIF or JXL can be resource-intensive. If you experience lag, it means the processing demands are reaching the limits of your device's web environment. For extreme professional needs, a dedicated native application might be a better fit.

---

### 3. What image formats are supported?

We support a wide range of modern and traditional formats including JPEG, PNG, WebP, AVIF, and JPEG XL. Capabilities are constantly expanding based on browser support.

---

### 4. Which browsers are compatible with Imify Web?

- On desktop, Imify Web is highly compatible with Chromium-based browsers (most extensively tested on Chrome) and Firefox.
- On mobile devices (tested on Android), Firefox is the most compatible and highly recommended browser. Chrome currently experiences image decoding errors with certain screenshots, and we have not yet found a fix for this issue.

---

### 5. Can I use Imify on mobile or tablet?

- In theory, yes. The website is responsive for both small and large screens.
- However, we don't recommend it. Imify is designed and optimized for large screens to provide the best working experience. Using it on a small phone screen will make it difficult to operate and you won't be able to enjoy all the features to their full extent.
- In situations where you are forced to use it, please opt for the Firefox browser for the best compatibility.

---

### 6. Do I need to install anything before using Imify Web?

No installation is required. You can start using Imify Web directly in your browser right away. For extension-exclusive workflows, you can optionally install the browser extension.

---

### 7. I see a new version of Imify Web was released, but I am still stuck on an older version?

This issue may occur if your browser cache did not refresh automatically or if the automatic update process encountered an issue.

**1. If the automatic update process encountered an issue:**
- If you are on version 2.3 or later, open the **About Imify** dialog and click on the version badge to check for updates. If a newer version is available, click **Update Now** to update.
- If the update fails or you are on an older version, proceed to step 2 below.

**2. If the browser cache did not refresh:**
- **Method 1 (Recommended - Clear Cache):**
  - **Option 1:** Visit the [Update Page](https://imify.trongajtt.com/update) to automatically purge stale cache and return to homepage with the latest version.
  - **Option 2:** Go to the [Recovery Page](https://imify.trongajtt.com/recovery) and click **Clear Cache & SW** to purge cached files, then reload the page.
- **Method 2 (Fallback):** If you cannot access the above pages, manually clear cookies and site data following the official guides: [Chrome](https://support.google.com/chrome/answer/95647), [Edge](https://support.microsoft.com/en-us/edge/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use), [Firefox](https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox).
  - On desktop, you can also press `Ctrl + F5` (or `Cmd + Shift + R` on macOS) to temporarily bypass cache and force a hard refresh.

---

### 8. I encountered an issue or crash while using or accessing a specific feature?

- **If an issue occurs during image processing (tab crashes or shows browser placeholder):** This is most likely due to high memory (RAM) usage from processing very large or numerous images. Try reloading the page to free up memory and process smaller batches. If your workload exceeds browser environment limits, specialized desktop software may be required.
- **If an error occurs while navigating or accessing a page:** Local storage or preset data may have a conflict. Go to the [Recovery Page](https://imify.trongajtt.com/recovery), export your backup, and perform a **Factory Reset (Clear All Data)**.
- **Report an Issue:** If the problem persists, please submit a detailed bug report on our [GitHub Issues](https://github.com/TrongAJTT/imify/issues/new/choose) so we can investigate.

---

### 9. Is Imify completely free to use?

Yes, all the core tools provided in Imify Web are free to use. There are no hidden fees or premium locks on the web workspace features.

---

### 10. How can Imify stay free?

Since the processing happens on your device, I don't incur server-side processing costs. However, building the tool and maintaining the domain still costs money. I've included a *Donate* button for those who find the tool valuable and wish to help me cover these maintenance costs. Your support is purely optional but deeply appreciated!

---

### 11. How can I support Imify?

If Imify helps your workflow, you can support us by clicking the Donate button (featuring the star count and a heart icon) on the top-right app bar. Your contributions via *PayPal*, *Buy Me A Coffee*, or *GitHub Sponsors* help cover domain maintenance, code development, and keep the project free for everyone. Sharing the project with friends is also a wonderful way to support!
