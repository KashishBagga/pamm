'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Redirect to appropriate dashboard based on role
                const roleName = user.role.name;
                if (roleName === 'admin') {
                    router.push('/dashboard/admin');
                } else if (roleName === 'manager') {
                    router.push('/dashboard/manager');
                } else {
                    router.push('/dashboard/user');
                }
            } else {
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );
}
