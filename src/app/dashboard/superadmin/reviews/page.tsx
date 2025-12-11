'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
    Star, Search, Filter, Calendar, Store, ChevronLeft, ChevronRight,
    User, Phone, Mail, Clock, MessageSquare, BarChart3, TrendingUp
} from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    comment: string;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    isProcessed: boolean;
    createdAt: string;
    shop: { id: string; name: string };
    section: { id: string; name: string } | null;
}

interface Shop {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
}

interface Stats {
    totalReviews: number;
    avgRating: number;
    ratingDistribution: Record<number, number>;
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export default function SuperadminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1, limit: 20, totalCount: 0, totalPages: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        shopId: '',
        sectionId: '',
        rating: '',
        dateFrom: '',
        dateTo: '',
        search: '',
        isProcessed: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', pagination.page.toString());
            params.set('limit', pagination.limit.toString());
            params.set('includeStats', 'true');

            if (filters.shopId) params.set('shopId', filters.shopId);
            if (filters.sectionId) params.set('sectionId', filters.sectionId);
            if (filters.rating) params.set('rating', filters.rating);
            if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.set('dateTo', filters.dateTo);
            if (filters.search) params.set('search', filters.search);
            if (filters.isProcessed) params.set('isProcessed', filters.isProcessed);

            const response = await fetch(`/api/reviews?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setReviews(data.data || []);
                setPagination(prev => ({ ...prev, ...data.pagination }));
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    const fetchShopsAndSections = async () => {
        try {
            const [shopsRes, sectionsRes] = await Promise.all([
                fetch('/api/shops'),
                fetch('/api/sections')
            ]);
            const shopsData = await shopsRes.json();
            const sectionsData = await sectionsRes.json();

            if (shopsData.success) setShops(shopsData.data || []);
            if (sectionsData.success) setSections(sectionsData.data || []);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    useEffect(() => {
        fetchShopsAndSections();
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            shopId: '', sectionId: '', rating: '', dateFrom: '', dateTo: '', search: '', isProcessed: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                        color={star <= rating ? '#fbbf24' : '#d1d5db'}
                    />
                ))}
            </div>
        );
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'hsl(var(--sla-on-time))';
        if (rating >= 3) return 'hsl(var(--sla-warning))';
        return 'hsl(var(--sla-overdue))';
    };

    const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="SUPERADMIN" userName="Super Admin" />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>
                        Customer Reviews
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                        View and manage all customer feedback across all shops
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, hsl(220 80% 55%) 0%, hsl(220 70% 45%) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <MessageSquare size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                        Total Reviews
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>
                                        {stats.totalReviews}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Star size={24} color="white" fill="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                        Avg Rating
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>
                                        {stats.avgRating} / 5
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, hsl(150 70% 45%) 0%, hsl(150 60% 35%) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <TrendingUp size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                        5-Star Reviews
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>
                                        {stats.ratingDistribution[5]}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, hsl(0 70% 55%) 0%, hsl(0 60% 45%) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <BarChart3 size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
                                        Low Ratings (1-2)
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>
                                        {stats.ratingDistribution[1] + stats.ratingDistribution[2]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
                    {/* Search and Filter Toggle */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: showFilters ? '16px' : 0 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{
                                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                color: 'hsl(var(--color-text-muted))'
                            }} />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or comment..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Filter size={18} />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span style={{
                                    background: 'hsl(var(--color-primary))',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid hsl(var(--color-border))'
                        }}>
                            <div>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Store size={14} /> Shop
                                </label>
                                <select
                                    className="form-input"
                                    value={filters.shopId}
                                    onChange={(e) => handleFilterChange('shopId', e.target.value)}
                                >
                                    <option value="">All Shops</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Section</label>
                                <select
                                    className="form-input"
                                    value={filters.sectionId}
                                    onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(section => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Star size={14} /> Rating
                                </label>
                                <select
                                    className="form-input"
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                                >
                                    <option value="">All Ratings</option>
                                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                    <option value="4">⭐⭐⭐⭐ (4)</option>
                                    <option value="3">⭐⭐⭐ (3)</option>
                                    <option value="2">⭐⭐ (2)</option>
                                    <option value="1">⭐ (1)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> From Date
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> To Date
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={clearFilters}>
                                    Clear All
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews List */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>
                            No Reviews Found
                        </h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
                            {activeFiltersCount > 0 ? 'Try adjusting your filters' : 'No customer reviews yet'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reviews.map((review) => (
                                <div key={review.id} className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: `linear-gradient(135deg, ${getRatingColor(review.rating)} 0%, ${getRatingColor(review.rating)}cc 100%)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.25rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {review.rating}
                                            </div>
                                            <div>
                                                {renderStars(review.rating)}
                                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))', marginTop: '4px' }}>
                                                    {review.section?.name || 'No section'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 10px', borderRadius: '6px',
                                                background: 'hsl(var(--color-bg))',
                                                fontSize: '0.75rem', fontWeight: 500,
                                                color: 'hsl(var(--color-text-secondary))'
                                            }}>
                                                <Store size={12} />
                                                {review.shop.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '4px',
                                                display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
                                            }}>
                                                <Clock size={12} />
                                                {formatDate(review.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{
                                        fontSize: '0.9375rem', color: 'hsl(var(--color-text-primary))',
                                        lineHeight: 1.6, marginBottom: '16px',
                                        padding: '12px', background: 'hsl(var(--color-bg))', borderRadius: '8px'
                                    }}>
                                        &ldquo;{review.comment}&rdquo;
                                    </p>

                                    {(review.customerName || review.customerPhone || review.customerEmail) && (
                                        <div style={{
                                            display: 'flex', flexWrap: 'wrap', gap: '16px',
                                            fontSize: '0.8125rem', color: 'hsl(var(--color-text-secondary))'
                                        }}>
                                            {review.customerName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <User size={14} />
                                                    {review.customerName}
                                                </div>
                                            )}
                                            {review.customerPhone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={14} />
                                                    {review.customerPhone}
                                                </div>
                                            )}
                                            {review.customerEmail && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Mail size={14} />
                                                    {review.customerEmail}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: '16px', marginTop: '24px'
                            }}>
                                <button
                                    className="btn btn-secondary"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <ChevronLeft size={18} /> Previous
                                </button>
                                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
