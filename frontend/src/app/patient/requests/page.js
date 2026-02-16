'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MessageSquare, Send, Pill } from 'lucide-react';

export default function PatientRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRx, setSelectedRx] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [reqs, rxs] = await Promise.all([
                apiFetch('/patient/change-requests'),
                apiFetch('/patient/prescriptions?status=ACTIVE')
            ]);
            setRequests(reqs);
            setPrescriptions(rxs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRx || !reason.trim()) return;
        setSubmitting(true);

        try {
            await apiFetch('/patient/change-requests', {
                method: 'POST',
                body: JSON.stringify({ prescriptionId: selectedRx, reason })
            });
            setSuccessMsg('Your change request has been submitted to the doctor.');
            setShowForm(false);
            setSelectedRx('');
            setReason('');
            loadData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>Change Requests</h1>
                        <p>Report side effects or dosage concerns</p>
                    </div>
                    {prescriptions.length > 0 && (
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            <MessageSquare size={16} /> New Request
                        </button>
                    )}
                </div>
            </div>

            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {showForm && (
                <div className="card mb-3" style={{ borderColor: 'var(--primary-200)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Submit Change Request</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Select Medication *</label>
                            <select
                                className="form-input"
                                value={selectedRx}
                                onChange={(e) => setSelectedRx(e.target.value)}
                                required
                            >
                                <option value="">Choose a prescription...</option>
                                {prescriptions.map(rx => (
                                    <option key={rx.id} value={rx.id}>
                                        {rx.medicationName} — {rx.dosage} (Dr. {rx.doctor?.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Describe your concern *</label>
                            <textarea
                                className="form-input"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Experiencing nausea after taking this medication, or dosage seems too high..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="flex gap-1">
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><MessageSquare size={28} /></div>
                    <h3>No change requests</h3>
                    <p>If you have concerns about a medication, submit a request to your doctor</p>
                </div>
            ) : (
                requests.map(req => (
                    <div key={req.id} className="request-card">
                        <div className="request-card-header">
                            <div className="flex items-center gap-1">
                                <Pill size={16} style={{ color: 'var(--primary-500)' }} />
                                <strong>{req.prescription?.medicationName}</strong>
                                <span className="text-sm text-muted">{req.prescription?.dosage}</span>
                            </div>
                            <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                        </div>

                        <div className="request-reason">{req.reason}</div>

                        <p className="text-sm text-muted mt-1">
                            Sent to Dr. {req.doctor?.name} ({req.doctor?.hospital}) · {formatDate(req.createdAt)}
                        </p>

                        {req.doctorResponse && (
                            <div className="request-response">
                                <strong>Doctor&apos;s Response:</strong> {req.doctorResponse}
                                {req.respondedAt && (
                                    <span className="text-sm text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                                        {formatDate(req.respondedAt)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
