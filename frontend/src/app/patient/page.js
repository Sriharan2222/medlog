'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Pill, Shield } from 'lucide-react';

export default function PatientDashboard() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [profile, setProfile] = useState(null);
    const [tab, setTab] = useState('ACTIVE');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/patient/prescriptions'),
            apiFetch('/patient/profile')
        ]).then(([rxs, prof]) => {
            setPrescriptions(rxs);
            setProfile(prof);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const filtered = prescriptions.filter(p => p.status === tab);
    const activeMeds = prescriptions.filter(p => p.status === 'ACTIVE');

    return (
        <div>
            <div className="page-header">
                <h1>My Medications 💊</h1>
                <p>
                    Patient ID: <strong style={{ fontFamily: 'monospace' }}>{profile?.uniquePatientId}</strong>
                </p>
            </div>

            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                <Shield size={18} />
                <span>Your prescriptions are <strong>read-only</strong>. Only your doctor can add or update medications.</span>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-600)' }}>{activeMeds.length}</div>
                    <div className="stat-label">Active Medications</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{prescriptions.length}</div>
                    <div className="stat-label">Total Prescriptions</div>
                </div>
            </div>

            <div className="tabs">
                {['ACTIVE', 'EXPIRED', 'REPLACED'].map(t => (
                    <button
                        key={t}
                        className={`tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                        {` (${prescriptions.filter(p => p.status === t).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Pill size={28} /></div>
                    <h3>No {tab.toLowerCase()} medications</h3>
                    <p>
                        {tab === 'ACTIVE'
                            ? 'Your doctor will add prescriptions for you'
                            : `No ${tab.toLowerCase()} prescriptions found`}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {filtered.map(rx => (
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
                                    <span className="prescription-meta-value">Dr. {rx.doctor?.name}</span>
                                </div>
                            </div>
                            {rx.notes && (
                                <div style={{ marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                    📋 {rx.notes}
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
        </div>
    );
}
