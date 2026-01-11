'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ManagerDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['manager']}>
            <DashboardLayout title="Manager Dashboard">
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

                {/* Manager Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Your Role</h3>
                        <p className="text-2xl font-bold mt-2">{user?.role.display_name}</p>
                        <p className="text-sm mt-2 opacity-90">{user?.role.description}</p>
                    </div>

                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Your Team</h3>
                        <p className="text-2xl font-bold mt-2">{user?.team.name}</p>
                        <p className="text-sm mt-2 opacity-90">{user?.team.code}</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Your Location</h3>
                        <p className="text-2xl font-bold mt-2">{user?.location.name}</p>
                        <p className="text-sm mt-2 opacity-90">{user?.location.code}</p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Manager Capabilities</h3>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <p className="font-medium text-gray-900">Team Management</p>
                                <p className="text-sm text-gray-500">Oversee team members and their activities</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <p className="font-medium text-gray-900">Access Control</p>
                                <p className="text-sm text-gray-500">Manage permissions within your team</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <p className="font-medium text-gray-900">Reporting</p>
                                <p className="text-sm text-gray-500">Generate and view team reports</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
