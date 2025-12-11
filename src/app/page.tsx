import { ClipboardList, Store, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: `
            radial-gradient(ellipse at top, hsl(220 90% 95%) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, hsl(142 76% 95%) 0%, transparent 40%),
            hsl(var(--color-bg))
          `,
        }}
      >
        {/* Header */}
        <header style={{
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--color-border))',
          background: 'hsl(var(--color-bg-secondary) / 0.8)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary-dark)) 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px hsl(var(--color-primary) / 0.3)'
            }}>
              <ClipboardList size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>ReviewTrack</span>
          </div>
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
        </header>

        {/* Hero content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px'
        }}>
          <div style={{ maxWidth: '900px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'hsl(var(--color-primary) / 0.1)',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'hsl(var(--color-primary))',
              marginBottom: '24px',
              border: '1px solid hsl(var(--color-primary) / 0.2)'
            }}>
              ✨ Customer Feedback Management System
            </div>

            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
              color: 'hsl(var(--color-text-primary))',
            }}>
              Turn Negative Reviews Into{' '}
              <span style={{
                background: 'linear-gradient(135deg, hsl(var(--sla-on-time)) 0%, hsl(142 76% 45%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Positive Actions
              </span>
            </h1>

            <p style={{
              fontSize: '1.25rem',
              color: 'hsl(var(--color-text-secondary))',
              lineHeight: 1.6,
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px'
            }}>
              Automatically convert customer complaints into actionable tasks for your team leaders.
              Track resolution times with SLA monitoring and improve your store performance.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '64px' }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                Get Started <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </Link>
              <Link href="#features" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                Learn More
              </Link>
            </div>

            {/* Key Benefits */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              marginBottom: '64px',
              flexWrap: 'wrap'
            }}>
              {[
                'Auto-assign tasks to Team Leaders',
                'Real-time SLA tracking',
                'Multi-store analytics'
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--color-text-secondary))' }}>
                  <CheckCircle size={18} color="hsl(142, 76%, 36%)" />
                  <span style={{ fontSize: '0.9rem' }}>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Feature highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginTop: '32px'
            }}>
              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'hsl(var(--color-primary) / 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Store size={24} color="hsl(220, 90%, 50%)" />
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--color-text-primary))' }}>Multi-Store Support</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                  Manage feedback from all your retail locations in one centralized platform.
                </p>
              </div>

              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'hsl(var(--sla-on-time) / 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Users size={24} color="hsl(142, 76%, 36%)" />
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--color-text-primary))' }}>Automatic Assignment</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                  Tasks are automatically assigned to the right Team Leader based on section.
                </p>
              </div>

              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'hsl(var(--color-warning) / 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <TrendingUp size={24} color="hsl(38, 92%, 50%)" />
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--color-text-primary))' }}>SLA Tracking</h3>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                  Monitor resolution times with color-coded status: Green (on-time), Red (delayed), Black (pending).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          padding: '24px 48px',
          borderTop: '1px solid hsl(var(--color-border))',
          textAlign: 'center',
          color: 'hsl(var(--color-text-muted))',
          fontSize: '0.875rem',
          background: 'hsl(var(--color-bg-secondary))'
        }}>
          © 2024 ReviewTrack. Built for retail excellence.
        </footer>
      </div>
    </main>
  );
}
