'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    ClipboardList,
    BarChart3,
    Settings,
    LogOut,
    User,
    Bell,
    ChevronDown,
    MessageSquare
} from 'lucide-react';

interface NavbarProps {
    userRole: 'SUPERADMIN' | 'ADMIN' | 'TL';
    userName: string;
    shopName?: string;
}

export function Navbar({ userRole, userName, shopName }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        // In production, this would call the auth API to invalidate the session
        // For now, redirect to login page
        router.push('/login');
    };

    const getNavLinks = () => {
        switch (userRole) {
            case 'SUPERADMIN':
                return [
                    { href: '/dashboard/superadmin', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/dashboard/superadmin/shops', label: 'Shops', icon: Store },
                    { href: '/dashboard/superadmin/reviews', label: 'Reviews', icon: MessageSquare },
                    { href: '/dashboard/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
                    { href: '/dashboard/superadmin/settings', label: 'Settings', icon: Settings },
                ];
            case 'ADMIN':
                return [
                    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/dashboard/admin/tasks', label: 'Tasks', icon: ClipboardList },
                    { href: '/dashboard/admin/team', label: 'Team', icon: User },
                    { href: '/dashboard/admin/reviews', label: 'Reviews', icon: MessageSquare },
                    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
                ];
            case 'TL':
                return [
                    { href: '/dashboard/tl', label: 'My Tasks', icon: ClipboardList },
                    { href: '/dashboard/tl/reviews', label: 'Reviews', icon: MessageSquare },
                    { href: '/dashboard/tl/analytics', label: 'My Performance', icon: BarChart3 },
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks();
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    const getRoleLabel = () => {
        switch (userRole) {
            case 'SUPERADMIN': return 'Super Admin';
            case 'ADMIN': return 'Shop Admin';
            case 'TL': return 'Team Leader';
            default: return userRole;
        }
    };

    return (
        <nav className="nav">
            <div className="nav-container">
                <Link href="/" className="nav-brand">
                    <div className="nav-brand-icon">
                        <ClipboardList size={18} />
                    </div>
                    <span>ReviewTrack</span>
                </Link>

                <div className="nav-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'nav-link--active' : ''}`}
                        >
                            <link.icon size={16} style={{ marginRight: '6px', display: 'inline' }} />
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="nav-user">
                    <button className="btn btn-ghost" style={{ padding: '8px' }}>
                        <Bell size={18} />
                    </button>

                    {/* User Dropdown */}
                    <div className="nav-dropdown" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-md)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--color-bg-tertiary))'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--color-text-primary))' }}>
                                    {userName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                                    {shopName || getRoleLabel()}
                                </div>
                            </div>
                            <div className="nav-user-avatar">{initials}</div>
                            <ChevronDown
                                size={16}
                                style={{
                                    color: 'hsl(var(--color-text-muted))',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s'
                                }}
                            />
                        </button>

                        <div className={`nav-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                            <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid hsl(var(--color-border))' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--color-text-primary))' }}>
                                    {userName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                                    {getRoleLabel()}
                                </div>
                            </div>

                            <div style={{ padding: 'var(--spacing-xs) 0' }}>
                                <button className="nav-dropdown-item">
                                    <User size={16} />
                                    Profile Settings
                                </button>
                                <button className="nav-dropdown-item">
                                    <Settings size={16} />
                                    Preferences
                                </button>
                            </div>

                            <div className="nav-dropdown-divider" />

                            <div style={{ padding: 'var(--spacing-xs) 0' }}>
                                <button
                                    className="nav-dropdown-item nav-dropdown-item--danger"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
