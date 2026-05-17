'use client';

// Modal de onboarding de wallet — paso 02 del PDF ("te guiamos para crearla
// en Lobstr o Meru en 3 minutos"). Se abre desde el form de Nueva Sucursal
// y desde la edición de wallet en el detalle de la sucursal.
//
// Wireframes en SVG simple (sin screenshots reales) para que no envejezcan
// cuando las apps cambien de UI.

import { useState } from 'react';

type App = 'lobstr' | 'meru';

interface Props {
  open: boolean;
  onClose: () => void;
}

const APPS: Record<App, {
  label: string;
  tagline: string;
  ios: string;
  android: string;
  web: string;
  steps: { title: string; body: string }[];
}> = {
  lobstr: {
    label: 'Lobstr',
    tagline: 'Wallet Stellar oficial. La opción más usada por la comunidad.',
    ios: 'https://apps.apple.com/app/lobstr-stellar-wallet/id1404357892',
    android: 'https://play.google.com/store/apps/details?id=com.lobstr.client',
    web: 'https://lobstr.co',
    steps: [
      {
        title: 'Descargá Lobstr',
        body: 'Disponible gratis en App Store, Google Play o desde lobstr.co. Pesa menos de 30 MB.',
      },
      {
        title: 'Creá una wallet nueva',
        body: 'Toca "Sign up" y elegí "Create new wallet". La app te muestra tu frase de respaldo de 12 palabras — anotala en papel y guardala en un lugar seguro.',
      },
      {
        title: 'Activá la wallet',
        body: 'Stellar pide un mínimo de 1 XLM para activar la cuenta. Lobstr te ofrece comprarlo directamente con tarjeta, o te lo puede mandar otra wallet.',
      },
      {
        title: 'Agregá el trustline de USDC',
        body: 'En "Assets" → "Add asset" → buscá USDC (emisor Circle) y aceptá el trustline. Es lo que permite que tu wallet reciba USDC.',
      },
      {
        title: 'Copiá tu dirección',
        body: 'En la pestaña principal toca el ícono de copiar al lado de la dirección que empieza con G. Pegala acá abajo y listo.',
      },
    ],
  },
  meru: {
    label: 'Meru',
    tagline: 'Wallet pensada para LATAM. Compra USDC con tarjeta o transferencia local.',
    ios: 'https://apps.apple.com/app/meru/id6473727989',
    android: 'https://play.google.com/store/apps/details?id=io.meru',
    web: 'https://meru.io',
    steps: [
      {
        title: 'Descargá Meru',
        body: 'Disponible gratis en App Store y Google Play.',
      },
      {
        title: 'Registrate con tu email',
        body: 'Meru maneja la frase de respaldo internamente. Si querés control total de tus llaves, usá Lobstr en lugar de Meru.',
      },
      {
        title: 'Comprá USDC',
        body: 'Meru permite comprar USDC directamente con tarjeta de débito/crédito o transferencia. La wallet se activa automáticamente con esa primera compra.',
      },
      {
        title: 'Copiá tu dirección Stellar',
        body: 'En tu perfil → "Recibir" → vas a ver la dirección Stellar que empieza con G. Copiala y pegala acá abajo.',
      },
    ],
  },
};

export default function WalletOnboardingModal({ open, onClose }: Props) {
  const [app, setApp] = useState<App>('lobstr');

  if (!open) return null;

  const config = APPS[app];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/60 backdrop-blur-sm">
      <div className="bg-white border border-[#e5e7eb] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Crear tu wallet Stellar</h2>
            <p className="text-xs text-[#6b7280] mt-0.5">3 minutos desde tu teléfono. Pollar no custodia tus fondos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#005DB4] text-2xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-[#e5e7eb]">
          <div className="flex gap-1">
            {(['lobstr', 'meru'] as App[]).map(a => (
              <button
                key={a}
                onClick={() => setApp(a)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  app === a
                    ? 'border-[#005DB4] text-[#005DB4]'
                    : 'border-transparent text-[#6b7280] hover:text-[#1a1a1a]'
                }`}
              >
                {APPS[a].label}
              </button>
            ))}
          </div>
        </div>

        {/* Body — grid wireframe + steps */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-sm text-[#6b7280] mb-5">{config.tagline}</p>

          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            {/* Wireframe SVG — placeholder visual del flujo */}
            <div className="hidden md:flex items-start justify-center pt-2">
              <PhoneWireframe app={app} />
            </div>

            {/* Pasos */}
            <ol className="space-y-3">
              {config.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-3 p-3 bg-[#f0f7ff] rounded-lg border border-[#e5e7eb]"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[#005DB4] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{s.title}</div>
                    <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Links de descarga */}
          <div className="mt-6 p-4 rounded-lg border border-[#005DB4] bg-[#f0f7ff]">
            <div className="text-xs font-semibold text-[#005DB4] mb-2 uppercase tracking-wider">
              Descargar {config.label}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={config.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md bg-white border border-[#e5e7eb] text-sm hover:border-[#005DB4]"
              >
                iOS · App Store
              </a>
              <a
                href={config.android}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md bg-white border border-[#e5e7eb] text-sm hover:border-[#005DB4]"
              >
                Android · Google Play
              </a>
              <a
                href={config.web}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md bg-white border border-[#e5e7eb] text-sm hover:border-[#005DB4]"
              >
                Web · {config.web.replace('https://', '')}
              </a>
            </div>
          </div>

          {app === 'lobstr' && (
            <p className="mt-4 text-xs text-[#6b7280] leading-relaxed">
              <strong>Tip:</strong> guardá la frase de 12 palabras en papel (no en una foto ni
              en la nube). Si perdés esa frase y se borra la app, no hay forma de recuperar los
              fondos — ni Lobstr ni Pollar tienen acceso a tu wallet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#005DB4] hover:bg-[#0047a0] text-white text-sm font-medium"
          >
            Ya tengo mi wallet
          </button>
        </div>
      </div>
    </div>
  );
}

// Wireframe minimalista de un teléfono mostrando la wallet. No es un screenshot
// real — un dibujo abstracto que sugiere la pantalla sin envejecer con cambios
// de UI de las apps.
function PhoneWireframe({ app }: { app: App }) {
  const accent = app === 'lobstr' ? '#7c3aed' : '#10b981';
  return (
    <svg viewBox="0 0 180 320" className="w-44 h-auto">
      {/* Cuerpo del teléfono */}
      <rect
        x="2" y="2" width="176" height="316" rx="22"
        fill="white" stroke="#e5e7eb" strokeWidth="3"
      />
      {/* Notch */}
      <rect x="60" y="2" width="60" height="12" rx="6" fill="#1a1a1a" />

      {/* Header con app name */}
      <rect x="14" y="28" width="152" height="32" rx="6" fill="#f0f7ff" />
      <circle cx="28" cy="44" r="7" fill={accent} />
      <rect x="42" y="40" width="60" height="4" rx="2" fill="#1a1a1a" opacity="0.6" />
      <rect x="42" y="48" width="40" height="3" rx="1.5" fill="#9ca3af" />

      {/* Balance card */}
      <rect x="14" y="72" width="152" height="60" rx="8" fill={accent} opacity="0.12" />
      <rect x="22" y="82" width="30" height="3" rx="1.5" fill="#9ca3af" />
      <rect x="22" y="92" width="80" height="10" rx="2" fill="#1a1a1a" opacity="0.7" />
      <rect x="22" y="108" width="40" height="3" rx="1.5" fill="#9ca3af" />

      {/* Action row */}
      <rect x="14" y="142" width="44" height="44" rx="8" fill="#f0f7ff" />
      <rect x="68" y="142" width="44" height="44" rx="8" fill={accent} opacity="0.2" />
      <rect x="122" y="142" width="44" height="44" rx="8" fill="#f0f7ff" />

      {/* Tx list */}
      {[0, 1, 2].map(i => (
        <g key={i} transform={`translate(0, ${198 + i * 32})`}>
          <circle cx="26" cy="14" r="8" fill="#f0f7ff" />
          <rect x="42" y="8" width="80" height="4" rx="2" fill="#1a1a1a" opacity="0.6" />
          <rect x="42" y="16" width="50" height="3" rx="1.5" fill="#9ca3af" />
          <rect x="138" y="10" width="24" height="4" rx="2" fill={accent} opacity="0.7" />
        </g>
      ))}

      {/* Bottom tab bar */}
      <rect x="14" y="290" width="152" height="20" rx="10" fill="#f0f7ff" />
      <circle cx="40" cy="300" r="4" fill={accent} />
      <circle cx="78" cy="300" r="4" fill="#9ca3af" />
      <circle cx="116" cy="300" r="4" fill="#9ca3af" />
      <circle cx="154" cy="300" r="4" fill="#9ca3af" />
    </svg>
  );
}
