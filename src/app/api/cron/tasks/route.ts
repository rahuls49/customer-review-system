import { NextRequest, NextResponse } from 'next/server';
import { runDailyTaskAssignment, runSLAUpdate, getCronJobLogs } from '@/lib/cron';

/**
 * POST /api/cron/tasks
 * 
 * Manually trigger the daily task assignment cron job
 * This endpoint should be protected and only accessible by admins or automated systems
 * 
 * For production, you should:
 * 1. Use a service like Vercel Cron, AWS EventBridge, or a similar scheduler
 * 2. Protect this endpoint with a secret key
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization (simple secret key check)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.log('⚠️ Unauthorized cron trigger attempt');
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await runDailyTaskAssignment();

        return NextResponse.json({
            success: result.success,
            data: {
                reviewsProcessed: result.reviewsProcessed,
                tasksCreated: result.tasksCreated,
                errors: result.errors,
                executedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('❌ Cron endpoint error:', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/tasks
 * 
 * Get recent cron job execution logs
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const logs = await getCronJobLogs(limit);

        return NextResponse.json({
            success: true,
            data: logs,
        });
    } catch (error) {
        console.error('❌ Error fetching cron logs:', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
