import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Lock } from 'lucide-react';
import Captcha from '../../components/Captcha';

const DriverLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const { driverLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            setError('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        const driver = driverLogin(email, password);
        if (driver) {
            navigate('/driver/dashboard');
        } else {
            setError('Email sau parolă incorectă.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            height: '100%',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 99999,
            overflowY: 'auto' // Allow scrolling if screen is too small
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'white',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                padding: '2.5rem',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: '#800020',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 10px 20px rgba(128, 0, 32, 0.2)'
                    }}>
                        <Truck size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '0.5rem' }}>Login Livrator</h2>
                    <p style={{ color: '#64748b', margin: 0 }}>Chianti Delivery Partner</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        border: '1px solid #fee2e2'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>EMAIL</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Truck size={18} />
                            </div>
                            <input
                                type="email"
                                style={{
                                    width: '100%',
                                    padding: '14px 14px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#f8fafc',
                                    color: '#334155'
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="livrator@chianti.ro"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>PAROLĂ</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                style={{
                                    width: '100%',
                                    padding: '14px 14px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#f8fafc',
                                    color: '#334155'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <Captcha onValidate={setIsCaptchaValid} />
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#800020',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(128, 0, 32, 0.2)',
                            transition: 'transform 0.1s'
                        }}
                    >
                        AUTENTIFICARE
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a href="/devino-livrator" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                        Nu ai cont? <span style={{ color: '#800020', fontWeight: '600' }}>Aplică aici</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DriverLogin;
