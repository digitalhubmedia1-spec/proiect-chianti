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
    // State for Contact & Basic Info
    const [contact, setContact] = useState({
        nume: '', prenume: '', telefon: '', email: '', data: ''
    });

    // State for Detailed Selections
    const [selections, setSelections] = useState({
        salon: 'Salon Roma',
        eventType: '',
        eventOtherType: '',
        guestCount: '',
        menuOptions: [],
        barOptions: [],
        music: [],
        photoVideo: [],
        decor: [],
        specialMoments: [],
        extraServices: [],
        agreement: false,
        terms: false
    });

    const [observations, setObservations] = useState('');

    // --- Handlers ---
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContact(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (category, value) => {
        setSelections(prev => {
            const currentList = prev[category];
            if (currentList.includes(value)) {
                return { ...prev, [category]: currentList.filter(item => item !== value) };
            } else {
                return { ...prev, [category]: [...currentList, value] };
            }
        });
    };

    const handleRadioChange = (category, value) => {
        setSelections(prev => ({ ...prev, [category]: value }));
    };

    const handleSimpleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSelections(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for critical fields
        if (!selections.terms) {
            alert('Te rugăm să accepți Termenii și Condițiile.');
            return;
        }

        const fullData = {
            type: 'Venue Reservation Request',
            ...contact,
            ...selections,
            observations
        };

        console.log('Sending venue reservation request:', fullData);
        // Here you would integrate with Supabase or Email service

        try {
            if (supabase) {
                const { error } = await supabase.from('event_requests').insert([{
                    salon: selections.salon,
                    event_type: selections.eventType === 'Other' ? selections.eventOtherType : selections.eventType,
                    date_primary: contact.data || null,
                    guests: 0, // Placeholder as input is range string
                    name: `${contact.nume} ${contact.prenume}`,
                    phone: contact.telefon,
                    email: contact.email,
                    message: JSON.stringify(fullData) // Clean JSON for admin parsing
                }]);
                if (error) console.error('Supabase error:', error);
            }
            alert('Cererea a fost trimisă! Veți primi o ofertă personalizată pe email.');
            // Reset form if needed
        } catch (err) {
            console.error(err);
            alert('Cererea a fost trimisă! Veți primi o ofertă personalizată pe email.');
        }
    };

    return (
        <form className="reservation-form" onSubmit={handleSubmit}>

            {/* 0. Salon & Data & Contact */}
            <div className="form-section">
                <h3>0. Detalii Generale & Contact</h3>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Salon Dorit <span className="required">*</span></label>
                    <select className="form-control" name="salon" value={selections.salon} onChange={handleSimpleChange}>
                        <option value="Salon Roma">Salon Roma (max 200 pers)</option>
                        <option value="Salon Veneția">Salon Veneția (max 170 pers)</option>
                        <option value="Salon Florența">Salon Florența (max 170 pers)</option>
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Nume <span className="required">*</span></label>
                        <input type="text" className="form-control" name="nume" value={contact.nume} onChange={handleContactChange} required />
                    </div>
                    <div className="form-group">
                        <label>Prenume <span className="required">*</span></label>
                        <input type="text" className="form-control" name="prenume" value={contact.prenume} onChange={handleContactChange} required />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Telefon <span className="required">*</span></label>
                        <input type="tel" className="form-control" name="telefon" value={contact.telefon} onChange={handleContactChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email <span className="required">*</span></label>
                        <input type="email" className="form-control" name="email" value={contact.email} onChange={handleContactChange} required />
                    </div>
                </div>

                <div className="form-group">
                    <label>Data Dorită <span className="required">*</span></label>
                    <input type="date" className="form-control" name="data" value={contact.data} onChange={handleContactChange} required />
                </div>
            </div>

            {/* 1. Tip Eveniment */}
            <div className="form-section">
                <h3>1. Tip Eveniment</h3>
                <div className="form-checkbox-group">
                    {['Nuntă', 'Botez', 'Aniversare', 'Corporate'].map(opt => (
                        <div key={opt} className="checkbox-item">
                            <input
                                type="radio"
                                id={`evt-${opt}`}
                                name="eventType"
                                checked={selections.eventType === opt}
                                onChange={() => handleRadioChange('eventType', opt)}
                            />
                            <label htmlFor={`evt-${opt}`}>{opt}</label>
                        </div>
                    ))}
                    <div className="checkbox-item">
                        <input
                            type="radio"
                            id="evt-other"
                            name="eventType"
                            checked={selections.eventType === 'Other'}
                            onChange={() => handleRadioChange('eventType', 'Other')}
                        />
                        <label htmlFor="evt-other">Alt tip:</label>
                        <input
                            type="text"
                            className="form-control"
                            style={{ marginLeft: '10px', padding: '4px 8px', width: '200px', display: 'inline-block' }}
                            value={selections.eventOtherType}
                            onChange={(e) => {
                                handleRadioChange('eventType', 'Other');
                                handleRadioChange('eventOtherType', e.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label>Număr estimativ invitați:</label>
                    <select
                        className="form-control"
                        value={selections.guestCount}
                        onChange={(e) => handleRadioChange('guestCount', e.target.value)}
                        required
                    >
                        <option value="">Selectează...</option>
                        <option value="sub 50">Sub 50</option>
                        <option value="50-100">50-100</option>
                        <option value="100-150">100-150</option>
                        <option value="150-170">150-170</option>
                        <option value="200">200 (Doar Salon Roma poate găzdui 200 pers)</option>
                    </select>
                </div>
            </div>

            {/* 2. Personalizare Meniu */}
            <div className="form-section">
                <h3>2. Personalizare Meniu</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Te rugăm să selectezi opțiunile dorite:</p>
                <div className="form-checkbox-group">
                    {[
                        'Doresc Pachetul Standard*',
                        'Doresc personalizarea meniului (ajustări)**',
                        'Meniu vegetarian / vegan',
                        'Meniu dedicat copiilor',
                        'Adaptare pentru alergii/intoleranțe',
                        'Degustare meniu (contra cost)'
                    ].map(item => (
                        <div key={item} className="checkbox-item">
                            <input
                                type="checkbox"
                                id={`menu-${item}`}
                                checked={selections.menuOptions.includes(item)}
                                onChange={() => handleCheckboxChange('menuOptions', item)}
                            />
                            <label htmlFor={`menu-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '1rem', fontStyle: 'italic' }}>
                    * Prin bifarea acestei opțiuni, vei primi pe e-mail, după rezervarea salonului, mai multe variante de meniuri standard.<br />
                    ** Prin bifarea acestei opțiuni, meniul poate fi personalizat conform preferințelor tale.
                </div>
            </div>

            {/* 3. Baruri Tematice */}
            <div className="form-section">
                <h3>3. Baruri Tematice</h3>
                <div className="form-checkbox-group">
                    {['Open bar', 'Candy bar', 'Cheese bar', 'Fruit bar'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`bar-${item}`} checked={selections.barOptions.includes(item)} onChange={() => handleCheckboxChange('barOptions', item)} />
                            <label htmlFor={`bar-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Muzica */}
            <div className="form-section">
                <h3>4. Muzică & Divertisment</h3>
                <div className="form-checkbox-group">
                    {['DJ', 'Formație live', 'Sonorizare profesională', 'Lumini scenice', 'Efecte speciale'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`music-${item}`} checked={selections.music.includes(item)} onChange={() => handleCheckboxChange('music', item)} />
                            <label htmlFor={`music-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Foto & Video */}
            <div className="form-section">
                <h3>5. Foto & Video</h3>
                <div className="form-checkbox-group">
                    {['Fotograf', 'Videograf', 'Filmare cu dronă', 'Photo corner', 'Cabină foto', 'Album foto personalizat'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`fv-${item}`} checked={selections.photoVideo.includes(item)} onChange={() => handleCheckboxChange('photoVideo', item)} />
                            <label htmlFor={`fv-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. Decor */}
            <div className="form-section">
                <h3>6. Decor & Ambianță</h3>
                <div className="form-checkbox-group">
                    {['Decor sală', 'Aranjamente florale', 'Decor mese invitați', 'Panou foto', 'Lumini ambientale', 'Tematică personalizată'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`decor-${item}`} checked={selections.decor.includes(item)} onChange={() => handleCheckboxChange('decor', item)} />
                            <label htmlFor={`decor-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7. Momente Speciale */}
            <div className="form-section">
                <h3>7. Momente Speciale</h3>
                <div className="form-checkbox-group">
                    {['Tort eveniment', 'Șampanie întâmpinare', 'Foc de artificii', 'Show artistic / dansatori', 'Moment tematic'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`spec-${item}`} checked={selections.specialMoments.includes(item)} onChange={() => handleCheckboxChange('specialMoments', item)} />
                            <label htmlFor={`spec-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 8. Extra */}
            <div className="form-section">
                <h3>8. Servicii Suplimentare</h3>
                <div className="form-checkbox-group">
                    {['Wedding planner', 'Coordonare ziua evenimentului', 'Consultanță organizare', 'Personalizare completă eveniment', 'Invitații & mărturii'].map(item => (
                        <div key={item} className="checkbox-item">
                            <input type="checkbox" id={`extra-${item}`} checked={selections.extraServices.includes(item)} onChange={() => handleCheckboxChange('extraServices', item)} />
                            <label htmlFor={`extra-${item}`}>{item}</label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Observatii */}
            <div className="form-section">
                <h3>📝 Observații Client</h3>
                <div className="form-group">
                    <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Alte detalii importante..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                    ></textarea>
                </div>
            </div>

            <div className="form-checkbox-group" style={{ margin: '2rem 0' }}>
                <div className="checkbox-item">
                    <input
                        type="checkbox"
                        id="terms-accept"
                        name="terms"
                        checked={selections.terms}
                        onChange={handleSimpleChange}
                        required
                    />
                    <label htmlFor="terms-accept">Sunt de acord cu <Link to="/termeni" className="terms-link">Termenii și Condițiile</Link> și <Link to="/confidentialitate" className="terms-link">Politica de Confidențialitate</Link>.</label>
                </div>
            </div>

            <button type="submit" className="btn-submit-verify" style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}>Trimite Cerere Ofertă</button>
            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>După trimiterea formularului, veți primi o ofertă personalizată adaptată selecției dvs.</p>
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

                    {/* CTA Inserted Middle */}
                    <div className="configurator-cta">
                        <p>Ai găsit data perfectă? Configurează meniul evenimentului&nbsp;tău!</p>
                        <Link to="/configurator" className="btn btn-primary btn-lg">Configurează Meniu Eveniment</Link>
                    </div>

                    {/* Right Column: Form */}
                    <div className="availability-right">
                        <ReservationForm />
                    </div>
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
