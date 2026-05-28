// content.js
console.log('[XVD] 终极防御型 UI 绑定脚本已启动！');

const videoMap = new Map();

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'XVD_URL_CAPTURED') {
    const { tweetId, videoUrl } = event.data;
    videoMap.set(tweetId, videoUrl);
    console.log(`[XVD] 🎯 成功捕获并匹配推文 [${tweetId}] 的真实高清直链！`);
  }
});

function injectDownloadButtons() {
  const videos = document.querySelectorAll('video');

  videos.forEach(video => {
    const tweet = video.closest('article[data-testid="tweet"]');
    if (!tweet) return;

    const actionBar = tweet.querySelector('div[role="group"]');
    if (!actionBar) return;

    if (actionBar.querySelector('.x-download-btn')) return;

    const statusLink = tweet.querySelector('a[href*="/status/"]');
    if (!statusLink) return;
    
    const href = statusLink.getAttribute('href');
    const idMatch = href.match(/status\/(\d+)/);
    if (!idMatch) return;
    const tweetId = idMatch[1];

    const downloadBtn = document.createElement('div');
    downloadBtn.className = 'x-download-btn';
    downloadBtn.innerHTML = '⬇️ 下载高清';
    downloadBtn.style.cssText = `
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-left: 20px;
      color: #00ba7c;
      font-size: 13px;
      font-weight: bold;
      padding: 4px 10px;
      border: 1px solid #00ba7c;
      border-radius: 9999px;
      user-select: none;
      z-index: 9999;
    `;

    downloadBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); });

    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('--- [XVD] 按钮确确切切被点击到了！ ---');
      console.log('[XVD] 当前按钮绑定推文的 ID:', tweetId);

      const realMp4Url = videoMap.get(tweetId);

      if (!realMp4Url) {
        console.log('[XVD] 🗺️ 地图为空！正在向 MAIN 空间申请 React Fiber 深度搜刮...');
        // 🌟 向 MAIN 空间发射高能信号，去挖 React 的 Fiber 树
        window.postMessage({ type: 'XVD_FORCE_SCRAPE_FIBER', tweetId: tweetId }, '*');

        // 🌟 给予 350 毫秒的极速对账等待，让数据在后台飞一会儿，自动完成下载
        setTimeout(() => {
          const retryUrl = videoMap.get(tweetId);
          if (retryUrl) {
            console.log('[XVD] 🎉 React 搜刮对账成功！自动触发下载。');
            triggerDownload(retryUrl, tweetId);
          } else {
            alert('正在深度解析 React 视频流，请在 1 秒后重新点击下载！');
          }
        }, 350);
        return;
      }

      triggerDownload(realMp4Url, tweetId);
    });

    actionBar.appendChild(downloadBtn);
  });
}

function triggerDownload(url, id) {
  console.log('[XVD] 🚀 验证通过，正在向后台推送真实直链:', url);
  chrome.runtime.sendMessage({
    action: 'download_video',
    url: url,
    filename: `X-Video-${id}.mp4`
  }, (response) => {
    console.log('[XVD] 后台下载响应反馈:', response);
  });
}

setInterval(injectDownloadButtons, 1500);