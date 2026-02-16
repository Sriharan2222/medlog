'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Plus, Pill, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [tab, setTab] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/doctor/patients/${id}`)
            .then(data => { setPatient(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (!patient) return <div className="empty-state"><h3>Patient not found</h3></div>;

    const filteredPrescriptions = tab === 'all'
        ? patient.prescriptions
        : patient.prescriptions.filter(p => p.status === tab.toUpperCase());

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div>
            <Link href="/doctor/patients" className="btn btn-sm btn-secondary mb-2">
                <ArrowLeft size={16} /> Back to Patients
            </Link>

            {/* Patient Header */}
            <div className="card mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="patient-avatar"
                        style={{
                            background: `hsl(${patient.name.charCodeAt(0) * 7}, 60%, 55%)`,
                            width: '56px',
                            height: '56px',
                            fontSize: '1.25rem'
                        }}
                    >
                        {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ marginBottom: '0.125rem' }}>{patient.name}</h2>
                        <p className="text-sm text-muted" style={{ fontFamily: 'monospace' }}>
                            ID: {patient.uniquePatientId}
                        </p>
                        <p className="text-sm text-muted">
                            {patient.age ? `${patient.age} yrs` : ''} {patient.gender ? `· ${patient.gender}` : ''}
                            {patient.phone ? ` · ${patient.phone}` : ''}
                            {patient.user?.email ? ` · ${patient.user.email}` : ''}
                        </p>
                    </div>
                    <Link href={`/doctor/prescribe/${patient.id}`} className="btn btn-primary">
                        <Plus size={16} /> Prescribe
                    </Link>
                </div>
            </div>

            {/* Prescriptions */}
            <div className="flex justify-between items-center mb-2">
                <h3>Prescriptions ({patient.prescriptions.length})</h3>
            </div>

            <div className="tabs">
                {['all', 'active', 'expired', 'replaced'].map(t => (
                    <button
                        key={t}
                        className={`tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                        {t !== 'all' && ` (${patient.prescriptions.filter(p => p.status === t.toUpperCase()).length})`}
                    </button>
                ))}
            </div>

            {filteredPrescriptions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Pill size={28} /></div>
                    <h3>No {tab !== 'all' ? tab : ''} prescriptions</h3>
                    <Link href={`/doctor/prescribe/${patient.id}`} className="btn btn-primary mt-2">
                        <Plus size={16} /> Add Prescription
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {filteredPrescriptions.map(rx => (
                        <div key={rx.id} className={`prescription-card status-${rx.status.toLowerCase()}`}>
                            <div className="prescription-card-header">
                                <div className="prescription-drug-name">{rx.medicationName}</div>
                                <span className={`badge badge-${rx.status.toLowerCase()}`}>
                                    <span className={`status-dot status-dot-${rx.status.toLowerCase()}`}></span>
                                    {rx.status}
                                </span>
                            </div>
                            <div className="prescription-meta">
                                <div className="prescription-meta-item">
                                    <span className="prescription-meta-label">Dosage</span>
                                    <span className="prescription-meta-value">{rx.dosage}</span>
                                </div>
                                <div className="prescription-meta-item">
                                    <span className="prescription-meta-label">Frequency</span>
                                    <span className="prescription-meta-value">{rx.frequency}</span>
                                </div>
                                <div className="prescription-meta-item">
                                    <span className="prescription-meta-label">Duration</span>
                                    <span className="prescription-meta-value">{rx.duration}</span>
                                </div>
                                <div className="prescription-meta-item">
                                    <span className="prescription-meta-label">Doctor</span>
                                    <span className="prescription-meta-value">{rx.doctor?.name}</span>
                                </div>
                            </div>
                            {rx.notes && (
                                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    Note: {rx.notes}
                                </div>
                            )}
                            <div className="prescription-footer">
                                <span>🏥 {rx.doctor?.hospital}</span>
                                <span>{formatDate(rx.prescribedAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Change Requests */}
            {patient.changeRequests.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>
                        <MessageSquare size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Change Requests ({patient.changeRequests.length})
                    </h3>
                    {patient.changeRequests.map(req => (
                        <div key={req.id} className="request-card">
                            <div className="request-card-header">
                                <span className="text-sm font-bold">{req.prescription?.medicationName}</span>
                                <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                            </div>
                            <div className="request-reason">{req.reason}</div>
                            {req.doctorResponse && (
                                <div className="request-response">
                                    <strong>Doctor&apos;s response:</strong> {req.doctorResponse}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
