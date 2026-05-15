'use client';

// Diálogo de exportación de movimientos. Se abre desde /dashboard/movimientos
// y desde el detalle de sucursal. Toma rango from/to, status y branch_id,
// pega al endpoint /api/merchant/export con auth Supabase y dispara la
// descarga via blob (no podemos usar <a download> porque el endpoint requiere
// Authorization header).
//
// El backend acota la ventana según el tier (Free=3m, Starter=6m, Growth/Scale=todo).
// Acá adelantamos esa lógica en UI para que el merchant vea de antemano qué puede pedir.

import { useEffect, useMemo, useState } from 'react';
import { backendFetch } from '@/lib/backend-api';
import type { TierState } from '@/lib/tiers';

const TIER_MAX_MONTHS: Record<string, number | null> = {
  free: 3,
  starter: 6,
  growth: null,
  scale: null,
};

function isoDate(d: Date): string {
  // YYYY-MM-DD en local time (input type=date espera local)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Array<{ id: string; name: string }>;
  /** Sucursal preseleccionada — útil cuando el botón sale del detalle de una sucursal. */
  initialBranchId?: string;
}

export default function ExportMovementsDialog({ open, onClose, branches, initialBranchId }: Props) {
  const [tier, setTier] = useState<TierState | null>(null);
  const today = useMemo(() => new Date(), []);

  // Defaults: últimos 30 días
  const defaultFrom = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return isoDate(d);
  }, [today]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(isoDate(today));
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState(initialBranchId || '');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    backendFetch<{ data: TierState }>('/api/merchant/tier')
      .then(d => setTier(d.data))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) setBranchId(initialBranchId || '');
  }, [open, initialBranchId]);

  // Earliest selectable date para el input según el tier
  const minFrom = useMemo(() => {
    if (!tier) return undefined;
    const months = TIER_MAX_MONTHS[tier.tier];
    if (months === null || months === undefined) return undefined;
    const d = new Date(today);
    d.setMonth(d.getMonth() - months);
    return isoDate(d);
  }, [tier, today]);

  const tierWindowLabel = useMemo(() => {
    if (!tier) return '';
    const months = TIER_MAX_MONTHS[tier.tier];
    if (months === null) return 'Tu plan permite exportar el historial completo.';
    return `Tu plan ${tier.tier_label} permite exportar los últimos ${months} meses.`;
  }, [tier]);

  const onDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        from: new Date(from + 'T00:00:00').toISOString(),
        to: new Date(to + 'T23:59:59').toISOString(),
      });
      if (status) params.set('status', status);
      if (branchId) params.set('branch_id', branchId);

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

      // Tomamos el token Supabase como backendFetch, pero acá necesitamos el Response
      // crudo para extraer el blob. Reimplementamos auth a mano.
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`${BACKEND_URL}/api/merchant/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const filename =
        res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        `pollar-pay-${isoDate(today)}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error generando el CSV');
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold">Exportar movimientos</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-xs text-slate-400">
            {tierWindowLabel || 'Cargando información del plan…'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                min={minFrom}
                max={to}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                min={from}
                max={isoDate(today)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="">Todos</option>
              <option value="completed">Cobrados</option>
              <option value="overpaid">Con excedente</option>
              <option value="pending">Esperando</option>
              <option value="underpaid">Parciales</option>
              <option value="expired">Vencidos</option>
              <option value="anomaly">En revisión</option>
            </select>
          </div>

          {branches.length > 1 && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sucursal</label>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">Todas</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Formato CSV (compatible con Excel y Google Sheets). Los movimientos se exportan en orden cronológico inverso.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {downloading ? 'Generando…' : 'Descargar CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
