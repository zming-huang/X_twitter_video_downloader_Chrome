# XVD (X/Twitter Video Downloader)

<p align="center">
  <a href="#english">🇬🇧 English</a> •
  <a href="#chinese">🇨🇳 中文</a> •
  <a href="#japanese">🇯🇵 日本語</a> •
  <a href="#spanish">🇪🇸 Español</a>
</p>

---

<h2 id="english">🇬🇧 English</h2>

A browser extension engineered for **high-definition video reverse extraction & one-click download** on X (formerly Twitter). It operates purely client-side with **zero reliance on third-party parsing APIs**.

### Features

- **🎯 Highest Quality Auto-Select** — Automatically filters all `video/mp4` variants, sorts by bitrate descending, always takes the best quality
- **🛡️ Safe Deep Recursion** — Uses `Set` to track visited objects and skips native DOM references (`stateNode`), preventing stack overflow and page freeze
- **⚡ Zero-Latency Reconciliation** — 350ms async wait for automatic "reconciliation → capture → trigger download" pipeline
- **🔌 Pure Local Parsing** — No third-party API dependencies; video links extracted entirely from browser runtime
- **📦 One-Click Download** — Click the green button to trigger the browser's native Save-As dialog

### Architecture

```
                        WEB PAGE (X.com)
                         │
            [React Fiber Component]
              (contains MP4 links)
                         │
                 (DOM private props exposure)
                         ▼
              ┌─────────────────────────┐
              │  main-world-hook.js     │
              │  (MAIN world probe)     │
              └─────────┬───────────────┘
                        │ window.postMessage
                        ▼
              ┌─────────────────────────┐
              │  content.js             │
              │  (ISOLATED world UI)    │
              └─────────┬───────────────┘
                        │ chrome.runtime.sendMessage
                        ▼
              ┌─────────────────────────┐
              │  background.js          │
              │  (Service Worker)       │
              └─────────┬───────────────┘
                        │
                        ▼
              Browser Native Download
              (X-Video-*.mp4)
```

| Layer | World | File | Role |
|-------|-------|------|------|
| Probe | **MAIN** | `main-world-hook.js` | Injects into page runtime, crawls React Fiber tree, intercepts GraphQL fetch |
| UI | **ISOLATED** | `content.js` | Renders download buttons, manages video URL cache, triggers downloads |
| Background | **Service Worker** | `background.js` | Calls `chrome.downloads.download` API, bypasses CORS restrictions |

**Cross-Context Communication:**

```
MAIN  ──postMessage──▶  ISOLATED  ──chrome.runtime.sendMessage──▶  Service Worker
(probe)                 (UI layer)                                  (download)
```

### Technical Deep Dive

The core extraction mechanism works as follows:

1. User clicks the download button → `content.js` checks local cache
2. Cache miss → `postMessage` to MAIN world with `XVD_FORCE_SCRAPE_FIBER` signal
3. `main-world-hook.js` climbs the DOM tree → locates the target `article[data-testid="tweet"]`
4. Pries open React's magic private properties (`__reactProps` / `__reactFiber`) on DOM nodes
5. Depth-first recursive search with `Set` dedup (max 8000 nodes) → finds `video_info.variants`
6. Filters `video/mp4`, sorts by bitrate → picks the highest-quality URL
7. Posts back via `postMessage` → `content.js` receives → `background.js` triggers native download

> As long as X renders pages with React, as long as a video plays on your screen, the React Fiber probe is an unstoppable dimensional strike.

### File Structure

```
x-video-downloader/
├── manifest.json          # Extension manifest (MV3) — declares permissions & injection rules
├── background.js          # Service worker — native download API, CORS bypass
├── content.js             # UI script — injects download buttons, manages URL cache, DOM ops
├── main-world-hook.js     # Core probe — React Fiber traversal + GraphQL fetch interception
└── README.md              # This file
```

### Installation & Usage

1. Save all project files in one folder
2. Open Chrome and go to `chrome://extensions/`
3. Toggle **Developer mode** (top-right corner)
4. Click **Load unpacked** and select the folder
5. Refresh your X (Twitter) page
6. Each tweet with a video will show a green **"⬇️ Download HD"** button next to the action bar
7. Click the button — the extension analyzes the React tree and triggers the native Save-As dialog within 1 second

### License

MIT

---

### Disclaimer

This project (XVD) is provided for personal learning, research, and technical exchange only. Do not use this extension for any commercial purposes or illegal distribution. Users shall bear all risks associated with violating X (Twitter)'s Terms of Service when downloading media content. The author assumes no legal responsibility for users' actions or consequences.

---

<h2 id="chinese">🇨🇳 中文</h2>

一款专门针对 X（原 Twitter）深度定制的高清视频逆向提取与下载浏览器扩展插件，纯客户端运行，**不依赖任何第三方解析接口**。

### 功能特性

- **🎯 最高清画质自动筛选** — 解析器自动过滤所有 `video/mp4` 变体，基于 bitrate 从高到低排序，永远只取最优画质
- **🛡️ 安全深度递归（Anti-Circular Reference）** — 使用 `Set` 记录已扫描对象，拦截 `stateNode` 等原生 DOM 节点引用，彻底杜绝栈溢出与网页卡死
- **⚡ 零延迟动态对账** — 350ms 极速异步等待，自动完成"对账 → 捕获 → 触发下载"全流程，体验丝滑
- **🔌 纯本地解析** — 不依赖任何第三方解析服务，视频链接完全从浏览器运行时提取，隐私安全
- **📦 一键下载** — 点击绿色按钮，浏览器原生另存为对话框优雅弹出

### 核心架构

```
                        WEB PAGE (X.com)
                         │
            [React Fiber Component]
              (contains MP4 links)
                         │
                 (DOM private props exposure)
                         ▼
              ┌─────────────────────────┐
              │  main-world-hook.js     │
              │  (MAIN 空间探针)         │
              └─────────┬───────────────┘
                        │ window.postMessage
                        ▼
              ┌─────────────────────────┐
              │  content.js             │
              │  (ISOLATED 空间 UI 层)   │
              └─────────┬───────────────┘
                        │ chrome.runtime.sendMessage
                        ▼
              ┌─────────────────────────┐
              │  background.js          │
              │  (后台下载线程)           │
              └─────────┬───────────────┘
                        │
                        ▼
              浏览器原生下载保存
              (X-Video-*.mp4)
```

| 层级 | World | 文件 | 职责 |
|------|-------|------|------|
| 探针 | **MAIN** | `main-world-hook.js` | 注入宿主页面，遍历 React Fiber 树，拦截 GraphQL 请求 |
| UI | **ISOLATED** | `content.js` | 注入绿色下载按钮，管理视频 URL 缓存，触发下载 |
| 后台 | **Service Worker** | `background.js` | 调用 `chrome.downloads.download` API，跨域下载 |

**跨域通信流:**

```
MAIN  ──postMessage──▶  ISOLATED  ──chrome.runtime.sendMessage──▶  Service Worker
(探针)                  (UI 层)                                     (下载)
```

### 技术原理

核心提取机制流程：

1. 用户点击下载按钮 → `content.js` 检查本地缓存
2. 缓存未命中 → 通过 `postMessage` 向 MAIN 空间发送 `XVD_FORCE_SCRAPE_FIBER` 信号
3. `main-world-hook.js` 顺着 DOM 节点往上摸 → 定位目标 `article[data-testid="tweet"]`
4. 强行扒开 DOM 节点上的 React 魔术私有属性（`__reactProps` / `__reactFiber`）
5. 深度优先递归搜索，使用 `Set` 去重（最多 8000 节点）→ 找到 `video_info.variants`
6. 过滤 `video/mp4`，按 bitrate 排序 → 取最高码率 URL
7. 通过 `postMessage` 回传 → `content.js` 接收 → `background.js` 触发原生下载

> 只要 X 还在基于 React 渲染页面，只要用户屏幕上还能播放这个视频，React Fiber 探针方案就是降维打击，它将坚不可摧。

### 文件结构

```
x-video-downloader/
├── manifest.json          # 插件配置文件（声明权限与脚本注入时机）
├── background.js          # 后台守护进程（调用原生下载 API 绕过跨域限制）
├── content.js             # 前端 UI 脚本（负责插入绿色下载按钮、监听点击与 DOM 操作）
├── main-world-hook.js     # 核心探针脚本（注入宿主页面，遍历 React Fiber 与 GraphQL）
└── README.md              # 本文件
```

### 安装使用

1. 将所有文件保存在同一文件夹中
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角 **"开发者模式" (Developer mode)**
4. 点击 **"加载已解压的扩展程序" (Load unpacked)**，选择该文件夹
5. 刷新 X (Twitter) 页面
6. 每条含视频的推文功能区会自动出现绿色 **"⬇️ 下载高清"** 按钮
7. 点击按钮，插件在 1 秒内完成 React 树深度解析并弹出浏览器另存为对话框

### 许可

MIT

---

### 免责声明

本项目（XVD）仅供个人学习、研究与技术交流使用。请勿将本插件用于任何商业用途或非法传播。用户使用本插件下载媒体内容时，须自行承担因违反 X (Twitter) 服务条款而产生的相关风险。作者不对用户的使用行为及后果承担任何法律责任。

---

<h2 id="japanese">🇯🇵 日本語</h2>

X（旧 Twitter）向けに特化設計された、**高解像度動画の逆抽出・ダウンロード**ブラウザ拡張機能です。サードパーティの解析 API に**一切依存せず**、クライアントサイドのみで動作します。

### 特徴

- **🎯 最高画質自動選択** — すべての `video/mp4` バリアントをフィルタリングし、ビットレート降順でソート、常に最高品質を取得
- **🛡️ 安全な深層再帰** — `Set` で訪問済みオブジェクトを追跡、`stateNode` などのネイティブ DOM 参照をスキップし、スタックオーバーフローとページフリーズを完全防止
- **⚡ ゼロレイテンシー同期** — 350ms の非同期待機で「照合 → キャプチャ → ダウンロード起動」を自動完了
- **🔌 完全ローカル解析** — サードパーティの解析サービス不要、ブラウザランタイムからのみ動画リンクを抽出、プライバシー保護
- **📦 ワンクリック保存** — 緑色のボタンをクリックするだけで、ブラウザ標準の「名前を付けて保存」ダイアログが表示

### アーキテクチャ

```
                        WEB PAGE (X.com)
                         │
            [React Fiber Component]
              (contains MP4 links)
                         │
                 (DOM private props exposure)
                         ▼
              ┌─────────────────────────┐
              │  main-world-hook.js     │
              │  (MAIN world プローブ)   │
              └─────────┬───────────────┘
                        │ window.postMessage
                        ▼
              ┌─────────────────────────┐
              │  content.js             │
              │  (ISOLATED world UI)    │
              └─────────┬───────────────┘
                        │ chrome.runtime.sendMessage
                        ▼
              ┌─────────────────────────┐
              │  background.js          │
              │  (Service Worker)       │
              └─────────┬───────────────┘
                        │
                        ▼
              ブラウザ標準ダウンロード
              (X-Video-*.mp4)
```

| レイヤー | World | ファイル | 役割 |
|----------|-------|----------|------|
| プローブ | **MAIN** | `main-world-hook.js` | ページランタイムに注入、React Fiber 木を走査、GraphQL を横取り |
| UI | **ISOLATED** | `content.js` | ダウンロードボタンを表示、動画 URL キャッシュ管理、ダウンロード起動 |
| バックグラウンド | **Service Worker** | `background.js` | `chrome.downloads.download` API を呼び出し、CORS 制限をバイパス |

**クロスコンテキスト通信:**

```
MAIN  ──postMessage──▶  ISOLATED  ──chrome.runtime.sendMessage──▶  Service Worker
(プローブ)              (UI 層)                                     (ダウンロード)
```

### 技術詳細

コア抽出メカニズムの流れ：

1. ユーザーがダウンロードボタンをクリック → `content.js` がローカルキャッシュを確認
2. キャッシュミス → `postMessage` で MAIN world に `XVD_FORCE_SCRAPE_FIBER` シグナルを送信
3. `main-world-hook.js` が DOM ツリーを遡る → 対象の `article[data-testid="tweet"]` を特定
4. DOM ノード上の React プライベートプロパティ（`__reactProps` / `__reactFiber`）を解析
5. `Set` で重複排除しながら深さ優先再帰検索（最大 8000 ノード）→ `video_info.variants` を発見
6. `video/mp4` をフィルタリング、ビットレート順にソート → 最高品質の URL を選択
7. `postMessage` で返送 → `content.js` が受信 → `background.js` がネイティブダウンロードを起動

> X が React でページをレンダリングし、ユーザーの画面で動画が再生できる限り、React Fiber プローブは絶対に破られない次元削減攻撃です。

### ファイル構成

```
x-video-downloader/
├── manifest.json          # 拡張機能マニフェスト (MV3) — 権限と注入ルールを宣言
├── background.js          # Service Worker — ネイティブダウンロード API、CORS バイパス
├── content.js             # UI スクリプト — ダウンロードボタン注入、URL キャッシュ管理、DOM 操作
├── main-world-hook.js     # コアプローブ — React Fiber 走査 + GraphQL フェッチ横取り
└── README.md              # このファイル
```

### インストールと使い方

1. すべてのファイルを 1 つのフォルダに保存
2. Chrome で `chrome://extensions/` を開く
3. 右上の **デベロッパーモード** を ON にする
4. **「パッケージ化されていない拡張機能を読み込む」** をクリックし、フォルダを選択
5. X（Twitter）ページをリロード
6. 動画を含むツイートのアクションバーに緑色の **"⬇️ Download HD"** ボタンが表示
7. ボタンをクリック → 1 秒以内に React ツリー解析完了、ブラウザの保存ダイアログが表示

### ライセンス

MIT

---

### 免責事項

本プロジェクト（XVD）は、個人学習、研究、技術交流のみを目的として提供されています。本拡張機能を商業目的や違法な配布に使用しないでください。ユーザーが本拡張機能を使用してメディアコンテンツをダウンロードする際は、X（Twitter）の利用規約に違反することによって生じるすべてのリスクを自ら負担するものとします。作者はユーザーの使用行為およびその結果に対して一切の法的責任を負いません。

---

<h2 id="spanish">🇪🇸 Español</h2>

Una extensión de navegador diseñada específicamente para la **extracción inversa y descarga de video HD** en X (antes Twitter). Opera completamente del lado del cliente **sin depender de API de terceros**.

### Características

- **🎯 Selección Automática de Máxima Calidad** — Filtra automáticamente todas las variantes `video/mp4`, ordena por bitrate descendente, siempre toma la mejor calidad
- **🛡️ Recursión Profunda Segura** — Usa `Set` para rastrear objetos visitados y omite referencias DOM nativas (`stateNode`), evitando desbordamiento de pila y congelamiento de página
- **⚡ Reconciliación de Latencia Cero** — Espera asíncrona de 350 ms para el pipeline automático de "reconciliación → captura → descarga"
- **🔌 Análisis Puramente Local** — Sin dependencias de API de terceros; los enlaces de video se extraen completamente del runtime del navegador
- **📦 Descarga en Un Solo Click** — Haga clic en el botón verde para activar el cuadro de diálogo nativo "Guardar como" del navegador

### Arquitectura

```
                        WEB PAGE (X.com)
                         │
            [React Fiber Component]
              (contains MP4 links)
                         │
                 (DOM private props exposure)
                         ▼
              ┌─────────────────────────┐
              │  main-world-hook.js     │
              │  (sonda en mundo MAIN)  │
              └─────────┬───────────────┘
                        │ window.postMessage
                        ▼
              ┌─────────────────────────┐
              │  content.js             │
              │  (UI en mundo ISOLATED) │
              └─────────┬───────────────┘
                        │ chrome.runtime.sendMessage
                        ▼
              ┌─────────────────────────┐
              │  background.js          │
              │  (Service Worker)       │
              └─────────┬───────────────┘
                        │
                        ▼
             Descarga nativa del navegador
             (X-Video-*.mp4)
```

| Capa | World | Archivo | Rol |
|------|-------|---------|-----|
| Sonda | **MAIN** | `main-world-hook.js` | Se inyecta en el runtime de la página, rastrea el árbol React Fiber, intercepta GraphQL |
| UI | **ISOLATED** | `content.js` | Renderiza botones de descarga, gestiona caché de URLs de video, activa descargas |
| Fondo | **Service Worker** | `background.js` | Llama a la API `chrome.downloads.download`, evita restricciones CORS |

**Comunicación entre contextos:**

```
MAIN  ──postMessage──▶  ISOLATED  ──chrome.runtime.sendMessage──▶  Service Worker
(sonda)                 (capa UI)                                   (descarga)
```

### Detalle Técnico

El flujo del mecanismo central de extracción:

1. El usuario hace clic en el botón de descarga → `content.js` verifica la caché local
2. Caché no encontrada → envía señal `XVD_FORCE_SCRAPE_FIBER` al mundo MAIN mediante `postMessage`
3. `main-world-hook.js` asciende por el árbol DOM → localiza el `article[data-testid="tweet"]` objetivo
4. Extrae las propiedades privadas de React (`__reactProps` / `__reactFiber`) en los nodos DOM
5. Búsqueda recursiva en profundidad con deduplicación `Set` (máx. 8000 nodos) → encuentra `video_info.variants`
6. Filtra `video/mp4`, ordena por bitrate → selecciona la URL de mayor calidad
7. Responde vía `postMessage` → `content.js` recibe → `background.js` activa la descarga nativa

> Mientras X renderice páginas con React, mientras un video se reproduzca en su pantalla, la sonda React Fiber es un golpe dimensional imparable.

### Estructura de Archivos

```
x-video-downloader/
├── manifest.json          # Manifiesto de extensión (MV3) — declara permisos y reglas de inyección
├── background.js          # Service Worker — API de descarga nativa, bypass CORS
├── content.js             # Script UI — inyecta botones de descarga, gestiona caché de URLs, operaciones DOM
├── main-world-hook.js     # Sonda principal — recorrido de React Fiber + intercepción de GraphQL
└── README.md              # Este archivo
```

### Instalación y Uso

1. Guarde todos los archivos del proyecto en una carpeta
2. Abra Chrome y vaya a `chrome://extensions/`
3. Active el **Modo desarrollador** (esquina superior derecha)
4. Haga clic en **Cargar extensión sin empaquetar** y seleccione la carpeta
5. Recargue su página de X (Twitter)
6. Cada tweet con video mostrará un botón verde **"⬇️ Download HD"** junto a la barra de acciones
7. Haga clic en el botón — la extensión analiza el árbol de React y activa el diálogo nativo "Guardar como" en menos de 1 segundo

### Licencia

MIT

---

### Descargo de Responsabilidad

Este proyecto (XVD) se proporciona únicamente para aprendizaje personal, investigación e intercambio técnico. No utilice esta extensión para fines comerciales o distribución ilegal. Los usuarios asumen todos los riesgos asociados con la violación de los Términos de Servicio de X (Twitter) al descargar contenido multimedia. El autor no asume ninguna responsabilidad legal por las acciones o consecuencias del usuario.
