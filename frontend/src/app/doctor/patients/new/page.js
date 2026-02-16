'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Search, ArrowLeft, User, Pill, Plus } from 'lucide-react';
import Link from 'next/link';

export default function FindPatientPage() {
    const router = useRouter();
    const [patientId, setPatientId] = useState('');
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!patientId.trim()) return;
        setError('');
        setPatient(null);
        setLoading(true);

        try {
            const data = await apiFetch(`/doctor/patients/find/${patientId.trim().toUpperCase()}`);
            setPatient(data);
        } catch (err) {
            setError(err.message || 'Patient not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <Link href="/doctor/patients" className="btn btn-sm btn-secondary mb-2">
                    <ArrowLeft size={16} /> Back
                </Link>
                <h1>Find Patient</h1>
                <p>Enter the patient&apos;s ID to find them and start prescribing</p>
            </div>

            <div className="card" style={{ maxWidth: '560px' }}>
                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                    <span>💡 Ask your patient for their <strong>Patient ID</strong> — they received it when they registered on MedLog.</span>
                </div>

                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <label className="form-label">Patient ID</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                placeholder="e.g. RAJESH-4571"
                                style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <Search size={18} />
                                {loading ? 'Finding...' : 'Search'}
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Patient Found — Show Details */}
            {patient && (
                <div className="card mt-3" style={{ maxWidth: '560px', borderColor: 'var(--accent-200)', borderWidth: '2px' }}>
                    <div className="flex items-center gap-2 mb-2">
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
                            </p>
                        </div>
                    </div>

                    {patient.prescriptions?.length > 0 && (
                        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem' }}>
                            <p className="text-sm" style={{ marginBottom: '0.5rem' }}>
                                <Pill size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                <strong>{patient.prescriptions.filter(p => p.status === 'ACTIVE').length} active medication(s)</strong>
                            </p>
                            {patient.prescriptions.filter(p => p.status === 'ACTIVE').slice(0, 3).map(rx => (
                                <span key={rx.id} className="badge badge-active" style={{ marginRight: '0.25rem', marginBottom: '0.25rem', display: 'inline-block' }}>
                                    {rx.medicationName} {rx.dosage}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-1">
                        <Link href={`/doctor/prescribe/${patient.id}`} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                            <Plus size={16} /> Prescribe Medication
                        </Link>
                        <Link href={`/doctor/patients/${patient.id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            <User size={16} /> View Full Profile
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
