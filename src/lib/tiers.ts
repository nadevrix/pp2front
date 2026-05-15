// Definición de tiers en el front — espejo del backend lib/tiers.ts.
// Lo mantenemos paralelo y no compartido porque pollar-web y pollar-backend
// son repos separados; el endpoint /api/merchant/tier siempre es la fuente
// de verdad para el estado del comercio (tier vigente, uso del mes, etc).

export type Tier = 'free' | 'starter' | 'growth' | 'scale';

export interface TierUi {
    id: Tier;
    label: string;
    headline: string;       // descripción corta para la cabecera del card
    percentLabel: string;   // "1.2 %"
    minimumLabel: string;   // "mín $0.20 por cobro"
    monthlyLabel: string;   // "sin cuota" / "$25/mes + fee reducido"
    volumeLabel: string;    // "Hasta 150 cobros / mes"
    features: string[];
    accent: string;         // clase Tailwind para destacar
    recommended?: boolean;
}

export const TIERS_UI: Record<Tier, TierUi> = {
    free: {
        id: 'free',
        label: 'Free',
        headline: 'Hasta 150 cobros / mes',
        volumeLabel: 'Hasta 150 cobros / mes',
        percentLabel: '1.2 %',
        minimumLabel: 'mín $0.20 por cobro',
        monthlyLabel: 'sin cuota',
        features: [
            '50 primeras transacciones gratuitas',
            'QR de cobro ilimitado',
            '1 sucursal',
            'Exportación CSV últimos 3 meses',
            'Soporte por email',
        ],
        accent: 'border-slate-700',
    },
    starter: {
        id: 'starter',
        label: 'Starter',
        headline: '150 – 400 cobros / mes',
        volumeLabel: '150 – 400 cobros / mes',
        percentLabel: '0.9 %',
        minimumLabel: 'mín $0.20 por cobro',
        monthlyLabel: 'sin cuota',
        features: [
            'Todo lo del tier Free',
            'Múltiples sucursales',
            'Exportación últimos 6 meses',
            'Soporte por email <48 h',
        ],
        accent: 'border-slate-700',
    },
    growth: {
        id: 'growth',
        label: 'Growth',
        headline: '400 – 1.000 cobros / mes',
        volumeLabel: '400 – 1.000 cobros / mes',
        percentLabel: '0.7 %',
        minimumLabel: 'mín $0.15 por cobro',
        monthlyLabel: 'sin cuota',
        features: [
            'Todo lo del tier Starter',
            'Exportación historial completo',
            'Notificaciones webhook',
            'Soporte por chat <4 h',
        ],
        accent: 'border-sky-500/60 ring-1 ring-sky-500/40',
        recommended: true,
    },
    scale: {
        id: 'scale',
        label: 'Scale',
        headline: 'Más de 1.000 cobros / mes',
        volumeLabel: 'Más de 1.000 cobros / mes',
        percentLabel: '0.5 %',
        minimumLabel: 'sin mínimo',
        monthlyLabel: '$25 / mes + fee reducido',
        features: [
            'Todo lo del tier Growth',
            'Exportación programada automática',
            'API de integración completa',
            'Soporte WhatsApp / Telegram <1 h',
        ],
        accent: 'border-slate-700',
    },
};

export const TIER_ORDER: readonly Tier[] = ['free', 'starter', 'growth', 'scale'];

export interface TierState {
    tier: Tier;
    tier_label: string;
    tier_assigned_at: string;
    percent: number;
    minimum: number;
    monthly_fee: number;
    features: string[];
    usage: {
        transactions_this_month: number;
        fee_paid_this_month: string;
        volume_this_month: string;
        monthly_volume_min: number;
        monthly_volume_max: number | null;
        free_tx_used: number;
        free_tx_remaining: number;
    };
    suggested_tier: Tier | null;
    suggested_label: string | null;
}
