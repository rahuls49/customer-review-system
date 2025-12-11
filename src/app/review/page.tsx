'use client';

import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, AlertCircle, Store, MapPin } from 'lucide-react';

interface Shop {
    id: string;
    name: string;
    city?: string;
}

interface Section {
    id: string;
    name: string;
}

export default function ReviewFormPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        shopId: '',
        sectionId: '',
        rating: 0,
        comment: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
    });

    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const seedRes = await fetch('/api/seed');
            const seedData = await seedRes.json();

            if (seedData.success) {
                setShops(seedData.data.shops.map((s: { id: string; name: string }) => ({
                    id: s.id,
                    name: s.name,
                })));
                setSections(seedData.data.sections || []);
            }
        } catch (err) {
            console.error('Error loading form data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!formData.shopId) {
            setError('Please select a store');
            setSubmitting(false);
            return;
        }

        if (formData.rating === 0) {
            setError('Please select a rating');
            setSubmitting(false);
            return;
        }

        if (formData.comment.length < 10) {
            setError('Please provide more details in your feedback (at least 10 characters)');
            setSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSubmitted(true);
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingLabel = (rating: number) => {
        switch (rating) {
            case 1: return 'Very Poor';
            case 2: return 'Poor';
            case 3: return 'Average';
            case 4: return 'Good';
            case 5: return 'Excellent';
            default: return 'Select rating';
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, hsl(220 60% 97%) 0%, hsl(220 40% 94%) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, hsl(220 60% 97%) 0%, hsl(220 40% 94%) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '48px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, hsl(150 70% 45%) 0%, hsl(150 60% 35%) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={40} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        marginBottom: '12px'
                    }}>
                        Thank You!
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#64748b',
                        marginBottom: '32px',
                        lineHeight: 1.6
                    }}>
                        Your feedback has been submitted successfully. We appreciate you taking the time to share your experience with us.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({
                                shopId: '',
                                sectionId: '',
                                rating: 0,
                                comment: '',
                                customerName: '',
                                customerPhone: '',
                                customerEmail: '',
                            });
                        }}
                        style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, hsl(220 80% 55%) 0%, hsl(220 70% 45%) 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Submit Another Review
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, hsl(220 60% 97%) 0%, hsl(220 40% 94%) 100%)',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, hsl(220 80% 55%) 0%, hsl(220 70% 45%) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Star size={32} color="white" fill="white" />
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        marginBottom: '8px'
                    }}>
                        Share Your Feedback
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#64748b'
                    }}>
                        We value your opinion. Help us improve our service.
                    </p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
                }}>
                    <form onSubmit={handleSubmit}>
                        {/* Store Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                <Store size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                Select Store *
                            </label>
                            <select
                                value={formData.shopId}
                                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '1rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            >
                                <option value="">Choose a store...</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                Section (Optional)
                            </label>
                            <select
                                value={formData.sectionId}
                                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '1rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            >
                                <option value="">Select a section...</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Star Rating */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '12px'
                            }}>
                                Your Rating *
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            transition: 'transform 0.2s'
                                        }}
                                    >
                                        <Star
                                            size={36}
                                            fill={(hoveredRating || formData.rating) >= star ? '#fbbf24' : 'transparent'}
                                            color={(hoveredRating || formData.rating) >= star ? '#fbbf24' : '#d1d5db'}
                                            style={{ transition: 'all 0.2s' }}
                                        />
                                    </button>
                                ))}
                                <span style={{
                                    marginLeft: '12px',
                                    fontSize: '0.875rem',
                                    color: formData.rating > 0 ? '#374151' : '#9ca3af',
                                    fontWeight: 500
                                }}>
                                    {getRatingLabel(hoveredRating || formData.rating)}
                                </span>
                            </div>
                        </div>

                        {/* Comment */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Your Feedback *
                            </label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                placeholder="Please share your experience with us..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '1rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <div style={{
                                fontSize: '0.75rem',
                                color: formData.comment.length >= 10 ? '#10b981' : '#9ca3af',
                                marginTop: '4px'
                            }}>
                                {formData.comment.length}/10 characters minimum
                            </div>
                        </div>

                        {/* Contact Info Section */}
                        <div style={{
                            padding: '20px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '16px'
                            }}>
                                Contact Information (Optional)
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Your Name"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        background: 'white',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                    placeholder="Email"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        background: 'white',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                                <input
                                    type="tel"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    placeholder="Phone"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        background: 'white',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 16px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '12px',
                                color: '#dc2626',
                                fontSize: '0.875rem',
                                marginBottom: '24px'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: submitting
                                    ? '#9ca3af'
                                    : 'linear-gradient(135deg, hsl(220 80% 55%) 0%, hsl(220 70% 45%) 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!submitting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {submitting ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Feedback
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    fontSize: '0.875rem',
                    color: '#9ca3af'
                }}>
                    Your feedback helps us serve you better
                </div>
            </div>
        </div>
    );
}
