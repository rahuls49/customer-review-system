import prisma from '@/lib/prisma';
import { TaskStatus, SLAStatus } from '@prisma/client';
import { TaskWithDetails, TaskFilters, ResolveTaskInput } from '@/types';
import { differenceInHours } from 'date-fns';

/**
 * Calculate the SLA status based on hours elapsed since assignment
 */
export function calculateSLAStatus(assignedAt: Date, resolvedAt?: Date | null): SLAStatus {
    const now = resolvedAt || new Date();
    const hoursElapsed = differenceInHours(now, assignedAt);

    if (resolvedAt) {
        // Task is resolved - determine final SLA status
        if (hoursElapsed <= 24) {
            return 'ON_TIME'; // Green: Resolved within 0-24 hours
        } else if (hoursElapsed <= 48) {
            return 'DELAYED'; // Red: Resolved between 24-48 hours
        } else {
            return 'DELAYED'; // Still delayed even if resolved after 48h
        }
    } else {
        // Task is still open
        if (hoursElapsed > 48) {
            return 'PENDING'; // Black: Open for > 48 hours
        }
        return 'PENDING'; // Still pending
    }
}

/**
 * Get deadline status for display purposes
 */
export function getDeadlineStatus(assignedAt: Date): 'within_24h' | 'within_48h' | 'overdue' {
    const hoursElapsed = differenceInHours(new Date(), assignedAt);

    if (hoursElapsed <= 24) {
        return 'within_24h';
    } else if (hoursElapsed <= 48) {
        return 'within_48h';
    } else {
        return 'overdue';
    }
}

/**
 * Create a task from a review (called by cron job)
 */
export async function createTaskFromReview(reviewId: string) {
    // Get the review with shop and section info
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            shop: true,
            section: true,
        },
    });

    if (!review) {
        throw new Error(`Review not found: ${reviewId}`);
    }

    if (review.rating >= 4) {
        console.log(`Skipping positive review: ${reviewId} (rating: ${review.rating})`);
        return null;
    }

    // Find the TL assigned to this section in this shop
    const userSection = await prisma.userSection.findFirst({
        where: {
            shopId: review.shopId,
            sectionId: review.sectionId,
            user: {
                role: 'TL',
                isActive: true,
            },
        },
        include: {
            user: true,
        },
    });

    const assignedToId = userSection?.userId || null;

    // Create the task
    const task = await prisma.task.create({
        data: {
            reviewId: review.id,
            shopId: review.shopId,
            sectionId: review.sectionId,
            assignedToId,
            status: 'PENDING',
            slaStatus: 'PENDING',
            assignedAt: new Date(),
        },
        include: {
            review: true,
            shop: true,
            section: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // Mark the review as processed
    await prisma.review.update({
        where: { id: reviewId },
        data: { isProcessed: true },
    });

    console.log(`Task created: ${task.id} - Assigned to: ${task.assignedTo?.name || 'Unassigned'}`);

    return task;
}

/**
 * Get tasks with filters
 */
export async function getTasks(filters: TaskFilters & { page?: number; pageSize?: number }) {
    const {
        status,
        slaStatus,
        sectionId,
        shopId,
        assignedToId,
        startDate,
        endDate,
        page = 1,
        pageSize = 20,
    } = filters;

    const where = {
        ...(status && { status }),
        ...(slaStatus && { slaStatus }),
        ...(sectionId && { sectionId }),
        ...(shopId && { shopId }),
        ...(assignedToId && { assignedToId }),
        ...(startDate && { assignedAt: { gte: startDate } }),
        ...(endDate && { assignedAt: { lte: endDate } }),
    };

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            include: {
                review: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        customerName: true,
                        customerPhone: true,
                        createdAt: true,
                    },
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                section: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.task.count({ where }),
    ]);

    // Add computed fields
    const tasksWithDetails: TaskWithDetails[] = tasks.map(task => ({
        ...task,
        hoursElapsed: differenceInHours(new Date(), task.assignedAt),
        deadlineStatus: getDeadlineStatus(task.assignedAt),
    }));

    return {
        items: tasksWithDetails,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<TaskWithDetails | null> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            review: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    customerName: true,
                    customerPhone: true,
                    createdAt: true,
                },
            },
            shop: {
                select: {
                    id: true,
                    name: true,
                },
            },
            section: {
                select: {
                    id: true,
                    name: true,
                },
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!task) return null;

    return {
        ...task,
        hoursElapsed: differenceInHours(new Date(), task.assignedAt),
        deadlineStatus: getDeadlineStatus(task.assignedAt),
    };
}

/**
 * Resolve a task (mark as action taken)
 */
export async function resolveTask(input: ResolveTaskInput) {
    const { taskId, remarks } = input;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });

    if (!task) {
        throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'PENDING') {
        throw new Error(`Task already resolved: ${taskId}`);
    }

    const resolvedAt = new Date();
    const slaStatus = calculateSLAStatus(task.assignedAt, resolvedAt);
    const status: TaskStatus = slaStatus === 'ON_TIME' ? 'ON_TIME' : 'DELAYED';

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            status,
            slaStatus,
            resolvedAt,
            remarks,
        },
        include: {
            review: true,
            shop: true,
            section: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    console.log(`Task resolved: ${taskId} - SLA Status: ${slaStatus}`);

    return updatedTask;
}

/**
 * Update SLA status for all open tasks (called periodically)
 * This ensures tasks that have been open > 48 hours are marked correctly
 */
export async function updateOpenTasksSLA() {
    const pendingTasks = await prisma.task.findMany({
        where: {
            status: 'PENDING',
        },
    });

    for (const task of pendingTasks) {
        const newSlaStatus = calculateSLAStatus(task.assignedAt);

        if (task.slaStatus !== newSlaStatus) {
            await prisma.task.update({
                where: { id: task.id },
                data: { slaStatus: newSlaStatus },
            });
        }
    }

    return pendingTasks.length;
}
