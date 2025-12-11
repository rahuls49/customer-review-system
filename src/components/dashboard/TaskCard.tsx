'use client';

import { Clock, MapPin, User, MessageSquare } from 'lucide-react';
import { SLABadge } from '@/components/ui/SLABadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatDistanceToNow } from 'date-fns';

// SLA Status type (matches Prisma schema)
type SLAStatus = 'ON_TIME' | 'DELAYED' | 'PENDING';

interface TaskCardProps {
    task: {
        id: string;
        slaStatus: SLAStatus;
        assignedAt: Date;
        resolvedAt: Date | null;
        remarks: string | null;
        review: {
            rating: number;
            comment: string | null;
            customerName: string | null;
            createdAt: Date;
        };
        shop: {
            name: string;
        };
        section: {
            name: string;
        };
        assignedTo: {
            name: string;
        } | null;
        hoursElapsed: number;
        deadlineStatus: 'within_24h' | 'within_48h' | 'overdue';
    };
    onResolve?: (taskId: string) => void;
    showResolveButton?: boolean;
}

export function TaskCard({ task, onResolve, showResolveButton = false }: TaskCardProps) {
    const getDeadlineText = () => {
        if (task.resolvedAt) {
            return `Resolved ${formatDistanceToNow(new Date(task.resolvedAt), { addSuffix: true })}`;
        }

        const hoursRemaining = 24 - task.hoursElapsed;
        if (hoursRemaining > 0) {
            return `${Math.round(hoursRemaining)} hours remaining`;
        } else if (task.hoursElapsed < 48) {
            return `${Math.round(48 - task.hoursElapsed)} hours until critical`;
        } else {
            return `Overdue by ${Math.round(task.hoursElapsed - 48)} hours`;
        }
    };

    const getDeadlineColor = () => {
        if (task.resolvedAt) return 'inherit';
        if (task.deadlineStatus === 'within_24h') return 'hsl(var(--sla-on-time))';
        if (task.deadlineStatus === 'within_48h') return 'hsl(var(--color-warning))';
        return 'hsl(var(--sla-delayed))';
    };

    return (
        <div className={`task-card task-card--${task.slaStatus.toLowerCase().replace('_', '-')}`}>
            <div className="task-header">
                <div className="task-info">
                    <div className="task-shop">
                        <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {task.shop.name}
                    </div>
                    <div className="task-section">{task.section.name}</div>
                </div>
                <SLABadge status={task.slaStatus} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <RatingStars rating={task.review.rating} />
                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-muted))' }}>
                    {task.review.rating} star rating
                </span>
            </div>

            {task.review.comment && (
                <div className="task-comment">
                    <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px', opacity: 0.5 }} />
                    &quot;{task.review.comment}&quot;
                </div>
            )}

            {task.review.customerName && (
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))', marginBottom: '12px' }}>
                    — {task.review.customerName}
                </div>
            )}

            <div className="task-meta">
                <div className="task-meta-item">
                    <Clock size={14} />
                    <span style={{ color: getDeadlineColor() }}>{getDeadlineText()}</span>
                </div>
                {task.assignedTo && (
                    <div className="task-meta-item">
                        <User size={14} />
                        <span>Assigned to {task.assignedTo.name}</span>
                    </div>
                )}
                <div className="task-meta-item">
                    Submitted {formatDistanceToNow(new Date(task.review.createdAt), { addSuffix: true })}
                </div>
            </div>

            {task.remarks && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'hsl(var(--sla-on-time) / 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                }}>
                    <strong>Resolution Notes:</strong> {task.remarks}
                </div>
            )}

            {showResolveButton && !task.resolvedAt && onResolve && (
                <div className="task-actions">
                    <button
                        className="btn btn-success"
                        onClick={() => onResolve(task.id)}
                        style={{ width: '100%' }}
                    >
                        Mark Issue Resolved
                    </button>
                </div>
            )}
        </div>
    );
}
