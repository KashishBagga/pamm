'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import PatientManagement from '@/components/dashboard/PatientManagement';
import AuditTrail from '@/components/dashboard/AuditTrail';

export default function ManagerDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <DashboardLayout title="Manager Dash">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                    {/* Welcome Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.full_name}!</h1>
                        <p className="text-slate-400 mt-2">Manage your team's patients and secure healthcare records here.</p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <p className="text-sm font-medium text-slate-500 uppercase">Team</p>
                            <p className="text-2xl font-bold text-white mt-1">{user?.team.name}</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <p className="text-sm font-medium text-slate-500 uppercase">Location</p>
                            <p className="text-2xl font-bold text-white mt-1">{user?.location.name}</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                            <p className="text-sm font-medium text-slate-500 uppercase">Role</p>
                            <p className="text-2xl font-bold text-emerald-400 mt-1">{user?.role.display_name}</p>
                        </div>
                    </div>

                    {/* Patient Management Section */}
                    <PatientManagement />

                    {/* Audit Trail Section */}
                    <AuditTrail />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
