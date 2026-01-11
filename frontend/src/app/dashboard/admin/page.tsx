'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import apiClient from '@/lib/api';
import { PaginatedUsers, UserListItem } from '@/lib/types';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        byRole: { admin: 0, manager: 0, user: 0 },
        byLocation: {} as Record<string, number>,
        byTeam: {} as Record<string, number>
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: PaginatedUsers }>('/users');
            const userData = response.data.data.users;
            setUsers(userData);

            // Calculate statistics
            const total = userData.length;
            const byRole = { admin: 0, manager: 0, user: 0 };
            const byLocation: Record<string, number> = {};
            const byTeam: Record<string, number> = {};

            userData.forEach((u) => {
                // Count by role
                if (u.role.toLowerCase() === 'admin') byRole.admin++;
                else if (u.role.toLowerCase() === 'manager') byRole.manager++;
                else byRole.user++;

                // Count by location
                byLocation[u.location] = (byLocation[u.location] || 0) + 1;

                // Count by team
                byTeam[u.team] = (byTeam[u.team] || 0) + 1;
            });

            setStats({ total, byRole, byLocation, byTeam });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Admin Dashboard">
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
                            <p className="text-sm text-gray-500">Timezone</p>
                            <p className="text-lg font-medium text-gray-900">{user?.location.timezone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Account Status</p>
                            <p className="text-lg font-medium text-green-600">Active</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Member Since</p>
                            <p className="text-lg font-medium text-gray-900">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Total Users</h3>
                        <p className="text-3xl font-bold mt-2">{stats.total}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Admins</h3>
                        <p className="text-3xl font-bold mt-2">{stats.byRole.admin}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Managers</h3>
                        <p className="text-3xl font-bold mt-2">{stats.byRole.manager}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                        <h3 className="text-sm font-medium opacity-90">Users</h3>
                        <p className="text-3xl font-bold mt-2">{stats.byRole.user}</p>
                    </div>
                </div>

                {/* Users by Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Location</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.byLocation).map(([location, count]) => (
                                <div key={location} className="flex justify-between items-center">
                                    <span className="text-gray-700">{location}</span>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Team</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.byTeam).map(([team, count]) => (
                                <div key={team} className="flex justify-between items-center">
                                    <span className="text-gray-700">{team}</span>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* All Users Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {u.full_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.role}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {u.team}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
