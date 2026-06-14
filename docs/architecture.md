# 智能試衣平台（Virtual Try-On）系統架構說明文件

> 版本：1.0｜日期：2026-06-08｜作者：Aaron Wang

---

## 目錄

1. [系統概述](#1-系統概述)
2. [架構說明](#2-架構說明)
   - [生產環境](#21-生產環境)
   - [本地開發環境](#22-本地開發環境)
3. [元件說明](#3-元件說明)
4. [核心流程說明](#4-核心流程說明)
5. [資料模型](#5-資料模型)
6. [API 列表](#6-api-列表)
7. [技術選型理由](#7-技術選型理由)
8. [未來規劃](#8-未來規劃)

---

## 1. 系統概述

**智能試衣平台**（Virtual Try-On，VTR）是一個針對台灣市場的 AI 服裝試穿網頁應用。使用者上傳個人人像照片後，選擇平台上的服裝款式，系統即呼叫 AI 推論服務（Fashn.ai tryon-v1.6），自動合成並回傳試穿效果圖。

### 核心價值主張

- 無需實體試穿，大幅降低退換貨率
- 整合台灣主流電商（規劃中），直接在商品頁觸發試穿
- 輕量匿名流程（MVP），降低使用者進入門檻

### 目前狀態

目前處於 **MVP（最小可行產品）** 階段，已實作基礎試穿流程、服裝管理、圖片儲存及 JWT 身份驗證骨架。

---

## 2. 架構說明

### 2.1 生產環境

```
┌─────────────────────────────────────────────────────────────────────┐
│                          使用者瀏覽器                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Vercel（前端，全球 CDN）                             │
│              Next.js 14 + shadcn/ui + Tailwind CSS                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS REST API
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│         AWS EC2 t4g.small（ap-southeast-1，新加坡）                    │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                   Docker Compose                             │  │
│   │                                                              │  │
│   │   ┌───────────────────────┐   ┌─────────────────────────┐   │  │
│   │   │  FastAPI (Python 3.11) │   │  SQLite                 │   │  │
│   │   │  Uvicorn              │◄──►│  (Docker named volume)  │   │  │
│   │   └──────────┬────────────┘   └─────────────────────────┘   │  │
│   │              │                                               │  │
│   └──────────────┼───────────────────────────────────────────────┘  │
│                  │                                                   │
└──────────────────┼───────────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌────────────────────┐
│  AWS S3       │    │  Fashn.ai API      │
│  (ap-         │    │  (tryon-v1.6)      │
│  southeast-1) │    │  AI 推論服務        │
└───────────────┘    └────────────────────┘
```

**生產環境各層說明：**

| 層級 | 服務 | 規格/說明 |
|------|------|-----------|
| 前端 | Vercel | 免費方案，全球 CDN，自動 HTTPS |
| 後端 | AWS EC2 t4g.small | ARM 架構，新加坡節點（ap-southeast-1），低延遲服務台灣用戶 |
| 資料庫 | SQLite | 存於 Docker named volume，持久化於 EC2 磁碟 |
| 圖片儲存 | AWS S3 | bucket 位於 ap-southeast-1，使用 presigned URL 存取 |
| AI 推論 | Fashn.ai API | 外部 SaaS，呼叫 tryon-v1.6 模型 |
| 容器化 | Docker Compose | 管理後端服務生命週期 |

---

### 2.2 本地開發環境

```
┌────────────────────────────────────────────────────────────┐
│                   開發者本機 Docker Compose                  │
│                                                            │
│   ┌───────────────────┐    ┌────────────────────────────┐  │
│   │  FastAPI (Python) │    │  MinIO                     │  │
│   │  :8000            │◄──►│  (S3 相容物件儲存)           │  │
│   └─────────┬─────────┘    │  :9000 (API) / :9001 (UI)  │  │
│             │              └────────────────────────────┘  │
│   ┌─────────▼─────────┐                                    │
│   │  SQLite           │                                    │
│   │  (本地檔案)        │                                    │
│   └───────────────────┘                                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
         │
         ▼ (AI 推論仍呼叫外部)
┌────────────────────┐
│  Fashn.ai API      │
│  (外部服務)         │
└────────────────────┘

前端：npm run dev → http://localhost:3000
後端：uvicorn → http://localhost:8000
```

本地開發以 **MinIO** 取代 AWS S3，提供完全相同的 S3 API 介面，無需付費即可測試完整圖片上傳／存取流程。

---

## 3. 元件說明

### 3.1 前端（Next.js 14）

| 元件 | 路徑 | 功能 |
|------|------|------|
| 主頁面 | `src/app/page.tsx` | 整合試穿流程的主入口 |
| ImageUploader | `src/components/ImageUploader.tsx` | 人像照片上傳元件 |
| GarmentGrid | `src/components/GarmentGrid.tsx` | 服裝選擇網格 |
| TryonResult | `src/components/TryonResult.tsx` | 試穿結果展示 |
| StatusPolling | `src/components/StatusPolling.tsx` | 每 3 秒輪詢任務狀態 |
| API Client | `src/lib/api.ts` | 封裝所有後端 API 呼叫 |

### 3.2 後端（FastAPI）

| 模組 | 路徑 | 功能 |
|------|------|------|
| 入口 | `app/main.py` | FastAPI 應用初始化、CORS、路由掛載 |
| 設定 | `app/config.py` | 環境變數讀取（Pydantic Settings） |
| 資料庫 | `app/db.py` | SQLite 連線、SQLModel 初始化 |
| 資料模型 | `app/models.py` | Garment、TryonTask、User 模型定義 |
| 物件儲存 | `app/storage.py` | S3/MinIO 操作封裝（boto3） |
| AI 推論 | `app/inference.py` | Fashn.ai API 整合、狀態輪詢 |
| 種子資料 | `app/seed.py` | 預設服裝資料初始化 |
| 試穿 API | `app/api/tryon.py` | POST /api/tryon、GET /api/tryon/{id} |
| 服裝 API | `app/api/garments.py` | GET /api/garments |
| 上傳 API | `app/api/upload.py` | POST /api/upload |
| 認證 API | `app/api/auth.py` | JWT 登入/註冊 |

### 3.3 外部服務

| 服務 | 用途 | 備注 |
|------|------|------|
| Fashn.ai | AI 試穿推論 | 呼叫 tryon-v1.6 模型，非同步返回結果 |
| AWS S3 | 圖片儲存 | 人像照、服裝照、結果圖皆存於此 |
| Vercel | 前端部署 | 自動 CI/CD，推送即部署 |

---

## 4. 核心流程說明

### 4.1 試穿請求流程

```
使用者
  │
  │ 1. 上傳人像照片 + 選擇服裝
  ▼
前端（Next.js）
  │
  │ 2. POST /api/tryon { person_image, garment_id }
  ▼
後端（FastAPI）
  │
  │ 3. 建立 TryonTask（status: 'pending'）
  │    啟動 BackgroundTask
  │
  │ 4. 回傳 { task_id }
  ▼
前端
  │
  │ 5. 每 3 秒輪詢 GET /api/tryon/{task_id}
  ▼
後端 BackgroundTask（非同步執行）
  │
  │ 6. 產生 S3 presigned URL（人像照 + 服裝照）
  │
  │ 7. 呼叫 Fashn.ai API（傳入 presigned URL）
  │
  │ 8. 輪詢 Fashn.ai 任務狀態（直到完成）
  │
  │ 9. 下載結果圖片
  │
  │ 10. 上傳結果圖片至 S3
  │
  │ 11. 更新 TryonTask（status: 'completed', result_image_url）
  ▼
前端（輪詢到 completed 時）
  │
  │ 12. 顯示試穿結果圖
  ▼
使用者看到結果
```

### 4.2 任務狀態機

```
pending ──► processing ──► completed
                │
                └──────────► failed
```

| 狀態 | 說明 |
|------|------|
| `pending` | 任務已建立，等待 BackgroundTask 執行 |
| `processing` | BackgroundTask 正在呼叫 Fashn.ai |
| `completed` | 結果圖已上傳 S3，可供前端顯示 |
| `failed` | 推論失敗，error 欄位記錄錯誤訊息 |

### 4.3 圖片存取流程

所有圖片（人像、服裝、結果）均儲存於 S3，透過 **presigned URL** 提供暫時存取權限：

```
後端需要傳圖給 Fashn.ai
  → 產生 presigned URL（有效期限：例如 1 小時）
  → Fashn.ai 直接從 S3 下載圖片
  → 結果圖上傳回 S3
  → 前端取得 presigned URL 顯示結果
```

---

## 5. 資料模型

### User（使用者）

```sql
CREATE TABLE user (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    name        TEXT,
    hashed_password TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Garment（服裝）

```sql
CREATE TABLE garment (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL,   -- 例如: tops, bottoms, dress
    image_url   TEXT    NOT NULL    -- S3 URL
);
```

### TryonTask（試穿任務）

```sql
CREATE TABLE tryontask (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    person_image_url  TEXT     NOT NULL,   -- S3 URL（人像）
    garment_id        INTEGER  NOT NULL REFERENCES garment(id),
    user_id           INTEGER  REFERENCES user(id),  -- nullable（匿名支援）
    status            TEXT     NOT NULL DEFAULT 'pending',
    result_image_url  TEXT,              -- S3 URL（結果圖，完成後填入）
    error             TEXT,              -- 失敗原因（失敗時填入）
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 模型關聯

```
User ──(1:N)──► TryonTask ◄──(N:1)── Garment
```

---

## 6. API 列表

### 試穿

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | `/api/tryon` | 提交試穿請求 | 否（匿名） |
| GET | `/api/tryon/{task_id}` | 查詢任務狀態與結果 | 否 |

**POST /api/tryon 請求格式：**
```json
{
  "person_image_url": "s3://...",
  "garment_id": 1
}
```

**GET /api/tryon/{task_id} 回應格式：**
```json
{
  "task_id": 42,
  "status": "completed",
  "result_image_url": "https://s3.../result.jpg",
  "created_at": "2026-06-08T12:00:00Z"
}
```

### 服裝

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| GET | `/api/garments` | 列出所有服裝 | 否 |

### 上傳

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | `/api/upload` | 上傳圖片至 S3/MinIO | 否 |

### 認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 使用者註冊 |
| POST | `/api/auth/login` | 使用者登入，回傳 JWT |

---

## 7. 技術選型理由

### 後端：FastAPI

- **效能**：基於 ASGI（asyncio），高並發表現優秀
- **簡潔**：自動產生 OpenAPI 文件，型別標註即文件
- **BackgroundTasks**：內建非同步背景任務，MVP 階段無需引入 Celery
- **生態**：SQLModel（SQLAlchemy + Pydantic）整合簡單，適合快速開發

### 前端：Next.js 14 + shadcn/ui

- **App Router**：Server Components 提升 SEO 與初始載入速度
- **shadcn/ui**：元件複製到專案內，可完全客製化，設計質感高
- **Vercel 部署**：零設定 CI/CD，免費方案足夠 MVP

### 資料庫：SQLite → PostgreSQL

- **MVP 階段**：SQLite 無需另外起服務，降低部署複雜度
- **遷移路徑**：SQLModel 抽象層讓遷移至 PostgreSQL 改動極小
- **限制**：SQLite 不適合高並發寫入，MVP 後需換 PostgreSQL

### 物件儲存：MinIO（開發）/ S3（生產）

- **完全相容**：MinIO 實作 S3 API，同一份程式碼不需修改
- **成本**：本地開發完全免費，生產使用 S3 的區域感知低延遲

### AI 推論：Fashn.ai API

- **快速上線**：無需自建 GPU 基礎設施
- **品質**：tryon-v1.6 在虛擬試穿任務上效果達業界水準
- **成本**：按次計費，MVP 驗證階段無需固定成本

### 部署：EC2 t4g.small（新加坡）

- **地理位置**：ap-southeast-1 對台灣使用者延遲約 50-80ms（優於美西 150ms+）
- **ARM 架構**：t4g 系列價格比 t3 低約 20%，適合省成本
- **彈性**：可隨需求升級至 t4g.medium 或更大

### 套件管理：uv（Python）

- **速度**：比 pip + venv 快 10-100 倍
- **鎖定**：uv.lock 確保環境可重現

---

## 8. 未來規劃

### Phase 2：效能與可靠性

| 項目 | 說明 |
|------|------|
| Celery + Redis | 替換 BackgroundTasks，支援任務重試、佇列管理、分散式執行 |
| PostgreSQL | 替換 SQLite，支援高並發寫入、pgvector 向量搜尋 |
| WebSocket | 替換前端輪詢，推播試穿完成通知 |
| JWT 認證完整化 | 目前已有骨架，Phase 2 完整實作 Refresh Token 機制 |

### Phase 3：使用者系統

| 項目 | 說明 |
|------|------|
| 社群登入 | Google、LINE、Facebook、Apple OAuth2 |
| 試穿歷史 | 使用者可查看過去試穿紀錄 |
| 收藏/分享 | 試穿結果可分享至社群媒體 |

### Phase 4：台灣市場功能

| 項目 | 說明 |
|------|------|
| 電商整合 | 蝦皮、momo、PChome 商品頁直接觸發試穿 |
| 尺寸推薦 | 結合體型分析推薦最適尺寸 |
| LINE Login + 分享 | LINE 是台灣最主要社群平台，深度整合提升分享率 |

### Phase 5：生產強化

| 項目 | 說明 |
|------|------|
| 自建 AI 推論 | CatVTON 模型部署至 RunPod/Modal，降低推論成本 |
| CI/CD | GitHub Actions 自動測試、建置、部署 |
| 監控 | Prometheus + Grafana 指標儀表板，Sentry 錯誤追蹤 |
| CDN | CloudFront 加速 S3 圖片存取 |

---

*文件由 Claude Code 自動產生，請隨架構演進持續更新。*
