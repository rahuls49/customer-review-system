import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/services/task.service';
import { TaskStatus, SLAStatus } from '@prisma/client';

/**
 * GET /api/tasks
 * 
 * Get tasks with optional filters
 * 
 * Query parameters:
 * - status: PENDING | ON_TIME | DELAYED
 * - slaStatus: ON_TIME | DELAYED | PENDING
 * - sectionId: string
 * - shopId: string
 * - assignedToId: string
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - page: number (default: 1)
 * - pageSize: number (default: 20)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const filters = {
            status: searchParams.get('status') as TaskStatus | undefined,
            slaStatus: searchParams.get('slaStatus') as SLAStatus | undefined,
            sectionId: searchParams.get('sectionId') || undefined,
            shopId: searchParams.get('shopId') || undefined,
            assignedToId: searchParams.get('assignedToId') || undefined,
            startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
            endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
            page: parseInt(searchParams.get('page') || '1', 10),
            pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
        };

        const result = await getTasks(filters);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
