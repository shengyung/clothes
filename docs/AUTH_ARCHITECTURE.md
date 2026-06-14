# FORMA — 使用者認證架構圖

---

## 1. 系統總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        瀏覽器 (Client)                           │
│                                                                  │
│   localStorage                    Next.js 前端                   │
│   ┌──────────────────┐            localhost:3000                 │
│   │ forma_token      │ ◄──────── 登入/註冊成功後寫入             │
│   │ forma_refresh_t… │                                           │
│   │ forma_user       │                                           │
│   └──────────────────┘                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Authorization: Bearer <token>
                           │ HTTP REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI 後端 (localhost:8000)                  │
│                                                                  │
│   /api/auth/register    /api/auth/login    /api/auth/sso        │
│   /api/auth/logout      /api/auth/refresh                       │
│   /api/auth/forgot-password               /api/auth/me          │
│   /api/auth/reset-password                /api/auth/profile     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQLModel ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SQLite (tryon.db)                             │
│                                                                  │
│   users │ refreshtoken │ passwordresettoken                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 註冊流程

```
使用者                 前端 (Next.js)              後端 (FastAPI)          SQLite
  │                        │                           │                     │
  │── 填 Email + 密碼 ────►│                           │                     │
  │                        │── POST /api/auth/register►│                     │
  │                        │                           │─ 查詢 Email 重複？ ─►│
  │                        │                           │◄─ 無重複 ───────────│
  │                        │                           │                     │
  │                        │                           │ bcrypt.hashpw(密碼) │
  │                        │                           │                     │
  │                        │                           │─ INSERT users ──────►│
  │                        │                           │─ INSERT refreshtoken►│
  │                        │                           │                     │
  │                        │◄── { access_token,        │                     │
  │                        │     refresh_token, user } │                     │
  │                        │                           │                     │
  │                        │ 寫入 localStorage          │                     │
  │◄── 跳轉 /studio ───────│                           │                     │
```

---

## 3. 登入流程

```
使用者                 前端 (Next.js)              後端 (FastAPI)          SQLite
  │                        │                           │                     │
  │── 填 Email + 密碼 ────►│                           │                     │
  │                        │── POST /api/auth/login ──►│                     │
  │                        │                           │─ SELECT users ──────►│
  │                        │                           │◄─ 返回 user row ────│
  │                        │                           │                     │
  │                        │                           │ bcrypt.checkpw()    │
  │                        │                           │ ✓ 密碼正確          │
  │                        │                           │                     │
  │                        │                           │ jwt.encode(user_id) │
  │                        │                           │ → access_token      │
  │                        │                           │                     │
  │                        │                           │─ INSERT refreshtoken►│
  │                        │                           │                     │
  │                        │◄── { access_token,        │                     │
  │                        │     refresh_token, user } │                     │
  │                        │                           │                     │
  │                        │ localStorage.setItem(…)   │                     │
  │◄── 跳轉 /studio ───────│                           │                     │
```

---

## 4. 已登入 API 請求

```
前端 (Next.js)                       後端 (FastAPI)               SQLite
  │                                       │                          │
  │── GET /api/tryon/history ────────────►│                          │
  │   Header: Authorization: Bearer JWT  │                          │
  │                                       │                          │
  │                                       │ jwt.decode(token)        │
  │                                       │ → 取出 user_id           │
  │                                       │ → 驗證簽名 & 過期時間    │
  │                                       │                          │
  │                                       │── SELECT users WHERE id─►│
  │                                       │◄─ User 物件 ─────────────│
  │                                       │                          │
  │◄── 200 回應資料 ─────────────────────│                          │
```

---

## 5. Token 自動刷新（401 攔截）

```
前端 authFetch()                    後端 (FastAPI)                SQLite
  │                                     │                            │
  │── API 請求 ────────────────────────►│                            │
  │                                     │ access_token 已過期        │
  │◄── 401 Unauthorized ───────────────│                            │
  │                                     │                            │
  │ [自動攔截]                          │                            │
  │── POST /api/auth/refresh ──────────►│                            │
  │   refresh_token                     │── 查 refreshtoken 表 ─────►│
  │                                     │◄─ 找到且未撤銷 ────────────│
  │                                     │                            │
  │                                     │── UPDATE revoked=True ─────►│  ← Token Rotation
  │                                     │── INSERT 新 refreshtoken ──►│
  │                                     │                            │
  │◄── 新 access_token + refresh_token─│                            │
  │                                     │                            │
  │ 更新 localStorage                   │                            │
  │── 重試原本的 API 請求 ─────────────►│                            │
  │◄── 200 成功 ───────────────────────│                            │
```

---

## 6. 登出流程

```
使用者           前端 (Next.js)         後端 (FastAPI)            SQLite
  │                   │                     │                        │
  │── 點登出 ────────►│                     │                        │
  │                   │── POST /api/auth/logout ──────────────────►  │
  │                   │   { refresh_token }  │                        │
  │                   │                     │── UPDATE refreshtoken ─►│
  │                   │                     │   SET revoked=True      │
  │                   │                     │                        │
  │                   │◄── { message: "已登出" }                     │
  │                   │                     │                        │
  │                   │ localStorage.clear()│                        │
  │◄── 頁面更新 ──────│                     │                        │
  │   (Navbar 顯示    │                     │                        │
  │    「登入」按鈕)  │                     │                        │
```

---

## 7. 忘記密碼流程

```
使用者              前端                  後端                       SQLite / Email
  │                  │                    │                              │
  │ 輸入 Email ─────►│                    │                              │
  │                  │ POST /forgot-password ──────────────────────────► │
  │                  │                    │                              │
  │                  │                    │ os.urandom(32) → raw_token   │
  │                  │                    │ SHA-256(raw) → token_hash    │
  │                  │                    │── INSERT passwordresettoken ─►│
  │                  │                    │   (expires_at = now + 1hr)   │
  │                  │                    │                              │
  │                  │                    │── Resend.send() ─────────────►│ Email
  │                  │                    │   連結: /reset-password       │
  │                  │                    │         ?token=<raw_token>   │
  │                  │◄── 200 ───────────│                              │
  │◄ "重設連結已寄出" │                    │                              │
  │                  │                    │                              │
  │ 點 Email 連結 ──►│ /reset-password    │                              │
  │ 輸入新密碼 ──────►│                    │                              │
  │                  │ POST /reset-password ──────────────────────────► │
  │                  │  { token, new_pw } │ SHA-256(token) 查 DB ───────►│
  │                  │                    │◄─ 找到未使用且未過期 ─────────│
  │                  │                    │── UPDATE users.password_hash ►│
  │                  │                    │── UPDATE token.used=True ────►│
  │◄── "重設成功" ───│◄── 200 ───────────│                              │
```

---

## 8. SSO 社群登入流程

```
使用者         前端 (NextAuth)          Google OAuth          後端 (FastAPI)      SQLite
  │                 │                       │                      │                │
  │ 點 Google 登入─►│                       │                      │                │
  │                 │── 導向 Google 授權頁 ►│                      │                │
  │◄── Google 登入頁│                       │                      │                │
  │                 │                       │                      │                │
  │ 完成 Google 授權│                       │                      │                │
  │                 │◄── OAuth callback ────│                      │                │
  │                 │    { provider_id,     │                      │                │
  │                 │      email, name,     │                      │                │
  │                 │      avatar }         │                      │                │
  │                 │                       │                      │                │
  │                 │ useEffect 偵測 session │                      │                │
  │                 │── POST /api/auth/sso ─────────────────────► │                │
  │                 │   { provider: "google" │                     │                │
  │                 │     provider_id, email}│                     │                │
  │                 │                        │                     │                │
  │                 │                        │    查 oauth_provider ────────────────►│
  │                 │                        │    ◄─ 無此用戶 ──────────────────────│
  │                 │                        │    INSERT users (無 password_hash) ──►│
  │                 │                        │                     │                │
  │                 │◄─── { access_token, refresh_token, user } ──│                │
  │                 │                        │                     │                │
  │◄── 跳轉 /studio │                        │                     │                │
```

---

## 9. 資料庫 Schema

```
┌────────────────────────────────┐
│            users               │
├────────────────────────────────┤
│ id            UUID (PK)        │
│ email         TEXT UNIQUE      │
│ password_hash TEXT (nullable)  │ ← SSO 用戶為 NULL
│ name          TEXT             │
│ avatar_url    TEXT             │
│ oauth_provider     TEXT        │ ← "google"/"line"/NULL
│ oauth_provider_id  TEXT        │
│ is_admin      BOOLEAN          │
│ created_at    DATETIME         │
└──────────────┬─────────────────┘
               │ 1:N
    ┌──────────┴────────────────────────────────┐
    │                                            │
    ▼                                            ▼
┌──────────────────────┐           ┌─────────────────────────┐
│     refreshtoken     │           │   passwordresettoken    │
├──────────────────────┤           ├─────────────────────────┤
│ id          UUID     │           │ id           UUID        │
│ user_id     FK       │           │ user_id      FK          │
│ token_hash  TEXT     │ ← SHA-256 │ token_hash   TEXT        │ ← SHA-256
│ expires_at  DATETIME │           │ expires_at   DATETIME    │
│ revoked     BOOLEAN  │           │ used         BOOLEAN     │
│ created_at  DATETIME │           │ created_at   DATETIME    │
└──────────────────────┘           └─────────────────────────┘
```

---

## 10. Token 安全機制總覽

```
┌──────────────────────────────────────────────────────────┐
│                    安全設計原則                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  密碼儲存                                                 │
│  明文密碼 ──► bcrypt(cost=12) ──► hash 存 DB             │
│              （不可逆，暴力破解成本高）                   │
│                                                          │
│  Access Token (JWT)                                      │
│  { user_id, exp } ──► HMAC-SHA256(JWT_SECRET) ──► token  │
│  有效期：1天 │ 無狀態（不查 DB）│ 可自驗證               │
│                                                          │
│  Refresh Token                                           │
│  os.urandom(64) ──► SHA-256 hash 存 DB                   │
│  有效期：30天 │ 使用後立即 rotate │ revoked 欄位控制      │
│                                                          │
│  Reset Token                                             │
│  os.urandom(32) ──► SHA-256 hash 存 DB                   │
│  有效期：1小時 │ 使用後標記 used=True                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
