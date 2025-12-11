import { NextRequest, NextResponse } from 'next/server';
import { getTLAnalytics } from '@/services/analytics.service';

/**
 * GET /api/analytics/tl/[userId]
 * 
 * Get TL-specific analytics dashboard data
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const analytics = await getTLAnalytics(userId);

        return NextResponse.json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        console.error('❌ Error fetching TL analytics:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const status = errorMessage.includes('not found') ? 404 : 500;

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status }
        );
    }
}
