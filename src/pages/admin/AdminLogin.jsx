import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import './Admin.css';
import Captcha from '../../components/Captcha';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            setError('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        // Hardcoded secure credentials as requested
        // Strong credentials as requested
        if (username === 'admin_chianti_secure_2026' && password === 'Xy9#mP2$Lk@8qR5!zVw4') {
            localStorage.setItem('admin_token', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Date de autentificare incorecte.');
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-icon">
                    <Lock size={48} />
                </div>
                <h2>Administrare Meniu</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Utilizator</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Introdu utilizatorul"
                        />
                    </div>
                    <div className="form-group">
                        <label>Parolă</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Introdu parola"
                        />
                    </div>

                    <Captcha onValidate={setIsCaptchaValid} />

                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" className="btn btn-primary btn-block">Autentificare</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
