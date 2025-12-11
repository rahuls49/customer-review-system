'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ResolveTaskModalProps {
    taskId: string;
    sectionName: string;
    onClose: () => void;
    onSubmit: (taskId: string, remarks: string) => Promise<void>;
}

export function ResolveTaskModal({ taskId, sectionName, onClose, onSubmit }: ResolveTaskModalProps) {
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!remarks.trim()) {
            setError('Please enter remarks about the action taken');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onSubmit(taskId, remarks.trim());
            onClose();
        } catch {
            setError('Failed to resolve task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                className="card fade-in"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    margin: '16px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="card-header">
                    <h3 className="card-title">Mark Issue Resolved</h3>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ marginBottom: '16px', color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                    Resolving task for: <strong>{sectionName}</strong>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="remarks">
                            Action Taken / Remarks *
                        </label>
                        <textarea
                            id="remarks"
                            className="form-textarea"
                            placeholder="Describe the action taken to resolve this issue..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: 'hsl(var(--color-danger))',
                            fontSize: '0.875rem',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Resolution'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
