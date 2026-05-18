'use client';

// Hosted Checkout — página pública del cobro.
// URL: /checkout/<transaction_id>
//
// El comercio redirige al cliente acá pasándole el transaction_id que recibió
// del SDK (POST /api/sdk/pay). El cliente ve:
//   - Monto, motivo, comercio
//   - QR SEP-7 escaneable desde Binance/Lobstr/Meru
//   - Status en vivo (polling cada 4 s + auto-verifica en backend)
//   - Botón "Verificar pago" para forzar el chequeo
//   - Botón "Compartir por WhatsApp" / "Imprimir"
//   - Si tiene ?success_url=, redirige cuando se completa

import { useEffect, useMemo, useState, use } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { buildSep7PayUri, normalizeNetwork, stellarExpertTxUrl } from '@/lib/stellar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const NETWORK = normalizeNetwork(process.env.NEXT_PUBLIC_STELLAR_NETWORK);

interface CheckoutData {
  transaction_id: string;
  merchant_name: string;
  status: 'pending' | 'completed' | 'overpaid' | 'underpaid' | 'expired' | 'refunded' | 'anomaly' | 'late_anomaly';
  reason: string;
  amount_expected: string;
  amount_paid: string;
  remaining: string;
  asset: string;
  wallet_address: string | null;
  expires_at: string;
  time_remaining_seconds: number;
  is_expired: boolean;
  created_at: string;
  forward_status?: string;
  forward_tx_hash?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Esperando pago',
  completed: 'Pago recibido',
  overpaid: 'Pagado con excedente',
  underpaid: 'Pago parcial — vencido',
  expired: 'Cobro vencido',
  refunded: 'Reembolsado',
  anomaly: 'Requiere revisión',
  late_anomaly: 'Requiere revisión',
};

function fmtCountdown(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
}

const TERMINAL = new Set(['completed', 'overpaid', 'underpaid', 'expired', 'refunded', 'anomaly']);

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const successUrl = searchParams.get('success_url') || null;

  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = async (): Promise<CheckoutData | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/checkout/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json.data as CheckoutData;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const fresh = await fetchStatus();
      if (cancelled) return;
      if (fresh) {
        setData(fresh);
        // Si terminó y hay success_url → redirigir al comercio
        if (TERMINAL.has(fresh.status) && successUrl) {
          const url = new URL(successUrl);
          url.searchParams.set('tx', fresh.transaction_id);
          url.searchParams.set('status', fresh.status);
          setTimeout(() => { window.location.href = url.toString(); }, 2500);
          return;
        }
      }
      if (fresh && !TERMINAL.has(fresh.status)) {
        timer = setTimeout(tick, 4000);
      }
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const verify = async () => {
    setVerifying(true);
    const fresh = await fetchStatus();
    if (fresh) setData(fresh);
    setVerifying(false);
  };

  const sep7Uri = useMemo(() => {
    if (!data || !data.wallet_address) return null;
    return buildSep7PayUri({
      destination: data.wallet_address,
      amount: data.amount_expected,
      network: NETWORK,
      memo: data.transaction_id.slice(0, 28),
    });
  }, [data]);

  if (error && !data) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold mb-2">Cobro no encontrado</h1>
        <p className="text-sm text-[#6b7280]">{error}</p>
      </Centered>
    );
  }
  if (!data) {
    return <Centered><p className="text-sm text-[#9ca3af]">Cargando cobro…</p></Centered>;
  }

  const settled = data.status === 'completed' || data.status === 'overpaid';
  const dead = ['expired', 'underpaid', 'refunded', 'anomaly', 'late_anomaly'].includes(data.status);

  if (settled) {
    return (
      <Centered>
        <Brand />
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
          <svg className="w-8 h-8 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-1">¡Pago recibido!</h1>
        <p className="text-sm text-[#6b7280] mb-5">
          {parseFloat(data.amount_paid).toFixed(2)} USDC pagados a {data.merchant_name}.
        </p>
        {data.forward_tx_hash && (
          <a
            href={stellarExpertTxUrl(data.forward_tx_hash, NETWORK)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#005DB4] hover:text-[#0047a0] font-mono"
          >
            Ver transacción en Stellar Expert ↗
          </a>
        )}
        {successUrl && (
          <p className="text-xs text-[#9ca3af] mt-5">Volviendo al comercio…</p>
        )}
      </Centered>
    );
  }

  if (dead) {
    return (
      <Centered>
        <Brand />
        <h1 className="text-xl font-semibold mb-2">{STATUS_LABEL[data.status]}</h1>
        <p className="text-sm text-[#6b7280]">
          {data.status === 'expired' && 'El cobro venció sin recibir pago. Pedile al comercio que genere uno nuevo.'}
          {data.status === 'underpaid' && `Se recibieron ${parseFloat(data.amount_paid).toFixed(2)} USDC parciales antes de vencer. El equipo de soporte va a contactarte.`}
          {data.status === 'anomaly' && 'Hubo un inconveniente procesando el pago. Soporte ya está en eso.'}
          {data.status === 'refunded' && 'Este cobro fue reembolsado.'}
        </p>
      </Centered>
    );
  }

  // Estado pending
  return (
    <main className="min-h-screen bg-[#f0f7ff] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white border border-[#e5e7eb] rounded-2xl shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
            <Brand inline />
            <span className="text-xs px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700">
              {STATUS_LABEL[data.status]}
            </span>
          </header>

          <div className="px-6 py-6 grid sm:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center bg-[#f0f7ff] rounded-xl p-4">
              {sep7Uri && (
                <QRCodeSVG value={sep7Uri} size={220} level="M" marginSize={2} className="w-full h-auto max-w-[240px]" />
              )}
              <p className="text-xs text-[#6b7280] mt-3 text-center">
                Escaneá con <strong>Binance, Meru, Lobstr</strong> o cualquier wallet Stellar.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Monto</div>
                <div className="text-3xl font-bold tabular-nums">
                  {parseFloat(data.amount_expected).toFixed(2)}
                  <span className="text-lg text-[#9ca3af] font-normal ml-2">USDC</span>
                </div>
                {parseFloat(data.amount_paid) > 0 && (
                  <div className="text-sm text-amber-700 mt-1">
                    Recibido: {parseFloat(data.amount_paid).toFixed(2)} · falta {data.remaining}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">A nombre de</div>
                <div className="font-medium">{data.merchant_name}</div>
                <div className="text-xs text-[#6b7280]">{data.reason}</div>
              </div>
              <div>
                <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Tiempo restante</div>
                <div className="text-xl font-semibold tabular-nums">
                  {fmtCountdown(data.time_remaining_seconds)}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#e5e7eb] flex flex-wrap gap-2 print:hidden">
            <button
              onClick={verify}
              disabled={verifying}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white text-sm font-semibold disabled:opacity-50"
            >
              {verifying ? 'Verificando…' : '✓ Verificar pago'}
            </button>
            {sep7Uri && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Pagá ${parseFloat(data.amount_expected).toFixed(2)} USDC con Pollar Pay:\n${sep7Uri}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
              >
                WhatsApp
              </a>
            )}
            <button
              onClick={() => sep7Uri && navigator.clipboard.writeText(sep7Uri)}
              className="px-4 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
            >
              Copiar link
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <footer className="px-4 py-4 text-center text-xs text-[#9ca3af]">
        Pagos en USDC sobre Stellar · <a href="https://stellar.expert" target="_blank" rel="noopener noreferrer" className="hover:text-[#005DB4]">stellar.expert</a>
      </footer>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f0f7ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm text-center">
        {children}
      </div>
    </main>
  );
}

function Brand({ inline }: { inline?: boolean }) {
  return (
    <div className={inline ? 'flex items-center gap-2' : 'flex items-center justify-center gap-2 mb-6'}>
      <Image src="/logo.jpg" alt="Pollar Pay" width={28} height={28} className="rounded-md" />
      <span className="font-semibold tracking-tight">Pollar Pay</span>
    </div>
  );
}
