// ─── Backend API client ─────────────────────────────────────────────────────
// Wrapper de fetch que agrega Authorization: Bearer <jwt> automáticamente.
// Toma el access_token de la sesión actual de Supabase (browser).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export interface BackendError {
  status: number;
  message: string;
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function backendFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: BackendError = {
      status: res.status,
      message: (data as { error?: string }).error || `HTTP ${res.status}`,
    };
    throw err;
  }
  return data as T;
}

// Llama a un endpoint del SDK (/api/sdk/*) con la api_key del proyecto.
// El terminal de cobro del dashboard reutiliza /api/sdk/pay y /api/sdk/status
// usando la api_key de la sucursal seleccionada — no hace falta endpoint nuevo.
export async function sdkFetch<T = unknown>(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('x-pollar-api-key', apiKey);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: BackendError = {
      status: res.status,
      message: (data as { error?: string }).error || `HTTP ${res.status}`,
    };
    throw err;
  }
  return data as T;
}

// ─── Tipos compartidos con el backend ──────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  reason: string;
  payout_wallet: string;
  api_key: string;
  /** Monto USDC prellenado en el QR de cobro. null = sin preset (PDF pág. 11 paso 03). */
  default_amount?: number | string | null;
  created_at: string;
  /** Rol del user actual sobre esta sucursal — 'owner' o 'cashier'. */
  role?: 'owner' | 'cashier';
}

export interface BranchMember {
  user_id: string;
  email: string;
  role: 'owner' | 'cashier';
  added_by: string | null;
  created_at: string | null;
}

export interface BranchInvite {
  id: string;
  token: string;
  role: 'owner' | 'cashier';
  invited_email: string | null;
  max_uses: number;
  use_count: number;
  expires_at: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  status:
    | 'pending'
    | 'completed'
    | 'overpaid'
    | 'underpaid'
    | 'expired'
    | 'refunded'
    | 'anomaly'
    | 'late_anomaly';
  reason: string;
  amount_expected: string;
  amount_paid: string;
  asset_code: string;
  wallet_pubkey: string | null;
  expires_at: string;
  created_at: string;
  forward_status: string;
  forward_tx_hash?: string | null;
  crypto_tx_hash?: string | null;
}

export interface PayIntent {
  transaction_id: string;
  wallet_address: string;
  amount: string;
  asset: string;
  expires_at: string;
  network: string;
}

export interface PayStatus {
  transaction_id: string;
  status:
    | 'pending'
    | 'completed'
    | 'overpaid'
    | 'underpaid'
    | 'expired'
    | 'refunded'
    | 'anomaly'
    | 'late_anomaly';
  reason: string;
  amount_expected: string;
  amount_paid: string;
  remaining: string;
  asset: string;
  wallet_address: string;
  expires_at: string;
  time_remaining_seconds: number;
  is_expired: boolean;
  created_at: string;
  forward_status: string;
  forward_tx_hash?: string | null;
  crypto_tx_hash?: string | null;
  fee_amount?: string;
  payout_amount?: string;
  is_free_tx?: boolean;
}
