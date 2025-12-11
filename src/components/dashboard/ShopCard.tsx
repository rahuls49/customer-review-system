'use client';

import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ShopCardProps {
    shop: {
        shopId: string;
        shopName: string;
        totalTasks: number;
        onTimeCount: number;
        delayedCount: number;
        pendingCount: number;
        onTimePercentage: number;
        delayedPercentage: number;
        pendingPercentage: number;
    };
    onClick?: () => void;
}

export function ShopCard({ shop, onClick }: ShopCardProps) {
    const getTrendIcon = () => {
        if (shop.onTimePercentage >= 80) return <TrendingUp size={14} color="hsl(142, 76%, 36%)" />;
        if (shop.onTimePercentage < 50) return <TrendingDown size={14} color="hsl(4, 90%, 58%)" />;
        return <Minus size={14} color="hsl(var(--color-text-muted))" />;
    };

    const getPerformanceColor = () => {
        if (shop.onTimePercentage >= 80) return 'hsl(142, 76%, 36%)';
        if (shop.onTimePercentage >= 50) return 'hsl(38, 92%, 50%)';
        return 'hsl(4, 90%, 58%)';
    };

    return (
        <div
            className="card"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <MapPin size={16} style={{ color: 'hsl(var(--color-primary))' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'hsl(var(--color-text-primary))' }}>{shop.shopName}</h3>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                        {shop.totalTasks} total tasks
                    </div>
                </div>
                {getTrendIcon()}
            </div>

            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>On-Time Rate</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: getPerformanceColor() }}>
                        {shop.onTimePercentage}%
                    </span>
                </div>
                <div style={{
                    height: '6px',
                    background: 'hsl(var(--color-border))',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${shop.onTimePercentage}%`,
                        background: getPerformanceColor(),
                        borderRadius: '3px',
                        transition: 'width 0.5s ease'
                    }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px 8px',
                    background: 'hsl(142 76% 36% / 0.08)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(142 76% 36% / 0.15)'
                }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(142, 76%, 36%)' }}>
                        {shop.onTimeCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                        On Time
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px 8px',
                    background: 'hsl(4 90% 58% / 0.08)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(4 90% 58% / 0.15)'
                }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(4, 90%, 58%)' }}>
                        {shop.delayedCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                        Delayed
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px 8px',
                    background: 'hsl(0 0% 25% / 0.05)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(0 0% 25% / 0.15)'
                }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(0, 0%, 25%)' }}>
                        {shop.pendingCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                        Pending
                    </div>
                </div>
            </div>
        </div>
    );
}
