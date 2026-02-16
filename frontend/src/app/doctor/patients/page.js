'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export default function PatientsPage() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/doctor/patients')
            .then(data => { setPatients(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSearch = async () => {
        if (!search.trim()) {
            setSearchResults(null);
            return;
        }
        try {
            const results = await apiFetch(`/doctor/patients?search=${encodeURIComponent(search)}`);
            setSearchResults(results);
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const displayPatients = searchResults !== null ? searchResults : patients;

    return (
        <div>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>Patients</h1>
                        <p>Manage and view your patients</p>
                    </div>
                    <Link href="/doctor/patients/new" className="btn btn-primary">
                        <Search size={18} /> Find Patient
                    </Link>
                </div>
            </div>

            <div className="search-bar">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search by name or patient ID..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (!e.target.value.trim()) setSearchResults(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>

            {search.trim() && (
                <button className="btn btn-sm btn-secondary mb-2" onClick={handleSearch}>
                    <Search size={14} /> Search
                </button>
            )}

            {displayPatients.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Users size={28} /></div>
                    <h3>{searchResults !== null ? 'No patients found' : 'No patients yet'}</h3>
                    <p>{searchResults !== null ? 'Try a different search term' : 'Find a patient by their ID to start prescribing'}</p>
                    {searchResults === null && (
                        <Link href="/doctor/patients/new" className="btn btn-primary mt-2">
                            <Search size={16} /> Find Patient
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid-2">
                    {displayPatients.map(patient => (
                        <Link href={`/doctor/patients/${patient.id}`} key={patient.id} className="patient-card">
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
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-muted">
                                    {patient.age ? `${patient.age} yrs` : ''} {patient.gender ? `· ${patient.gender}` : ''}
                                </span>
                                <span className="text-sm text-muted">{patient.user?.email}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
