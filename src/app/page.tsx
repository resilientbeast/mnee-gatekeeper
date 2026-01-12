'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { WalletConnect } from '@/components/wallet-connect';
import { SubscriptionPlans } from '@/components/subscription-plans';
import { PaymentForm } from '@/components/payment-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Channel, SubscriptionPlan } from '@/types/database';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          button_color?: string;
        };
      };
    };
  }
}

export default function Home() {
  const searchParams = useSearchParams();
  const { isConnected, address } = useAppKitAccount();

  const [telegramUser, setTelegramUser] = useState<{
    id: number;
    first_name: string;
  } | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get channel ID from URL params
  const channelId = searchParams.get('channelId');
  const planIdParam = searchParams.get('planId');

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }
    }

    // For development without Telegram
    if (process.env.NODE_ENV === 'development' && !window.Telegram?.WebApp) {
      setTelegramUser({ id: 123456789, first_name: 'Dev User' });
    }
  }, []);

  // Fetch channel and plans
  useEffect(() => {
    async function fetchData() {
      if (!channelId) {
        setError('No channel specified');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/channels/${channelId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load channel');
        }

        setChannel(data.channel);
        setPlans(data.plans);

        // Pre-select plan if specified in URL
        if (planIdParam && data.plans) {
          const preselected = data.plans.find(
            (p: SubscriptionPlan) => p.id === planIdParam
          );
          if (preselected) setSelectedPlan(preselected);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load channel');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [channelId, planIdParam]);

  const handlePaymentSuccess = (link: string) => {
    setInviteLink(link);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </main>
    );
  }

  // Error state
  if (error && !channel) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Success state - show invite link
  if (inviteLink) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
        <Card className="bg-green-500/10 border-green-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <CardTitle className="text-2xl text-white">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-center">
              Click the button below to join{' '}
              <span className="text-white font-semibold">{channel?.channel_name}</span>
            </p>
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-semibold text-center transition-all"
            >
              Join Channel →
            </a>
            <p className="text-xs text-white/40 text-center">
              This link expires in 24 hours and can only be used once.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-300">
            Powered by MNEE
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">
            {channel?.channel_name || 'Premium Access'}
          </h1>
          <p className="text-white/60">
            Subscribe using MNEE stablecoin
          </p>
        </div>

        {/* Welcome message */}
        {telegramUser && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/80">
              Welcome, <span className="font-semibold text-white">{telegramUser.first_name}</span>! 👋
            </p>
          </div>
        )}

        {/* Wallet Connection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Wallet</span>
            {isConnected && (
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                Connected
              </Badge>
            )}
          </div>
          <WalletConnect />
        </div>

        {/* Subscription Plans */}
        {plans.length > 0 && (
          <div className="mb-6">
            <SubscriptionPlans
              plans={plans}
              selectedPlanId={selectedPlan?.id || null}
              onSelectPlan={setSelectedPlan}
            />
          </div>
        )}

        {/* Payment Form */}
        {isConnected && selectedPlan && channel && telegramUser && (
          <PaymentForm
            plan={selectedPlan}
            channel={channel}
            telegramId={telegramUser.id.toString()}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}

        {/* Connect wallet prompt */}
        {!isConnected && selectedPlan && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6 text-center">
              <p className="text-white/70 mb-4">
                Connect your wallet to continue with payment
              </p>
              <WalletConnect />
            </CardContent>
          </Card>
        )}

        {/* No plan selected */}
        {isConnected && !selectedPlan && plans.length > 0 && (
          <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/70">
              Select a subscription plan above to continue
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
