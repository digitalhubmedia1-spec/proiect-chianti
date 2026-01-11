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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isCaptchaValid) {
            alert('Te rugăm să verifici codul CAPTCHA.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Parolele nu coincid!");
            return;
        }

        const fullName = `${formData.firstName} ${formData.lastName}`;
        const success = register(fullName, formData.email, formData.password, formData.phone);
        if (success) {
            alert("Cont creat cu succes!");
            navigate('/login');
        } else {
            alert("Acest email este deja înregistrat!");
        }
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

                    <button type="submit" className="auth-btn">Înregistrează-te</button>
                </form>
                <p className="auth-link">
                    Ai deja cont? <Link to="/login">Autentifică-te</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
