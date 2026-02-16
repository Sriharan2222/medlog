'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken, setRole } from '@/lib/api';
import { Heart, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [role, setRoleState] = useState('DOCTOR');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            setToken(data.token);
            setRole(data.user.role);

            router.push(data.user.role === 'DOCTOR' ? '/doctor' : '/patient');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Heart size={28} />
                    </div>
                    <h1>Med<span style={{ color: 'var(--primary-500)' }}>Log</span></h1>
                    <p>Secure Medication Logger</p>
                </div>

                <div className="role-toggle">
                    <button
                        className={`role-toggle-btn ${role === 'DOCTOR' ? 'active' : ''}`}
                        onClick={() => setRoleState('DOCTOR')}
                        type="button"
                    >
                        🩺 Doctor
                    </button>
                    <button
                        className={`role-toggle-btn ${role === 'PATIENT' ? 'active' : ''}`}
                        onClick={() => setRoleState('PATIENT')}
                        type="button"
                    >
                        🧑 Patient
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : `Sign in as ${role === 'DOCTOR' ? 'Doctor' : 'Patient'}`}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p className="text-sm text-muted">
                        Doctor? <a href="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>Register here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
