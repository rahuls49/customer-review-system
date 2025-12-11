// Type definitions for the Review Management System

// Enums (matches Prisma schema - defined locally to avoid circular dependency)
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TL';
export type TaskStatus = 'PENDING' | 'ON_TIME' | 'DELAYED';
export type SLAStatus = 'ON_TIME' | 'DELAYED' | 'PENDING';

// ============================================
// API Types
// ============================================

export interface TallyWebhookPayload {
    eventId: string;
    eventType: 'FORM_RESPONSE';
    createdAt: string;
    data: {
        responseId: string;
        submissionId: string;
        respondentId: string;
        formId: string;
        formName: string;
        createdAt: string;
        fields: TallyField[];
    };
}

export interface TallyField {
    key: string;
    label: string;
    type: string;
    value: string | number | null;
    options?: { id: string; text: string }[];
}

export interface ParsedTallyReview {
    shopName: string;
    sectionName: string;
    rating: number;
    comment: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    tallySubmissionId: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface ShopMetrics {
    shopId: string;
    shopName: string;
    totalTasks: number;
    onTimeCount: number;
    delayedCount: number;
    pendingCount: number;
    onTimePercentage: number;
    delayedPercentage: number;
    pendingPercentage: number;
}

export interface SectionMetrics {
    sectionId: string;
    sectionName: string;
    totalTasks: number;
    onTimeCount: number;
    delayedCount: number;
    pendingCount: number;
    onTimePercentage: number;
}

export interface TLMetrics {
    userId: string;
    userName: string;
    sections: string[];
    totalTasks: number;
    onTimeCount: number;
    delayedCount: number;
    pendingCount: number;
    averageResolutionTime: number; // in hours
}

export interface GlobalMetrics {
    totalShops: number;
    totalReviews: number;
    totalTasks: number;
    overallOnTimePercentage: number;
    overallDelayedPercentage: number;
    overallPendingPercentage: number;
    shopMetrics: ShopMetrics[];
}

// ============================================
// Task Types
// ============================================

export interface TaskWithDetails {
    id: string;
    status: TaskStatus;
    slaStatus: SLAStatus;
    assignedAt: Date;
    resolvedAt: Date | null;
    remarks: string | null;
    review: {
        id: string;
        rating: number;
        comment: string | null;
        customerName: string | null;
        customerPhone: string | null;
        createdAt: Date;
    };
    shop: {
        id: string;
        name: string;
    };
    section: {
        id: string;
        name: string;
    };
    assignedTo: {
        id: string;
        name: string;
        email: string;
    } | null;
    hoursElapsed: number;
    deadlineStatus: 'within_24h' | 'within_48h' | 'overdue';
}

export interface TaskFilters {
    status?: TaskStatus;
    slaStatus?: SLAStatus;
    sectionId?: string;
    shopId?: string;
    assignedToId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface ResolveTaskInput {
    taskId: string;
    remarks: string;
}

// ============================================
// User Types
// ============================================

export interface UserWithSections {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    shop: {
        id: string;
        name: string;
    } | null;
    sections: {
        id: string;
        name: string;
    }[];
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
