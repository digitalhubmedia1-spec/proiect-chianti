import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Calendar, Users, Home, Map } from 'lucide-react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import './Contact.css';

const Contact = () => {
    // Basic state for form handling (optional for visual demo, but good practice)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        events: [],
        location: [],
        guests: '',
        date: '',
        packages: [],
        message: '',
        agreement: false,
        terms: false
    });

    const handleCheckboxChange = (e, category) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const list = prev[category];
            if (checked) {
                return { ...prev, [category]: [...list, value] };
            } else {
                return { ...prev, [category]: list.filter(item => item !== value) };
            }
        });
    };

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    // ... inside component
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!supabase) {
            alert('Eroare: Conexiunea la server lipsește.');
            return;
        }

        try {
            const { error } = await supabase.from('contact_messages').insert([{
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                event_type: formData.events,
                location: formData.location,
                guests: formData.guests ? parseInt(formData.guests) : 0,
                date: formData.date || null,
                packages: formData.packages,
                message: formData.message
            }]);

            if (error) throw error;

            alert('Mesajul a fost trimis! Vă mulțumim.');
            setFormData({
                name: '', phone: '', email: '', events: [], location: [],
                guests: '', date: '', packages: [], message: '',
                agreement: false, terms: false
            });
        } catch (err) {
            console.error(err);
            alert('Eroare la trimiterea mesajului: ' + err.message);
        }
    };

    return (
        <div className="contact-page">
            <SEO
                title="Contact & Rezervări - Restaurant Chianti Roman"
                description="Contactează-ne pentru rezervări la masă, comenzi telefonice sau organizarea de evenimente. Suntem situați în centrul orașului Roman."
                canonical="/contact"
            />
            <div className="contact-header">
                <div className="container">
                    <h1 className="page-title">Contact & Rezervări</h1>
                    <p className="page-subtitle">Suntem aici pentru a transforma evenimentul tău într-o experiență memorabilă</p>
                </div>
            </div>

            <div className="container contact-content-vertical">
                {/* 1. Contact Info Section (Top) */}
                <div className="info-top-section">
                    <div className="info-card">
                        <MapPin className="info-icon" size={32} />
                        <h3>Adresa</h3>
                        <p>Strada Ștefan cel Mare nr. 24, Roman, Neamț</p>
                    </div>
                    <div className="info-card">
                        <Phone className="info-icon" size={32} />
                        <h3>Telefon</h3>
                        <p>0745 123 456</p>
                    </div>
                    <div className="info-card">
                        <Mail className="info-icon" size={32} />
                        <h3>Email</h3>
                        <p>contact@chianti.ro</p>
                    </div>
                    <div className="info-card">
                        <Clock className="info-icon" size={32} />
                        <h3>Program</h3>
                        <p>Luni - Duminică: 10:00 - 23:00</p>
                    </div>
                </div>

                {/* 2. Detailed Form Section (Bottom) */}
                <div className="form-section-container">
                    <h2 className="form-heading">Formular cerere ofertă</h2>

                    <form className="complex-contact-form" onSubmit={handleSubmit}>

                        {/* Row 1: Personal Info */}
                        <div className="form-row three-cols">
                            <div className="form-group">
                                <label htmlFor="name">Nume <span className="req">*</span></label>
                                <input type="text" id="name" placeholder="Nume" required onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Nr. Telefon <span className="req">*</span></label>
                                <input type="tel" id="phone" placeholder="Nr. Telefon" required onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email <span className="req">*</span></label>
                                <input type="email" id="email" placeholder="Adresa email" required onChange={handleChange} />
                            </div>
                        </div>

                        {/* Row 2: Event & Location */}
                        <div className="form-row two-cols">
                            <div className="form-group checkbox-group-container">
                                <label className="group-label">Selectează Evenimentul</label>
                                <div className="checkbox-grid">
                                    <label className="cb-item"><input type="checkbox" value="Nuntă" onChange={(e) => handleCheckboxChange(e, 'events')} /> Nuntă</label>
                                    <label className="cb-item"><input type="checkbox" value="Cumătrie" onChange={(e) => handleCheckboxChange(e, 'events')} /> Cumătrie</label>
                                    <label className="cb-item"><input type="checkbox" value="Pomenire" onChange={(e) => handleCheckboxChange(e, 'events')} /> Pomenire</label>
                                    <label className="cb-item"><input type="checkbox" value="Onomastică" onChange={(e) => handleCheckboxChange(e, 'events')} /> Onomastică</label>
                                </div>
                            </div>

                            <div className="form-group checkbox-group-container">
                                <label className="group-label">Selectează Locația</label>
                                <div className="checkbox-grid">
                                    <label className="cb-item full-width"><input type="checkbox" value="Acasa" onChange={(e) => handleCheckboxChange(e, 'location')} /> La mine acasă (catering la o locație aleasă de client)</label>
                                    <label className="cb-item"><input type="checkbox" value="Venetia" onChange={(e) => handleCheckboxChange(e, 'location')} /> Salon Veneția</label>
                                    <label className="cb-item"><input type="checkbox" value="Florenta" onChange={(e) => handleCheckboxChange(e, 'location')} /> Salon Florența</label>
                                    <label className="cb-item"><input type="checkbox" value="Roma" onChange={(e) => handleCheckboxChange(e, 'location')} /> Salon Roma</label>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Guests & Date */}
                        <div className="form-row two-cols">
                            <div className="form-group">
                                <label htmlFor="guests">Număr aproximativ persoane <span className="req">*</span></label>
                                <input type="number" id="guests" placeholder="Introdu nr. de persoane" required onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="date">Selectați Data evenimentului <span className="req">*</span></label>
                                <input type="date" id="date" placeholder="Selectați data" required onChange={handleChange} />
                            </div>
                        </div>



                        {/* Row 5: Message */}
                        <div className="form-group">
                            <label htmlFor="message">Mesaj <span className="req">*</span></label>
                            <textarea
                                id="message"
                                rows="4"
                                placeholder="Ex: Am vizionat pagina dvs. de Meniuri și mi-aș dori o ofertă personalizată pentru următoarele produse..."
                                required
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        {/* Row 6: Agreements */}
                        <div className="form-group agreement-section">
                            <label className="cb-item full-width agreement-item">
                                <input type="checkbox" id="agreement" required onChange={handleChange} />
                                <span className="agreement-text">
                                    <strong>Acord client: <span className="req">*</span></strong><br />
                                    Da, puteți să mă contactați în legătură cu cererea mea de ofertă. Numărul meu de telefon și adresa de e-mail de mai sus sunt corecte.
                                </span>
                            </label>

                            <label className="cb-item full-width mt-2 agreement-item">
                                <input type="checkbox" id="terms" required onChange={handleChange} />
                                <span className="agreement-text">
                                    <strong>Termeni și Condiții <span className="req">*</span></strong><br />
                                    Am luat la cunoștință și sunt de acord cu <Link to="/termeni-si-conditii" className="terms-link">Termenii și Condițiile</Link>.
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary btn-submit-offer">Trimite</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
