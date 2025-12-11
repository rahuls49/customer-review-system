import prisma from '@/lib/prisma';
import { GlobalMetrics, ShopMetrics, SectionMetrics, TLMetrics } from '@/types';
import { differenceInHours } from 'date-fns';

/**
 * Calculate percentage safely (avoid division by zero)
 */
function calcPercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 10) / 10;
}

/**
 * Get global analytics for Superadmin dashboard
 */
export async function getGlobalAnalytics(): Promise<GlobalMetrics> {
    // Get all shops with their task counts
    const shops = await prisma.shop.findMany({
        where: { isActive: true },
        include: {
            tasks: true,
            _count: {
                select: {
                    reviews: true,
                    tasks: true,
                },
            },
        },
    });

    // Calculate shop-level metrics
    const shopMetrics: ShopMetrics[] = shops.map(shop => {
        const tasks = shop.tasks;
        const totalTasks = tasks.length;
        const onTimeCount = tasks.filter(t => t.slaStatus === 'ON_TIME').length;
        const delayedCount = tasks.filter(t => t.slaStatus === 'DELAYED').length;
        const pendingCount = tasks.filter(t => t.slaStatus === 'PENDING').length;

        return {
            shopId: shop.id,
            shopName: shop.name,
            totalTasks,
            onTimeCount,
            delayedCount,
            pendingCount,
            onTimePercentage: calcPercentage(onTimeCount, totalTasks),
            delayedPercentage: calcPercentage(delayedCount, totalTasks),
            pendingPercentage: calcPercentage(pendingCount, totalTasks),
        };
    });

    // Calculate global totals
    const totalShops = shops.length;
    const totalReviews = shops.reduce((sum, shop) => sum + shop._count.reviews, 0);
    const totalTasks = shopMetrics.reduce((sum, shop) => sum + shop.totalTasks, 0);
    const totalOnTime = shopMetrics.reduce((sum, shop) => sum + shop.onTimeCount, 0);
    const totalDelayed = shopMetrics.reduce((sum, shop) => sum + shop.delayedCount, 0);
    const totalPending = shopMetrics.reduce((sum, shop) => sum + shop.pendingCount, 0);

    return {
        totalShops,
        totalReviews,
        totalTasks,
        overallOnTimePercentage: calcPercentage(totalOnTime, totalTasks),
        overallDelayedPercentage: calcPercentage(totalDelayed, totalTasks),
        overallPendingPercentage: calcPercentage(totalPending, totalTasks),
        shopMetrics,
    };
}

/**
 * Get shop-level analytics for Admin dashboard
 */
export async function getShopAnalytics(shopId: string): Promise<{
    shop: { id: string; name: string };
    totalTasks: number;
    onTimePercentage: number;
    delayedPercentage: number;
    pendingPercentage: number;
    sectionMetrics: SectionMetrics[];
    tlMetrics: TLMetrics[];
}> {
    // Get shop details
    const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, name: true },
    });

    if (!shop) {
        throw new Error(`Shop not found: ${shopId}`);
    }

    // Get all tasks for this shop
    const tasks = await prisma.task.findMany({
        where: { shopId },
        include: {
            section: true,
            assignedTo: true,
        },
    });

    // Calculate overall metrics
    const totalTasks = tasks.length;
    const onTimeCount = tasks.filter(t => t.slaStatus === 'ON_TIME').length;
    const delayedCount = tasks.filter(t => t.slaStatus === 'DELAYED').length;
    const pendingCount = tasks.filter(t => t.slaStatus === 'PENDING').length;

    // Group by section
    const sectionMap = new Map<string, typeof tasks>();
    tasks.forEach(task => {
        const existing = sectionMap.get(task.sectionId) || [];
        existing.push(task);
        sectionMap.set(task.sectionId, existing);
    });

    const sectionMetrics: SectionMetrics[] = [];
    for (const [sectionId, sectionTasks] of sectionMap) {
        const section = sectionTasks[0].section;
        const total = sectionTasks.length;
        const onTime = sectionTasks.filter(t => t.slaStatus === 'ON_TIME').length;
        const delayed = sectionTasks.filter(t => t.slaStatus === 'DELAYED').length;
        const pending = sectionTasks.filter(t => t.slaStatus === 'PENDING').length;

        sectionMetrics.push({
            sectionId,
            sectionName: section.name,
            totalTasks: total,
            onTimeCount: onTime,
            delayedCount: delayed,
            pendingCount: pending,
            onTimePercentage: calcPercentage(onTime, total),
        });
    }

    // Group by TL
    const tlMap = new Map<string, typeof tasks>();
    tasks.filter(t => t.assignedToId).forEach(task => {
        const existing = tlMap.get(task.assignedToId!) || [];
        existing.push(task);
        tlMap.set(task.assignedToId!, existing);
    });

    // Get TL user details with their sections
    const tlIds = Array.from(tlMap.keys());
    const tlUsers = await prisma.user.findMany({
        where: { id: { in: tlIds } },
        include: {
            userSections: {
                where: { shopId },
                include: {
                    section: true,
                },
            },
        },
    });

    const tlMetrics: TLMetrics[] = tlUsers.map(tl => {
        const tlTasks = tlMap.get(tl.id) || [];
        const total = tlTasks.length;
        const onTime = tlTasks.filter(t => t.slaStatus === 'ON_TIME').length;
        const delayed = tlTasks.filter(t => t.slaStatus === 'DELAYED').length;
        const pending = tlTasks.filter(t => t.slaStatus === 'PENDING').length;

        // Calculate average resolution time for resolved tasks
        const resolvedTasks = tlTasks.filter(t => t.resolvedAt);
        const avgResolutionTime = resolvedTasks.length > 0
            ? resolvedTasks.reduce((sum, t) => {
                return sum + differenceInHours(t.resolvedAt!, t.assignedAt);
            }, 0) / resolvedTasks.length
            : 0;

        return {
            userId: tl.id,
            userName: tl.name,
            sections: tl.userSections.map(us => us.section.name),
            totalTasks: total,
            onTimeCount: onTime,
            delayedCount: delayed,
            pendingCount: pending,
            averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        };
    });

    return {
        shop,
        totalTasks,
        onTimePercentage: calcPercentage(onTimeCount, totalTasks),
        delayedPercentage: calcPercentage(delayedCount, totalTasks),
        pendingPercentage: calcPercentage(pendingCount, totalTasks),
        sectionMetrics,
        tlMetrics,
    };
}

/**
 * Get TL-specific analytics
 */
export async function getTLAnalytics(userId: string): Promise<TLMetrics & {
    recentTasks: Awaited<ReturnType<typeof import('./task.service').getTasks>>['items'];
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userSections: {
                include: {
                    section: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error(`User not found: ${userId}`);
    }

    const tasks = await prisma.task.findMany({
        where: { assignedToId: userId },
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
        take: 20, // Recent 20 tasks
    });

    const totalTasks = tasks.length;
    const onTimeCount = tasks.filter(t => t.slaStatus === 'ON_TIME').length;
    const delayedCount = tasks.filter(t => t.slaStatus === 'DELAYED').length;
    const pendingCount = tasks.filter(t => t.slaStatus === 'PENDING').length;

    // Calculate average resolution time
    const resolvedTasks = tasks.filter(t => t.resolvedAt);
    const avgResolutionTime = resolvedTasks.length > 0
        ? resolvedTasks.reduce((sum, t) => {
            return sum + differenceInHours(t.resolvedAt!, t.assignedAt);
        }, 0) / resolvedTasks.length
        : 0;

    // Add computed fields to tasks
    const recentTasks = tasks.map(task => ({
        ...task,
        hoursElapsed: differenceInHours(new Date(), task.assignedAt),
        deadlineStatus: task.resolvedAt
            ? ('resolved' as const)
            : differenceInHours(new Date(), task.assignedAt) <= 24
                ? ('within_24h' as const)
                : differenceInHours(new Date(), task.assignedAt) <= 48
                    ? ('within_48h' as const)
                    : ('overdue' as const),
    }));

    return {
        userId: user.id,
        userName: user.name,
        sections: user.userSections.map(us => us.section.name),
        totalTasks,
        onTimeCount,
        delayedCount,
        pendingCount,
        averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        recentTasks: recentTasks as unknown as Awaited<ReturnType<typeof import('./task.service').getTasks>>['items'],
    };
}

/**
 * Get review trends over time (for charts)
 */
export async function getReviewTrends(options: {
    shopId?: string;
    days?: number;
}) {
    const { shopId, days = 30 } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await prisma.review.findMany({
        where: {
            createdAt: { gte: startDate },
            ...(shopId && { shopId }),
        },
        select: {
            id: true,
            rating: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData = new Map<string, { positive: number; negative: number }>();

    reviews.forEach(review => {
        const dateKey = review.createdAt.toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { positive: 0, negative: 0 };

        if (review.rating >= 4) {
            existing.positive++;
        } else {
            existing.negative++;
        }

        dailyData.set(dateKey, existing);
    });

    return Array.from(dailyData.entries()).map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.positive + counts.negative,
    }));
}
