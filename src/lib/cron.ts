import prisma from '@/lib/prisma';
import { getUnprocessedNegativeReviews } from '@/services/review.service';
import { createTaskFromReview, updateOpenTasksSLA } from '@/services/task.service';

/**
 * Daily Task Assignment Cron Job
 * Runs at 9:00 AM daily (configurable via CRON_SCHEDULE env var)
 * 
 * This job:
 * 1. Fetches all unprocessed negative reviews (rating < 4)
 * 2. Creates tasks for each review
 * 3. Assigns tasks to the TL responsible for the section
 * 4. Starts the SLA timer (assignedAt = now)
 */
export async function runDailyTaskAssignment(): Promise<{
    success: boolean;
    reviewsProcessed: number;
    tasksCreated: number;
    errors: string[];
}> {
    console.log('🕘 Starting daily task assignment cron job...');

    const startTime = new Date();
    const errors: string[] = [];
    let reviewsProcessed = 0;
    let tasksCreated = 0;

    try {
        // Get all unprocessed negative reviews
        const negativeReviews = await getUnprocessedNegativeReviews();
        console.log(`📋 Found ${negativeReviews.length} unprocessed negative reviews`);

        // Process each review
        for (const review of negativeReviews) {
            try {
                const task = await createTaskFromReview(review.id);
                reviewsProcessed++;

                if (task) {
                    tasksCreated++;
                    console.log(`✅ Task created for review ${review.id} - Assigned to: ${task.assignedTo?.name || 'Unassigned'}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to process review ${review.id}: ${errorMessage}`);
                console.error(`❌ Error processing review ${review.id}:`, errorMessage);
            }
        }

        // Log the cron job execution
        await prisma.cronJobLog.create({
            data: {
                jobName: 'DAILY_TASK_ASSIGNMENT',
                status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
                message: errors.length > 0 ? errors.join('\n') : null,
                reviewsProcessed,
                tasksCreated,
                startedAt: startTime,
                completedAt: new Date(),
            },
        });

        console.log(`✨ Daily task assignment completed: ${tasksCreated} tasks created from ${reviewsProcessed} reviews`);

        return {
            success: errors.length === 0,
            reviewsProcessed,
            tasksCreated,
            errors,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log the failed cron job
        await prisma.cronJobLog.create({
            data: {
                jobName: 'DAILY_TASK_ASSIGNMENT',
                status: 'FAILED',
                message: errorMessage,
                reviewsProcessed: 0,
                tasksCreated: 0,
                startedAt: startTime,
                completedAt: new Date(),
            },
        });

        console.error('❌ Daily task assignment failed:', errorMessage);

        return {
            success: false,
            reviewsProcessed: 0,
            tasksCreated: 0,
            errors: [errorMessage],
        };
    }
}

/**
 * SLA Update Cron Job
 * Runs every hour to update SLA status for open tasks
 * 
 * This ensures tasks that have been open > 48 hours are marked as PENDING (Black)
 */
export async function runSLAUpdate(): Promise<{
    success: boolean;
    tasksUpdated: number;
}> {
    console.log('🔄 Starting SLA update cron job...');

    try {
        const tasksUpdated = await updateOpenTasksSLA();

        console.log(`✅ SLA update completed: ${tasksUpdated} tasks checked`);

        return {
            success: true,
            tasksUpdated,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ SLA update failed:', errorMessage);

        return {
            success: false,
            tasksUpdated: 0,
        };
    }
}

/**
 * Get recent cron job logs
 */
export async function getCronJobLogs(limit: number = 20) {
    return prisma.cronJobLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
    });
}
