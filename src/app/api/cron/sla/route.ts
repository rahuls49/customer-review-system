import { NextRequest, NextResponse } from 'next/server';
import { runSLAUpdate } from '@/lib/cron';

/**
 * POST /api/cron/sla
 * 
 * Trigger SLA status update for all open tasks
 * This should run hourly to ensure tasks > 48 hours are marked correctly
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await runSLAUpdate();

        return NextResponse.json({
            success: result.success,
            data: {
                tasksUpdated: result.tasksUpdated,
                executedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('❌ SLA cron endpoint error:', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
