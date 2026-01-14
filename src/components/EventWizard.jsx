import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import './EventWizard.css';

const EventWizard = ({ isOpen, onClose, initialType }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [choice, setChoice] = useState(null); // 'configurator' or 'standard'
    const [formData, setFormData] = useState({
        nume: '',
        prenume: '',
        telefon: '',
        email: ''
    });

    if (!isOpen) return null;

    const handleChoice = (selectedChoice) => {
        setChoice(selectedChoice);
        if (selectedChoice === 'configurator') {
            // Redirect immediately to configurator
            navigate('/configurator');
        } else {
            // Go to step 2 (Standard Offer Form)
            setStep(2);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitStandard = (e) => {
        e.preventDefault();
        // Here you would typically send data to backend
        console.log('Sending standard offer request:', formData);
        alert('Cererea a fost trimisă! Vă vom contacta în curând.');
        onClose();
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal">
                <button className="wizard-close" onClick={onClose}><X size={24} /></button>

                {step === 1 && (
                    <div className="wizard-step step-choice">
                        <h2>Cum dorești să procedezi?</h2>
                        <p className="step-subtitle">Alege varianta potrivită pentru evenimentul tău</p>

                        <div className="choice-cards">
                            <div
                                className="choice-card"
                                onClick={() => handleChoice('configurator')}
                            >
                                <div className="choice-icon">🛠️</div>
                                <h3>Configurez Singur</h3>
                                <p>Vreau să îmi aleg manual preparatele folosind configuratorul interactiv.</p>
                            </div>

                            <div
                                className="choice-card"
                                onClick={() => handleChoice('standard')}
                            >
                                <div className="choice-icon">📋</div>
                                <h3>Ofertă Standard</h3>
                                <p>Vreau o ofertă predefinită de la restaurant pe baza preferințelor mele.</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && choice === 'standard' && (
                    <div className="wizard-step step-form">
                        <h2>Date de Contact</h2>
                        <p className="step-subtitle">Pentru a îți trimite oferta standard, avem nevoie de câteva detalii.</p>

                        <form onSubmit={handleSubmitStandard}>
                            <div className="form-group">
                                <label>Nume</label>
                                <input
                                    type="text"
                                    name="nume"
                                    value={formData.nume}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Prenume</label>
                                <input
                                    type="text"
                                    name="prenume"
                                    value={formData.prenume}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="tel"
                                    name="telefon"
                                    value={formData.telefon}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-block">
                                Trimite Cererea
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventWizard;
