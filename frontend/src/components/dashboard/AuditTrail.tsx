/**
 * Audit Trail component for the Manager Dashboard.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock, User as UserIcon, Activity, ExternalLink } from 'lucide-react';
import { patientService } from '@/lib/patient-service';
import { AuditLog } from '@/lib/types';
import { format } from 'date-fns';

export default function AuditTrail() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const response = await patientService.getAuditLogs(page, limit);
                if (response.success) {
                    setLogs(response.data);
                    setTotal(response.total);
                }
            } catch (err) {
                console.error('Failed to load audit logs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [page]);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'UPLOAD': return 'text-indigo-400 bg-indigo-400/10';
            case 'EDIT': return 'text-amber-400 bg-amber-400/10';
            case 'ACCESS': return 'text-emerald-400 bg-emerald-400/10';
            case 'DELETE': return 'text-rose-400 bg-rose-400/10';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Security Audit Trail (PHI Access)
                </h2>
                <p className="text-sm text-slate-400 mt-1">Real-time log of data decryption and record modifications.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No audit records found</td>
                            </tr>
                        ) : logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        Success
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400 italic max-w-xs truncate">
                                    {log.details || 'Decrypted record for viewing'}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                    {log.client_ip || 'Internal'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Pagination */}
            <div className="p-6 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                    Phase 2 Compliance: ACTIVE
                </span>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-30 uppercase font-bold"
                    >
                        Previous
                    </button>
                    <button
                        disabled={page * limit >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-30 uppercase font-bold"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
