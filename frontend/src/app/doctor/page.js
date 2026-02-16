'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Users, Pill, AlertCircle, Plus, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboard() {
    const [doctor, setDoctor] = useState(null);
    const [patients, setPatients] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/auth/me'),
            apiFetch('/doctor/patients'),
            apiFetch('/doctor/change-requests')
        ]).then(([me, pats, reqs]) => {
            setDoctor(me.doctor);
            setPatients(pats);
            setRequests(reqs);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const totalPrescriptions = patients.reduce((acc, p) => acc + (p.prescriptions?.length || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1>Welcome, Dr. {doctor?.name} 👋</h1>
                <p>{doctor?.hospital} · {doctor?.specialization || 'General Practice'}</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary-600)' }}>
                        {patients.length}
                    </div>
                    <div className="stat-label">My Patients</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-600)' }}>
                        {totalPrescriptions}
                    </div>
                    <div className="stat-label">Prescriptions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: pendingRequests.length > 0 ? 'var(--warm-500)' : 'var(--text-muted)' }}>
                        {pendingRequests.length}
                    </div>
                    <div className="stat-label">Pending Requests</div>
                </div>
            </div>

            <div className="grid-2">
                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Link href="/doctor/patients/new" className="btn btn-primary btn-block" style={{ justifyContent: 'flex-start' }}>
                            <Search size={18} /> Find Patient by ID
                        </Link>
                        <Link href="/doctor/patients" className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start' }}>
                            <Search size={18} /> Search Patients
                        </Link>
                        {pendingRequests.length > 0 && (
                            <Link href="/doctor/requests" className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start', borderColor: 'var(--warm-300)', background: 'var(--warm-50)' }}>
                                <AlertCircle size={18} style={{ color: 'var(--warm-500)' }} />
                                View {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Recent Patients */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Patients</h3>
                        <Link href="/doctor/patients" className="btn btn-sm btn-secondary">
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>
                    {patients.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Users size={28} /></div>
                            <h3>No patients yet</h3>
                            <p>Find a patient by their ID to start prescribing</p>
                        </div>
                    ) : (
                        patients.slice(0, 4).map(patient => (
                            <Link href={`/doctor/patients/${patient.id}`} key={patient.id} className="patient-card" style={{ marginBottom: '0.5rem' }}>
                                <div className="patient-card-header">
                                    <div
                                        className="patient-avatar"
                                        style={{ background: `hsl(${patient.name.charCodeAt(0) * 7}, 60%, 55%)` }}
                                    >
                                        {patient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="patient-name">{patient.name}</div>
                                        <div className="patient-id">{patient.uniquePatientId}</div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Pending Change Requests */}
            {pendingRequests.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary-800)' }}>
                        ⚠️ Pending Change Requests
                    </h3>
                    {pendingRequests.slice(0, 3).map(req => (
                        <div key={req.id} className="request-card">
                            <div className="request-card-header">
                                <div>
                                    <strong>{req.patient?.name}</strong>
                                    <span className="text-sm text-muted" style={{ marginLeft: '0.5rem' }}>
                                        {req.prescription?.medicationName}
                                    </span>
                                </div>
                                <span className="badge badge-pending">Pending</span>
                            </div>
                            <div className="request-reason">{req.reason}</div>
                            <div style={{ marginTop: '0.75rem' }}>
                                <Link href="/doctor/requests" className="btn btn-sm btn-primary">Respond</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
