'use client';

// Dialog que muestra el QR para pagar el upgrade a un tier pago (Scale).
// Reutiliza la lógica visual de /cobrar: QR SEP-7, countdown, polling de
// status. Al detectar `activated:true` cierra y refresca el plan.

import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { backendFetch } from '@/lib/backend-api';
import { buildSep7PayUri, type StellarNetwork } from '@/lib/stellar';
import type { Tier } from '@/lib/tiers';

interface Intent {
  id: string;
  target_tier: Tier;
  amount: string;
  transaction_id: string;
  wallet_address: string;
  expires_at: string;
  network: string;
}

interface StatusData {
  status: 'pending' | 'completed' | 'overpaid' | 'underpaid' | 'expired' | 'anomaly' | 'refunded' | 'late_anomaly';
  amount_paid: string;
  time_remaining_seconds: number;
  is_expired: boolean;
  forward_tx_hash: string | null;
  activated: boolean;
}

interface Props {
  open: boolean;
  intent: Intent | null;
  onClose: () => void;
  onActivated: () => void;
}

function fmtCountdown(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
}

export default function PlanUpgradeDialog({ open, intent, onClose, onActivated }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !intent) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const r = await backendFetch<{ data: StatusData }>(
          `/api/merchant/billing/status?id=${intent.id}`,
        );
        if (cancelled) return;
        setStatus(r.data);
        if (r.data.activated) {
          onActivated();
          return;
        }
        if (r.data.is_expired || r.data.status === 'underpaid' || r.data.status === 'expired' || r.data.status === 'anomaly') {
          return; // terminal, no polea más
        }
        pollTimer.current = setTimeout(tick, 3000);
      } catch {
        if (!cancelled) pollTimer.current = setTimeout(tick, 5000);
      }
    };
    tick();

    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
      setStatus(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intent?.id]);

  const sep7 = useMemo(() => {
    if (!intent) return null;
    return buildSep7PayUri({
      destination: intent.wallet_address,
      amount: intent.amount,
      network: (intent.network as StellarNetwork) || 'TESTNET',
    });
  }, [intent]);

  if (!open || !intent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/60 backdrop-blur-sm print:hidden">
      <div className="bg-white border border-[#e5e7eb] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">
              Activar plan {intent.target_tier.toUpperCase()}
            </h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Pagá ${intent.amount} USDC para activar tu plan. La activación es automática al confirmarse la transacción.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#1a1a1a] text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-center">
            {sep7 && (
              <QRCodeSVG value={sep7} size={256} level="M" marginSize={2} className="w-full h-auto max-w-[260px]" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Monto a pagar</div>
              <div className="text-3xl font-bold text-[#1a1a1a] tabular-nums">
                ${intent.amount} <span className="text-base text-[#9ca3af] font-normal">USDC</span>
              </div>
              {status && parseFloat(status.amount_paid || '0') > 0 && status.status === 'pending' && (
                <div className="text-xs text-amber-700 mt-1.5">
                  Recibido parcial: ${parseFloat(status.amount_paid).toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Estado</div>
              <div className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]">
                {status?.activated ? (
                  <>
                    <span className="text-emerald-700">●</span> Plan activado
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                    {status?.status === 'completed' ? 'Procesando activación…' : 'Esperando pago'}
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Tiempo restante</div>
              <div className="text-xl font-semibold tabular-nums text-[#1a1a1a]">
                {status ? fmtCountdown(status.time_remaining_seconds) : '15:00'}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Wallet destino</div>
              <div className="font-mono text-[10px] text-[#1a1a1a] break-all bg-[#f0f7ff] px-3 py-2 rounded-lg border border-[#e5e7eb]">
                {intent.wallet_address}
              </div>
            </div>

            <button
              onClick={() => sep7 && navigator.clipboard.writeText(sep7)}
              className="w-full px-3 py-2 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
            >
              Copiar link de pago
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e5e7eb] bg-[#f0f7ff] text-xs text-[#6b7280] rounded-b-2xl">
          Escaneá el QR con Binance, Meru, Lobstr o cualquier wallet Stellar con USDC.
          La activación se confirma automáticamente en 3–5 segundos después del pago.
        </div>
      </div>
    </div>
  );
}
