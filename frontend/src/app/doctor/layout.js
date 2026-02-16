'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, getToken, getRole, removeToken, removeRole } from '@/lib/api';
import { Heart, Users, ClipboardList, MessageSquare, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function DoctorLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = getToken();
        const role = getRole();
        if (!token || role !== 'DOCTOR') {
            router.replace('/login');
            return;
        }

        apiFetch('/auth/me')
            .then(data => { setUser(data); setLoading(false); })
            .catch(() => { router.replace('/login'); });
    }, [router]);

    const handleLogout = () => {
        removeToken();
        removeRole();
        router.replace('/login');
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><p>Loading dashboard...</p></div>;
    }

    const navItems = [
        { href: '/doctor', icon: ClipboardList, label: 'Dashboard' },
        { href: '/doctor/patients', icon: Users, label: 'Patients' },
        { href: '/doctor/requests', icon: MessageSquare, label: 'Requests' }
    ];

    return (
        <div className="page-container">
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/doctor" className="navbar-brand">
                        <div className="navbar-brand-icon"><Heart size={20} /></div>
                        <div className="navbar-brand-text">Med<span>Log</span></div>
                    </Link>

                    <div className="navbar-actions">
                        <div className="desktop-only flex items-center gap-2">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`btn btn-sm ${pathname === item.href ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    <item.icon size={16} /> {item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="navbar-user">
                            <span className="navbar-role navbar-role-doctor">Doctor</span>
                            <span className="desktop-only">{user?.doctor?.name}</span>
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={handleLogout} title="Sign out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                {children}
            </main>

            <nav className="mobile-nav">
                <ul className="mobile-nav-items">
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <item.icon size={22} />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button className="mobile-nav-link" onClick={handleLogout}>
                            <LogOut size={22} />
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
