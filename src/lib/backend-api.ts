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

// ─── Tipos compartidos con el backend ──────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  reason: string;
  payout_wallet: string;
  api_key: string;
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
