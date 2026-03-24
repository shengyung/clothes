import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

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
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ── Garments ──────────────────────────────────────────────────────────────────

export async function fetchGarments(): Promise<Garment[]> {
  const res = await fetch(`${API_URL}/api/garments`);
  if (!res.ok) throw new Error("Failed to fetch garments");
  return res.json();
}

// ── Try-on ────────────────────────────────────────────────────────────────────

export async function createTryon(
  personImage: File,
  garmentId: string
): Promise<{ task_id: string; status: string }> {
  const formData = new FormData();
  formData.append("person_image", personImage);
  formData.append("garment_id", garmentId);

  const res = await fetch(`${API_URL}/api/tryon`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_URL}/api/tryon/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(email: string, password: string, name?: string): Promise<AuthResponse> {
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

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
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
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}
