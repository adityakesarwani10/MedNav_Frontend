import { AuthUser } from "./types";

// BASE_URL is read from .env (Vite requires the VITE_ prefix to expose it to the client).
// Add this to your .env at the project root:
//   VITE_API_BASE_URL=http://localhost:3000
export const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:3000";

const TOKEN_KEY = "mednav.auth.token";
const USER_KEY = "mednav.auth.user";
const PENDING_PHONE_KEY = "mednav.auth.pendingPhone";

const normalizePhone = (raw: string) => {
  const trimmed = raw.replace(/\s+/g, "");
  return trimmed.startsWith("+") ? trimmed : `+91${trimmed.replace(/^0+/, "")}`;
};

export const formatPhone = normalizePhone;

const getToken = () => localStorage.getItem(TOKEN_KEY);

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) finalHeaders.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data && (data as { message?: string }).message) ||
      `Request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return data as T;
}

// ---------- Backend response shapes ----------
interface BackendUser {
  id: string;
  name?: string;
  phone: string;
  role: "user" | "admin";
}

const toAuthUser = (u: BackendUser): AuthUser => ({
  id: u.id,
  name: u.name || `User ${u.phone.slice(-4)}`,
  phone: u.phone,
  role: u.role,
});

// Raw backend payloads (loose — fields may vary).
export interface BackendAmbulance {
  id: string;
  plate?: string;
  driver?: string;
  phone?: string;
  status?: string;
  available?: boolean;
  hospital?: string;
  type?: string;
}

export interface BackendHospital {
  id: string;
  name: string;
  erBeds?: number;
  totalBeds?: number;
  available?: boolean;
  address?: string;
  phone?: string;
  specialties?: string[];
  rating?: number;
  distanceKm?: number;
  area?: string;
}

export interface BackendCall {
  id: string;
  condition?: string;
  priority?: string;
  status?: string;
  patient?: string;
  patientName?: string;
  phone?: string;
  pickup?: string;
  destination?: string;
  ambulance?: string;
  ambulanceId?: string;
  timestamp?: string;
  createdAt?: string;
  type?: string;
}

// ============================================================
//                          Auth
// ============================================================
export const api = {
  baseUrl: BASE_URL,

  async sendOtp(phoneRaw: string): Promise<{ phone: string , otp: string}> {
    const phone = normalizePhone(phoneRaw);
    if (phone.replace(/\D/g, "").length < 11) {
      throw new Error("Please enter a valid 10-digit phone number");
    }
    const res = await request<{ success: boolean;  otp: string , message:string}>("/api/auth/send-otp", {
      method: "POST",
      body: { phone },
    });
    sessionStorage.setItem(PENDING_PHONE_KEY, phone);
    return { phone, otp: res.otp };
  },

  async verifyOtp(otp: string): Promise<AuthUser> {
    const phone = sessionStorage.getItem(PENDING_PHONE_KEY);
    if (!phone) throw new Error("No login in progress. Please request OTP again.");
    const res = await request<{ success: boolean; token: string; user: BackendUser }>(
      "/api/auth/verify-otp",
      { method: "POST", body: { phone, otp } },
    );
    localStorage.setItem(TOKEN_KEY, res.token);
    const user = toAuthUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(PENDING_PHONE_KEY);
    return user;
  },

  async me(): Promise<AuthUser | null> {
    if (!getToken()) return null;
    try {
      const res = await request<{ user: BackendUser }>("/api/auth/me", { auth: true });
      const user = toAuthUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      // Token invalid / expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },

  async logout(): Promise<void> {
    try {
      await request<{ success: boolean }>("/api/auth/logout", { method: "POST", auth: true });
    } catch {
      /* ignore network errors on logout */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(PENDING_PHONE_KEY);
  },

  // ============================================================
  //                       User endpoints
  // ============================================================
  user: {
    dashboard: () => request<{ stats: Record<string, number | boolean>; activity: BackendCall[]; activeCall: BackendCall | null }>(
      "/api/user/dashboard",
      { auth: true },
    ),
    fleet: () => request<BackendAmbulance[]>("/api/user/fleet", { auth: true }),
    hospitals: () => request<BackendHospital[]>("/api/user/hospitals", { auth: true }),
    track: (callId: string) =>
      request<{
        callId: string;
        status: string;
        eta?: string;
        distanceKm?: string;
        ambulance?: BackendAmbulance;
        timeline?: { label: string; time?: string; done?: boolean }[];
      }>(`/api/user/track/${encodeURIComponent(callId)}`, { auth: true }),
    calls: () => request<BackendCall[]>("/api/user/calls", { auth: true }),
  },

  // ============================================================
  //                      Admin endpoints
  // ============================================================
  admin: {
    overview: () => request<{ stats: Record<string, number>; recentActivity: BackendCall[]; systemStatus: string }>(
      "/api/admin/overview",
      { auth: true },
    ),
    users: () => request<BackendUser[]>("/api/admin/users", { auth: true }),
    updateUser: (id: string, body: Record<string, unknown>) =>
      request<{ success: boolean; user: BackendUser }>(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        body,
      }),
    fleet: () => request<BackendAmbulance[]>("/api/admin/fleet", { auth: true }),
    updateAmbulance: (id: string, body: Record<string, unknown>) =>
      request<{ success: boolean; ambulance: BackendAmbulance }>(`/api/admin/ambulance/${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        body,
      }),
    hospitals: () => request<BackendHospital[]>("/api/admin/hospitals", { auth: true }),
    updateHospital: (id: string, body: Record<string, unknown>) =>
      request<{ success: boolean; hospital: BackendHospital }>(`/api/admin/hospital/${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        body,
      }),
    calls: () => request<BackendCall[]>("/api/admin/calls", { auth: true }),
  },

  // ============================================================
  //                    Public (no auth) — polled
  // ============================================================
  public: {
    status: () => request<{
      status: string;
      lastDispatch: {
        condition?: string;
        ambulance?: string;
        eta?: string;
        timeline?: { label: string; time?: string; done?: boolean }[];
      } | null;
      stats: Record<string, number>;
      activity: BackendCall[];
    }>("/api/status"),
    fleet: () => request<BackendAmbulance[]>("/api/fleet"),
    hospitals: () => request<BackendHospital[]>("/api/hospitals"),
    calls: () => request<BackendCall[]>("/api/calls"),
  },
};
