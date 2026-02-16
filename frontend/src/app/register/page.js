'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken, setRole } from '@/lib/api';
import { Heart, Eye, EyeOff, Stethoscope, User } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('PATIENT');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        hospital: '',
        regNumber: '',
        specialization: '',
        age: '',
        gender: '',
        phone: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: selectedRole
            };

            if (selectedRole === 'DOCTOR') {
                payload.hospital = form.hospital;
                payload.regNumber = form.regNumber;
                payload.specialization = form.specialization;
            } else {
                payload.age = form.age;
                payload.gender = form.gender;
                payload.phone = form.phone;
            }

            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setToken(data.token);
            setRole(data.user.role);

            // For patients, fetch profile to show their patient ID
            if (selectedRole === 'PATIENT') {
                const me = await apiFetch('/auth/me');
                setPatientId(me.patient?.uniquePatientId || '');
            } else {
                router.push('/doctor');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Show patient ID after successful patient registration
    if (patientId) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h1>Welcome to MedLog!</h1>
                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>Your account has been created successfully.</p>

                    <div style={{ background: 'var(--accent-50)', borderRadius: 'var(--radius-md)', padding: '1.5rem', margin: '1.5rem 0', border: '2px dashed var(--accent-300)' }}>
                        <p className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>Your Patient ID</p>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-700)', letterSpacing: '1px' }}>
                            {patientId}
                        </div>
                    </div>

                    <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <span>📋 <strong>Share this ID with your doctor</strong> so they can prescribe medications for you. Keep it safe!</span>
                    </div>

                    <button
                        className="btn btn-primary btn-block btn-lg"
                        onClick={() => router.push('/patient')}
                    >
                        Go to My Dashboard →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Heart size={28} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join MedLog to manage medications</p>
                </div>

                {/* Role Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--gray-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('PATIENT')}
                        className={`btn btn-sm ${selectedRole === 'PATIENT' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center', background: selectedRole === 'PATIENT' ? undefined : 'transparent', border: 'none' }}
                    >
                        <User size={16} /> Patient
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('DOCTOR')}
                        className={`btn btn-sm ${selectedRole === 'DOCTOR' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center', background: selectedRole === 'DOCTOR' ? undefined : 'transparent', border: 'none' }}
                    >
                        <Stethoscope size={16} /> Doctor
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={form.name}
                            onChange={handleChange}
                            placeholder={selectedRole === 'DOCTOR' ? 'Dr. John Smith' : 'Rajesh Kumar'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={form.email}
                            onChange={handleChange}
                            placeholder={selectedRole === 'DOCTOR' ? 'doctor@hospital.com' : 'patient@email.com'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-input"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Doctor-specific fields */}
                    {selectedRole === 'DOCTOR' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Hospital / Clinic</label>
                                <input
                                    type="text"
                                    name="hospital"
                                    className="form-input"
                                    value={form.hospital}
                                    onChange={handleChange}
                                    placeholder="City General Hospital"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Registration Number</label>
                                <input
                                    type="text"
                                    name="regNumber"
                                    className="form-input"
                                    value={form.regNumber}
                                    onChange={handleChange}
                                    placeholder="Medical council reg. number"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Specialization (Optional)</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    className="form-input"
                                    value={form.specialization}
                                    onChange={handleChange}
                                    placeholder="e.g. Cardiology, General Medicine"
                                />
                            </div>
                        </>
                    )}

                    {/* Patient-specific fields */}
                    {selectedRole === 'PATIENT' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        className="form-input"
                                        value={form.age}
                                        onChange={handleChange}
                                        placeholder="Age"
                                        min="0"
                                        max="150"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select name="gender" className="form-input" value={form.gender} onChange={handleChange}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p className="text-sm text-muted">
                        Already have an account?{' '}
                        <a href="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
