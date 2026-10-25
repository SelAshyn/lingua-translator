/* background.js (service worker)
 *
 * Opens the extension popup on demand, carrying the selected text that
 * triggered it, so the popup can pre-fill the source field instead of
 * having to re-read the (possibly cleared) page selection.
 */

let pendingText = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.action === "openPopup") {
    pendingText = message.text || null;
    // openPopup() must run within a user-gesture path. This listener is
    // invoked synchronously from the floating button's click handler, so
    // the gesture is still intact here.
    chrome.action.openPopup()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("select-translator: openPopup failed", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  }

  if (message.action === "getPendingText") {
    const text = pendingText;
    pendingText = null;
    sendResponse({ text: text || "" });
    return; // Synchronous response
  }
});