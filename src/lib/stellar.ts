// Helpers para construir URIs SEP-7 y links a Stellar Expert.
// El backend ya define USDC y la network — acá solo formateamos para el cliente.

const USDC_ISSUERS = {
  TESTNET: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  MAINNET: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
} as const;

const NETWORK_PASSPHRASES = {
  TESTNET: 'Test SDF Network ; September 2015',
  MAINNET: 'Public Global Stellar Network ; September 2015',
} as const;

export type StellarNetwork = 'TESTNET' | 'MAINNET';

export function normalizeNetwork(value: string | null | undefined): StellarNetwork {
  return (value || '').toUpperCase() === 'MAINNET' ? 'MAINNET' : 'TESTNET';
}

export function buildSep7PayUri(opts: {
  destination: string;
  amount: string | number;
  network: StellarNetwork;
  memo?: string;
}): string {
  const issuer = USDC_ISSUERS[opts.network];
  const passphrase = NETWORK_PASSPHRASES[opts.network];
  const params = new URLSearchParams({
    destination: opts.destination,
    amount: String(opts.amount),
    asset_code: 'USDC',
    asset_issuer: issuer,
    network_passphrase: passphrase,
  });
  if (opts.memo) params.set('memo', opts.memo);
  return `web+stellar:pay?${params.toString()}`;
}

export function stellarExpertTxUrl(hash: string, network: StellarNetwork): string {
  const segment = network === 'MAINNET' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${segment}/tx/${hash}`;
}

export function stellarExpertAccountUrl(pubkey: string, network: StellarNetwork): string {
  const segment = network === 'MAINNET' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${segment}/account/${pubkey}`;
}

export function networkFromApiKey(apiKey: string): StellarNetwork {
  return apiKey.startsWith('pub_mainnet_') ? 'MAINNET' : 'TESTNET';
}
