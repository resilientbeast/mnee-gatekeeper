'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { type ReactNode, useState } from 'react';
import { WagmiProvider, type State } from 'wagmi';
import { wagmiAdapter, projectId, networks, metadata } from '@/lib/web3-config';

// Initialize AppKit
if (projectId) {
    createAppKit({
        adapters: [wagmiAdapter],
        projectId,
        networks,
        defaultNetwork: networks[0],
        metadata,
        features: {
            analytics: true,
        },
    });
}

interface ProvidersProps {
    children: ReactNode;
    initialState?: State;
}

export function Providers({ children, initialState }: ProvidersProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
