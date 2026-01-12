'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionPlan } from '@/types/database';

interface SubscriptionPlansProps {
    plans: SubscriptionPlan[];
    selectedPlanId: string | null;
    onSelectPlan: (plan: SubscriptionPlan) => void;
}

export function SubscriptionPlans({
    plans,
    selectedPlanId,
    onSelectPlan,
}: SubscriptionPlansProps) {
    const formatDuration = (days: number | null) => {
        if (days === null) return 'Lifetime';
        if (days === 1) return '1 Day';
        if (days === 7) return '7 Days';
        if (days === 30) return '30 Days';
        if (days === 90) return '90 Days';
        if (days === 365) return '1 Year';
        return `${days} Days`;
    };

    const getBadgeVariant = (days: number | null) => {
        if (days === null) return 'default';
        if (days <= 7) return 'secondary';
        return 'outline';
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                Select a Plan
            </h3>
            <div className="grid gap-3">
                {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                        <Card
                            key={plan.id}
                            onClick={() => onSelectPlan(plan)}
                            className={`cursor-pointer transition-all duration-200 border-2 ${isSelected
                                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                                    <Badge
                                        variant={getBadgeVariant(plan.duration_days)}
                                        className="text-xs"
                                    >
                                        {formatDuration(plan.duration_days)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">
                                        {plan.price_mnee}
                                    </span>
                                    <span className="text-white/60 text-sm">MNEE</span>
                                </div>
                                {plan.duration_days && (
                                    <p className="text-sm text-white/50 mt-1">
                                        ${(plan.price_mnee / plan.duration_days).toFixed(2)}/day
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
