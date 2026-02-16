import React, { useState } from 'react';
import { Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Captcha from '../../components/Captcha';

const DriverApplication = () => {
    const { submitDriverApplication } = useAuth();
    const [formData, setFormData] = useState({
        nume: '',
        prenume: '',
        varsta: '',
        telefon: '',
        email: ''
    });
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error, captcha_error


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate Captcha
        if (!isCaptchaValid) {
            setStatus('captcha_error');
            return;
        }

        setStatus('submitting');

        // Basic validation
        if (!formData.nume || !formData.prenume || !formData.varsta || !formData.telefon || !formData.email) {
            setStatus('error');
            return;
        }

        try {
            // DIRECT STORAGE WRITING (Bypass Context for Debugging/Reliability)
            const apps = JSON.parse(localStorage.getItem('chianti_driver_apps_v2') || '[]');
            const newApp = {
                id: Date.now().toString(),
                ...formData,
                status: 'pending',
                date: new Date().toISOString()
            };
            apps.push(newApp);
            localStorage.setItem('chianti_driver_apps_v2', JSON.stringify(apps));

            // Trigger storage event manually for other tabs
            window.dispatchEvent(new Event('storage'));

            setStatus('success');
            setFormData({ nume: '', prenume: '', varsta: '', telefon: '', email: '' });
            setIsCaptchaValid(false);

            // Notify user immediately
            // alert('Aplicația a fost salvată în baza de date locală!');

        } catch (error) {
            console.error("Error submitting application:", error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="container" style={{ marginTop: '120px', marginBottom: '100px' }}>
                <div className="card shadow-lg p-5 text-center mx-auto" style={{ maxWidth: '600px', borderRadius: '15px' }}>
                    <div className="mb-4 text-success">
                        <CheckCircle size={64} />
                    </div>
                    <h2 className="mb-3">Aplicație Trimisă cu Succes!</h2>
                    <p className="text-muted mb-4">
                        Îți mulțumim pentru interesul acordat echipei Chianti Catering.
                        Am înregistrat datele tale și le vom analiza în cel mai scurt timp.
                        Vei fi contactat telefonic sau pe email pentru următorii pași.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setStatus('idle');
                            setIsCaptchaValid(false);
                        }}
                    >
                        Trimite o nouă aplicație
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '120px', marginBottom: '100px' }}>
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="text-center mb-5">
                        <h1 className="fw-bold">Devino Livrator Chianti</h1>
                        <p className="text-muted lead">
                            Alătură-te echipei noastre și ajută-ne să livrăm bucurie (și mâncare bună) clienților noștri.
                        </p>
                    </div>

                    <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                        <div className="card-body p-4 p-md-5">
                            <h4 className="card-title fw-bold mb-4">Formular de Aplicare</h4>

                            {status === 'error' && (
                                <div className="alert alert-danger d-flex align-items-center mb-4">
                                    <AlertCircle size={20} className="me-2" />
                                    <div>A apărut o eroare. Te rugăm să verifici datele și să încerci din nou.</div>
                                </div>
                            )}

                            {status === 'captcha_error' && (
                                <div className="alert alert-warning d-flex align-items-center mb-4">
                                    <AlertCircle size={20} className="me-2" />
                                    <div>Verificarea Captcha a eșuat. Te rugăm să încerci din nou.</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Nume</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nume"
                                            value={formData.nume}
                                            onChange={handleChange}
                                            required
                                            placeholder="Popescu"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Prenume</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="prenume"
                                            value={formData.prenume}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ion"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="ion.popescu@email.com"
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="telefon"
                                            value={formData.telefon}
                                            onChange={handleChange}
                                            required
                                            placeholder="07xx xxx xxx"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Vârstă</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="varsta"
                                            value={formData.varsta}
                                            onChange={handleChange}
                                            required
                                            min="18"
                                            placeholder="Ex: 25"
                                        />
                                    </div>
                                </div>

                                <hr className="my-4" />

                                {/* Captcha Section */}
                                <div className="mb-4">
                                    <div className="bg-light p-3 rounded">
                                        <Captcha onValidate={setIsCaptchaValid} />
                                    </div>
                                </div>

                                <div className="d-grid mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg"
                                        disabled={status === 'submitting'}
                                    >
                                        {status === 'submitting' ? 'Se trimite...' : 'Trimite Aplicația'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="text-center mt-4 text-muted small">
                        Prin trimiterea acestui formular, ești de acord cu <a href="/confidentialitate" className="text-decoration-none text-danger">Politica de Confidențialitate</a> referitoare la prelucrarea datelor cu caracter personal în scopuri de recrutare.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverApplication;
