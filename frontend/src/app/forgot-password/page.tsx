'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api';

type ForgotPasswordForm = {
    email: string;
};

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

    const onSubmit = async (data: ForgotPasswordForm) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/auth/forgot-password', data);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                    <Key className="h-6 w-6 text-indigo-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white">Forgot password?</h2>
                <p className="mt-2 text-sm text-slate-400">No worries, we'll send you reset instructions.</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-4 shadow-xl border border-slate-800 sm:rounded-2xl sm:px-10">
                    {success ? (
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                            <p className="text-slate-400 mb-6">We've sent a password reset link to your email address.</p>
                            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Email address</label>
                                <input
                                    {...register('email', { required: 'Email is required' })}
                                    type="email"
                                    placeholder="Enter your email"
                                    className="mt-1 block w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
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

                            <div className="text-center">
                                <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white inline-flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
