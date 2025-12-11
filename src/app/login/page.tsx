'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Demo login - In production, this would call the auth API
        // For demo purposes, we'll redirect based on email pattern
        setTimeout(() => {
            if (email.includes('superadmin')) {
                router.push('/dashboard/superadmin');
            } else if (email.includes('admin')) {
                router.push('/dashboard/admin');
            } else if (email.includes('tl')) {
                router.push('/dashboard/tl');
            } else {
                setError('Invalid credentials. Use demo accounts: superadmin@example.com, admin1@example.com, or tl1@example.com');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: `
          radial-gradient(ellipse at top left, hsl(220 90% 95%) 0%, transparent 50%),
          hsl(var(--color-bg))
        `,
            }}
        >
            <div
                className="card fade-in"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '40px',
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary-dark)) 100%)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 14px hsl(var(--color-primary) / 0.3)'
                    }}>
                        <ClipboardList size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'hsl(var(--color-text-primary))' }}>
                        Welcome back
                    </h1>
                    <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                        Sign in to your ReviewTrack account
                    </p>
                </div>

                {/* Demo accounts notice */}
                <div style={{
                    padding: '12px 16px',
                    background: 'hsl(var(--color-primary) / 0.05)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '24px',
                    fontSize: '0.8rem',
                    color: 'hsl(var(--color-text-secondary))',
                    border: '1px solid hsl(var(--color-primary) / 0.15)'
                }}>
                    <strong style={{ color: 'hsl(var(--color-primary))' }}>Demo Accounts:</strong><br />
                    • superadmin@example.com<br />
                    • admin1@example.com<br />
                    • tl1@example.com<br />
                    <span style={{ opacity: 0.7 }}>Password: password123</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'hsl(var(--color-text-muted))'
                                }}
                            />
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '42px' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'hsl(var(--color-text-muted))'
                                }}
                            />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'hsl(var(--color-text-muted))',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'hsl(var(--color-danger) / 0.1)',
                            border: '1px solid hsl(var(--color-danger) / 0.2)',
                            borderRadius: 'var(--radius-md)',
                            color: 'hsl(var(--color-danger))',
                            fontSize: '0.875rem',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', marginTop: '8px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    fontSize: '0.875rem',
                    color: 'hsl(var(--color-text-secondary))'
                }}>
                    <Link href="/" style={{ color: 'hsl(var(--color-primary))', textDecoration: 'none' }}>
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
