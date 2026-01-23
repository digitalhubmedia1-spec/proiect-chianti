import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Lock } from 'lucide-react';
import './Admin.css';
import Captcha from '../../components/Captcha';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            setError('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        if (!supabase) {
            setError('Eroare conexiune server.');
            return;
        }

        try {
            // SECURE LOGIN via RPC
            const { data, error } = await supabase
                .rpc('check_admin_credentials', {
                    p_username: username.trim(),
                    p_password: password.trim()
                });

            if (error || !data) {
                setError('Date de autentificare incorecte.');
            } else {
                // Successful Login
                localStorage.setItem('admin_token', 'true');
                localStorage.setItem('admin_role', data.role);
                localStorage.setItem('admin_name', data.name);
                navigate('/admin/dashboard');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('A apărut o eroare la autentificare.');
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
