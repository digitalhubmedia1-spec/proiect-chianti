import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Captcha from '../components/Captcha';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            alert('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Parolele nu coincid!");
            return;
        }

        // Clean inputs (remove accidental spaces)
        // Aggressively remove ALL whitespace from email and phone (including internal spaces)
        // FORCE LOWERCASE (Supabase usually handles this multiple case sensitivity issues)
        const cleanEmail = formData.email ? formData.email.replace(/\s/g, '').toLowerCase() : '';
        const cleanPhone = formData.phone ? formData.phone.replace(/\s/g, '') : '';

        // Names can have internal spaces, so only trim ends
        const cleanFirstName = formData.firstName ? formData.firstName.trim() : '';
        const cleanLastName = formData.lastName ? formData.lastName.trim() : '';

        const fullName = `${cleanFirstName} ${cleanLastName}`;

        // DEBUG: Alert exactly what is being sent to identify hidden chars
        // REMOVE THIS after fixing
        alert(`DEBUG: Email trimis: [${cleanEmail}] (lungime: ${cleanEmail.length})`);

        const success = await register(fullName, cleanEmail, formData.password, cleanPhone);
        if (success) {
            navigate('/login');
        }
        // If not success, the register function already alerted the error
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Creează Cont</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Prenume</label>
                        <input type="text" name="firstName" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Nume</label>
                        <input type="text" name="lastName" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Telefon</label>
                        <input type="tel" name="phone" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Parolă</label>
                        <input
                            type="password"
                            name="password"
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmă Parola</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <Captcha onValidate={setIsCaptchaValid} />

                    <button type="submit" className="auth-btn">Înregistrează-te (Debug)</button>
                </form>
                <p className="auth-link">
                    Ai deja cont? <Link to="/login">Autentifică-te</Link>
                </p>

                {/* DEBUG SECTION - REMOVE BEFORE PRODUCTION */}
                <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '10px', color: '#333' }}>
                    <strong>DIAGNOSTIC SERVER (Trimite poză cu asta):</strong><br />
                    URL: {import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.substring(0, 20) + "..." : "LIPSA"}<br />
                    KEY: {import.meta.env.VITE_SUPABASE_KEY ? "PREZENT (KEY)" : (import.meta.env.VITE_SUPABASE_ANON_KEY ? "PREZENT (ANON)" : "LIPSA COMPLET")}
                    <br />
                    URL are ghilimele? {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('"') ? "DA (STERGE-LE!)" : "NU"}
                </div>
            </div>
        </div>
    );
};

export default Register;
