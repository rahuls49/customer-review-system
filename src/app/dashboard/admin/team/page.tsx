'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Users, Plus, Edit, Trash2, X, CheckCircle } from 'lucide-react';

interface Section {
    id: string;
    name: string;
}

interface TeamLeader {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
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

export default function TeamManagementPage() {
    const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTL, setEditingTL] = useState<TeamLeader | null>(null);

    // Shop info - dynamically loaded
    const [shop, setShop] = useState<Shop | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        sectionIds: [] as string[],
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // First get seed data to find the shop
            const seedRes = await fetch('/api/seed');
            const seedData = await seedRes.json();

            if (seedData.success && seedData.data.shops.length > 0) {
                // Use the first shop for demo purposes
                const firstShop = seedData.data.shops[0];
                setShop(firstShop);

                // Load sections
                setSections(seedData.data.sections || []);

                // Fetch team leaders for this shop
                const tlRes = await fetch(`/api/users?role=TL&shopId=${firstShop.id}`);
                const tlData = await tlRes.json();
                if (tlData.success) {
                    setTeamLeaders(tlData.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tl?: TeamLeader) => {
        if (tl) {
            setEditingTL(tl);
            setFormData({
                name: tl.name,
                email: tl.email,
                phone: tl.phone || '',
                password: '',
                sectionIds: tl.sections.map(s => s.id),
            });
        } else {
            setEditingTL(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                sectionIds: [],
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const handleSectionToggle = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            sectionIds: prev.sectionIds.includes(sectionId)
                ? prev.sectionIds.filter(id => id !== sectionId)
                : [...prev.sectionIds, sectionId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        if (!shop) {
            setFormError('No shop found. Please create a shop first.');
            setSaving(false);
            return;
        }

        if (formData.sectionIds.length === 0) {
            setFormError('Please assign at least one section to this Team Leader');
            setSaving(false);
            return;
        }

        try {
            const url = editingTL ? `/api/users/${editingTL.id}` : '/api/users';
            const method = editingTL ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                role: 'TL',
                shopId: shop.id,
            };

            console.log('Sending payload:', payload);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('Response:', data);

            if (response.ok && data.success) {
                await fetchInitialData();
                setShowModal(false);
            } else {
                setFormError(data.error || `Failed to save team leader (HTTP ${response.status})`);
            }
        } catch (error) {
            console.error('Error saving TL:', error);
            setFormError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this Team Leader?')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                await fetchInitialData();
            }
        } catch (error) {
            console.error('Error removing team leader:', error);
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
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '24px' }}>
                            Please create a shop first before managing team leaders.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="ADMIN" userName={shop.admin?.name || 'Admin User'} shopName={shop.name} />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '4px' }}>
                            Team Management
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Manage Team Leaders and assign sections for {shop.name}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Add Team Leader
                    </button>
                </div>

                {/* Team Leaders Grid */}
                {teamLeaders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Users size={48} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }} />
                        <h3 style={{ color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>No Team Leaders</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '24px' }}>
                            Add your first Team Leader to start managing tasks.
                        </p>
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={18} />
                            Add First Team Leader
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                        {teamLeaders.map((tl) => (
                            <div key={tl.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary-dark)) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '1.1rem'
                                        }}>
                                            {tl.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'hsl(var(--color-text-primary))', marginBottom: '2px' }}>
                                                {tl.name}
                                            </h3>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                                {tl.email}
                                            </div>
                                            {tl.phone && (
                                                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                                                    {tl.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '8px' }}
                                            onClick={() => handleOpenModal(tl)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '8px', color: 'hsl(var(--color-danger))' }}
                                            onClick={() => handleDelete(tl.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Assigned Sections */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Assigned Sections ({tl.sections.length})
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {tl.sections.map((section) => (
                                            <span
                                                key={section.id}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: 'hsl(var(--color-primary) / 0.1)',
                                                    color: 'hsl(var(--color-primary))',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {section.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{
                                    display: 'flex',
                                    gap: '16px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid hsl(var(--color-border))',
                                    fontSize: '0.875rem',
                                    color: 'hsl(var(--color-text-secondary))'
                                }}>
                                    <div>
                                        <strong style={{ color: 'hsl(var(--color-text-primary))' }}>{tl._count?.assignedTasks || 0}</strong> Active Tasks
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: tl.isActive ? 'hsl(var(--sla-on-time))' : 'hsl(var(--color-text-muted))'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: tl.isActive ? 'hsl(var(--sla-on-time))' : 'hsl(var(--color-text-muted))'
                                        }} />
                                        {tl.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid hsl(var(--color-border))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>
                                    {editingTL ? 'Edit Team Leader' : 'Add New Team Leader'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                >
                                    <X size={20} style={{ color: 'hsl(var(--color-text-muted))' }} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Personal Information
                                </h3>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Rahul Kumar"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g., rahul@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g., +91 9876543210"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        {editingTL ? 'New Password (leave empty to keep current)' : 'Password *'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        required={!editingTL}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Assign Sections *
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-muted))', marginBottom: '12px' }}>
                                    Select which sections this Team Leader will be responsible for:
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {sections.map((section) => (
                                        <label
                                            key={section.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '12px',
                                                background: formData.sectionIds.includes(section.id)
                                                    ? 'hsl(var(--color-primary) / 0.1)'
                                                    : 'hsl(var(--color-bg-tertiary))',
                                                borderRadius: 'var(--radius-md)',
                                                border: formData.sectionIds.includes(section.id)
                                                    ? '1px solid hsl(var(--color-primary) / 0.3)'
                                                    : '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: formData.sectionIds.includes(section.id)
                                                    ? 'none'
                                                    : '2px solid hsl(var(--color-border))',
                                                background: formData.sectionIds.includes(section.id)
                                                    ? 'hsl(var(--color-primary))'
                                                    : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {formData.sectionIds.includes(section.id) && (
                                                    <CheckCircle size={14} color="white" />
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.sectionIds.includes(section.id)}
                                                onChange={() => handleSectionToggle(section.id)}
                                                style={{ display: 'none' }}
                                            />
                                            <span style={{
                                                fontSize: '0.875rem',
                                                color: formData.sectionIds.includes(section.id)
                                                    ? 'hsl(var(--color-primary))'
                                                    : 'hsl(var(--color-text-primary))',
                                                fontWeight: formData.sectionIds.includes(section.id) ? 500 : 400
                                            }}>
                                                {section.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formError && (
                                <div style={{
                                    padding: '12px',
                                    background: 'hsl(var(--color-danger) / 0.1)',
                                    border: '1px solid hsl(var(--color-danger) / 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'hsl(var(--color-danger))',
                                    fontSize: '0.875rem',
                                    marginBottom: '16px'
                                }}>
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingTL ? 'Update Team Leader' : 'Add Team Leader'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
