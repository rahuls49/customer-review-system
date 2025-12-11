import { NextRequest, NextResponse } from 'next/server';
import { parseTallyPayload, storeReview } from '@/services/review.service';
import { TallyWebhookPayload } from '@/types';

/**
 * POST /api/webhooks/tally
 * 
 * Webhook endpoint to receive reviews from Tally.so
 * 
 * Expected payload structure from Tally.so:
 * {
 *   eventId: string,
 *   eventType: "FORM_RESPONSE",
 *   createdAt: string,
 *   data: {
 *     responseId: string,
 *     submissionId: string,
 *     respondentId: string,
 *     formId: string,
 *     formName: string,
 *     createdAt: string,
 *     fields: [
 *       { key: "question_xxx", label: "Shop", type: "DROPDOWN_V2", value: "Store A" },
 *       { key: "question_yyy", label: "Section", type: "DROPDOWN_V2", value: "Men Casual" },
 *       { key: "question_zzz", label: "Rating", type: "RATING", value: 3 },
 *       { key: "question_aaa", label: "Comment", type: "LONG_TEXT", value: "..." },
 *       { key: "question_bbb", label: "Name", type: "INPUT_TEXT", value: "John" },
 *       { key: "question_ccc", label: "Phone", type: "INPUT_PHONE_NUMBER", value: "+91..." },
 *     ]
 *   }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Optional: Verify webhook signature
        const webhookSecret = process.env.TALLY_WEBHOOK_SECRET;
        if (webhookSecret) {
            const signature = request.headers.get('tally-signature');
            // Note: Tally.so may not send signatures. Implement if needed.
            // For now, we'll skip signature verification
        }

        // Parse the payload
        const payload: TallyWebhookPayload = await request.json();

        console.log('📨 Received Tally webhook:', {
            eventId: payload.eventId,
            eventType: payload.eventType,
            submissionId: payload.data?.submissionId,
        });

        // Validate event type
        if (payload.eventType !== 'FORM_RESPONSE') {
            console.log('⏭️ Ignoring non-form-response event:', payload.eventType);
            return NextResponse.json(
                { success: true, message: 'Event type ignored' },
                { status: 200 }
            );
        }

        // Parse the Tally payload
        const reviewData = parseTallyPayload(payload);

        if (!reviewData) {
            console.error('❌ Failed to parse Tally payload');
            return NextResponse.json(
                { success: false, error: 'Invalid payload structure' },
                { status: 400 }
            );
        }

        console.log('📝 Parsed review data:', {
            shop: reviewData.shopName,
            section: reviewData.sectionName,
            rating: reviewData.rating,
            customerName: reviewData.customerName,
        });

        // Store the review
        const review = await storeReview(reviewData);

        console.log('✅ Review stored successfully:', {
            reviewId: review.id,
            rating: review.rating,
            willCreateTask: review.rating < 4,
        });

        return NextResponse.json({
            success: true,
            data: {
                reviewId: review.id,
                rating: review.rating,
                isNegative: review.rating < 4,
                message: review.rating < 4
                    ? 'Review stored. Task will be created during next cron run.'
                    : 'Positive review stored. No task required.',
            },
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal server error';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/tally
 * 
 * Health check endpoint for the webhook
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Tally webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}
