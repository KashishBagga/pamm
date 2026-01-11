/**
 * Patient Management component for the Manager Dashboard.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Upload,
    FileText,
    Search,
    Edit2,
    X,
    Check,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
} from 'lucide-react';
import { patientService } from '@/lib/patient-service';
import { Patient } from '@/lib/types';

export default function PatientManagement() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const limit = 10;

    // Inline Editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await patientService.getPatients(page, limit, search);
            if (response.success) {
                setPatients(response.data);
                setTotal(response.total);
            }
        } catch (err: any) {
            setError('Failed to load patient records');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await patientService.uploadPatients(acceptedFiles[0]);
            if (response.data.success) {
                setSuccess(`Successfully processed ${response.data.processed_count} records.`);
                if (response.data.errors.length > 0) {
                    setError(`Some errors occurred: ${response.data.errors.slice(0, 3).join(', ')}`);
                }
                fetchPatients();
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false
    });

    const handleEdit = (patient: Patient) => {
        setEditingId(patient.id);
        setEditForm({
            first_name: patient.first_name,
            last_name: patient.last_name,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender
        });
    };

    const handleSave = async (id: string) => {
        try {
            await patientService.updatePatient(id, editForm);
            setEditingId(null);
            fetchPatients();
            setSuccess('Patient record updated');
        } catch (err: any) {
            setError('Failed to update patient');
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    Upload Patient Data
                </h2>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                        ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                        {uploading ? (
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        ) : (
                            <FileText className="w-10 h-10 text-slate-500" />
                        )}
                        <p className="text-slate-300">
                            {uploading ? 'Processing file...' : isDragActive ? 'Drop the file here' : 'Drag & drop an Excel file, or click to select'}
                        </p>
                        <p className="text-xs text-slate-500">Supported formats: .xlsx, .xls (Max 10k records)</p>
                    </div>
                </div>

                {success && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4" /> {success}
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}
            </div>

            {/* Management Table Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-400" />
                        Patient Database
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search Patient ID..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                <th className="px-6 py-4">Patient ID</th>
                                <th className="px-6 py-4">First Name</th>
                                <th className="px-6 py-4">Last Name</th>
                                <th className="px-6 py-4">DOB</th>
                                <th className="px-6 py-4">Gender</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(6).fill(0).map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No patient records found</td>
                                </tr>
                            ) : patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-indigo-400">{patient.patient_id}</td>
                                    <td className="px-6 py-4">
                                        {editingId === patient.id ? (
                                            <input
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-full"
                                                value={editForm.first_name}
                                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                            />
                                        ) : patient.first_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === patient.id ? (
                                            <input
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-full"
                                                value={editForm.last_name}
                                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                            />
                                        ) : patient.last_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === patient.id ? (
                                            <input
                                                type="date"
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-full"
                                                value={editForm.date_of_birth}
                                                onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                            />
                                        ) : patient.date_of_birth}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === patient.id ? (
                                            <select
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white w-full"
                                                value={editForm.gender}
                                                onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : patient.gender}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingId === patient.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(patient.id)} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded">
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1 text-rose-400 hover:bg-rose-400/10 rounded">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(patient)} className="p-1 text-slate-400 hover:text-white transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="text-white">{(page - 1) * limit + 1}</span> to <span className="text-white">{Math.min(page * limit, total)}</span> of <span className="text-white">{total}</span> records
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page * limit >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
