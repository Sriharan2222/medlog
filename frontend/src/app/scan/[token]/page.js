'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Heart, Shield, Clock, AlertTriangle } from 'lucide-react';

export default function PublicScanPage() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        fetch(`${apiUrl}/public/patient/${token}`)
            .then(res => {
                if (!res.ok) throw new Error('Patient not found');
                return res.json();
            })
            .then(d => { setData(d); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [token]);

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
                <p>Loading patient medications...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="card text-center">
                    <AlertTriangle size={48} style={{ color: 'var(--warm-500)', margin: '0 auto 1rem' }} />
                    <h2>Patient Not Found</h2>
                    <p className="text-muted mt-1">This QR code may be invalid or expired.</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="public-view" style={{ minHeight: '100vh', paddingTop: '1rem' }}>
            {/* Header */}
            <div className="public-header">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={24} />
                    </div>
                </div>
                <h1>MedLog — Active Medications</h1>
                <p style={{ fontFamily: 'monospace', marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
                    Patient: {data.patientName} · ID: {data.patientId}
                </p>
                {data.age > 0 && (
                    <p style={{ fontSize: '0.8125rem', opacity: 0.7, marginTop: '0.25rem' }}>
                        {data.age} yrs {data.gender ? `· ${data.gender}` : ''}
                    </p>
                )}
            </div>

            {/* Security Notice */}
            <div className="public-notice">
                <Shield size={18} />
                <span>Read-only view · No editing allowed · Scanned via QR code</span>
            </div>

            {data.lastUpdated && (
                <div className="public-notice" style={{ background: 'var(--gray-50)', color: 'var(--text-secondary)' }}>
                    <Clock size={16} />
                    <span>Last updated: {formatDate(data.lastUpdated)}</span>
                </div>
            )}

            {/* Medications */}
            {data.activeMedications.length === 0 ? (
                <div className="card text-center" style={{ padding: '2rem' }}>
                    <h3>No active medications</h3>
                    <p className="text-muted mt-1">This patient currently has no active prescriptions.</p>
                </div>
            ) : (
                <>
                    <h3 style={{ margin: '1rem 0 0.75rem', color: 'var(--primary-800)' }}>
                        💊 {data.activeMedications.length} Active Medication{data.activeMedications.length > 1 ? 's' : ''}
                    </h3>
                    <div className="flex flex-col gap-1">
                        {data.activeMedications.map((rx, i) => (
                            <div key={i} className="prescription-card status-active animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="prescription-card-header">
                                    <div className="prescription-drug-name">{rx.medicationName}</div>
                                    <span className="badge badge-active">
                                        <span className="status-dot status-dot-active"></span>
                                        Active
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
                                        <span className="prescription-meta-label">Prescribed by</span>
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
                </>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '2rem 1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Heart size={16} style={{ color: 'var(--primary-500)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>MedLog</span>
                </div>
                <p className="text-sm text-muted">Secure Medication Logger · For authorized use only</p>
            </div>
        </div>
    );
}
