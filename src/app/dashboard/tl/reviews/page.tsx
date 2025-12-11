'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
    Star, Search, Filter, Calendar, ChevronLeft, ChevronRight,
    User, Phone, Mail, Clock, MessageSquare, BarChart3
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

interface UserData {
    shopId: string;
    shopName: string;
    name: string;
}

export default function TLReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1, limit: 20, totalCount: 0, totalPages: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        sectionId: '',
        rating: '',
        dateFrom: '',
        dateTo: '',
        search: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        // Get user data from session/localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserData({
                shopId: user.shopId,
                shopName: user.shopName || 'Your Shop',
                name: user.name || 'Team Lead'
            });
        }
    }, []);

    const fetchReviews = useCallback(async () => {
        if (!userData?.shopId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', pagination.page.toString());
            params.set('limit', pagination.limit.toString());
            params.set('includeStats', 'true');
            params.set('shopId', userData.shopId); // Filter by TL's shop

            if (filters.sectionId) params.set('sectionId', filters.sectionId);
            if (filters.rating) params.set('rating', filters.rating);
            if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.set('dateTo', filters.dateTo);
            if (filters.search) params.set('search', filters.search);

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
    }, [pagination.page, pagination.limit, filters, userData?.shopId]);

    const fetchSections = async () => {
        try {
            const response = await fetch('/api/sections');
            const data = await response.json();
            if (data.success) setSections(data.data || []);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        if (userData?.shopId) {
            fetchReviews();
        }
    }, [fetchReviews, userData?.shopId]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ sectionId: '', rating: '', dateFrom: '', dateTo: '', search: '' });
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
            <Navbar userRole="TL" userName={userData?.name || 'Team Lead'} />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '8px' }}>
                        Customer Reviews
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                        View customer feedback for {userData?.shopName || 'your shop'}
                    </p>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                            <MessageSquare size={20} style={{ color: 'hsl(var(--color-primary))', marginBottom: '8px' }} />
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.totalReviews}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Total</div>
                        </div>
                        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                            <Star size={20} style={{ color: '#fbbf24', marginBottom: '8px' }} fill="#fbbf24" />
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.avgRating}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Avg Rating</div>
                        </div>
                        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--sla-on-time))' }}>
                                {stats.ratingDistribution[5] + stats.ratingDistribution[4]}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Positive (4-5★)</div>
                        </div>
                        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--sla-overdue))' }}>
                                {stats.ratingDistribution[1] + stats.ratingDistribution[2]}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Negative (1-2★)</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: showFilters ? '16px' : 0 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{
                                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                color: 'hsl(var(--color-text-muted))'
                            }} />
                            <input
                                type="text"
                                placeholder="Search reviews..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
                            />
                        </div>
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
                        >
                            <Filter size={16} />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span style={{
                                    background: showFilters ? 'white' : 'hsl(var(--color-primary))',
                                    color: showFilters ? 'hsl(var(--color-primary))' : 'white',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600
                                }}>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            paddingTop: '16px',
                            borderTop: '1px solid hsl(var(--color-border))'
                        }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Section</label>
                                <select
                                    className="form-input"
                                    value={filters.sectionId}
                                    onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    <option value="">All</option>
                                    {sections.map(section => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Rating</label>
                                <select
                                    className="form-input"
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    <option value="">All</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={clearFilters}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews List */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ width: '32px', height: '32px' }} />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <MessageSquare size={40} style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '12px' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                            No Reviews Found
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                            {activeFiltersCount > 0 ? 'Try adjusting your filters' : 'No customer reviews yet'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {reviews.map((review) => (
                                <div key={review.id} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: `linear-gradient(135deg, ${getRatingColor(review.rating)} 0%, ${getRatingColor(review.rating)}cc 100%)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {review.rating}
                                            </div>
                                            <div>
                                                {renderStars(review.rating)}
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '2px' }}>
                                                    {review.section?.name || 'General'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.6875rem', color: 'hsl(var(--color-text-muted))',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <Clock size={10} />
                                            {formatDate(review.createdAt)}
                                        </div>
                                    </div>

                                    <p style={{
                                        fontSize: '0.875rem', color: 'hsl(var(--color-text-primary))',
                                        lineHeight: 1.5, marginBottom: '12px',
                                        padding: '10px', background: 'hsl(var(--color-bg))', borderRadius: '6px'
                                    }}>
                                        &ldquo;{review.comment}&rdquo;
                                    </p>

                                    {(review.customerName || review.customerPhone || review.customerEmail) && (
                                        <div style={{
                                            display: 'flex', flexWrap: 'wrap', gap: '12px',
                                            fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))'
                                        }}>
                                            {review.customerName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} /> {review.customerName}
                                                </div>
                                            )}
                                            {review.customerPhone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={12} /> {review.customerPhone}
                                                </div>
                                            )}
                                            {review.customerEmail && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} /> {review.customerEmail}
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
                                gap: '12px', marginTop: '20px'
                            }}>
                                <button
                                    className="btn btn-secondary"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--color-text-secondary))' }}>
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
