'use client';

interface PerformanceChartProps {
    data: {
        onTimePercentage: number;
        delayedPercentage: number;
        pendingPercentage: number;
    };
    size?: number;
}

export function PerformanceChart({ data, size = 180 }: PerformanceChartProps) {
    const { onTimePercentage, delayedPercentage, pendingPercentage } = data;

    // Calculate stroke dash arrays for each segment
    const circumference = 2 * Math.PI * 45; // radius = 45
    const onTimeOffset = 0;
    const delayedOffset = (onTimePercentage / 100) * circumference;
    const pendingOffset = ((onTimePercentage + delayedPercentage) / 100) * circumference;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <svg width={size} height={size} viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--color-border))"
                    strokeWidth="10"
                />

                {/* Pending segment (bottom layer) */}
                {pendingPercentage > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(0, 0%, 25%)"
                        strokeWidth="10"
                        strokeDasharray={`${(pendingPercentage / 100) * circumference} ${circumference}`}
                        strokeDashoffset={-pendingOffset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'all 0.5s ease' }}
                    />
                )}

                {/* Delayed segment */}
                {delayedPercentage > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(4, 90%, 58%)"
                        strokeWidth="10"
                        strokeDasharray={`${(delayedPercentage / 100) * circumference} ${circumference}`}
                        strokeDashoffset={-delayedOffset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'all 0.5s ease' }}
                    />
                )}

                {/* On Time segment (top layer) */}
                {onTimePercentage > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth="10"
                        strokeDasharray={`${(onTimePercentage / 100) * circumference} ${circumference}`}
                        strokeDashoffset={-onTimeOffset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'all 0.5s ease' }}
                    />
                )}

                {/* Center text */}
                <text
                    x="50"
                    y="45"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="700"
                    fill="hsl(var(--color-text-primary))"
                >
                    {onTimePercentage}%
                </text>
                <text
                    x="50"
                    y="60"
                    textAnchor="middle"
                    fontSize="8"
                    fill="hsl(var(--color-text-muted))"
                >
                    ON TIME
                </text>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(142, 76%, 36%)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>On Time</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>{onTimePercentage}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(4, 90%, 58%)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>Delayed</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>{delayedPercentage}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(0, 0%, 25%)' }} />
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>Pending</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>{pendingPercentage}%</span>
                </div>
            </div>
        </div>
    );
}
