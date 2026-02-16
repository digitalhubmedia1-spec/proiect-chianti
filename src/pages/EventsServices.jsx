import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import heroBg from '../assets/hero_wedding.png';
import partyImg from '../assets/party_people.png';
import cateringImg from '../assets/catering_detail.png';
import EventWizard from '../components/EventWizard';
import './EventsServices.css';

const EventsServices = () => {
    const navigate = useNavigate();
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardType, setWizardType] = useState(''); // 'local' or 'remote'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToOffer = () => {
        const element = document.getElementById('oferta');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const openWizard = (type) => {
        setWizardType(type);
        setWizardOpen(true);
    };

    return (
        <div className="events-page">
            <SEO
                title="Servicii Evenimente Chianti - Momente de Neuitat"
                description="Organizează evenimentul perfect la Casa Chianti sau bucură-te de servicii de catering premium la tine acasă. Nunți, botezuri, petreceri private."
                canonical="/servicii-evenimente"
            />

            {/* Hero Section */}
            <div className="events-hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">SERVICII EVENIMENTE & CATERING</h1>
                    <p className="hero-subtitle">Transformăm fiecare ocazie într-o amintire prețioasă.</p>
                    <button className="btn btn-hero" onClick={scrollToOffer}>Solicită Ofertă</button>
                </div>
            </div>

            <div className="container events-container">

                {/* Section 1: Intro with Image */}
                <div className="event-section">
                    <div className="event-image-wrapper inview-fade-right">
                        <img src={partyImg} alt="Oameni fericiți la petrecere" className="event-img" />
                    </div>
                    <div className="event-text-wrapper inview-fade-left">
                        <h2>Evenimentul Tău, Prioritatea Noastră</h2>
                        <p>
                            Vrei să îți organizezi evenimentul la <strong>Casa Chianti</strong> în unul dintre frumoasele noastre saloane sau vrei să venim noi la tine acasă și să îți livrăm acolo servicii complete de catering?
                        </p>
                        <p>
                            Indiferent de alegere, echipa noastră îți pune la dispoziție meniuri diversificate și o organizare impecabilă pentru o experiență de neuitat. De la nunți de vis la petreceri private relaxate, suntem aici pentru tine.
                        </p>
                    </div>
                </div>

                {/* Section 2: Catering Details with Image */}
                <div className="event-section reverse">
                    <div className="event-image-wrapper inview-fade-left">
                        <img src={cateringImg} alt="Platouri catering premium" className="event-img" />
                    </div>
                    <div className="event-text-wrapper inview-fade-right">
                        <h2>Gust și Rafinament</h2>
                        <p>
                            <strong>Casa Chianti</strong> livrează meniuri pentru toate gusturile și buzunarele, rapid și în condiții sigure, oriunde ați dori să vă organizați un eveniment sau o masă în familie.
                        </p>
                        <p>
                            Pentru noi, aspectul contează la fel de mult ca gustul. Îți construim farfurii sau platouri personalizate, de diferite forme și în combinații inedite de gusturi. Oferta noastră se potrivește perfect atât pentru servirea la masă, cât și pentru bufeturi suedeze elegante.
                        </p>
                    </div>
                </div>

                {/* Section 3: Final Info & CTAs */}
                <div className="event-final-info text-center" id="oferta">
                    <h3>Livrare și Organizare Fără Griji</h3>
                    <p>Putem livra oriunde în zonă, fără să îți faci griji în privința organizării și a serviciului. Lasă detaliile în seama noastră și bucură-te de petrecere alături de invitații tăi.</p>

                    <div className="cta-section-cards">
                        <div className="cta-card">
                            <h3>La Noi Acasă</h3>
                            <button
                                className="btn btn-primary cta-action-btn"
                                onClick={() => openWizard('local')}
                            >
                                Organizează la Chianti
                            </button>
                        </div>
                        <div className="cta-card secondary">
                            <h3>La Tine Acasă</h3>
                            <button
                                className="btn btn-outline-primary cta-action-btn"
                                onClick={() => openWizard('remote')}
                            >
                                Organizează în Altă Locație
                            </button>
                        </div>
                    </div>
                </div>

                {/* Wizard Component */}
                <EventWizard
                    isOpen={wizardOpen}
                    onClose={() => setWizardOpen(false)}
                    initialType={wizardType}
                />

            </div>
        </div>
    );
};

export default EventsServices;
