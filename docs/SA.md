# ShapeOnYou — System Architecture Document

> 版本：1.0　　最後更新：2026-06-29　　維護者：Aaron Wang

---

## 1. 系統概覽

ShapeOnYou 是一個 AI 虛擬試衣平台，讓用戶上傳個人全身照，選擇服裝後由 Fashn.ai API 生成試穿效果圖。

### 核心流程

```
用戶上傳人像 → 選服裝 → FastAPI 建立 Task → BackgroundTask 呼叫 Fashn.ai
→ 輪詢結果 → 下載結果圖 → 上傳 S3 → 前端輪詢取得結果
```

---

## 2. 系統架構

### 架構圖

```
Browser（用戶）
    │
    ▼
CloudFront (*.cloudfront.net → 之後換成自訂 domain + HTTPS)
    │  預設行為: /* → EC2:80
    │
    ▼
EC2 t4g.small — nginx :80 (ap-southeast-1, sg-0d5b7b12fb18bc258)
    │
    ├──  /*              → Next.js  :3000  (前端)
    ├──  /api/auth/*     → Next.js  :3000  (NextAuth，屬於前端)
    └──  /api/*          → FastAPI  :8000  (後端)
              │
              ├── SQLite (tryon.db, EBS 持久化)
              ├── BackgroundTask (Fashn.ai 輪詢)
              └── Cron (backup + cleanup)
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
       AWS S3       Fashn.ai        Resend
  (ap-southeast-1)  (tryon-v1.6)   (email)
  person-images/
  result-images/
  images/ (garments)
  backups/ (DB snapshots)
```

### 架構圖檔案

- `docs/architecture.drawio` — draw.io 互動式架構圖

---

## 3. 基礎設施資訊

### EC2

| 項目 | 值 |
|------|-----|
| Instance ID | i-00f4c5d8a2d2701d6 |
| Instance Type | t4g.small (ARM, 2 vCPU / 2GB RAM) |
| Region | ap-southeast-1 (Singapore) |
| AMI | ami-0e72552cffa1f6aec (Amazon Linux 2023 ARM) |
| Public IP | 18.138.212.224 |
| DNS | ec2-18-138-212-224.ap-southeast-1.compute.amazonaws.com |
| Security Group | sg-0d5b7b12fb18bc258 (clothes-sg) |
| Key Pair | clothes-key (~/Desktop/clothes-key.pem) |
| EBS | 20GB gp3 |

### Security Group 規則

| Port | Protocol | Source | 用途 |
|------|----------|--------|------|
| 22 | TCP | 1.169.36.26/32 | SSH（部署者 IP） |
| 80 | TCP | 0.0.0.0/0 | HTTP（CloudFront origin） |
| 8000 | TCP | 0.0.0.0/0 | FastAPI（CloudFront origin，之後可限制為 CF only） |

### AWS S3

| 項目 | 值 |
|------|-----|
| Bucket | ai-clothes-ut-109152774123-ap-southeast-1-an |
| Region | ap-southeast-1 |
| Prefixes | `person-images/`, `result-images/`, `images/`, `backups/` |

### CloudFront

| 項目 | 值 |
|------|-----|
| Origin | EC2 Public IP :80 |
| Default URL | (建立後填入) |
| Custom Domain | (之後申請 domain 後設定) |
| SSL | (之後申請 ACM 憑證後啟用) |

---

## 4. 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 14 |
| UI | shadcn/ui + Tailwind CSS | — |
| 後端框架 | FastAPI + Uvicorn | — |
| ORM | SQLModel | — |
| 資料庫 | SQLite (WAL mode) | — |
| 物件儲存 | AWS S3 (boto3) | — |
| AI 推論 | Fashn.ai API (tryon-v1.6) | — |
| 認證 | JWT + Refresh Token + NextAuth.js | — |
| SSO | Google OAuth (完成) / LINE (進行中) | — |
| Email | Resend API | — |
| Web 伺服器 | nginx (reverse proxy) | — |
| 容器化 | Docker + Docker Compose | — |
| CDN | AWS CloudFront | — |
| OS | Amazon Linux 2023 (ARM) | — |

---

## 5. 目錄結構

```
clothes/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI 入口
│       ├── config.py        # 環境變數（Pydantic Settings）
│       ├── models.py        # User, Garment, TryonTask, RefreshToken, PasswordResetToken
│       ├── inference.py     # Fashn.ai 整合（BackgroundTask）
│       ├── storage.py       # S3 操作（boto3）
│       ├── auth.py          # JWT 工具
│       ├── db.py            # SQLite WAL 連線
│       ├── seed.py          # 預設服裝資料
│       └── api/
│           ├── auth.py      # 登入/註冊/SSO/JWT 管理
│           ├── garments.py  # 服裝 CRUD
│           ├── tryon.py     # 試穿任務
│           └── upload.py    # 圖片上傳
│   └── scripts/
│       ├── backup_db.py     # SQLite → S3 備份
│       ├── cleanup_images.py # 定期清洗 S3 圖片（30天/7天）
│       └── clear_s3.py      # 一次性清空 S3（已執行）
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router 頁面
│       ├── components/      # React 元件
│       ├── lib/
│       │   ├── api.ts       # 後端 API 封裝
│       │   └── auth.ts      # localStorage token 管理
│       └── auth.ts          # NextAuth 設定
├── docs/
│   ├── SA.md                # 本文件
│   ├── architecture.drawio  # draw.io 架構圖
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   └── AUTH_ARCHITECTURE.md
├── docker-compose.yml       # 本地開發
├── docker-compose.prod.yml  # 生產環境
└── Makefile
```

---

## 6. 資料模型

```python
User               # id, email, name, password_hash, oauth_provider, is_admin, daily_credits_used
Garment            # id, name, category, image_url
TryonTask          # id, person_image_url, garment_id, user_id, status, result_image_url, created_at
RefreshToken       # id, user_id, token_hash, expires_at, revoked
PasswordResetToken # id, user_id, token_hash, expires_at, used
```

---

## 7. API 端點

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/sso
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
PATCH /api/auth/profile
POST /api/auth/change-password
GET  /api/garments
GET  /api/garments/{id}
POST /api/garments/upload
POST /api/upload
POST /api/tryon
GET  /api/tryon/history
GET  /api/tryon/{task_id}
GET  /health
```

---

## 8. 認證機制

- **Access Token**：JWT，1 天有效，存 localStorage
- **Refresh Token**：30 天有效，DB 存 hash，rotation 機制（使用後換新）
- **Google SSO**：NextAuth → POST /api/auth/sso → JWT
- **每日限制**：5 次試穿/用戶/天（`daily_credits_used`）

---

## 9. S3 圖片管理

| Prefix | 內容 | 清洗策略 |
|--------|------|----------|
| `person-images/` | 用戶上傳人像 | 30 天後刪除（透過 TryonTask） |
| `result-images/` | 試穿結果圖 | 30 天後刪除（透過 TryonTask） |
| `images/` | 服裝圖片（seed） | 永久保留 |
| `backups/` | SQLite 快照 | 手動管理 |

---

## 10. 排程任務（EC2 Cron）

```cron
# 每天凌晨 3:00 備份 DB 到 S3
0 3 * * * docker exec clothes-backend-1 python scripts/backup_db.py >> /var/log/tryon_backup.log 2>&1

# 每天凌晨 3:30 清洗 30 天前的圖片
30 3 * * * docker exec clothes-backend-1 python scripts/cleanup_images.py >> /var/log/tryon_cleanup.log 2>&1
```

---

## 11. 部署流程

### 首次部署

```bash
# 1. SSH 進 EC2
ssh -i ~/Desktop/clothes-key.pem ec2-user@18.138.212.224

# 2. 裝 Docker
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# （重新登入生效）

# 3. 裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 設 GitHub deploy key（read-only）
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub  # 加到 GitHub repo → Settings → Deploy keys

# 5. Clone repo
GIT_SSH_COMMAND='ssh -i ~/.ssh/deploy_key' git clone git@github.com:<user>/clothes.git
cd clothes

# 6. 傳 .env（從本機執行）
scp -i ~/Desktop/clothes-key.pem .env ec2-user@18.138.212.224:~/clothes/

# 7. 啟動
docker-compose -f docker-compose.prod.yml up -d

# 8. 設 cron
crontab -e
```

### 更新部署

```bash
ssh -i ~/Desktop/clothes-key.pem ec2-user@<EC2 public IP>  # AWS Console → EC2 → clothes-backend 查目前 IP
cd clothes
GIT_SSH_COMMAND='ssh -i ~/.ssh/deploy_key' git pull origin main
GIT_SHA=$(git rev-parse --short HEAD) docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

部署完用 `curl http://localhost:8000/health` 確認回傳的 `git_sha` 跟 `git rev-parse --short HEAD` 一致，不用每次都 SSH 進去對 commit。

---

## 12. 環境變數（.env）

| 變數 | 說明 | 必填 |
|------|------|------|
| `FASHN_API_KEY` | Fashn.ai API 金鑰 | ✅ |
| `USE_S3` | `true` = AWS S3, `false` = MinIO | ✅ |
| `AWS_ACCESS_KEY_ID` | S3 IAM key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | S3 IAM secret | ✅ |
| `AWS_S3_BUCKET` | S3 bucket 名稱 | ✅ |
| `JWT_SECRET` | JWT 簽名密鑰（openssl rand -hex 32） | ✅ |
| `NEXTAUTH_SECRET` | NextAuth 密鑰 | ✅ |
| `NEXTAUTH_URL` | 前端 URL（CloudFront URL） | ✅ |
| `NEXT_PUBLIC_API_URL` | 後端 API URL（CloudFront URL） | ✅ |
| `RESEND_API_KEY` | Resend 發信 API key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ |
| `FRONTEND_URL` | 前端 URL（CORS 用） | ✅ |

---

## 13. 監控與維護

### 查看 Log

```bash
# 後端 log
docker logs clothes-backend-1 -f

# 前端 log
docker logs clothes-frontend-1 -f

# 備份 log
tail -f /var/log/tryon_backup.log

# 清洗 log
tail -f /var/log/tryon_cleanup.log
```

### 資料庫

```bash
# 進入 DB
docker exec -it clothes-backend-1 sqlite3 /app/tryon.db

# 手動備份
docker exec clothes-backend-1 python scripts/backup_db.py
```

### 手動清洗 S3

```bash
# 預覽
docker exec clothes-backend-1 python scripts/cleanup_images.py

# 一次性清空（謹慎使用）
docker exec -it clothes-backend-1 python scripts/clear_s3.py
```

---

## 14. 已知限制與未來規劃

### 已知限制

| 項目 | 說明 |
|------|------|
| SQLite 單寫入者 | 高併發寫入可能 locked；流量大時換 PostgreSQL (RDS) |
| BackgroundTask | 重啟服務會中斷進行中的試穿任務 |
| 試穿 5 次/天 | hardcode 在 `tryon.py`，之後可做 admin 調整介面 |
| S3 credentials | 目前用 root IAM key，之後應改用 IAM Role（EC2 instance profile） |

### 未來規劃

- **Phase 2**：Celery + Redis（取代 BackgroundTask）、PostgreSQL
- **Phase 3**：試穿歷史收藏、分享連結
- **Phase 4**：電商整合、尺寸推薦
- **Phase 5**：自建 AI 推論（CatVTON/RunPod）、CI/CD、監控

---

*文件由 Claude Code 生成，部署變更請同步更新本文件。*
