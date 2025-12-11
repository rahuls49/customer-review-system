'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { ShopCard } from '@/components/dashboard/ShopCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { Store, ClipboardList, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';

interface ShopData {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    isActive: boolean;
    admin: { id: string; name: string; email: string } | null;
    _count: { users: number; tasks: number; reviews: number };
}

interface DashboardData {
    shops: ShopData[];
    totalSections: number;
    totalShops: number;
    totalUsers: number;
}

export default function SuperadminDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch shops
            const shopsRes = await fetch('/api/shops');
            const shopsData = await shopsRes.json();

            // Fetch seed data for counts
            const seedRes = await fetch('/api/seed');
            const seedData = await seedRes.json();

            if (shopsData.success && seedData.success) {
                setData({
                    shops: shopsData.data || [],
                    totalSections: seedData.data.counts.sections || 0,
                    totalShops: seedData.data.counts.shops || 0,
                    totalUsers: seedData.data.counts.users || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
                <Navbar userRole="SUPERADMIN" userName="Super Admin" />
                <div className="container" style={{ paddingTop: '32px' }}>
                    <div className="loading">
                        <div className="spinner" />
                    </div>
                </div>
            </div>
        );
    }

    const totalTasks = data?.shops.reduce((sum, shop) => sum + (shop._count?.tasks || 0), 0) || 0;
    const totalReviews = data?.shops.reduce((sum, shop) => sum + (shop._count?.reviews || 0), 0) || 0;

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="SUPERADMIN" userName="Super Admin" />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '4px' }}>
                        Global Dashboard
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                        Overview of all stores and their performance metrics
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <StatCard
                        title="Total Shops"
                        value={data?.totalShops || 0}
                        icon={<Store size={24} />}
                    />
                    <StatCard
                        title="Total Users"
                        value={data?.totalUsers || 0}
                        subtitle="Admins & TLs"
                        icon={<Users size={24} />}
                    />
                    <StatCard
                        title="Total Reviews"
                        value={totalReviews}
                        subtitle="All time"
                        icon={<ClipboardList size={24} />}
                    />
                    <StatCard
                        title="Active Tasks"
                        value={totalTasks}
                        subtitle="Across all shops"
                        icon={<CheckCircle size={24} />}
                    />
                </div>

                {/* Quick Actions & Performance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '24px' }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link href="/dashboard/superadmin/shops" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                                <Store size={18} />
                                Manage Shops
                            </Link>
                            <Link href="/dashboard/superadmin/analytics" className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid hsl(var(--color-border))' }}>
                                <AlertCircle size={18} />
                                View Analytics
                            </Link>
                        </div>
                        <div style={{ marginTop: '24px', padding: '16px', background: 'hsl(var(--color-bg-tertiary))', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Sections Available
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>
                                {data?.totalSections || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                Product categories
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '24px' }}>
                            Recent Activity
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data && data.shops.length > 0 ? (
                                data.shops.slice(0, 5).map((shop) => (
                                    <div
                                        key={shop.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            padding: '12px',
                                            background: 'hsl(var(--color-bg-tertiary))',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    >
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            marginTop: '6px',
                                            flexShrink: 0,
                                            background: shop.isActive
                                                ? 'hsl(var(--sla-on-time))'
                                                : 'hsl(var(--sla-delayed))'
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-primary))' }}>
                                                {shop.name} - {shop._count?.users || 0} team members
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                                                {shop.city || 'No location'} • {shop._count?.tasks || 0} tasks
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '24px', color: 'hsl(var(--color-text-muted))' }}>
                                    No shops yet. <Link href="/dashboard/superadmin/shops" style={{ color: 'hsl(var(--color-primary))' }}>Create your first shop</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shop Cards */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--color-text-primary))' }}>
                        All Shops
                    </h2>
                </div>

                {data && data.shops.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px'
                    }}>
                        {data.shops.map((shop) => (
                            <div key={shop.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Store size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'hsl(var(--color-text-primary))' }}>
                                                {shop.name}
                                            </h3>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                            {shop.city || 'No location set'}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        background: shop.isActive ? 'hsl(var(--sla-on-time) / 0.1)' : 'hsl(var(--color-text-muted) / 0.1)',
                                        color: shop.isActive ? 'hsl(var(--sla-on-time))' : 'hsl(var(--color-text-muted))'
                                    }}>
                                        {shop.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                {shop.admin && (
                                    <div style={{
                                        padding: '12px',
                                        background: 'hsl(var(--color-bg-tertiary))',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Shop Admin
                                        </div>
                                        <div style={{ fontWeight: 500, color: 'hsl(var(--color-text-primary))' }}>{shop.admin.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>{shop.admin.email}</div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                                    <div style={{ padding: '8px', background: 'hsl(var(--color-bg-tertiary))', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--color-primary))' }}>
                                            {shop._count?.users || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                            Team
                                        </div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'hsl(var(--color-bg-tertiary))', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--sla-pending))' }}>
                                            {shop._count?.tasks || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                            Tasks
                                        </div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'hsl(var(--color-bg-tertiary))', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--sla-on-time))' }}>
                                            {shop._count?.reviews || 0}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                            Reviews
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Store size={48} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }} />
                        <h3 style={{ color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>No shops yet</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '24px' }}>
                            Get started by creating your first shop.
                        </p>
                        <Link href="/dashboard/superadmin/shops" className="btn btn-primary">
                            <Store size={18} />
                            Create Your First Shop
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
