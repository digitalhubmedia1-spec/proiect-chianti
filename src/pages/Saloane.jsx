import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Users, Shield, Wind, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Saloane.css';
import { supabase } from '../supabaseClient';

const ImageCarousel = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        if (!images || images.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        if (!images || images.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="venue-carousel">
            <div
                className="carousel-slide"
                style={{ backgroundImage: `url(${images[currentIndex]})` }}
                role="img"
                aria-label={`${alt} - Image ${currentIndex + 1}`}
            ></div>

            {images.length > 1 && (
                <>
                    <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous image">
                        <ChevronLeft size={24} />
                    </button>

                    <button className="carousel-btn next" onClick={nextSlide} aria-label="Next image">
                        <ChevronRight size={24} />
                    </button>

                    <div className="carousel-dots">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ReservationForm = () => {
    const [formData, setFormData] = useState({
        salon: 'Salon Roma',
        eventType: 'Nuntă',
        datePrimary: '',
        dateSecondary: '',
        dateTertiary: '',
        guests: '',
        name: '',
        phone: '',
        email: '',
        message: '',
        agreement: false,
        terms: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supabase) {
            alert('Eroare: Conexiunea la baza de date lipsește.');
            return;
        }

        try {
            const { error } = await supabase.from('event_requests').insert([{
                salon: formData.salon,
                event_type: formData.eventType,
                date_primary: formData.datePrimary || null,
                date_secondary: formData.dateSecondary || null,
                date_tertiary: formData.dateTertiary || null,
                guests: parseInt(formData.guests) || 0,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                message: formData.message
            }]);

            if (error) throw error;
            alert('Cererea dumneavoastră a fost trimisă! Vă vom contacta în curând.');
            setFormData({
                salon: 'Salon Roma', eventType: 'Nuntă', datePrimary: '', dateSecondary: '', dateTertiary: '',
                guests: '', name: '', phone: '', email: '', message: '', agreement: false, terms: false
            });
        } catch (error) {
            alert('Eroare la trimitere: ' + error.message);
        }
    };

    return (
        <form className="reservation-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label>Rezervă Salon <span className="required">*</span></label>
                    <select className="form-control" name="salon" value={formData.salon} onChange={handleChange}>
                        <option>Salon Roma</option>
                        <option>Salon Veneția</option>
                        <option>Salon Florența</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Tip Eveniment <span className="required">*</span></label>
                    <select className="form-control" name="eventType" value={formData.eventType} onChange={handleChange}>
                        <option>Nuntă</option>
                        <option>Botez</option>
                        <option>Majorat</option>
                        <option>Corporate</option>
                        <option>Altele</option>
                    </select>
                </div>
            </div>

            <div className="form-row three-cols">
                <div className="form-group">
                    <label>Data preferată <span className="required">*</span></label>
                    <input
                        type="date"
                        className="form-control"
                        name="datePrimary"
                        value={formData.datePrimary}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Data (opțiunea nr.2)</label>
                    <input
                        type="date"
                        className="form-control"
                        name="dateSecondary"
                        value={formData.dateSecondary}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Data (opțiunea nr.3)</label>
                    <input
                        type="date"
                        className="form-control"
                        name="dateTertiary"
                        value={formData.dateTertiary}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-row three-cols">
                <div className="form-group">
                    <label>Nr. aproximativ invitați <span className="required">*</span></label>
                    <input
                        type="number"
                        className="form-control"
                        placeholder="Ex: 150"
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nume <span className="required">*</span></label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nume"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nr. Telefon <span className="required">*</span></label>
                    <input
                        type="tel"
                        className="form-control"
                        placeholder="Telefon"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Mesaj</label>
                <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Alte detalii..."
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                ></textarea>
            </div>

            <div className="form-checkbox-group">
                <div className="checkbox-item">
                    <input
                        type="checkbox"
                        id="contact-accept"
                        name="agreement"
                        checked={formData.agreement}
                        onChange={handleChange}
                        required
                    />
                    <label htmlFor="contact-accept">Accept să fiu contactat.</label>
                </div>
            </div>

            <div className="form-checkbox-group">
                <div className="checkbox-item">
                    <input
                        type="checkbox"
                        id="terms-accept"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        required
                    />
                    <label htmlFor="terms-accept">Sunt de acord cu <Link to="/termeni-si-conditii">Termenii și Condițiile</Link>.</label>
                </div>
            </div>

            <button type="submit" className="btn-submit-verify">Trimite Cerere Ofertă</button>
        </form>
    );
};

import { useMenu } from '../context/MenuContext';

const VenueAvailability = () => {
    const { bookedDates } = useMenu();
    const [selectedVenue, setSelectedVenue] = useState('venetia');
    const [date, setDate] = useState(new Date());

    const toDateString = (date) => {
        const offset = date.getTimezoneOffset();
        const d = new Date(date.getTime() - (offset * 60 * 1000));
        return d.toISOString().split('T')[0];
    };

    const isUnavailable = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = toDateString(date);
            return (bookedDates[selectedVenue] || []).includes(dateStr);
        }
        return false;
    };

    return (
        <div className="availability-section">
            <div className="container">
                <div className="availability-header">
                    <h3>Verifică Disponibilitatea</h3>
                    <p>Selectează salonul și completează formularul pentru a cere o ofertă.</p>
                </div>

                <div className="availability-grid">
                    {/* Left Column: Calendar */}
                    <div className="availability-left">
                        <div className="venue-selector-compact">
                            <label>Calendar Disponibilitate pentru:</label>
                            <div className="venue-selector-buttons">
                                <button
                                    className={`venue-btn-sm ${selectedVenue === 'venetia' ? 'active' : ''}`}
                                    onClick={() => setSelectedVenue('venetia')}
                                >
                                    Veneția
                                </button>
                                <button
                                    className={`venue-btn-sm ${selectedVenue === 'roma' ? 'active' : ''}`}
                                    onClick={() => setSelectedVenue('roma')}
                                >
                                    Roma
                                </button>
                                <button
                                    className={`venue-btn-sm ${selectedVenue === 'florenta' ? 'active' : ''}`}
                                    onClick={() => setSelectedVenue('florenta')}
                                >
                                    Florența
                                </button>
                            </div>
                        </div>

                        <div className="calendar-wrapper-simple">
                            <Calendar
                                onChange={setDate}
                                value={date}
                                tileClassName={({ date, view }) => isUnavailable({ date, view }) ? 'unavailable-date' : null}
                                locale="ro-RO"
                            />
                            <div className="calendar-legend">
                                <div className="legend-item"><span className="dot available"></span> Disponibil</div>
                                <div className="legend-item"><span className="dot unavailable"></span> Indisponibil</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="availability-right">
                        <ReservationForm />
                    </div>
                </div>

                <div className="configurator-cta">
                    <p>Ai găsit data perfectă? Configurează meniul evenimentului&nbsp;tău!</p>
                    <a href="/meniuri" className="btn btn-primary btn-lg">Configurează Meniu Eveniment</a>
                </div>
            </div>
        </div>
    );
};

const Saloane = () => {
    return (
        <div className="venues-page">
            <div className="venues-header-hero">
                <div className="container">
                    <h1 className="page-title">Saloanele Noastre</h1>
                    <p className="page-subtitle">Eleganță și rafinament pentru evenimentul tău</p>
                </div>
            </div>

            <div className="container">
                <div className="venues-intro">
                    <p>
                        Fiecare dintre cele 3 saloane de evenimente ale casei noastre este unic prin confortul,
                        designul și eleganța, fapt confirmat de cele peste 1950 de cupluri care au ales să își
                        organizeze aici evenimentele mult dorite în cei peste 10 ani de activitate.
                    </p>
                </div>

                {/* --- SALON VENETIA --- */}
                <div className="venue-section" id="venetia">
                    <div className="venue-content-wrapper">
                        <div className="venue-text-side">
                            <h2 className="venue-title">Salon Veneția</h2>
                            <p className="venue-desc">
                                Cu o capacitate ce poate atinge <strong>170 de invitați</strong> în cazul organizării de evenimente private,
                                Salonul Veneția este cel mai intim salon al nostru, fiind alegerea potrivită pentru momente
                                speciale alături de familie, prieteni, colegi de serviciu sau parteneri de afaceri.
                            </p>

                            <div className="venue-details-grid">
                                <div className="detail-item">
                                    <strong>Tipuri de evenimente:</strong>
                                    <span>Nuntă, botez, petrecere aniversară, petrecere corporate, lansări de produse, conferințe, recepții.</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Dotări:</strong>
                                    <span>Acces dedicat, garderobă, terasă, ring central (~60 mp), scenă artiști, candelabre argintii, instalații LED, climatizare aer proaspăt, loc prezidiu.</span>
                                </div>
                            </div>

                            <ul className="venue-specs">
                                <li><Users size={18} /> Capacitate recomandată: <strong>155 persoane</strong></li>
                                <li><Shield size={18} /> Poziție: <strong>Etaj</strong></li>
                                <li><Wind size={18} /> Climatizare cu aer proaspăt</li>
                            </ul>
                        </div>
                        <div className="venue-media-side">
                            {/* Placeholder Video */}
                            <div className="venue-video-wrapper">
                                <iframe
                                    src="https://player.vimeo.com/video/559543560"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title="Prezentare Salon Venetia"
                                ></iframe>
                            </div>

                            <ImageCarousel
                                images={[
                                    "/assets/saloane/venetia/Salon-Venetia-Good.jpg",
                                    "/assets/saloane/venetia/Salon-Venetia-Candy-Bar-eveniment-2.jpg",
                                    "/assets/saloane/venetia/Salon-Venetia-decor-masa-1.jpg",
                                    "/assets/saloane/venetia/Salon-Venetia-masa-miri-1-1.jpg"
                                ]}
                                alt="Salon Venetia"
                            />
                        </div>
                    </div>
                </div>

                <div className="separator"></div>

                {/* --- SALON ROMA --- */}
                <div className="venue-section reversed" id="roma">
                    <div className="venue-content-wrapper">
                        <div className="venue-text-side">
                            <h2 className="venue-title">Salon Roma</h2>
                            <p className="venue-desc">
                                Cu o capacitate ce poate atinge <strong>200 de invitați</strong> în cazul organizării de evenimente private,
                                Salonul Roma este cel mai grandios salon al nostru, fiind alegerea potrivită pentru momente
                                cu adevărat speciale din viața unei familii și nu numai.
                            </p>

                            <div className="venue-details-grid">
                                <div className="detail-item">
                                    <strong>Tipuri de evenimente:</strong>
                                    <span>Nuntă, botez, petrecere aniversară, petrecere corporate, lansări de produse, conferințe, recepții.</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Dotări:</strong>
                                    <span>Acces dedicat, garderobă, terasă, ring central (~60 mp), scenă artiști, candelabre aurii, instalații LED, climatizare aer proaspăt, loc prezidiu.</span>
                                </div>
                            </div>

                            <ul className="venue-specs">
                                <li><Users size={18} /> Capacitate recomandată: <strong>175 persoane</strong></li>
                                <li><Shield size={18} /> Poziție: <strong>Etaj</strong></li>
                                <li><Check size={18} /> Antreu primire invitați</li>
                            </ul>
                        </div>
                        <div className="venue-media-side">
                            {/* Placeholder Video */}
                            <div className="venue-video-wrapper">
                                <iframe
                                    src="https://player.vimeo.com/video/559543520"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title="Prezentare Salon Roma"
                                ></iframe>
                            </div>

                            <ImageCarousel
                                images={[
                                    "/assets/saloane/roma/Salon-Roma-masa-1-1.jpg",
                                    "/assets/saloane/roma/S-Roma-primire-1-1.jpg",
                                    "/assets/saloane/roma/Salon-Roma-decor-masa-1-1.jpg",
                                    "/assets/saloane/roma/Salon-Roma-artisitic-decor-2.jpg",
                                    "/assets/saloane/roma/Salon-Roma-masa-mireasa-1.jpg",
                                    "/assets/saloane/roma/Salon-Roma-masa-mireasa4.jpg",
                                    "/assets/saloane/roma/S-Roma-primire-2-1.jpg"
                                ]}
                                alt="Salon Roma"
                            />
                        </div>
                    </div>
                </div>

                <div className="separator"></div>

                {/* --- SALON FLORENTA --- */}
                <div className="venue-section" id="florenta">
                    <div className="venue-content-wrapper">
                        <div className="venue-text-side">
                            <h2 className="venue-title">Salon Florența</h2>
                            <p className="venue-desc">
                                Cu o capacitate ce poate atinge <strong>170 de invitați</strong> în cazul organizării de evenimente private,
                                Salonul Florența este cel mai confortabil salon al nostru, fiind alegerea potrivită pentru momente
                                speciale alături de familie, prieteni, colegi de serviciu sau parteneri de afaceri.
                            </p>

                            <div className="venue-details-grid">
                                <div className="detail-item">
                                    <strong>Tipuri de evenimente:</strong>
                                    <span>Nuntă, botez, petrecere aniversară, petrecere corporate, lansări de produse, conferințe, recepții.</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Dotări:</strong>
                                    <span>Acces dedicat, garderobă, terasă, ring central (~60 mp), scenă artiști, candelabre aurii, instalație LED, climatizare aer proaspăt, loc prezidiu.</span>
                                </div>
                            </div>

                            <ul className="venue-specs">
                                <li><Users size={18} /> Capacitate recomandată: <strong>155 persoane</strong></li>
                                <li><Shield size={18} /> Poziție: <strong>Parter</strong></li>
                                <li><Check size={18} /> Zonă primire clienți</li>
                            </ul>
                        </div>
                        <div className="venue-media-side">
                            {/* Placeholder Video */}
                            <div className="venue-video-wrapper">
                                <iframe
                                    src="https://player.vimeo.com/video/559543628"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title="Prezentare Salon Florenta"
                                ></iframe>
                            </div>

                            <ImageCarousel
                                images={[
                                    "/assets/saloane/florenta/SALON-CREM-MASA-MIRI-1-1.jpg",
                                    "/assets/saloane/florenta/SALON-CREM-DECORATIUNI-1.jpg",
                                    "/assets/saloane/florenta/SALON-CREM-MASA-DECOR2-1.jpg",
                                    "/assets/saloane/florenta/Salon-Florenta-masa-decor-1-1.jpg",
                                    "/assets/saloane/florenta/SALON-CREM-DECORATIUNI-3-1.jpg",
                                    "/assets/saloane/florenta/Salon-Florenta-masa-miri-2.jpg"
                                ]}
                                alt="Salon Florenta"
                            />
                        </div>
                    </div>
                </div>

                <div className="separator"></div>

                <VenueAvailability />
            </div>
        </div>
    );
};

export default Saloane;
