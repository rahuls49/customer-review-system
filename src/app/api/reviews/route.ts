import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/reviews
 * Submit a new customer review (public - no auth required)
 * Supports multiple section IDs - creates grouped reviews
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shopId, sectionId, sectionIds, rating, comment, customerName, customerPhone, customerEmail } = body;

        // Support both single sectionId and array sectionIds
        let sectionsToProcess: string[] = [];
        if (sectionIds && Array.isArray(sectionIds) && sectionIds.length > 0) {
            sectionsToProcess = sectionIds;
        } else if (sectionId) {
            sectionsToProcess = [sectionId];
        }

        // Validate required fields
        if (!shopId) {
            return NextResponse.json(
                { success: false, error: 'Shop ID is required' },
                { status: 400 }
            );
        }

        if (sectionsToProcess.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Please select at least one section' },
                { status: 400 }
            );
        }

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (!comment || comment.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: 'Please provide a detailed comment (at least 10 characters)' },
                { status: 400 }
            );
        }

        // Verify shop exists
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
        });

        if (!shop) {
            return NextResponse.json(
                { success: false, error: 'Invalid shop ID' },
                { status: 400 }
            );
        }

        // Verify all sections exist
        const sections = await prisma.section.findMany({
            where: { id: { in: sectionsToProcess } },
        });

        if (sections.length !== sectionsToProcess.length) {
            return NextResponse.json(
                { success: false, error: 'One or more sections are invalid' },
                { status: 400 }
            );
        }

        // Generate a groupId to link related reviews
        const groupId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Create reviews for each section
        const createdReviews = [];
        for (const secId of sectionsToProcess) {
            const review = await prisma.review.create({
                data: {
                    shopId,
                    sectionId: secId,
                    rating: parseInt(rating),
                    comment: comment.trim(),
                    customerName: customerName?.trim() || null,
                    customerPhone: customerPhone?.trim() || null,
                    customerEmail: customerEmail?.trim() || null,
                    tallySubmissionId: sectionsToProcess.length > 1 ? groupId : null, // Use this field to group reviews
                    isProcessed: false,
                },
                include: {
                    shop: { select: { name: true } },
                    section: { select: { name: true } },
                },
            });
            createdReviews.push(review);
        }

        return NextResponse.json({
            success: true,
            message: 'Thank you for your feedback!',
            data: {
                count: createdReviews.length,
                reviews: createdReviews.map(r => ({
                    id: r.id,
                    shopName: r.shop.name,
                    sectionName: r.section?.name,
                    rating: r.rating,
                })),
            },
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Failed to submit review: ${errorMessage}` },
            { status: 500 }
        );
    }
}

/**
 * GET /api/reviews
 * Get reviews with comprehensive filters (for admin dashboard)
 * Filters: shopId, sectionId, rating, isProcessed, dateFrom, dateTo, search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const shopId = searchParams.get('shopId');
        const sectionId = searchParams.get('sectionId');
        const rating = searchParams.get('rating');
        const minRating = searchParams.get('minRating');
        const maxRating = searchParams.get('maxRating');
        const isProcessed = searchParams.get('isProcessed');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build where clause
        const where: Record<string, unknown> = {};

        if (shopId) where.shopId = shopId;
        if (sectionId) where.sectionId = sectionId;

        // Rating filters
        if (rating) {
            where.rating = parseInt(rating);
        } else if (minRating || maxRating) {
            where.rating = {};
            if (minRating) (where.rating as Record<string, number>).gte = parseInt(minRating);
            if (maxRating) (where.rating as Record<string, number>).lte = parseInt(maxRating);
        }

        // Processed filter
        if (isProcessed !== null && isProcessed !== '') {
            where.isProcessed = isProcessed === 'true';
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                (where.createdAt as Record<string, Date>).lte = endDate;
            }
        }

        // Search filter (customer name, email, phone, or comment)
        if (search) {
            where.OR = [
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search } },
                { comment: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count for pagination
        const totalCount = await prisma.review.count({ where });

        // Determine sort field
        const orderBy: Record<string, string> = {};
        if (['createdAt', 'rating', 'customerName'].includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Get reviews
        const reviews = await prisma.review.findMany({
            where,
            include: {
                shop: {
                    select: { id: true, name: true },
                },
                section: {
                    select: { id: true, name: true },
                },
            },
            orderBy,
            skip,
            take: limit,
        });

        // Calculate stats if requested
        const includeStats = searchParams.get('includeStats') === 'true';
        let stats = null;
        if (includeStats) {
            const statsWhere = shopId ? { shopId } : {};
            const allReviews = await prisma.review.findMany({
                where: statsWhere,
                select: { rating: true },
            });

            const totalReviews = allReviews.length;
            const avgRating = totalReviews > 0
                ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;
            const ratingDistribution = {
                1: allReviews.filter(r => r.rating === 1).length,
                2: allReviews.filter(r => r.rating === 2).length,
                3: allReviews.filter(r => r.rating === 3).length,
                4: allReviews.filter(r => r.rating === 4).length,
                5: allReviews.filter(r => r.rating === 5).length,
            };

            stats = {
                totalReviews,
                avgRating: Math.round(avgRating * 10) / 10,
                ratingDistribution,
            };
        }

        return NextResponse.json({
            success: true,
            data: reviews,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            stats,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}
