import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, sepolia } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Get project ID for WalletConnect
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
    console.warn('NEXT_PUBLIC_PROJECT_ID is not set');
}

// Define Soneium Minato testnet
const soneiumMinato: AppKitNetwork = {
    id: 1946,
    name: 'Soneium Minato',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.minato.soneium.org/'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Soneium Explorer',
            url: 'https://explorer-testnet.soneium.org/',
        },
    },
    testnet: true,
};

// Determine which network to use based on env
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111;

// Select networks based on chain ID
function getNetworks(): [AppKitNetwork, ...AppKitNetwork[]] {
    switch (chainId) {
        case 1946:
            return [soneiumMinato, sepolia, mainnet];
        case 1:
            return [mainnet, sepolia];
        case 11155111:
        default:
            return [sepolia, mainnet];
    }
}

export const networks = getNetworks();

// Wagmi adapter for Reown AppKit
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId: projectId || '',
    networks,
});

export const config = wagmiAdapter.wagmiConfig;

// Metadata for the app
export const metadata = {
    name: 'MNEE Gatekeeper',
    description: 'Subscribe to premium Telegram channels with MNEE',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    icons: ['/icon.png'],
};
