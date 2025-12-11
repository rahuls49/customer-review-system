'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Store, Plus, Edit, Trash2, MapPin, Users, X, Search } from 'lucide-react';

interface Shop {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    isActive: boolean;
    createdAt: string;
    _count?: {
        users: number;
        tasks: number;
    };
    admin?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export default function ShopsManagementPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        address: '',
        city: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await fetch('/api/shops');
            const data = await response.json();
            if (data.success) {
                setShops(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (shop?: Shop) => {
        if (shop) {
            setEditingShop(shop);
            setFormData({
                name: shop.name,
                slug: shop.slug || '',
                address: shop.address || '',
                city: shop.city || '',
                adminName: shop.admin?.name || '',
                adminEmail: shop.admin?.email || '',
                adminPassword: '',
            });
        } else {
            setEditingShop(null);
            setFormData({
                name: '',
                slug: '',
                address: '',
                city: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            const url = editingShop ? `/api/shops/${editingShop.id}` : '/api/shops';
            const method = editingShop ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await fetchShops();
                setShowModal(false);
            } else {
                setFormError(data.error || `Failed to save shop (HTTP ${response.status})`);
            }
        } catch (error) {
            console.error('Error saving shop:', error);
            setFormError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (shopId: string) => {
        if (!confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/shops/${shopId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                await fetchShops();
            }
        } catch (error) {
            console.error('Error deleting shop:', error);
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="SUPERADMIN" userName="Super Admin" />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '4px' }}>
                            Shop Management
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Create and manage shop locations and their administrators
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Add New Shop
                    </button>
                </div>

                {/* Search */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--color-text-muted))' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search shops by name or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '42px' }}
                        />
                    </div>
                </div>

                {/* Shops Grid */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner" />
                    </div>
                ) : filteredShops.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <Store size={48} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }} />
                        <h3 style={{ color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>No shops found</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '24px' }}>
                            {searchQuery ? 'No shops match your search.' : 'Get started by adding your first shop.'}
                        </p>
                        {!searchQuery && (
                            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                                <Plus size={18} />
                                Add First Shop
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {filteredShops.map((shop) => (
                            <div key={shop.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Store size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'hsl(var(--color-text-primary))' }}>{shop.name}</h3>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                            <MapPin size={14} />
                                            {shop.address ? `${shop.address}, ${shop.city}` : shop.city || 'No address'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '8px' }}
                                            onClick={() => handleOpenModal(shop)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: '8px', color: 'hsl(var(--color-danger))' }}
                                            onClick={() => handleDelete(shop.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
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

                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={14} />
                                        {shop._count?.users || 0} team members
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: shop.isActive ? 'hsl(var(--sla-on-time))' : 'hsl(var(--color-text-muted))'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: shop.isActive ? 'hsl(var(--sla-on-time))' : 'hsl(var(--color-text-muted))'
                                        }} />
                                        {shop.isActive ? 'Active' : 'Inactive'}
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid hsl(var(--color-border))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>
                                    {editingShop ? 'Edit Shop' : 'Add New Shop'}
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
                                    Shop Details
                                </h3>
                                <div className="form-group">
                                    <label className="form-label">Shop Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Downtown Store"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">URL Slug *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        placeholder="e.g., ssrpr"
                                        required
                                    />
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '4px' }}>
                                        Review form URL: /review/{formData.slug || 'your-slug'}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="e.g., 123 Main Street"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="e.g., Mumbai"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Shop Admin Account
                                </h3>
                                <div className="form-group">
                                    <label className="form-label">Admin Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        placeholder="e.g., John Smith"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Admin Email *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        placeholder="e.g., admin@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        {editingShop ? 'New Password (leave empty to keep current)' : 'Password *'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                        placeholder="••••••••"
                                        required={!editingShop}
                                        minLength={6}
                                    />
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
                                    {saving ? 'Saving...' : editingShop ? 'Update Shop' : 'Create Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
