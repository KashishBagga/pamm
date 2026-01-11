'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';

export default function UserDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['user']}>
            <DashboardLayout title="User Dashboard">
                {/* User Details Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="text-lg font-medium text-gray-900">{user?.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="text-lg font-medium text-gray-900">{user?.role.display_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="text-lg font-medium text-gray-900">{user?.location.name} ({user?.location.code})</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Team</p>
                            <p className="text-lg font-medium text-gray-900">{user?.team.name} ({user?.team.code})</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Team Description</p>
                            <p className="text-lg font-medium text-gray-900">{user?.team.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Timezone</p>
                            <p className="text-lg font-medium text-gray-900">{user?.location.timezone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Account Status</p>
                            <p className="text-lg font-medium text-green-600">Active</p>
                        </div>
                    </div>
                </div>

                {/* Profile Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Your Team</h3>
                        <p className="text-2xl font-bold mt-2">{user?.team.name}</p>
                        <p className="text-sm mt-2 opacity-90">{user?.team.description}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Your Location</h3>
                        <p className="text-2xl font-bold mt-2">{user?.location.name}</p>
                        <p className="text-sm mt-2 opacity-90">Timezone: {user?.location.timezone}</p>
                    </div>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                            <p className="text-sm text-gray-500">User ID</p>
                            <p className="text-sm font-mono text-gray-900">{user?.id}</p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                            <p className="text-sm text-gray-500">Member Since</p>
                            <p className="text-sm font-medium text-gray-900">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4">
                            <p className="text-sm text-gray-500">Access Level</p>
                            <p className="text-sm font-medium text-gray-900">{user?.role.display_name} (Level {user?.role.hierarchy_level})</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
