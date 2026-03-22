import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import './Layout.css';
import '../animations.css';

const Layout = ({ children, qrMode: propQrMode }) => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const isQR = propQrMode || query.get('qr') === 'true';

    return (
        <div className="layout animated-site">
            <Header qrMode={isQR} />
            <Breadcrumbs />
            <main className="main-content">
                {/* Key ensures animation triggers on route change */}
                <div key={location.pathname} className="page-animate-enter">
                    {children}
                </div>
            </main>
            <Footer qrMode={isQR} />
        </div>
    );
};

export default Layout;
