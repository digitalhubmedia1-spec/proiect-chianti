import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on home page
    if (pathnames.length === 0) {
        return null;
    }

    const breadcrumbNameMap = {
        'produse': 'Comandă Mâncare',
        'catering': 'Catering',
        'meniuri': 'Meniuri Evenimente',
        'saloane': 'Saloane',
        'contact': 'Contact',
        'termeni': 'Termeni și Condiții',
        'confidentialitate': 'Politica de Confidențialitate',
        'anulare': 'Politica de Anulare și Retur',
        'livrare': 'Politica de Livrare',
        'comercializare': 'Politici de Comercializare'
    };

    return (
        <nav aria-label="breadcrumb" className="breadcrumb-nav">
            <div className="container">
                <ol className="breadcrumb-list">
                    <li className="breadcrumb-item">
                        <Link to="/">
                            <Home size={16} />
                            <span className="sr-only">Acasă</span>
                        </Link>
                    </li>
                    {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1;
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const name = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                        return (
                            <li key={to} className={`breadcrumb-item ${last ? 'active' : ''}`}>
                                <ChevronRight size={14} className="breadcrumb-separator" />
                                {last ? (
                                    <span aria-current="page">{name}</span>
                                ) : (
                                    <Link to={to}>{name}</Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
};

export default Breadcrumbs;
