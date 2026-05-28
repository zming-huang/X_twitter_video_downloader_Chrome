// background.js — X Video Downloader Service Worker

// Top-level self-test: if this fails, the SW will show as "invalid"
console.log('[XVD] Service worker started');

// Handle download requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download_video') {
    handleDownload(message.url, message.filename)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ success: false, error: error.message })
      );
    return true; // Keep message channel open for async response
  }
});

async function handleDownload(url, filename) {
  if (!url) {
    throw new Error('No video URL provided');
  }

  // Sanitize filename (remove illegal filesystem chars)
  const safeName = filename
    ? filename.replace(/[<>:"/\\|?*]/g, '_')
    : `X-Video-${Date.now()}.mp4`;

  const downloadId = await chrome.downloads.download({
    url,
    filename: safeName,
    saveAs: true,
    conflictAction: 'uniquify',
  });

  return { success: true, downloadId };
}
