// MNEE Token ERC-20 ABI (minimal for transfers)
export const MNEE_ABI = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
        ],
        name: 'Transfer',
        type: 'event',
    },
] as const;

// Chain IDs
export const CHAINS = {
    MAINNET: 1,
    SEPOLIA: 11155111,
} as const;

// Get MNEE contract address from env
export const MNEE_CONTRACT_ADDRESS = process.env
    .NEXT_PUBLIC_MNEE_CONTRACT as `0x${string}`;

// Get chain ID from env
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || CHAINS.SEPOLIA;

// MNEE token decimals (standard ERC-20 is 18)
export const MNEE_DECIMALS = 18;

// Parse MNEE amount to wei
export function parseManee(amount: number): bigint {
    return BigInt(Math.floor(amount * 10 ** MNEE_DECIMALS));
}

// Format wei to MNEE
export function formatMnee(wei: bigint): string {
    const value = Number(wei) / 10 ** MNEE_DECIMALS;
    return value.toFixed(2);
}
