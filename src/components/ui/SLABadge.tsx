'use client';

// SLA Status type (matches Prisma schema)
type SLAStatus = 'ON_TIME' | 'DELAYED' | 'PENDING';

interface SLABadgeProps {
    status: SLAStatus;
    showLabel?: boolean;
}

const statusConfig = {
    ON_TIME: {
        label: 'On Time',
        className: 'sla-badge--on-time',
    },
    DELAYED: {
        label: 'Delayed',
        className: 'sla-badge--delayed',
    },
    PENDING: {
        label: 'Pending',
        className: 'sla-badge--pending',
    },
};

export function SLABadge({ status, showLabel = true }: SLABadgeProps) {
    const config = statusConfig[status];

    return (
        <span className={`sla-badge ${config.className}`}>
            <span
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                }}
            />
            {showLabel && config.label}
        </span>
    );
}
