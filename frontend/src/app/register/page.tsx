'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api';

type RegisterForm = {
    email: string;
    full_name: string;
    password: string;
    role_id: string;
    location_id: string;
    team_id: string;
};

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [config, setConfig] = useState<{
        roles: any[];
        locations: any[];
        teams: any[];
    }>({ roles: [], locations: [], teams: [] });

    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [roles, locations, teams] = await Promise.all([
                    apiClient.get('/users/roles'),
                    apiClient.get('/users/locations'),
                    apiClient.get('/users/teams'),
                ]);
                setConfig({
                    roles: roles.data.data,
                    locations: locations.data.data,
                    teams: teams.data.data,
                });
            } catch (err) {
                console.error('Failed to fetch config:', err);
            }
        };
        fetchConfig();
    }, []);

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/auth/register', data);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-slate-400 mb-6">Your account has been created. Redirecting to login...</p>
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                        Click here if you aren't redirected
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-4 shadow-xl border border-slate-800 sm:rounded-2xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Full Name</label>
                            <input
                                {...register('full_name', { required: 'Name is required' })}
                                className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.full_name && <p className="mt-1 text-xs text-rose-500">{errors.full_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Email address</label>
                            <input
                                {...register('email', { required: 'Email is required' })}
                                type="email"
                                className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <input
                                {...register('password', { required: 'Password is required', minLength: 8 })}
                                type="password"
                                className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.password && <p className="mt-1 text-xs text-rose-500">Min 8 characters required</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Role</label>
                                <select
                                    {...register('role_id', { required: true })}
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select Role</option>
                                    {config.roles.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.display_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300">Location</label>
                                <select
                                    {...register('location_id', { required: true })}
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select Location</option>
                                    {config.locations.map((l: any) => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300">Team</label>
                                <select
                                    {...register('team_id', { required: true })}
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select Team</option>
                                    {config.teams.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
