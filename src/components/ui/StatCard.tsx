'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: {
        value: number;
        label: string;
    };
    variant?: 'default' | 'on-time' | 'delayed' | 'pending';
    icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, change, variant = 'default', icon }: StatCardProps) {
    const variantClass = variant !== 'default' ? `stat-card--${variant}` : '';

    return (
        <div className={`stat-card ${variantClass} fade-in`}>
            {icon && (
                <div style={{ marginBottom: '12px', opacity: 0.7 }}>
                    {icon}
                </div>
            )}
            <div className="stat-value">{value}</div>
            <div className="stat-label">{title}</div>
            {subtitle && (
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '4px' }}>
                    {subtitle}
                </div>
            )}
            {change && (
                <div className={`stat-change ${change.value >= 0 ? 'stat-change--positive' : 'stat-change--negative'}`}>
                    {change.value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(change.value)}% {change.label}</span>
                </div>
            )}
        </div>
    );
}
