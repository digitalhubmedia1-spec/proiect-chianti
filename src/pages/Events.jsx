import React from 'react';
import { Link } from 'react-router-dom'; // Added import
import { Calendar, Users, Music, Star, ArrowRight, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';
import './Events.css';

const Events = () => {
    return (
        <div className="events-page">
            <SEO
                title="Organizare Evenimente & Nunți - Restaurant Chianti Roman"
                description="Găzduim evenimente speciale, nunți, botezuri și petreceri private în saloanele noastre elegante din Roman. Meniuri personalizate și servicii premium."
                canonical="/evenimente"
            />
            <div className="events-header">
                <div className="container">
                    <h1 className="page-title">Meniuri Evenimente</h1>
                    <p className="page-subtitle">Preparate culinare de excepție pentru momente speciale</p>
                </div>
            </div>

            <div className="container events-content">
                <div className="event-card">
                    <div className="card-icon">
                        <FileText size={48} />
                    </div>
                    <h2>Meniuri Evenimente Sezon 2021/2022</h2>
                    <p>
                        Vă invităm să vizionați preparate culinare de excepție ambalate în meniuri ce se pretează
                        pentru orice tip de eveniment. Fie că organizați o NUNTĂ, un BOTEZ, o ANIVERSARE sau o
                        MASĂ cu prietenii, pentru orice EVENIMENT avem întotdeauna meniurile potrivite.
                    </p>
                    <p>
                        Dați un click mai jos și completați meniurile favorite și NOI o să vă consiliem gratuit
                        pentru a putea obține cea mai bună OFERTĂ de PREȚ. Să începem…
                    </p>
                    <button className="btn btn-primary">Vezi Meniuri Evenimente</button>
                </div>

                <div className="event-card">
                    <div className="card-icon">
                        <Settings size={48} />
                    </div>
                    <h2>Configurator Meniuri Nuntă</h2>
                    <p>
                        Wow! Aici îți vei putea configura TU SINGUR meniul pentru NUNTA mult dorită și, în consecință,
                        vei putea obține cel mai bun preț pentru finalizarea unui plan de catering profesional care
                        să se potrivească perfect cerințelor tale.
                    </p>
                    <p>
                        Tu dai câteva click-uri și noi ne vom ocupa pentru tine…
                    </p>
                    <Link to="/configurator" className="btn btn-primary">Configurează Meniul Dorit</Link>
                </div>
            </div>
        </div>
    );
};

export default Events;
