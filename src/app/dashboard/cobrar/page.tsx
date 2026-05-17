'use client';

// Terminal de cobro — paridad con la página 5 del PDF:
//   "El comercio genera el QR de cobro... con el monto ya incluido.
//    Puede mostrarse en pantalla, imprimirse o compartirse por WhatsApp."
//
// El flujo: elegir sucursal → ingresar monto + motivo → generar QR SEP-7 →
// status live (pending / partial / completed / overpaid / expired). Reusa
// /api/sdk/pay y /api/sdk/status con la api_key de la sucursal.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { backendFetch, sdkFetch, type Project, type PayIntent, type PayStatus } from '@/lib/backend-api';
import {
  buildSep7PayUri,
  networkFromApiKey,
  stellarExpertAccountUrl,
  stellarExpertTxUrl,
  type StellarNetwork,
} from '@/lib/stellar';

type Stage = 'form' | 'pending' | 'completed' | 'overpaid' | 'failed';

const STATUS_LABEL: Record<PayStatus['status'], string> = {
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

function CobrarInner() {
  // Query params soportados (PDF pág. 11 paso 04 — "pago de prueba"):
  //   ?branch=<projectId>     → preselecciona la sucursal
  //   ?amount=<USDC>          → prellena el monto
  //   ?reason=<texto>         → prellena el motivo
  // Ej: /dashboard/cobrar?branch=abc&amount=1&reason=Prueba+testnet
  const searchParams = useSearchParams();
  const initialBranch = searchParams.get('branch') || '';
  const initialAmount = searchParams.get('amount') || '';
  const initialReason = searchParams.get('reason') || '';

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState<string>(initialBranch);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form
  const [amount, setAmount] = useState(initialAmount);
  const [reason, setReason] = useState(initialReason);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Intent + status live
  const [intent, setIntent] = useState<PayIntent | null>(null);
  const [status, setStatus] = useState<PayStatus | null>(null);
  const [stage, setStage] = useState<Stage>('form');
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar sucursales (proyectos) del comercio
  useEffect(() => {
    backendFetch<{ projects: Project[] }>('/api/projects/list')
      .then(d => {
        setProjects(d.projects);
        // Si vino por query param `branch` válido, lo respetamos. Si no, y hay
        // una sola sucursal, la elegimos automáticamente.
        if (initialBranch && d.projects.some(p => p.id === initialBranch)) {
          setProjectId(initialBranch);
        } else if (d.projects.length === 1) {
          setProjectId(d.projects[0].id);
        }
      })
      .catch(e => setLoadError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => projects?.find(p => p.id === projectId) ?? null,
    [projects, projectId],
  );

  // Prefill del monto cuando el merchant tiene default_amount configurado en
  // la sucursal (PDF pág. 11 paso 03). Solo se sobreescribe si el campo está
  // vacío — si el merchant ya tipeó algo, lo respetamos.
  useEffect(() => {
    if (!selected) return;
    const def = selected.default_amount;
    if (def === null || def === undefined || def === '') return;
    if (amount.trim() !== '') return;
    const n = typeof def === 'number' ? def : parseFloat(String(def));
    if (!isNaN(n) && n > 0) setAmount(n.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const network: StellarNetwork = selected ? networkFromApiKey(selected.api_key) : 'TESTNET';

  // Polling de status mientras el intent está vivo
  useEffect(() => {
    if (!intent || !selected) return;
    if (stage !== 'pending') return;

    let cancelled = false;

    const tick = async () => {
      try {
        const r = await sdkFetch<{ data: PayStatus }>(
          selected.api_key,
          `/api/sdk/status?transaction_id=${intent.transaction_id}`,
        );
        if (cancelled) return;

        setStatus(r.data);
        if (r.data.status === 'completed') {
          setStage('completed');
          return;
        }
        if (r.data.status === 'overpaid') {
          setStage('overpaid');
          return;
        }
        if (
          r.data.status === 'expired' ||
          r.data.status === 'underpaid' ||
          r.data.status === 'anomaly' ||
          r.data.status === 'late_anomaly' ||
          r.data.is_expired
        ) {
          setStage('failed');
          return;
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
    };
  }, [intent, selected, stage]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setFormError('Seleccioná una sucursal');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0.01 || parsed > 1_000_000) {
      setFormError('Monto inválido (0.01 – 1,000,000 USDC)');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await sdkFetch<{ data: PayIntent }>(selected.api_key, '/api/sdk/pay', {
        method: 'POST',
        body: JSON.stringify({
          amount_expected: parsed.toFixed(7),
          reason: reason.trim() || 'Cobro',
        }),
      });
      setIntent(r.data);
      setStage('pending');
    } catch (e: any) {
      setFormError(e.message || 'Error creando el cobro');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setIntent(null);
    setStatus(null);
    setStage('form');
    setAmount('');
    setReason('');
    setFormError(null);
  };

  const sep7Uri = useMemo(() => {
    if (!intent) return null;
    return buildSep7PayUri({
      destination: intent.wallet_address,
      amount: intent.amount,
      network,
    });
  }, [intent, network]);

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700">
          {loadError}
        </div>
      </div>
    );
  }

  if (projects === null) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-[#9ca3af]">Cargando…</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Cobrar</h1>
        <p className="text-[#6b7280] mb-6">
          Para empezar a cobrar necesitás registrar una sucursal con la wallet Stellar donde querés recibir los fondos.
        </p>
        <Link
          href="/dashboard/sucursales/nueva"
          className="inline-block px-4 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
        >
          Registrar sucursal
        </Link>
      </div>
    );
  }

  // ── ESTADO: formulario ────────────────────────────────────────────────────
  if (stage === 'form') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Cobrar</h1>
        <p className="text-[#6b7280] mb-8">
          Generá un QR de cobro. Tu cliente paga en segundos desde Binance, Meru, Lobstr o cualquier wallet Stellar.
        </p>

        <form onSubmit={onSubmit} className="bg-white border border-[#e5e7eb] rounded-2xl p-8 space-y-5">
          {projects.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1.5">Sucursal</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
              >
                <option value="">— Elegir sucursal —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1.5">
              Monto en USDC
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="25.00"
              required
              className="w-full px-4 py-3 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] text-2xl font-semibold placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
            />
            <p className="text-xs text-[#9ca3af] mt-1.5">El gas de Stellar está incluido en el fee de Pollar Pay.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1.5">
              Motivo <span className="text-[#9ca3af] font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Venta mostrador"
              className="w-full px-4 py-2.5 bg-[#f0f7ff] border border-[#e5e7eb] rounded-lg text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#005DB4] focus:ring-1 focus:ring-[#005DB4]"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !projectId || !amount}
            className="w-full py-3 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Generando…' : 'Generar QR de cobro'}
          </button>
        </form>
      </div>
    );
  }

  // ── ESTADO: esperando pago (QR vivo) ─────────────────────────────────────
  if (stage === 'pending') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Esperando pago</h1>
        <p className="text-[#6b7280] mb-8">
          {selected?.name} — {network === 'TESTNET' ? 'Testnet' : 'Mainnet'}
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
            {sep7Uri && (
              <QRCodeSVG
                value={sep7Uri}
                size={256}
                level="M"
                marginSize={2}
                className="w-full h-auto max-w-[280px]"
              />
            )}
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-5">
            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Monto a cobrar</div>
              <div className="text-3xl font-bold tabular-nums">
                {parseFloat(intent!.amount).toFixed(2)} <span className="text-[#9ca3af] text-lg font-normal">USDC</span>
              </div>
              {status && parseFloat(status.amount_paid || '0') > 0 && (
                <div className="text-sm text-amber-700 mt-2">
                  Recibido parcial: {parseFloat(status.amount_paid).toFixed(2)} · falta {status.remaining}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Estado</div>
              <div className="inline-flex items-center gap-2 text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                </span>
                {status ? STATUS_LABEL[status.status] : 'Esperando pago'}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Tiempo restante</div>
              <div className="text-2xl font-semibold tabular-nums">
                {status ? fmtCountdown(status.time_remaining_seconds) : '15:00'}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#9ca3af] mb-1">Wallet destino</div>
              <div className="font-mono text-xs text-[#6b7280] break-all bg-[#f0f7ff] px-3 py-2 rounded-lg border border-[#e5e7eb]">
                {intent!.wallet_address}
              </div>
              <a
                href={stellarExpertAccountUrl(intent!.wallet_address, network)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-[#005DB4] hover:text-[#0047a0]"
              >
                Ver en Stellar Expert ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button
            onClick={resetAll}
            className="px-4 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => sep7Uri && navigator.clipboard.writeText(sep7Uri)}
            className="px-4 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
          >
            Copiar link de pago
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] text-sm font-medium"
          >
            Imprimir QR
          </button>
          {sep7Uri && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Pagá ${parseFloat(intent!.amount).toFixed(2)} USDC con Pollar Pay:\n${sep7Uri}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              Compartir por WhatsApp
            </a>
          )}
        </div>

        <p className="text-xs text-[#9ca3af] mt-6 print:hidden">
          El cliente paga desde Binance, Meru, Lobstr o cualquier wallet Stellar. La confirmación aparece automáticamente en 3 – 5 segundos.
        </p>
      </div>
    );
  }

  // ── ESTADO: completado / overpago ────────────────────────────────────────
  if (stage === 'completed' || stage === 'overpaid') {
    const isOver = stage === 'overpaid';
    const paid = parseFloat(status!.amount_paid);
    const fee = parseFloat(status!.fee_amount || '0');
    const net = parseFloat(status!.payout_amount || (paid - fee).toString());
    const showSplit = fee > 0 || status!.is_free_tx;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <svg className="w-8 h-8 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {isOver ? 'Pagado con excedente' : 'Pago recibido'}
          </h1>
          <p className="text-[#6b7280] mb-6">
            {paid.toFixed(2)} USDC liquidados sobre Stellar.
          </p>

          {showSplit && (
            <div className="grid grid-cols-2 gap-3 bg-[#f0f7ff] border border-[#e5e7eb] rounded-xl p-4 mb-6 max-w-md mx-auto text-left">
              <div>
                <div className="text-xs text-[#9ca3af]">Fee Pollar</div>
                <div className="font-mono text-sm">
                  {status!.is_free_tx ? (
                    <span className="text-emerald-700">GRATIS</span>
                  ) : (
                    <>${fee.toFixed(2)}</>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9ca3af]">Llegó a tu wallet</div>
                <div className="font-mono text-sm text-[#1a1a1a]">${net.toFixed(2)}</div>
              </div>
            </div>
          )}

          {status?.forward_tx_hash && (
            <a
              href={stellarExpertTxUrl(status.forward_tx_hash, network)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-[#005DB4] hover:text-[#0047a0] mb-6 font-mono"
            >
              Verificar en Stellar Expert ↗
            </a>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={resetAll}
              className="px-5 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
            >
              Cobrar otro
            </button>
            <Link
              href="/dashboard/movimientos"
              className="px-5 py-2.5 rounded-lg bg-[#f0f7ff] hover:bg-[#e0f0ff] text-[#005DB4] font-medium"
            >
              Ver movimientos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── ESTADO: falló (expirado / underpaid / anomaly) ────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="bg-white border border-rose-500/30 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {status ? STATUS_LABEL[status.status] : 'Cobro vencido'}
        </h1>
        <p className="text-[#6b7280] mb-6">
          {status && parseFloat(status.amount_paid || '0') > 0
            ? `Se recibieron ${parseFloat(status.amount_paid).toFixed(2)} USDC parciales. El equipo de soporte va a contactarte.`
            : 'No se recibió ningún pago dentro del tiempo permitido.'}
        </p>
        <button
          onClick={resetAll}
          className="px-5 py-2.5 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white font-medium"
        >
          Generar otro cobro
        </button>
      </div>
    </div>
  );
}

// Wrapper con <Suspense> — useSearchParams() requiere boundary en Next 15.
export default function CobrarPage() {
  return (
    <Suspense fallback={null}>
      <CobrarInner />
    </Suspense>
  );
}
