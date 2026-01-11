import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import logoAlb from '../assets/logo/logoalb.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">

                    {/* Column 1: Brand & Info */}
                    <div className="footer-col brand-col">
                        <div className="footer-logo">
                            <img
                                src={logoAlb}
                                alt="Casa Chianti"
                                className="logo-image-footer"
                                style={{ maxHeight: '80px', width: 'auto' }}
                            />
                        </div>
                        <p className="brand-desc">
                            Singura companie din zona Roman dedicată exclusiv serviciilor de catering pentru evenimente
                        </p>

                        <div className="payment-methods">
                            <p>Plătește în siguranță prin</p>
                            <div className="payment-logos">
                                <div className="pay-logo netopia">NETOPIA</div>
                                <div className="pay-logo mc">Mastercard</div>
                                <div className="pay-logo visa">VISA</div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: NAVIGARE RAPIDA */}
                    <div className="footer-col">
                        <h3>NAVIGARE</h3>
                        <ul className="footer-links">
                            <li><a href="/">Acasă</a></li>
                            <li><a href="/produse">Comandă Mâncare</a></li>
                            <li><a href="/catering">Catering Evenimente</a></li>
                            <li><a href="/configurator">Configurator Meniu</a></li>
                            <li><a href="/saloane">Saloane Evenimente</a></li>
                            <li><a href="/blog">Blog</a></li>
                            <li><a href="/contact">Contact</a></li>
                            <li className="mt-2 pt-2 border-top border-secondary"><a href="/devino-livrator" style={{ color: '#e74c3c' }}>🚀 Devino Livrator Chianti</a></li>
                        </ul>
                    </div>

                    {/* Column 3: TERMENI ȘI CONDIȚII */}
                    <div className="footer-col">
                        <h3>TERMENI ȘI CONDIȚII</h3>
                        <ul className="footer-links">
                            <li><a href="/termeni">Termeni și Condiții</a></li>
                            <li><a href="/siguranta-datelor">Informații privind siguranța datelor clienților</a></li>
                            <li><a href="/confidentialitate">Politica de confidențialitate</a></li>
                            <li><a href="/anulare">Politica de anulare și retur</a></li>
                            <li><a href="/livrare">Politica de livrare</a></li>
                            <li><a href="/comercializare">Politici de comercializare</a></li>
                        </ul>
                    </div>

                </div>

                <div className="footer-bottom">
                    <p>
                        © 2025 Chianti. Toate drepturile rezervate. | Designed & Developed by <a href="https://digitalhubmedia.ro" target="_blank" rel="noopener noreferrer">DigitalHub Media</a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
