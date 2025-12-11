'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { CheckCircle, AlertCircle, Clock, Users, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface Section {
    id: string;
    name: string;
}

interface TeamLeader {
    id: string;
    name: string;
    email: string;
    sections: Section[];
    _count?: {
        assignedTasks: number;
    };
}

interface Shop {
    id: string;
    name: string;
    admin: { id: string; name: string; email: string } | null;
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<Shop | null>(null);
    const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get seed data to find the shop
            const seedRes = await fetch('/api/seed');
            const seedData = await seedRes.json();

            if (seedData.success && seedData.data.shops.length > 0) {
                const firstShop = seedData.data.shops[0];
                setShop(firstShop);
                setSections(seedData.data.sections || []);

                // Fetch team leaders for this shop
                const tlRes = await fetch(`/api/users?role=TL&shopId=${firstShop.id}`);
                const tlData = await tlRes.json();
                if (tlData.success) {
                    setTeamLeaders(tlData.data || []);
                }
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
                <Navbar userRole="ADMIN" userName="Admin User" shopName="Loading..." />
                <div className="container" style={{ paddingTop: '32px' }}>
                    <div className="loading">
                        <div className="spinner" />
                    </div>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
                <Navbar userRole="ADMIN" userName="Admin User" />
                <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <h3 style={{ color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>No Shop Found</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
                            Please contact your superadmin to set up your shop.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const totalTasks = teamLeaders.reduce((sum, tl) => sum + (tl._count?.assignedTasks || 0), 0);
    const totalSections = sections.length;
    const assignedSections = new Set(teamLeaders.flatMap(tl => tl.sections.map(s => s.id))).size;

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="ADMIN" userName={shop.admin?.name || 'Admin User'} shopName={shop.name} />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '4px' }}>
                        {shop.name}
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                        Performance overview for your store
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <StatCard
                        title="Team Leaders"
                        value={teamLeaders.length}
                        subtitle="Active"
                        icon={<Users size={24} />}
                    />
                    <StatCard
                        title="Total Tasks"
                        value={totalTasks}
                        subtitle="Assigned"
                        icon={<ClipboardList size={24} />}
                    />
                    <StatCard
                        title="Sections Covered"
                        value={`${assignedSections}/${totalSections}`}
                        subtitle="Assigned"
                        icon={<CheckCircle size={24} />}
                        variant="on-time"
                    />
                    <StatCard
                        title="Unassigned Sections"
                        value={totalSections - assignedSections}
                        subtitle="Need TL"
                        icon={<AlertCircle size={24} />}
                        variant={totalSections - assignedSections > 0 ? 'delayed' : undefined}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    {/* Quick Actions */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '24px' }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link href="/dashboard/admin/team" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                                <Users size={18} />
                                Manage Team Leaders
                            </Link>
                            <Link href="/dashboard/admin/tasks" className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid hsl(var(--color-border))' }}>
                                <ClipboardList size={18} />
                                View All Tasks
                            </Link>
                        </div>
                    </div>

                    {/* Section Coverage */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '24px' }}>
                            Section Coverage
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sections.slice(0, 6).map((section) => {
                                const isAssigned = teamLeaders.some(tl =>
                                    tl.sections.some(s => s.id === section.id)
                                );
                                const assignedTL = teamLeaders.find(tl =>
                                    tl.sections.some(s => s.id === section.id)
                                );
                                return (
                                    <div
                                        key={section.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px',
                                            background: 'hsl(var(--color-bg-tertiary))',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-primary))' }}>
                                            {section.name}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            background: isAssigned
                                                ? 'hsl(var(--sla-on-time) / 0.1)'
                                                : 'hsl(var(--sla-delayed) / 0.1)',
                                            color: isAssigned
                                                ? 'hsl(var(--sla-on-time))'
                                                : 'hsl(var(--sla-delayed))'
                                        }}>
                                            {isAssigned ? assignedTL?.name || 'Assigned' : 'Unassigned'}
                                        </div>
                                    </div>
                                );
                            })}
                            {sections.length > 6 && (
                                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--color-text-muted))', paddingTop: '8px' }}>
                                    +{sections.length - 6} more sections
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Leaders Table */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '24px' }}>
                        Team Leaders
                    </h3>
                    {teamLeaders.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Team Leader</th>
                                        <th>Email</th>
                                        <th>Sections</th>
                                        <th>Active Tasks</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamLeaders.map((tl) => (
                                        <tr key={tl.id}>
                                            <td>
                                                <div style={{ fontWeight: 500, color: 'hsl(var(--color-text-primary))' }}>
                                                    {tl.name}
                                                </div>
                                            </td>
                                            <td style={{ color: 'hsl(var(--color-text-secondary))' }}>
                                                {tl.email}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {tl.sections.map((section) => (
                                                        <span
                                                            key={section.id}
                                                            style={{
                                                                padding: '2px 8px',
                                                                background: 'hsl(var(--color-primary) / 0.1)',
                                                                color: 'hsl(var(--color-primary))',
                                                                borderRadius: 'var(--radius-full)',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        >
                                                            {section.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {tl._count?.assignedTasks || 0}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    background: 'hsl(var(--sla-on-time) / 0.1)',
                                                    color: 'hsl(var(--sla-on-time))'
                                                }}>
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--color-text-muted))' }}>
                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ marginBottom: '16px' }}>No team leaders yet.</p>
                            <Link href="/dashboard/admin/team" className="btn btn-primary">
                                Add Your First Team Leader
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
