'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Check, Pill } from 'lucide-react';
import Link from 'next/link';

export default function PrescribePage() {
    const { patientId } = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
    });

    useEffect(() => {
        apiFetch(`/doctor/patients/${patientId}`)
            .then(data => { setPatient(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [patientId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await apiFetch('/doctor/prescriptions', {
                method: 'POST',
                body: JSON.stringify({ ...form, patientId })
            });
            setSuccess(true);
            setTimeout(() => router.push(`/doctor/patients/${patientId}`), 1500);
        } catch (err) {
            setError(err.message || 'Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    if (success) {
        return (
            <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Check size={32} style={{ color: 'var(--accent-600)' }} />
                </div>
                <h2>Prescription Created!</h2>
                <p className="text-muted mt-1">
                    {form.medicationName} prescribed to {patient?.name}
                </p>
                <p className="text-sm text-muted mt-1">Redirecting to patient detail...</p>
            </div>
        );
    }

    return (
        <div>
            <Link href={`/doctor/patients/${patientId}`} className="btn btn-sm btn-secondary mb-2">
                <ArrowLeft size={16} /> Back to Patient
            </Link>

            <div className="page-header">
                <h1>
                    <Pill size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    New Prescription
                </h1>
                <p>Prescribing for <strong>{patient?.name}</strong> ({patient?.uniquePatientId})</p>
            </div>

            {/* Active medications warning */}
            {patient?.prescriptions?.filter(p => p.status === 'ACTIVE').length > 0 && (
                <div className="alert alert-info mb-3">
                    <Pill size={18} />
                    <span>
                        This patient has <strong>{patient.prescriptions.filter(p => p.status === 'ACTIVE').length} active medication(s)</strong>.
                        If you prescribe the same drug, the older prescription will be automatically marked as Replaced.
                    </span>
                </div>
            )}

            <div className="card" style={{ maxWidth: '600px' }}>
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Medication Name *</label>
                        <input
                            type="text"
                            name="medicationName"
                            className="form-input"
                            value={form.medicationName}
                            onChange={handleChange}
                            placeholder="e.g. Metformin, Amlodipine, Paracetamol"
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Dosage *</label>
                            <input
                                type="text"
                                name="dosage"
                                className="form-input"
                                value={form.dosage}
                                onChange={handleChange}
                                placeholder="e.g. 500mg, 10ml"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Frequency *</label>
                            <input
                                type="text"
                                name="frequency"
                                className="form-input"
                                value={form.frequency}
                                onChange={handleChange}
                                placeholder="e.g. Twice daily, Once at night"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Duration *</label>
                        <input
                            type="text"
                            name="duration"
                            className="form-input"
                            value={form.duration}
                            onChange={handleChange}
                            placeholder="e.g. 30 days, 2 weeks, Ongoing"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (Optional)</label>
                        <textarea
                            name="notes"
                            className="form-input"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Additional instructions, warnings, or context..."
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="btn btn-success btn-block btn-lg" disabled={submitting}>
                        <Check size={18} />
                        {submitting ? 'Creating...' : 'Create Prescription'}
                    </button>
                </form>
            </div>
        </div>
    );
}
