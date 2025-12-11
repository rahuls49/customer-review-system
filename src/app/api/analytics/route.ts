import { NextRequest, NextResponse } from 'next/server';
import { getGlobalAnalytics, getShopAnalytics, getReviewTrends } from '@/services/analytics.service';

/**
 * GET /api/analytics
 * 
 * Get analytics data based on scope
 * 
 * Query parameters:
 * - scope: 'global' | 'shop' (default: 'global')
 * - shopId: required if scope is 'shop'
 * - trends: 'true' to include review trends
 * - days: number of days for trends (default: 30)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const scope = searchParams.get('scope') || 'global';
        const shopId = searchParams.get('shopId');
        const includeTrends = searchParams.get('trends') === 'true';
        const days = parseInt(searchParams.get('days') || '30', 10);

        let analytics;
        let trends;

        if (scope === 'global') {
            analytics = await getGlobalAnalytics();
            if (includeTrends) {
                trends = await getReviewTrends({ days });
            }
        } else if (scope === 'shop') {
            if (!shopId) {
                return NextResponse.json(
                    { success: false, error: 'shopId is required for shop scope' },
                    { status: 400 }
                );
            }
            analytics = await getShopAnalytics(shopId);
            if (includeTrends) {
                trends = await getReviewTrends({ shopId, days });
            }
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid scope. Use "global" or "shop"' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...analytics,
                ...(trends && { trends }),
            },
        });
    } catch (error) {
        console.error('❌ Error fetching analytics:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const status = errorMessage.includes('not found') ? 404 : 500;

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status }
        );
    }
}
