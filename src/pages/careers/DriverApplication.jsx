import React, { useState } from 'react';
import { Truck, CheckCircle, AlertCircle, User, Mail, Phone, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
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
            <div className="container" style={{ marginTop: '160px', marginBottom: '100px' }}>
                <div className="card shadow-lg p-5 text-center mx-auto border-0" style={{ maxWidth: '600px', borderRadius: '24px' }}>
                    <div className="mb-4 d-flex justify-content-center">
                        <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={48} color="#16a34a" />
                        </div>
                    </div>
                    <h2 className="mb-3 fw-bold">Aplicație Trimisă cu Succes!</h2>
                    <p className="text-muted mb-4 lead">
                        Îți mulțumim pentru interesul acordat echipei Chianti Catering.
                        Am înregistrat datele tale și le vom analiza în cel mai scurt timp.
                    </p>
                    <div className="bg-light p-4 rounded-4 mb-4 text-start">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div className="bg-white p-2 rounded-circle shadow-sm"><Phone size={18} className="text-danger" /></div>
                            <span>Vei fi contactat telefonic în curând.</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-white p-2 rounded-circle shadow-sm"><Mail size={18} className="text-danger" /></div>
                            <span>Verifică și adresa de email pentru confirmare.</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary w-100 py-3"
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
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '140px', paddingBottom: '100px' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="row align-items-center mb-5">
                            <div className="col-md-6 text-center text-md-start">
                                <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill mb-3 fw-bold">CARIERE CHIANTI</span>
                                <h1 className="display-4 fw-bold mb-3" style={{ color: '#1e293b' }}>Devino Livrator</h1>
                                <p className="text-muted lead mb-4">
                                    Fă parte din cea mai rapidă echipă de livrări din oraș. Oferim program flexibil, venituri competitive și un mediu de lucru profesionist.
                                </p>
                                <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
                                    <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm">
                                        <Truck size={18} className="text-danger" />
                                        <span className="small fw-bold">Livrare Rapidă</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm">
                                        <Calendar size={18} className="text-danger" />
                                        <span className="small fw-bold">Program Flexibil</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 d-none d-md-block text-center">
                                <div className="p-4 bg-white rounded-circle d-inline-block shadow-lg" style={{ width: '280px', height: '280px', overflow: 'hidden' }}>
                                    <Truck size={180} className="text-danger opacity-25 mt-4" />
                                </div>
                            </div>
                        </div>

                        <div className="row justify-content-center">
                            <div className="col-md-10 col-lg-8">
                                <div className="card shadow-xl border-0" style={{ borderRadius: '30px', overflow: 'hidden' }}>
                                    <div className="row g-0">
                                        <div className="col-12 p-4 p-md-5 bg-white">
                                            <div className="d-flex align-items-center gap-3 mb-4">
                                                <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                                                    <User size={24} className="text-danger" />
                                                </div>
                                                <h4 className="fw-bold m-0">Formular de Aplicare</h4>
                                            </div>

                                            {status === 'error' && (
                                                <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 rounded-4">
                                                    <AlertCircle size={20} className="me-2" />
                                                    <div>A apărut o eroare. Te rugăm să verifici datele.</div>
                                                </div>
                                            )}

                                            {status === 'captcha_error' && (
                                                <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4 rounded-4">
                                                    <AlertCircle size={20} className="me-2" />
                                                    <div>Verificarea Captcha a eșuat. Încearcă din nou.</div>
                                                </div>
                                            )}

                                            <form onSubmit={handleSubmit} className="row g-4">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small text-uppercase tracking-wider text-muted">Nume</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0"><User size={18} className="text-muted" /></span>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light border-0 py-2"
                                                            name="nume"
                                                            value={formData.nume}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Popescu"
                                                            style={{ borderRadius: '0 8px 8px 0' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small text-uppercase tracking-wider text-muted">Prenume</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0"><User size={18} className="text-muted" /></span>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light border-0 py-2"
                                                            name="prenume"
                                                            value={formData.prenume}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Ion"
                                                            style={{ borderRadius: '0 8px 8px 0' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-bold small text-uppercase tracking-wider text-muted">Email</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted" /></span>
                                                        <input
                                                            type="email"
                                                            className="form-control bg-light border-0 py-2"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="ion.popescu@email.com"
                                                            style={{ borderRadius: '0 8px 8px 0' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-8">
                                                    <label className="form-label fw-bold small text-uppercase tracking-wider text-muted">Telefon</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0"><Phone size={18} className="text-muted" /></span>
                                                        <input
                                                            type="tel"
                                                            className="form-control bg-light border-0 py-2"
                                                            name="telefon"
                                                            value={formData.telefon}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="07xx xxx xxx"
                                                            style={{ borderRadius: '0 8px 8px 0' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold small text-uppercase tracking-wider text-muted">Vârstă</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-0"><Calendar size={18} className="text-muted" /></span>
                                                        <input
                                                            type="number"
                                                            className="form-control bg-light border-0 py-2"
                                                            name="varsta"
                                                            value={formData.varsta}
                                                            onChange={handleChange}
                                                            required
                                                            min="18"
                                                            placeholder="Ex: 25"
                                                            style={{ borderRadius: '0 8px 8px 0' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-12 mt-5">
                                                    <div className="d-flex align-items-center gap-2 mb-3">
                                                        <ShieldCheck size={20} className="text-success" />
                                                        <span className="fw-bold small text-uppercase tracking-wider text-muted">Verificare Securitate</span>
                                                    </div>
                                                    <div className="p-3 bg-light rounded-4 border border-white shadow-sm">
                                                        <Captcha onValidate={setIsCaptchaValid} />
                                                    </div>
                                                </div>

                                                <div className="col-12 mt-5">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary w-100 py-3 shadow-lg d-flex align-items-center justify-content-center gap-2"
                                                        disabled={status === 'submitting'}
                                                        style={{ borderRadius: '15px' }}
                                                    >
                                                        {status === 'submitting' ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                <span>Se trimite...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>TRIMITE APLICAȚIA</span>
                                                                <ArrowRight size={20} />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mt-5 text-muted small px-4">
                                    Prin trimiterea acestui formular, confirmi că ai citit și ești de acord cu <a href="/confidentialitate" className="text-decoration-none text-danger fw-bold">Politica de Confidențialitate</a>. Datele tale vor fi procesate exclusiv în scopul recrutării.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverApplication;
