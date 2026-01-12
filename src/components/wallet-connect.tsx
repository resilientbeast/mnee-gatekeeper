'use client';

import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';

export function WalletConnect() {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (isConnected && address) {
        return (
            <Button
                onClick={() => open({ view: 'Account' })}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                {formatAddress(address)}
            </Button>
        );
    }

    return (
        <Button
            onClick={() => open()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
        >
            Connect Wallet
        </Button>
    );
}
