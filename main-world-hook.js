// main-world-hook.js
(function() {
  console.log('[XVD] 核心 API 拦截服务已成功注入 MAIN 空间');

  window.__XVD_GLOBAL_CACHE__ = window.__XVD_GLOBAL_CACHE__ || new Map();

  // 1. 安全的深度数据遍历（使用 Set 绝不动摇 React 原生结构，防止循环引用）
  function deepSearchTweets(obj, visited = new Set()) {
    if (!obj || typeof obj !== 'object') return;
    if (visited.has(obj)) return;
    visited.add(obj);

    // 防止极其庞大的 React 树导致内存溢出
    if (visited.size > 8000) return;

    if (obj.video_info && obj.video_info.variants) {
      let tweetId = null;

      if (obj.expanded_url) {
        const match = obj.expanded_url.match(/status\/(\d+)/);
        if (match) tweetId = match[1];
      }
      if (!tweetId && obj.source_status_id_str) tweetId = obj.source_status_id_str;
      if (!tweetId && obj.id_str) tweetId = obj.id_str;

      if (tweetId) {
        const mp4Variants = obj.video_info.variants
          .filter(v => v.content_type === 'video/mp4')
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        if (mp4Variants.length > 0) {
          const bestVideoUrl = mp4Variants[0].url;
          window.__XVD_GLOBAL_CACHE__.set(tweetId, bestVideoUrl);
          
          window.postMessage({
            type: 'XVD_URL_CAPTURED',
            tweetId: tweetId,
            videoUrl: bestVideoUrl
          }, '*');
        }
      }
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        deepSearchTweets(obj[i], visited);
      }
    } else {
      for (const key in obj) {
        // 关键优化：跳过原生的 DOM 节点引用，避免顺着 React 爬回整个网页树
        if (key === 'stateNode' && obj[key] instanceof HTMLElement) continue;

        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          deepSearchTweets(obj[key], visited);
        }
      }
    }
  }

  // 2. 核心大招：顺着 DOM 节点往上摸，强行扒掉 React 的底裤
  function scrapeReactFiberForTweet(tweetId) {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let targetTweetEl = null;

    for (const tweet of tweets) {
      const statusLink = tweet.querySelector('a[href*="/status/"]');
      if (statusLink && statusLink.getAttribute('href').includes(tweetId)) {
        targetTweetEl = tweet;
        break;
      }
    }

    // 如果根据 ID 没找准，就全量扫描页面上所有推文和视频容器的底层属性
    const elementsToScan = targetTweetEl 
      ? [targetTweetEl, ...targetTweetEl.querySelectorAll('*')]
      : document.querySelectorAll('article[data-testid="tweet"], video');

    const visited = new Set();
    elementsToScan.forEach(el => {
      // 提取 React 注入到真实 DOM 上的魔术私有属性 (__reactProps... / __reactFiber...)
      const reactKeys = Object.keys(el).filter(k => k.startsWith('__reactProps') || k.startsWith('__reactFiber'));
      reactKeys.forEach(key => {
        try {
          deepSearchTweets(el[key], visited);
        } catch (e) {}
      });
    });
  }

  // 3. 监听来自前端的各种对账与强力搜刮请求
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'XVD_FORCE_SCRAPE_FIBER') {
      const { tweetId } = event.data;
      console.log(`[XVD] 📥 收到精准搜刮指令，正在拆解推文 [${tweetId}] 的 React Fiber 节点...`);
      
      // 执行 React 属性强刷
      scrapeReactFiberForTweet(tweetId);

      console.log(`[XVD] 🏁 React 搜刮结束，当前账本总数: ${window.__XVD_GLOBAL_CACHE__.size}`);
      
      // 搜刮完立刻把最新的货重播给前端
      window.__XVD_GLOBAL_CACHE__.forEach((videoUrl, id) => {
        window.postMessage({ type: 'XVD_URL_CAPTURED', tweetId: id, videoUrl: videoUrl }, '*');
      });
    }
  });

  // 4. 原有的 Fetch 拦截依然保留，作为滚动刷新的双保险
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0];
    if (typeof url === 'string' && url.includes('/graphql/')) {
      try {
        const clone = response.clone();
        const json = await clone.json();
        deepSearchTweets(json);
      } catch (e) {}
    }
    return response;
  };
})();