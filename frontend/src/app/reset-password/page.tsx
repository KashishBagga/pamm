'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api';

type ResetPasswordForm = {
    new_password: string;
    confirm_password: string;
};

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
    const password = watch('new_password');

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/auth/reset-password', {
                reset_token: token,
                new_password: data.new_password
            });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-indigo-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white">Set new password</h2>
                <p className="mt-2 text-sm text-slate-400">Enter your new password below.</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-4 shadow-xl border border-slate-800 sm:rounded-2xl sm:px-10">
                    {success ? (
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Password reset successful</h3>
                            <p className="text-slate-400 mb-6">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">New Password</label>
                                <input
                                    {...register('new_password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Min 8 characters' }
                                    })}
                                    type="password"
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.new_password && <p className="mt-1 text-xs text-rose-500">{errors.new_password.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                                <input
                                    {...register('confirm_password', {
                                        required: 'Please confirm password',
                                        validate: (v: string) => v === password || 'Passwords do not match'
                                    })}
                                    type="password"
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.confirm_password && <p className="mt-1 text-xs text-rose-500">{errors.confirm_password.message}</p>}
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
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
