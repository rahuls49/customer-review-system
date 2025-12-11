'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StatCard } from '@/components/ui/StatCard';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { TaskFilters } from '@/components/dashboard/TaskFilters';
import { ResolveTaskModal } from '@/components/dashboard/ResolveTaskModal';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

// SLA Status type (matches Prisma schema)
type SLAStatus = 'ON_TIME' | 'DELAYED' | 'PENDING';

// Mock data - In production, this would come from the API
const mockTLData = {
    userId: '1',
    userName: 'Rahul Kumar',
    shopName: 'Downtown Store',
    sections: ['Men Casual', "Men's Formal and Party wear", "Men's Ethnic"],
    totalTasks: 8,
    onTimeCount: 6,
    delayedCount: 1,
    pendingCount: 1,
    averageResolutionTime: 14.5,
    recentTasks: [
        {
            id: 'task-1',
            slaStatus: 'PENDING' as SLAStatus,
            assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
            resolvedAt: null,
            remarks: null,
            review: {
                rating: 2,
                comment: 'Poor quality fabric. The shirt started fading after first wash. Very disappointed with the purchase.',
                customerName: 'Rajesh Verma',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
            },
            shop: { name: 'Downtown Store' },
            section: { name: 'Men Casual' },
            assignedTo: { name: 'Rahul Kumar' },
            hoursElapsed: 12,
            deadlineStatus: 'within_24h' as const,
        },
        {
            id: 'task-2',
            slaStatus: 'PENDING' as SLAStatus,
            assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 hours ago
            resolvedAt: null,
            remarks: null,
            review: {
                rating: 1,
                comment: 'Terrible customer service. Staff was rude and did not help with size exchange.',
                customerName: 'Amit Sharma',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
            },
            shop: { name: 'Downtown Store' },
            section: { name: "Men's Formal and Party wear" },
            assignedTo: { name: 'Rahul Kumar' },
            hoursElapsed: 30,
            deadlineStatus: 'within_48h' as const,
        },
        {
            id: 'task-3',
            slaStatus: 'ON_TIME' as SLAStatus,
            assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 72 hours ago
            resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 60),
            remarks: 'Contacted customer and arranged for a replacement. Customer satisfied with the resolution.',
            review: {
                rating: 3,
                comment: 'Material quality could be better for the price paid.',
                customerName: 'Suresh Patel',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
            },
            shop: { name: 'Downtown Store' },
            section: { name: "Men's Ethnic" },
            assignedTo: { name: 'Rahul Kumar' },
            hoursElapsed: 12,
            deadlineStatus: 'within_24h' as const,
        },
        {
            id: 'task-4',
            slaStatus: 'DELAYED' as SLAStatus,
            assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 100),
            resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 65),
            remarks: 'Issue resolved after coordinating with quality team. Provided store credit to customer.',
            review: {
                rating: 2,
                comment: 'Stitching came undone after just one week. Not acceptable.',
                customerName: 'Vikram Singh',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
            },
            shop: { name: 'Downtown Store' },
            section: { name: 'Men Casual' },
            assignedTo: { name: 'Rahul Kumar' },
            hoursElapsed: 35,
            deadlineStatus: 'within_48h' as const,
        },
    ],
};

const mockSections = [
    { id: '1', name: 'Men Casual' },
    { id: '2', name: "Men's Formal and Party wear" },
    { id: '3', name: "Men's Ethnic" },
];

export default function TLDashboard() {
    const [filters, setFilters] = useState<{
        slaStatus?: SLAStatus;
        sectionId?: string;
        startDate?: string;
        endDate?: string;
    }>({});
    const [selectedTask, setSelectedTask] = useState<typeof mockTLData.recentTasks[0] | null>(null);
    const [tasks, setTasks] = useState(mockTLData.recentTasks);

    const handleResolve = async (taskId: string, remarks: string) => {
        // In production, this would call the API
        console.log('Resolving task:', taskId, remarks);

        // Update local state to show the task as resolved
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const hoursElapsed = task.hoursElapsed;
                return {
                    ...task,
                    slaStatus: (hoursElapsed <= 24 ? 'ON_TIME' : 'DELAYED') as SLAStatus,
                    resolvedAt: new Date(),
                    remarks,
                };
            }
            return task;
        }));

        setSelectedTask(null);
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filters.slaStatus && task.slaStatus !== filters.slaStatus) return false;
        if (filters.sectionId && task.section.name !== mockSections.find(s => s.id === filters.sectionId)?.name) return false;
        return true;
    });

    const pendingTasks = filteredTasks.filter(t => !t.resolvedAt);
    const resolvedTasks = filteredTasks.filter(t => t.resolvedAt);

    return (
        <div style={{ background: 'hsl(var(--color-bg))', minHeight: '100vh' }}>
            <Navbar userRole="TL" userName={mockTLData.userName} shopName={mockTLData.shopName} />

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-primary))', marginBottom: '4px' }}>
                        My Tasks
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
                        Manage your assigned feedback tasks • {mockTLData.sections.join(' • ')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <StatCard
                        title="Total Assigned"
                        value={mockTLData.totalTasks}
                        icon={<Clock size={24} />}
                    />
                    <StatCard
                        title="Resolved On Time"
                        value={mockTLData.onTimeCount}
                        variant="on-time"
                        icon={<CheckCircle size={24} />}
                    />
                    <StatCard
                        title="Delayed"
                        value={mockTLData.delayedCount}
                        variant="delayed"
                        icon={<AlertCircle size={24} />}
                    />
                    <StatCard
                        title="Avg Resolution"
                        value={`${mockTLData.averageResolutionTime}h`}
                        subtitle="Average time"
                        icon={<TrendingUp size={24} />}
                    />
                </div>

                {/* Filters */}
                <TaskFilters
                    filters={filters}
                    sections={mockSections}
                    onFilterChange={setFilters}
                />

                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'hsl(var(--color-text-primary))'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'hsl(var(--color-warning))',
                                animation: 'pulse 2s ease-in-out infinite'
                            }} />
                            Pending Tasks ({pendingTasks.length})
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
                            {pendingTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    showResolveButton
                                    onResolve={() => setSelectedTask(task)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Resolved Tasks */}
                {resolvedTasks.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--color-text-primary))' }}>
                            Recently Resolved ({resolvedTasks.length})
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
                            {resolvedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 style={{ color: 'hsl(var(--color-text-primary))' }}>No tasks found</h3>
                        <p>No tasks match your current filters.</p>
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            {selectedTask && (
                <ResolveTaskModal
                    taskId={selectedTask.id}
                    sectionName={selectedTask.section.name}
                    onClose={() => setSelectedTask(null)}
                    onSubmit={handleResolve}
                />
            )}
        </div>
    );
}
