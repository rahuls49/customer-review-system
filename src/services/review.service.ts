import prisma from '@/lib/prisma';
import { TallyWebhookPayload, ParsedTallyReview } from '@/types';

/**
 * Parse the Tally.so webhook payload to extract review data
 */
export function parseTallyPayload(payload: TallyWebhookPayload): ParsedTallyReview | null {
    try {
        const fields = payload.data.fields;

        // Extract fields by label (case-insensitive search)
        const findField = (labels: string[]) => {
            return fields.find(f =>
                labels.some(label =>
                    f.label.toLowerCase().includes(label.toLowerCase())
                )
            );
        };

        const shopField = findField(['shop', 'store', 'location', 'branch']);
        const sectionField = findField(['section', 'department', 'category']);
        const ratingField = findField(['rating', 'star', 'score']);
        const commentField = findField(['comment', 'feedback', 'review', 'message']);
        const nameField = findField(['name', 'customer name']);
        const phoneField = findField(['phone', 'mobile', 'contact']);
        const emailField = findField(['email']);

        // Validate required fields
        if (!shopField?.value || !sectionField?.value || !ratingField?.value) {
            console.error('Missing required fields in Tally payload');
            return null;
        }

        // Parse rating (could be a number or string)
        let rating: number;
        if (typeof ratingField.value === 'number') {
            rating = ratingField.value;
        } else if (typeof ratingField.value === 'string') {
            // Handle cases like "4 stars" or just "4"
            const match = ratingField.value.match(/\d+/);
            rating = match ? parseInt(match[0], 10) : 0;
        } else {
            rating = 0;
        }

        return {
            shopName: String(shopField.value),
            sectionName: String(sectionField.value),
            rating,
            comment: commentField?.value ? String(commentField.value) : '',
            customerName: nameField?.value ? String(nameField.value) : undefined,
            customerPhone: phoneField?.value ? String(phoneField.value) : undefined,
            customerEmail: emailField?.value ? String(emailField.value) : undefined,
            tallySubmissionId: payload.data.submissionId,
        };
    } catch (error) {
        console.error('Error parsing Tally payload:', error);
        return null;
    }
}

/**
 * Store a review from Tally.so webhook
 */
export async function storeReview(reviewData: ParsedTallyReview) {
    // Find or validate the shop
    const shop = await prisma.shop.findFirst({
        where: {
            name: {
                equals: reviewData.shopName,
                mode: 'insensitive',
            },
            isActive: true,
        },
    });

    if (!shop) {
        throw new Error(`Shop not found: ${reviewData.shopName}`);
    }

    // Find or validate the section
    const section = await prisma.section.findFirst({
        where: {
            name: {
                equals: reviewData.sectionName,
                mode: 'insensitive',
            },
            isActive: true,
        },
    });

    if (!section) {
        throw new Error(`Section not found: ${reviewData.sectionName}`);
    }

    // Check if review already exists (prevent duplicates)
    const existingReview = await prisma.review.findFirst({
        where: {
            tallySubmissionId: reviewData.tallySubmissionId,
        },
    });

    if (existingReview) {
        console.log(`Review already exists: ${reviewData.tallySubmissionId}`);
        return existingReview;
    }

    // Create the review
    const review = await prisma.review.create({
        data: {
            tallySubmissionId: reviewData.tallySubmissionId,
            shopId: shop.id,
            sectionId: section.id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            customerName: reviewData.customerName,
            customerPhone: reviewData.customerPhone,
            customerEmail: reviewData.customerEmail,
            isProcessed: false, // Will be processed by cron job
        },
        include: {
            shop: true,
            section: true,
        },
    });

    console.log(`Review stored: ${review.id} - Rating: ${review.rating} - Shop: ${review.shop.name} - Section: ${review.section?.name || 'Unknown'}`);

    return review;
}

/**
 * Get reviews with filters
 */
export async function getReviews(options: {
    shopId?: string;
    sectionId?: string;
    minRating?: number;
    maxRating?: number;
    startDate?: Date;
    endDate?: Date;
    isProcessed?: boolean;
    page?: number;
    pageSize?: number;
}) {
    const {
        shopId,
        sectionId,
        minRating,
        maxRating,
        startDate,
        endDate,
        isProcessed,
        page = 1,
        pageSize = 20,
    } = options;

    const where = {
        ...(shopId && { shopId }),
        ...(sectionId && { sectionId }),
        ...(minRating !== undefined && { rating: { gte: minRating } }),
        ...(maxRating !== undefined && { rating: { lte: maxRating } }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
        ...(isProcessed !== undefined && { isProcessed }),
    };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                shop: true,
                section: true,
                task: {
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.review.count({ where }),
    ]);

    return {
        items: reviews,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Get negative reviews that need to be processed (rating < 4 and not yet processed)
 */
export async function getUnprocessedNegativeReviews() {
    return prisma.review.findMany({
        where: {
            rating: { lt: 4 },
            isProcessed: false,
        },
        include: {
            shop: true,
            section: true,
        },
        orderBy: { createdAt: 'asc' },
    });
}
