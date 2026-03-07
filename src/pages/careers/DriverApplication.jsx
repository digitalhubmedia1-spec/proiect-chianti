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

        } catch (error) {
            console.error("Error submitting application:", error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="container" style={{ marginTop: '120px', marginBottom: '100px' }}>
                <div className="card shadow-lg p-5 text-center mx-auto" style={{ maxWidth: '600px', borderRadius: '15px' }}>
                    <div className="mb-4 text-success text-center">
                        <CheckCircle size={64} style={{ margin: '0 auto' }} />
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

                    <div 
                        className="card border-0" 
                        style={{ 
                            borderRadius: '20px',
                            background: 'white',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease-in-out',
                            padding: '20px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div className="card-body p-4 p-md-5">
                            <h4 className="card-title fw-bold mb-4 text-center">Formular de Aplicare</h4>

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
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Nume</label>
                                        <input
                                            type="text"
                                            className="form-control py-2 px-3"
                                            name="nume"
                                            value={formData.nume}
                                            onChange={handleChange}
                                            required
                                            placeholder="Popescu"
                                            style={{ borderRadius: '10px', border: '1px solid #eee' }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Prenume</label>
                                        <input
                                            type="text"
                                            className="form-control py-2 px-3"
                                            name="prenume"
                                            value={formData.prenume}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ion"
                                            style={{ borderRadius: '10px', border: '1px solid #eee' }}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Email</label>
                                        <input
                                            type="email"
                                            className="form-control py-2 px-3"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="ion.popescu@email.com"
                                            style={{ borderRadius: '10px', border: '1px solid #eee' }}
                                        />
                                    </div>

                                    <div className="col-md-7">
                                        <label className="form-label fw-semibold">Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control py-2 px-3"
                                            name="telefon"
                                            value={formData.telefon}
                                            onChange={handleChange}
                                            required
                                            placeholder="07xx xxx xxx"
                                            style={{ borderRadius: '10px', border: '1px solid #eee' }}
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <label className="form-label fw-semibold">Vârstă</label>
                                        <input
                                            type="number"
                                            className="form-control py-2 px-3"
                                            name="varsta"
                                            value={formData.varsta}
                                            onChange={handleChange}
                                            required
                                            min="18"
                                            placeholder="Ex: 25"
                                            style={{ borderRadius: '10px', border: '1px solid #eee' }}
                                        />
                                    </div>
                                </div>

                                <div className="my-5">
                                    <div className="p-4 rounded-4" style={{ background: '#fcfcfc', border: '1px dashed #ddd' }}>
                                        <Captcha onValidate={setIsCaptchaValid} />
                                    </div>
                                </div>

                                <div className="d-grid">
                                    <button
                                        type="submit"
                                        className="btn btn-primary py-3"
                                        disabled={status === 'submitting'}
                                        style={{ borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}
                                    >
                                        {status === 'submitting' ? 'SE TRIMITE...' : 'TRIMITE APLICAȚIA'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="text-center mt-5 text-muted small px-4">
                        Prin trimiterea acestui formular, confirmi că ești de acord cu <a href="/confidentialitate" className="text-decoration-none text-danger fw-bold">Politica de Confidențialitate</a> referitoare la prelucrarea datelor cu caracter personal.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverApplication;
