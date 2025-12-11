'use client';

// Types (matches Prisma schema)
type SLAStatus = 'ON_TIME' | 'DELAYED' | 'PENDING';
type TaskStatus = 'PENDING' | 'ON_TIME' | 'DELAYED';

import { Filter, Calendar } from 'lucide-react';

interface TaskFiltersProps {
    filters: {
        status?: TaskStatus;
        slaStatus?: SLAStatus;
        sectionId?: string;
        startDate?: string;
        endDate?: string;
    };
    sections: { id: string; name: string }[];
    onFilterChange: (filters: TaskFiltersProps['filters']) => void;
}

export function TaskFilters({ filters, sections, onFilterChange }: TaskFiltersProps) {
    const handleChange = (key: keyof typeof filters, value: string) => {
        onFilterChange({
            ...filters,
            [key]: value || undefined,
        });
    };

    return (
        <div className="filters">
            <div className="filter-group">
                <label className="filter-label">
                    <Filter size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    SLA Status
                </label>
                <select
                    className="form-select"
                    value={filters.slaStatus || ''}
                    onChange={(e) => handleChange('slaStatus', e.target.value as SLAStatus)}
                >
                    <option value="">All Statuses</option>
                    <option value="ON_TIME">On Time (Green)</option>
                    <option value="DELAYED">Delayed (Red)</option>
                    <option value="PENDING">Pending (Black)</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">
                    Section
                </label>
                <select
                    className="form-select"
                    value={filters.sectionId || ''}
                    onChange={(e) => handleChange('sectionId', e.target.value)}
                >
                    <option value="">All Sections</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">
                    <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    Start Date
                </label>
                <input
                    type="date"
                    className="form-input"
                    value={filters.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label className="filter-label">
                    End Date
                </label>
                <input
                    type="date"
                    className="form-input"
                    value={filters.endDate || ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                />
            </div>

            <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                <button
                    className="btn btn-ghost"
                    onClick={() => onFilterChange({})}
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
}
