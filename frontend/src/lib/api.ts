import {
  clearToken,
  getAuthHeaders,
  getRefreshToken,
  setRefreshToken,
  setToken,
} from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Garment {
  id: string;
  name: string;
  category: string;
  image_url: string;
}

export interface TryonResult {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result_image_url?: string;
  person_image_url?: string;
  error?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  oauth_provider: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// ── Auto-refresh helper ───────────────────────────────────────────────────────

let _isRefreshing = false;

async function refreshAccessToken(): Promise<boolean> {
  if (_isRefreshing) return false;
  const rt = getRefreshToken();
  if (!rt) return false;

  _isRefreshing = true;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      clearToken();
      return false;
    }
    const data: AuthResponse = await res.json();
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  } finally {
    _isRefreshing = false;
  }
}

// Authenticated fetch with auto-retry on 401
async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...getAuthHeaders(), ...(init.headers as Record<string, string> || {}) };
  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = { ...getAuthHeaders(), ...(init.headers as Record<string, string> || {}) };
      res = await fetch(url, { ...init, headers: retryHeaders });
    }
  }
  return res;
}

// ── Garments ───────────────────────────────────────────────────────────────────

export async function fetchGarments(): Promise<Garment[]> {
  const res = await fetch(`${API_URL}/api/garments`);
  if (!res.ok) throw new Error("Failed to fetch garments");
  return res.json();
}

export async function uploadGarment(file: File, name?: string): Promise<Garment> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  const res = await authFetch(`${API_URL}/api/garments/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload garment");
  return res.json();
}

// ── Try-on ─────────────────────────────────────────────────────────────────────

export async function createTryon(
  personImage: File,
  garmentId: string
): Promise<{ task_id: string; status: string }> {
  const formData = new FormData();
  formData.append("person_image", personImage);
  formData.append("garment_id", garmentId);

  const res = await authFetch(`${API_URL}/api/tryon`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create tryon task");
  return res.json();
}

export async function getTryonStatus(taskId: string): Promise<TryonResult> {
  const res = await fetch(`${API_URL}/api/tryon/${taskId}`);
  if (!res.ok) throw new Error("Failed to get tryon status");
  return res.json();
}

export async function fetchTryonHistory(): Promise<TryonResult[]> {
  const res = await authFetch(`${API_URL}/api/tryon/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "註冊失敗");
  }
  return res.json();
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "登入失敗");
  }
  return res.json();
}

export async function ssoLogin(
  provider: string,
  providerId: string,
  email: string,
  name?: string | null,
  avatarUrl?: string | null
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, provider_id: providerId, email, name, avatar_url: avatarUrl }),
  });
  if (!res.ok) throw new Error("SSO 登入失敗");
  return res.json();
}

export async function getMe(): Promise<AuthUser> {
  const res = await authFetch(`${API_URL}/api/auth/me`);
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}

export async function logoutUser(): Promise<void> {
  const rt = getRefreshToken();
  if (rt) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    }).catch(() => {});
  }
  clearToken();
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("請求失敗");
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "重設失敗");
  }
}

export async function updateProfile(
  name?: string,
  avatarUrl?: string
): Promise<AuthUser> {
  const res = await authFetch(`${API_URL}/api/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar_url: avatarUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "更新失敗");
  }
  return res.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await authFetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "更改密碼失敗");
  }
}