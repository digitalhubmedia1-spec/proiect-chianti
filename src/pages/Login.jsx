import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Captcha from '../components/Captcha';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            alert('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        const success = await login(email, password);
        if (success) {
            navigate('/contul-meu');
        } else {
            // Error is handled in context (alert), but we can add fallback here if needed
            // alert("Email sau parolă incorecte!"); 
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Autentificare</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="exemplu@email.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Parolă</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Captcha onValidate={setIsCaptchaValid} />

                    <button type="submit" className="auth-btn">Autentificare</button>
                </form>
                <p className="auth-link">
                    Nu ai cont? <Link to="/register">Înregistrează-te</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
