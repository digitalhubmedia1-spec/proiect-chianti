import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Star } from 'lucide-react';
import SEO from '../components/SEO';
import './Home.css';

const TESTIMONIALS = [
    {
        id: 1,
        name: "Maria Popescu",
        role: "Nuntă, 2023",
        text: "O experiență absolut minunată! Atenția la detalii și calitatea preparatelor ne-au impresionat profund pe noi și pe invitații noștri.",
        rating: 5
    },
    {
        id: 2,
        name: "Andrei Ionescu",
        role: "Eveniment Corporate",
        text: "Cel mai bun serviciu de catering din Roman. Profesionalism desăvârșit și o prezentare impecabilă.",
        rating: 5
    },
    {
        id: 3,
        name: "Elena Dumitrescu",
        role: "Botez, 2022",
        text: "Saloanele sunt superbe, iar mâncarea a fost deliciul serii. Recomandăm cu toată încrederea!",
        rating: 5
    },
    {
        id: 4,
        name: "George Stan",
        role: "Aniversare, 2023",
        text: "Nu am cuvinte să descriu cât de gustos a fost totul. O echipă de profesioniști!",
        rating: 5
    },
    {
        id: 5,
        name: "Cristina Radu",
        role: "Cununie, 2023",
        text: "Organizare ireproșabilă. Mulțumim Chianti pentru că ați făcut ziua noastră specială.",
        rating: 5
    },
    {
        id: 6,
        name: "Alexandru M",
        role: "Petrecere Privată",
        text: "Cea mai bună mâncare pe care am gustat-o la un eveniment. Recomand 100%!",
        rating: 5
    }
];

const Home = () => {
    return (
        <div className="home-page">
            {/* 1. Refined Main Hero Section */}
            <section className="hero">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <span className="hero-badge">Bine ați venit la Chianti</span>
                    <h1 className="hero-title">Experiențe Culinare & <br />Evenimente de Neuitat</h1>
                    <p className="hero-subtitle">Gustul autentic și rafinamentul se întâlnesc în inima orașului Roman.</p>
                    <div className="hero-actions">
                        <Link to="/produse" className="btn btn-primary btn-lg pulse-anim">
                            Comandă Mâncare
                        </Link>
                        <Link to="/saloane" className="btn btn-outline btn-lg">
                            Rezervă Salon
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Services Section - Links as Buttons */}
            <section className="section services">
                <div className="container">
                    <h2 className="section-title">Serviciile Noastre</h2>
                    <div className="services-grid">
                        <div className="service-card">
                            <h3>Servicii Evenimente</h3>
                            <p>Selectează serviciile preferate și cere o ofertă personalizată pentru evenimentul dorit.</p>
                            <Link to="/servicii-evenimente" className="btn btn-ghost">Vezi mai mult &rarr;</Link>
                        </div>
                        <div className="service-card">
                            <h3>Comandă Mâncare</h3>
                            <p>Platouri delicioase pentru petreceri sau birou. Comandă cu minim 48h înainte.</p>
                            <Link to="/produse" className="btn btn-ghost">Vezi produsele &rarr;</Link>
                        </div>
                        <div className="service-card">
                            <h3>Rezervă Salon</h3>
                            <p>Organizează evenimentul mult dorit în unul din cele trei saloane elegante.</p>
                            <Link to="/saloane" className="btn btn-ghost">Vezi saloane &rarr;</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. New Event Services Section */}
            <section className="section events-features">
                <div className="container">
                    <div className="events-header-modern">
                        <h2>Preluăm comenzi pentru <span className="highlight">Nunți, Botezuri, Aniversări, Corporate</span></h2>
                        <div className="divider-center"></div>
                        <p>Cere mai jos o ofertă personalizată! Dacă nu știai deja, noi suntem singura companie din zonă dedicată serviciilor de catering și organizării de evenimente.</p>
                    </div>

                    <div className="events-gallery">
                        <div className="gallery-item">
                            <img src="https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Catering Service" />
                        </div>
                        <div className="gallery-item">
                            <img src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Elegant Dining" />
                        </div>
                        <div className="gallery-item">
                            <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Buffet Setup" />
                        </div>
                        <div className="gallery-item">
                            <img src="https://images.unsplash.com/photo-1520342868574-5fa3804e551c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Waiters Serving" />
                        </div>
                    </div>

                    <div className="features-grid">
                        <div className="feature-column">
                            <h3>Servicii integrate</h3>
                            <p>Casa Chianti vă pune la dispoziție tot ce aveți nevoie pentru organizarea unui eveniment: pachete de meniuri atent selecționate, opțiuni multiple pentru decorațiuni, acces la cele mai deosebite formații din zonă...</p>
                        </div>
                        <div className="feature-column">
                            <h3>Meniu personalizat</h3>
                            <p>Orice client și eveniment este unic. De aceea, ne-am gândit să fim deschiși și să oferim întotdeauna clienților posibilitatea de a-și personaliza meniurile în funcție de bugetul asumat...</p>
                        </div>
                        <div className="feature-column">
                            <h3>Saloane dedicate</h3>
                            <p>Fiecare dintre cele 3 Saloane de evenimente ale casei noastre este unic prin confortul, designul și eleganța, fapt confirmat de cele peste 1950 de cupluri care au ales să își organizeze aici evenimentele...</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Dual CTA Hero Section */}
            <section className="cta-dual-section">
                <div className="cta-overlay"></div>
                <div className="container cta-content">
                    <div className="cta-block">
                        <h2>Planifici un Eveniment?</h2>
                        <p>Descoperă saloanele noastre create special pentru momente memorabile.</p>
                        <Link to="/saloane" className="btn btn-red btn-lg">Vezi Saloane Evenimente</Link>
                    </div>
                    <div className="cta-divider"></div>
                    <div className="cta-block">
                        <h2>Personalizează Totul</h2>
                        <p>Folosește configuratorul nostru pentru a crea meniul perfect pentru nunta ta.</p>
                        <Link to="/configurator" className="btn btn-red btn-lg">Configurator Meniuri Nuntă</Link>
                    </div>
                </div>
            </section>

            {/* 5. Testimonials Section - Continuous Slider */}
            <section className="section testimonials-section">
                <div className="container-fluid">
                    <h2 className="section-title">Ce spun clienții noștri</h2>
                    <div className="marquee-container">
                        <div className="marquee-track">
                            {/* Set 1 */}
                            {TESTIMONIALS.map((t) => (
                                <div key={`orig-${t.id}`} className="testimonial-card-light marquee-item">
                                    <div className="stars">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={16} fill="#c0a062" color="#c0a062" />
                                        ))}
                                    </div>
                                    <p className="testimonial-text">"{t.text}"</p>
                                    <div className="testimonial-author">
                                        <h4>{t.name}</h4>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                            ))}
                            {/* Set 2 (Duplicate for Loop) */}
                            {TESTIMONIALS.map((t) => (
                                <div key={`dup-${t.id}`} className="testimonial-card-light marquee-item">
                                    <div className="stars">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={16} fill="#c0a062" color="#c0a062" />
                                        ))}
                                    </div>
                                    <p className="testimonial-text">"{t.text}"</p>
                                    <div className="testimonial-author">
                                        <h4>{t.name}</h4>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Map & Info Section (Red Design) */}
            <section className="map-info-section">
                <div className="info-panel">
                    <h3>Cum ne găsești</h3>
                    <div className="info-item">
                        <MapPin className="info-icon" color="white" />
                        <p>Str. Mihai Viteazu 3 – 5, Roman</p>
                    </div>
                    <div className="info-item">
                        <Phone className="info-icon" color="white" />
                        <p>0729 881 854</p>
                    </div>
                    <div className="info-item">
                        <Mail className="info-icon" color="white" />
                        <p>comenzi@chianti.ro</p>
                    </div>

                    <div className="separator-line"></div>

                    <h3>Program de lucru</h3>
                    <div className="info-item">
                        <Clock className="info-icon" color="white" />
                        <div>
                            <p>Luni - Vineri: 10.00 – 16.00</p>
                            <p>Sâmbătă: 10.00 – 14.00</p>
                            <p>Duminică: 10.00 – 14.00</p>
                        </div>
                    </div>
                </div>
                <div className="map-container">
                    <iframe
                        title="Chianti Location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2703.5517176465363!2d26.92158631584852!3d46.93586337914597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4735546132338b25%3A0x889895171701550c!2sRoman%20Value%20Centre!5e0!3m2!1sen!2sro!4v1620000000000!5m2!1sen!2sro"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                    ></iframe>
                </div>
            </section>
        </div>
    );
};

export default Home;
