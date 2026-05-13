'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { backendFetch, type Project } from '@/lib/backend-api';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    backendFetch<{ projects: Project[] }>('/api/projects/list')
      .then(d => setProjects(d.projects))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tus proyectos</h1>
          <p className="text-slate-400 mt-1">Cada proyecto tiene su propia API key y wallet de payout.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
        >
          + Nuevo proyecto
        </Link>
      </header>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-4">
          {error}
        </div>
      )}

      {projects === null && !error && (
        <div className="text-slate-500 text-sm">Cargando…</div>
      )}

      {projects && projects.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-300 mb-4">Aún no creaste ningún proyecto.</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
          >
            Crear el primero
          </Link>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors block"
            >
              <h3 className="font-semibold text-lg mb-1 truncate">{p.name}</h3>
              <p className="text-sm text-slate-400 mb-3 truncate">{p.reason}</p>
              <div className="text-xs text-slate-500 font-mono truncate">
                {p.api_key.slice(0, 24)}…
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Payout: <span className="font-mono">{p.payout_wallet.slice(0, 10)}…{p.payout_wallet.slice(-6)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
