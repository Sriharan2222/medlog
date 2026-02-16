'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MessageSquare, Send, X } from 'lucide-react';

export default function DoctorRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [tab, setTab] = useState('PENDING');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await apiFetch('/doctor/change-requests');
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId, status, response) => {
        try {
            await apiFetch(`/doctor/change-requests/${requestId}/respond`, {
                method: 'POST',
                body: JSON.stringify({ doctorResponse: response || '', status })
            });
            setResponding(null);
            setResponseText('');
            loadRequests();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const filtered = requests.filter(r => r.status === tab);

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div>
            <div className="page-header">
                <h1>Change Requests</h1>
                <p>Review and respond to patient medication concerns</p>
            </div>

            <div className="tabs">
                {['PENDING', 'RESPONDED', 'DISMISSED'].map(t => (
                    <button
                        key={t}
                        className={`tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                        {` (${requests.filter(r => r.status === t).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><MessageSquare size={28} /></div>
                    <h3>No {tab.toLowerCase()} requests</h3>
                    <p>Requests from patients will appear here</p>
                </div>
            ) : (
                filtered.map(req => (
                    <div key={req.id} className="request-card">
                        <div className="request-card-header">
                            <div>
                                <strong style={{ fontSize: '1rem' }}>{req.patient?.name}</strong>
                                <span className="text-sm text-muted" style={{ marginLeft: '0.5rem' }}>
                                    {req.patient?.uniquePatientId}
                                </span>
                            </div>
                            <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                            <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                                {req.prescription?.medicationName}
                            </span>
                            <span className="text-sm text-muted">{req.prescription?.dosage}</span>
                        </div>

                        <div className="request-reason">{req.reason}</div>
                        <p className="text-sm text-muted mt-1">{formatDate(req.createdAt)}</p>

                        {req.doctorResponse && (
                            <div className="request-response">
                                <strong>Your response:</strong> {req.doctorResponse}
                            </div>
                        )}

                        {req.status === 'PENDING' && (
                            <>
                                {responding === req.id ? (
                                    <div style={{ marginTop: '1rem', background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <textarea
                                            className="form-input"
                                            placeholder="Write your response..."
                                            value={responseText}
                                            onChange={(e) => setResponseText(e.target.value)}
                                            rows={3}
                                            style={{ marginBottom: '0.75rem' }}
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleRespond(req.id, 'RESPONDED', responseText)}
                                                disabled={!responseText.trim()}
                                            >
                                                <Send size={14} /> Respond
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => { setResponding(null); setResponseText(''); }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-1" style={{ marginTop: '0.75rem' }}>
                                        <button className="btn btn-sm btn-primary" onClick={() => setResponding(req.id)}>
                                            <MessageSquare size={14} /> Reply
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleRespond(req.id, 'DISMISSED', '')}>
                                            <X size={14} /> Dismiss
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
