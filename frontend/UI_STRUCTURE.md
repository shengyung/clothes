# UI 結構說明 — ShapeOnYou 虛擬試衣間

## 技術棧

- **框架**：Next.js 14（App Router）＋ React 18 ＋ TypeScript
- **樣式**：Tailwind CSS v3 ＋ shadcn/ui（Radix UI 底層）
- **建置**：next dev / next build；Dockerfile 部署
- **字型**：Cormorant Garamond（serif，品牌標題）＋ DM Sans（sans，正文）
- **Auth**：next-auth v4（Google / LINE / Facebook / Apple SSO ＋ 自建 JWT）

---

## 畫面地圖 (Screen Map)

### 1. 首頁 Landing Page — `/`

```
┌──────────────────────────────────────────────────────┐
│                    Navbar (site)                     │  固定在頂部，半透明
├──────────────────────────────────────────────────────┤
│                                                      │
│                   HeroSection                        │  全螢幕，品牌名＋CTA
│          （品牌標語 + BeforeAfterCards）              │
│                                                      │
├──────────────────────────────────────────────────────┤
│                HowItWorksSection                     │  三步驟卡片（id="how-it-works"）
├──────────────────────────────────────────────────────┤
│                   StatsStrip                         │  深色底，三個數字
├──────────────────────────────────────────────────────┤
│                 FeaturesSection                      │  六格功能介紹（id="features"）
├──────────────────────────────────────────────────────┤
│                  SizeFinder                          │  尺寸推薦工具（id="size-finder"）
├──────────────────────────────────────────────────────┤
│                  FinalCTASection                     │  行動呼籲區塊
├──────────────────────────────────────────────────────┤
│                    Footer                            │  深色底，Logo＋連結＋版權
└──────────────────────────────────────────────────────┘
```

- **Navbar (site)** — [src/components/Navbar.tsx](src/components/Navbar.tsx) — 固定頂部，`variant="site"`，毛玻璃背景，左側 Logo，中間導覽連結，右側登入按鈕或使用者頭像
- **HeroSection** — [src/app/page.tsx](src/app/page.tsx) `<section aria-label="主視覺">` — 全螢幕居中，品牌名 + 副標 + 兩個 CTA 按鈕 + Before/After 模擬卡
- **BeforeAfterCards** — [src/app/page.tsx](src/app/page.tsx) — HeroSection 底部的兩張卡（「上傳照片」→「試穿效果」）
- **HowItWorksSection** — [src/app/page.tsx](src/app/page.tsx) `id="how-it-works"` — 三欄步驟卡（01 上傳人像、02 挑選服裝、03 即時試穿）
- **StatsStrip** — [src/app/page.tsx](src/app/page.tsx) `<section aria-label="平台數據">` — 深黑底色，顯示 30s / 500+ / 6+ 三個數字
- **FeaturesSection** — [src/app/page.tsx](src/app/page.tsx) `id="features"` — 2×3 網格，六個功能說明方塊
- **SizeFinder** — [src/components/SizeFinder.tsx](src/components/SizeFinder.tsx) — 左側表單（品牌選擇＋身高體重輸入）＋右側結果（推薦尺寸＋完整尺寸表）
- **FinalCTASection** — [src/app/page.tsx](src/app/page.tsx) `<section aria-label="行動呼籲">` — 大字標語＋立即試穿按鈕
- **Footer** — [src/app/page.tsx](src/app/page.tsx) `<footer>` — 深黑底，Logo＋試衣間/登入連結＋版權文字

---

### 2. 試衣間 Studio — `/studio`

```
┌──────────────────────────────────────────────────────┐
│                  Navbar (app)                        │  靜態白色頂欄
├──────────┬────────────────────────┬──────────────────┤
│          │      PhotoArea         │                  │
│ Brands   │   （人像上傳＋預覽）    │  OutfitRecords   │
│ Sidebar  ├────────────────────────┤  （我的穿搭紀錄）  │
│（260px） │    ProductPanel        │    （280px）     │
│          │  （服裝照片上傳＋試穿） │                  │
├──────────┴────────────────────────┴──────────────────┤
│                   StepGuide Bar                      │  四步驟進度指示
└──────────────────────────────────────────────────────┘
```

- **Navbar (app)** — [src/components/Navbar.tsx](src/components/Navbar.tsx) — `variant="app"`，靜態不固定，白色帶底線
- **BrandsSidebar** — [src/components/BrandsSidebar.tsx](src/components/BrandsSidebar.tsx) — 左欄 260px，目前顯示「即將推出」佔位圖
- **TryonCenter** — [src/components/TryonCenter.tsx](src/components/TryonCenter.tsx) — 中間主區域，內含 PhotoArea＋ProductPanel
  - **PhotoArea** — TryonCenter.tsx `div.flex-1.bg-[#F5F5F7]` — 左側大區塊，顯示人像預覽或拖放上傳框；底部有「重設」按鈕和「對比模式」（未開放）
  - **ProductPanel** — TryonCenter.tsx `div.w-[220px]` — 右側小面板（220px），服裝照片上傳＋今日剩餘次數＋「立即試穿」按鈕
- **OutfitRecords** — [src/components/OutfitRecords.tsx](src/components/OutfitRecords.tsx) — 右欄 280px，顯示歷史試穿紀錄卡片，需登入
- **StepGuide Bar** — TryonCenter.tsx 底部 `div.border-t` — 顯示「上傳照片→選擇商品→生成試穿→儲存分享」四步驟，目前步驟反黑

#### 浮層（Overlay）

- **TryonModal** — [src/components/TryonModal.tsx](src/components/TryonModal.tsx) — 點擊「立即試穿」後出現，全螢幕遮罩＋圓角白色彈窗，顯示 AI 生成中（旋轉動畫）或左右對比結果圖
- **LoginPromptModal** — [src/app/studio/page.tsx](src/app/studio/page.tsx) `showLoginPrompt` — 未登入時點擊試穿觸發，小型圓角白色彈窗，含「前往登入」＋「取消」
- **EnlargedImageOverlay** — OutfitRecords.tsx `enlarged` — 點擊紀錄縮圖後展開，深色全螢幕背景，顯示完整試穿結果圖

---

### 3. 登入 / 註冊 — `/login`

```
┌──────────────────────────────────────────────────────┐
│                  （全螢幕灰背景）                      │
│              ┌────────────────────┐                  │
│              │     Logo           │                  │
│              ├────────────────────┤                  │
│              │  LoginCard         │                  │
│              │  ┌─────┬────────┐  │                  │
│              │  │登入 │  註冊  │  │  ← Tabs          │
│              │  └─────┴────────┘  │                  │
│              │  EmailForm         │                  │
│              │  ─── 或使用 ───    │                  │
│              │  SSOButtons        │                  │
│              └────────────────────┘                  │
└──────────────────────────────────────────────────────┘
```

- **LoginCard** — [src/app/login/page.tsx](src/app/login/page.tsx) — 白色方形卡，寬度 max-w-[400px]
- **LoginTabs** — LoginPage 內的 tab 切換，「登入」/ 「註冊」，底線高亮當前頁
- **EmailForm** — LoginPage 的 `<form>` — Email＋密碼輸入（註冊時加姓名欄），送出按鈕
- **SSOButtons** — LoginPage — Google / LINE / Facebook / Apple 四個 SSO 按鈕

---

### 4. 尺寸推薦 — `/size-guide`

- **SizeGuideClient** — [src/components/SizeGuideClient.tsx](src/components/SizeGuideClient.tsx) — 完整的尺寸推薦工具頁（與首頁 SizeFinder 共用邏輯）

---

## 元件對照表 (Component Reference)

| 你看到的東西 | 元件名稱 | 檔案 | 備註 |
|---|---|---|---|
| 頂部「ShapeOnYou」Logo＋導覽 | `Navbar` | [Navbar.tsx](src/components/Navbar.tsx) | `variant="site"` 半透明固定；`variant="app"` 白色靜態 |
| 試衣間左側「即將推出」品牌欄 | `BrandsSidebar` | [BrandsSidebar.tsx](src/components/BrandsSidebar.tsx) | 目前為佔位狀態，260px 寬 |
| 試衣間中央人像上傳大區塊 | `PhotoArea` | [TryonCenter.tsx](src/components/TryonCenter.tsx#L119) | TryonCenter 內的 `div.flex-1`，含拖放邏輯 |
| 試衣間右側小面板（服裝上傳＋按鈕） | `ProductPanel` | [TryonCenter.tsx](src/components/TryonCenter.tsx#L223) | TryonCenter 內的 `div.w-[220px]` |
| 底部步驟進度條（上傳照片…） | `StepGuide Bar` | [TryonCenter.tsx](src/components/TryonCenter.tsx#L323) | 四步驟，當前步驟反黑顯示 |
| 試衣間最右側試穿紀錄清單 | `OutfitRecords` | [OutfitRecords.tsx](src/components/OutfitRecords.tsx) | 280px 寬，需登入才顯示內容 |
| 今日剩餘次數小圓點指示器 | `CreditsIndicator` | [TryonCenter.tsx](src/components/TryonCenter.tsx#L291) | （文件命名，程式碼中為 `div.flex.items-center.gap-1`） |
| 點擊試穿後的全螢幕等待彈窗 | `TryonModal` | [TryonModal.tsx](src/components/TryonModal.tsx) | 分兩個 step：processing（旋轉圈）/ result（左右對比圖）|
| 未登入時彈出的小提示框 | `LoginPromptModal` | [studio/page.tsx](src/app/studio/page.tsx#L87) | （文件命名，程式碼中為 `showLoginPrompt` 條件渲染的 div）|
| 首頁的「先找尺寸」區塊 | `SizeFinder` | [SizeFinder.tsx](src/components/SizeFinder.tsx) | 左側表單＋右側結果，同時在 /size-guide 頁面使用 |
| 登入頁的白色卡片 | `LoginCard` | [login/page.tsx](src/app/login/page.tsx#L81) | （文件命名，程式碼中為 `div.bg-white.border`）|
| 登入/註冊 Tab 切換 | `LoginTabs` | [login/page.tsx](src/app/login/page.tsx#L83) | `tab` state 控制，底線 `-mb-px` 技法 |
| 紀錄卡片的愛心按鈕 | `LikeButton` | [OutfitRecords.tsx](src/components/OutfitRecords.tsx#L154) | 本地 state `liked`，尚未持久化到後端 |
| 點擊縮圖後的大圖燈箱 | `EnlargedImageOverlay` | [OutfitRecords.tsx](src/components/OutfitRecords.tsx#L191) | `enlarged` state 控制，點擊背景關閉 |

---

## 互動行為 (Behaviors)

| 行為 | 觸發方式 | 效果 | 控制位置 |
|---|---|---|---|
| 人像上傳 | 點擊 PhotoArea 虛線框 或 拖放圖片 | 顯示預覽圖，步驟條推進到步驟 2 | TryonCenter.tsx `handleFile()` |
| 服裝上傳 | 點擊 ProductPanel 虛線框 | 上傳至後端後取得 garmentId，步驟條推進到步驟 3 | TryonCenter.tsx `handleGarmentFile()` |
| 立即試穿按鈕 | 點擊（需已上傳人像＋服裝＋有剩餘次數） | 未登入 → 開啟 LoginPromptModal；已登入 → 開啟 TryonModal | studio/page.tsx `handleTryOn()` |
| TryonModal 等待動畫 | 進入 modal 後自動提交，每 3s polling | 旋轉圈＋文字（排隊中 / 生成中） | TryonModal.tsx `startPolling()` |
| TryonModal 結果顯示 | AI 完成後 polling 返回 completed | 切換為左右對比圖，底部顯示下載按鈕 | TryonModal.tsx `step = "result"` |
| 試穿紀錄大圖燈箱 | 點擊 OutfitRecords 的縮圖 | 深色全螢幕覆蓋＋大圖，點背景或 ✕ 關閉 | OutfitRecords.tsx `setEnlarged()` |
| 尺寸查詢 | 填入身高體重後點「查詢推薦尺寸」 | 400ms 假延遲後顯示推薦尺寸＋完整尺寸表 | SizeFinder.tsx `handleSubmit()` |
| 圍度選填展開 | 點擊「加入圍度數據」按鈕 | 展開三個輸入框（胸圍/腰圍/臀圍），圖示旋轉 45° | SizeFinder.tsx `showOptional` state |
| Navbar 登入狀態 | 頁面載入時讀 localStorage | 有 token → 顯示頭像＋Hi 姓名＋登出；無 → 顯示登入按鈕 | Navbar.tsx `getStoredUser()` |
| 重設按鈕 | 點擊 PhotoArea 底部「重設」 | 清空人像預覽＋已選服裝 ID | TryonCenter.tsx `handleReset()` |

---

## 樣式慣例 (Styling Conventions)

### 色彩

| 用途 | 色碼 / 變數 |
|---|---|
| 主要文字、按鈕背景 | `#1D1D1F`（CSS 變數 `--cream`） |
| 頁面背景、輸入框背景 | `#F5F5F7`（CSS 變數 `--charcoal`） |
| 次要文字、accent | `#6E6E73`（CSS 變數 `--accent`） |
| 細線邊框 | `rgba(0,0,0,0.08)`（CSS 變數 `--forma-border`） |
| 半透明文字（說明） | `rgba(0,0,0,0.45)` 到 `rgba(0,0,0,0.25)` |
| 深色區塊（Stats、Footer） | `bg-[#1D1D1F]` |

### 字型

- **Serif 標題**：`font-serif`（Cormorant Garamond），`font-light`，搭配大 `tracking`
- **無襯線正文**：`font-sans`（DM Sans），`font-light` / `font-medium`
- 字級慣用 `clamp()`：`text-[clamp(3.5rem,10vw,6rem)]` 響應式標題

### 間距與圓角

- 大區塊 padding：`py-32 px-6`（sections）
- 卡片 padding：`px-8 py-10`
- 圓角：元件大多用 `rounded-xl`（12px）或 `rounded-2xl`（16px）；方形按鈕不用圓角（Landing CTA）
- 邊框：幾乎都用 `border border-[var(--forma-border)]`（`rgba(0,0,0,0.08)`）

### 修改樣式去哪裡

1. **全域變數**（色彩/字型）→ [src/app/globals.css](src/app/globals.css)
2. **Tailwind 設定**（自訂顏色/breakpoints）→ [tailwind.config.ts](tailwind.config.ts)
3. **頁面佈局**（Studio 三欄比例）→ [src/app/studio/page.tsx](src/app/studio/page.tsx) `grid-cols-[260px_1fr_280px]`
4. **單一元件樣式** → 直接找對應 `.tsx` 檔，className 內的 Tailwind class

---

## 詞彙表 (Vocabulary)

| 你說的 | 對應英文術語 | 用在哪裡 |
|---|---|---|
| 頂部導覽列 | `Navbar` / `nav` | Navbar.tsx |
| 試衣間左側品牌欄 | `BrandsSidebar` / `aside` | BrandsSidebar.tsx |
| 中央主區塊 | `TryonCenter` / `main` | TryonCenter.tsx |
| 人像上傳大框 | `PhotoArea` | TryonCenter.tsx |
| 服裝上傳小面板 | `ProductPanel` | TryonCenter.tsx |
| 右側紀錄欄 | `OutfitRecords` / `aside` | OutfitRecords.tsx |
| 步驟進度條 | `StepGuide Bar` | TryonCenter.tsx（底部 div） |
| AI 生成彈窗 | `TryonModal` | TryonModal.tsx |
| 登入提示彈窗 | `LoginPromptModal` | studio/page.tsx |
| 放大圖燈箱 | `EnlargedImageOverlay` | OutfitRecords.tsx |
| 半透明毛玻璃 | `backdrop-blur-md` + `bg-[rgba(...)]` | Navbar (site) |
| Navbar 手機右側留白 | `pr-5`（20px），左側 `pl-3`（12px） | Navbar.tsx — 兩個 variant 皆同 |
| 旋轉等待圈 | `animate-spin` | TryonModal.tsx |
| 淡入 / 顏色漸變 | `transition-colors duration-200` | 整個專案通用 |
| 細虛線框（上傳區） | `border-2 border-dashed` | PhotoArea, ProductPanel |
| 深色覆蓋層 | `fixed inset-0 bg-black/50 backdrop-blur-sm` | TryonModal, LoginPromptModal |

---

## 修改守則 (Editing Rules)

1. **只修改使用者指定的屬性**，不重構、不「順手」改其他樣式或邏輯
2. **動手前先說明**打算改哪個檔案的哪個 className 或屬性，等確認再執行
3. **改完後告知**「在哪個頁面 / 哪個元件可以看到變化」，方便使用者即時驗證
4. Studio 的三欄比例由 `grid-cols-[260px_1fr_280px]` 控制（studio/page.tsx:63），改這裡會同時影響三欄寬度
5. Navbar 有兩種 variant，改 site 不影響 app，反之亦然，注意 prop 傳入值；手機版右側 padding 為 `pr-5`（20px），左側為 `pl-3`（12px），非對稱設計，改間距時請分開指定
6. `--forma-border` 是全站細線標準，改邊框顏色優先改此變數而非個別 className
