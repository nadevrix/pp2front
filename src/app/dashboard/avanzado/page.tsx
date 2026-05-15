'use client';

// Avanzado — API keys + guía de integración para desarrolladores.
// El PDF promete: "API REST documentada para integrarse con sitios web, sistemas
// de punto de venta, tiendas WooCommerce o cualquier plataforma personalizada."
// Esta sección concentra todo lo técnico que no le interesa al merchant promedio.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch, type Project } from '@/lib/backend-api';

export default function AvanzadoPage() {
  const [branches, setBranches] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    backendFetch<{ projects: Project[] }>('/api/projects/list')
      .then(d => setBranches(d.projects))
      .catch(e => setError(e.message));
  }, []);

  const toggle = (id: string) =>
    setRevealed(s => ({ ...s, [id]: !s[id] }));

  const copy = (text: string) => navigator.clipboard.writeText(text);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Avanzado</h1>
        <p className="text-slate-400 mt-1">
          Integrá Pollar Pay con tu sitio, POS o cualquier sistema usando el SDK <code className="text-slate-200 text-sm bg-black/40 px-1.5 py-0.5 rounded">@pollar/pay</code> o la API REST.
        </p>
      </header>

      {/* API keys por sucursal */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-2">API keys</h2>
        <p className="text-sm text-slate-400 mb-5">
          Cada sucursal tiene su propia API key. Usala como credencial para crear cobros desde tu sistema. Tratala como una contraseña.
        </p>

        {branches === null ? (
          <div className="text-slate-500 text-sm">Cargando…</div>
        ) : branches.length === 0 ? (
          <div className="text-slate-500 text-sm">
            Aún no tenés sucursales. <Link href="/dashboard/sucursales/nueva" className="text-indigo-400 hover:text-indigo-300">Registrar la primera →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {branches.map(b => (
              <div key={b.id} className="border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-slate-500">{b.reason}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md border ${
                    b.api_key.startsWith('pub_mainnet_')
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {b.api_key.startsWith('pub_mainnet_') ? 'Mainnet' : 'Testnet'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-xs bg-black/50 px-3 py-2 rounded-lg text-emerald-400 border border-slate-800 break-all">
                    {revealed[b.id] ? b.api_key : b.api_key.replace(/^(pub_\w+_).{8}.+(.{4})$/, '$1••••••••$2')}
                  </code>
                  <button
                    onClick={() => toggle(b.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
                  >
                    {revealed[b.id] ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    onClick={() => copy(b.api_key)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
                  >
                    Copiar
                  </button>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Project ID: <code className="font-mono">{b.id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guía de integración rápida */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-2">Integración con el SDK</h2>
        <p className="text-sm text-slate-400 mb-5">
          El paquete <code className="text-slate-200 bg-black/40 px-1.5 py-0.5 rounded text-xs">@pollar/pay</code> abstrae la creación de intents, polling de estado y manejo de errores. Funciona en Node, browsers y edge runtimes.
        </p>

        <div className="text-xs text-slate-500 mb-1.5">Instalación</div>
        <pre className="bg-black/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 mb-5 overflow-x-auto">
{`npm install @pollar/pay`}
        </pre>

        <div className="text-xs text-slate-500 mb-1.5">Uso básico</div>
        <pre className="bg-black/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto">
{`import { PollarPayClient } from '@pollar/pay';

const pay = new PollarPayClient({
  apiKey: 'pub_testnet_...', // la de tu sucursal
});

const intent = await pay.createIntent(25.00, 'Venta mostrador');
// intent.data.wallet_address  → mostrar como QR
// intent.data.transaction_id  → guardar para consultar estado

pay.waitForPayment(intent.data.transaction_id, {
  onCompleted: (s) => console.log('Pagado:', s.amount_paid),
  onFailed:    (s) => console.log('No completado:', s.status),
});`}
        </pre>
      </section>

      {/* API REST */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-2">API REST</h2>
        <p className="text-sm text-slate-400 mb-5">
          Si preferís llamar la API directamente (por ejemplo desde un POS o WooCommerce), todos los endpoints aceptan la api_key en el header <code className="text-slate-200 bg-black/40 px-1.5 py-0.5 rounded text-xs">x-pollar-api-key</code>.
        </p>

        <div className="space-y-4 text-sm">
          <Endpoint
            method="POST"
            path="/api/sdk/pay"
            description="Crea un cobro. Devuelve transaction_id + wallet_address."
            body={`{
  "amount_expected": "25.00",
  "reason": "Venta mostrador"
}`}
          />
          <Endpoint
            method="GET"
            path="/api/sdk/status?transaction_id=…"
            description="Consulta el estado de un cobro. Si está pending, dispara la verificación on-chain automáticamente."
          />
          <Endpoint
            method="POST"
            path="/api/sdk/manual-complete"
            description="Marca el cobro como cerrado manualmente (útil para pagos en efectivo o conciliación)."
            body={`{ "transaction_id": "..." }`}
          />
        </div>
      </section>
    </div>
  );
}

function Endpoint({
  method,
  path,
  description,
  body,
}: {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  description: string;
  body?: string;
}) {
  const color =
    method === 'GET'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  return (
    <div className="border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${color}`}>{method}</span>
        <code className="text-xs font-mono text-slate-200">{path}</code>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
      {body && (
        <pre className="bg-black/40 border border-slate-800 rounded mt-2 p-2 text-xs font-mono text-slate-300 overflow-x-auto">
          {body}
        </pre>
      )}
    </div>
  );
}
