import { NextRequest, NextResponse } from 'next/server';
import { getTask, resolveTask } from '@/services/task.service';

/**
 * GET /api/tasks/[taskId]
 * 
 * Get a single task by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;

        const task = await getTask(taskId);

        if (!task) {
            return NextResponse.json(
                { success: false, error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: task,
        });
    } catch (error) {
        console.error('❌ Error fetching task:', error);

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/tasks/[taskId]
 * 
 * Resolve a task (mark as action taken)
 * 
 * Body:
 * {
 *   remarks: string (required) - Notes about the action taken
 * }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const body = await request.json();

        // Validate remarks
        if (!body.remarks || typeof body.remarks !== 'string' || body.remarks.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Remarks are required' },
                { status: 400 }
            );
        }

        const updatedTask = await resolveTask({
            taskId,
            remarks: body.remarks.trim(),
        });

        return NextResponse.json({
            success: true,
            data: updatedTask,
            message: `Task resolved with status: ${updatedTask.slaStatus}`,
        });
    } catch (error) {
        console.error('❌ Error resolving task:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const status = errorMessage.includes('not found') ? 404 :
            errorMessage.includes('already resolved') ? 400 : 500;

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status }
        );
    }
}
