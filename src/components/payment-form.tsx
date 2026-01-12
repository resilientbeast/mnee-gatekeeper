'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MNEE_ABI, MNEE_CONTRACT_ADDRESS, parseManee } from '@/lib/constants';
import type { SubscriptionPlan, Channel } from '@/types/database';

interface PaymentFormProps {
    plan: SubscriptionPlan;
    channel: Channel;
    telegramId: string;
    onSuccess: (inviteLink: string) => void;
    onError: (error: string) => void;
}

type PaymentStep = 'ready' | 'signing' | 'confirming' | 'verifying' | 'success' | 'error';

export function PaymentForm({
    plan,
    channel,
    telegramId,
    onSuccess,
    onError,
}: PaymentFormProps) {
    const { address, isConnected } = useAccount();
    const [step, setStep] = useState<PaymentStep>('ready');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { writeContract, data: hash, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    // Handle transaction confirmation
    const verifyPayment = async (txHash: string) => {
        setStep('verifying');
        try {
            const response = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash,
                    telegramId,
                    planId: plan.id,
                    channelId: channel.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setStep('success');
            onSuccess(data.inviteLink);
        } catch (error) {
            setStep('error');
            const msg = error instanceof Error ? error.message : 'Verification failed';
            setErrorMessage(msg);
            onError(msg);
        }
    };

    // Effect to handle confirmation
    if (isConfirmed && hash && step === 'confirming') {
        verifyPayment(hash);
    }

    const handlePayment = async () => {
        if (!isConnected || !address) {
            onError('Please connect your wallet first');
            return;
        }

        setStep('signing');
        setErrorMessage('');

        try {
            const amount = parseManee(plan.price_mnee);

            writeContract({
                address: MNEE_CONTRACT_ADDRESS,
                abi: MNEE_ABI,
                functionName: 'transfer',
                args: [channel.wallet_address as `0x${string}`, amount],
            });

            setStep('confirming');
        } catch (error) {
            setStep('error');
            const msg = error instanceof Error ? error.message : 'Transaction failed';
            setErrorMessage(msg);
            onError(msg);
        }
    };

    // Handle write error
    if (writeError && step !== 'error') {
        setStep('error');
        setErrorMessage(writeError.message);
    }

    const getButtonContent = () => {
        switch (step) {
            case 'signing':
                return (
                    <>
                        <span className="animate-spin mr-2">⏳</span>
                        Waiting for signature...
                    </>
                );
            case 'confirming':
                return (
                    <>
                        <span className="animate-spin mr-2">⏳</span>
                        Confirming transaction...
                    </>
                );
            case 'verifying':
                return (
                    <>
                        <span className="animate-spin mr-2">⏳</span>
                        Generating invite link...
                    </>
                );
            case 'success':
                return (
                    <>
                        <span className="mr-2">✅</span>
                        Payment successful!
                    </>
                );
            case 'error':
                return 'Try Again';
            default:
                return `Pay ${plan.price_mnee} MNEE`;
        }
    };

    const isDisabled =
        !isConnected ||
        step === 'signing' ||
        step === 'confirming' ||
        step === 'verifying' ||
        step === 'success';

    return (
        <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6 space-y-4">
                {/* Payment Summary */}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                        <p className="text-sm text-white/60">You're paying</p>
                        <p className="text-2xl font-bold text-white">{plan.price_mnee} MNEE</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-white/60">For</p>
                        <p className="text-lg font-medium text-white">{plan.name}</p>
                    </div>
                </div>

                {/* Recipient */}
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                    <span className="text-white/60 text-sm">To:</span>
                    <code className="text-xs text-purple-300 truncate flex-1">
                        {channel.wallet_address}
                    </code>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-300">{errorMessage}</p>
                    </div>
                )}

                {/* Pay Button */}
                <Button
                    onClick={step === 'error' ? handlePayment : handlePayment}
                    disabled={isDisabled}
                    className={`w-full h-14 text-lg font-semibold transition-all ${step === 'success'
                            ? 'bg-green-500 hover:bg-green-600'
                            : step === 'error'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        }`}
                >
                    {getButtonContent()}
                </Button>

                {/* Security Note */}
                <p className="text-xs text-white/40 text-center">
                    🔒 Secure payment via Ethereum blockchain
                </p>
            </CardContent>
        </Card>
    );
}
