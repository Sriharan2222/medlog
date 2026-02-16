'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { QrCode, Download, Share2 } from 'lucide-react';

export default function QRPage() {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/patient/qr')
            .then(data => { setQrData(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const handleDownload = () => {
        if (!qrData?.qrDataUrl) return;
        const link = document.createElement('a');
        link.download = `MedLog-QR-${qrData.patientId}.png`;
        link.href = qrData.qrDataUrl;
        link.click();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My MedLog QR Code',
                    text: `Scan to view my active medications - Patient ID: ${qrData.patientId}`,
                    url: qrData.qrUrl
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(qrData.qrUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div>
            <div className="page-header" style={{ textAlign: 'center' }}>
                <h1>My QR Code</h1>
                <p>Share this with doctors or emergency contacts</p>
            </div>

            <div className="qr-container">
                <div className="qr-frame">
                    {qrData?.qrDataUrl ? (
                        <img src={qrData.qrDataUrl} alt="Patient QR Code" />
                    ) : (
                        <div style={{ width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <QrCode size={64} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    )}
                </div>

                <div className="qr-label">
                    <div className="qr-patient-id">{qrData?.patientId}</div>
                    <div className="qr-instructions">{qrData?.patientName}</div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '320px' }}>
                        Anyone who scans this QR code can view your <strong>active medications</strong>. No personal contact details are shared.
                    </p>
                </div>

                <div className="flex gap-1 mt-3">
                    <button className="btn btn-primary" onClick={handleDownload}>
                        <Download size={16} /> Download
                    </button>
                    <button className="btn btn-secondary" onClick={handleShare}>
                        <Share2 size={16} /> Share Link
                    </button>
                </div>
            </div>

            <div className="card mt-3" style={{ maxWidth: '500px', margin: '1.5rem auto' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>How it works</h4>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <span style={{ fontSize: '1.25rem' }}>📱</span>
                        <span className="text-sm">A doctor scans your QR code</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span style={{ fontSize: '1.25rem' }}>💊</span>
                        <span className="text-sm">They see your active medications instantly</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span style={{ fontSize: '1.25rem' }}>🔒</span>
                        <span className="text-sm">Read-only view — no edits possible</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span style={{ fontSize: '1.25rem' }}>🏥</span>
                        <span className="text-sm">Great for emergencies or new doctor visits</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
