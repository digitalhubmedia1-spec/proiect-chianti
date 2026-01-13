import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import './EventsServices.css';

const EventsServices = () => {
    const navigate = useNavigate();

    return (
        <div className="events-page">
            <SEO
                title="Servicii Evenimente Chianti"
                description="Organizează evenimentul perfect la Casa Chianti sau prin serviciile noastre de catering premium la locația ta."
                canonical="/servicii-evenimente"
            />

            <div className="events-hero">
                <div className="container">
                    <h1 className="events-title">SERVICII CATERING</h1>
                </div>
            </div>

            <div className="container events-content">
                <div className="text-section">
                    <p>
                        Vrei să îți organizezi evenimentul la <strong>Casa Chianti</strong> în unul dintre frumoasele noastre saloane sau vrei să venim noi la tine acasă și să îți livrăm acolo servicii complete de catering?
                    </p>
                    <p>
                        Oricum ai alege, echipa noastră îți va pune la dispoziție meniuri diversificate și servicii de catering complete pentru o experiență de neuitat.
                    </p>
                    <p>
                        <strong>Casa Chianti</strong> livrează meniuri pentru toate gusturile și buzunarele, rapid și în condiții sigure, oriunde ați dori să vă organizați un eveniment sau o masă în familie.
                    </p>
                    <p>
                        Pentru noi, aspectul contează la fel de mult ca gustul. Îți construim farfurii sau platouri personalizate, de diferite forme și în combinații inedite de gust.
                    </p>
                    <p>
                        Oferta de meniu se potrivește atât platourilor servite la masă, cât și bufeturilor.
                    </p>
                    <p>
                        Putem livra oriunde în zonă, fără să îți faci griji în privința organizării și a serviciului.
                    </p>
                </div>

                <div className="cta-section">
                    <button
                        className="btn btn-primary btn-lg cta-btn"
                        onClick={() => navigate('/saloane')}
                    >
                        Organizează evenimentul la Chianti
                    </button>

                    <button
                        className="btn btn-outline-primary btn-lg cta-btn"
                        onClick={() => navigate('/catering')}
                    >
                        Organizează evenimentul în altă locație
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventsServices;
