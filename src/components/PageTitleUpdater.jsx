import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTitleUpdater = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'Restaurant Chianti Roman'; // Default title

        // Static route mapping
        if (path === '/') title = 'Restaurant Chianti Roman';
        else if (path === '/produse') title = 'Meniu - Restaurant Chianti';
        else if (path === '/catering') title = 'Catering - Restaurant Chianti';
        else if (path === '/configurator') title = 'Configurator Meniu - Chianti';
        else if (path === '/saloane') title = 'Saloane & Evenimente - Chianti';
        else if (path === '/servicii-evenimente') title = 'Servicii Evenimente - Chianti';
        else if (path === '/blog') title = 'Blog - Restaurant Chianti';
        else if (path === '/contact') title = 'Contact - Restaurant Chianti';
        else if (path === '/login') title = 'Autentificare - Chianti';
        else if (path === '/register') title = 'Înregistrare - Chianti';
        else if (path === '/contul-meu') title = 'Contul Meu - Chianti';
        else if (path === '/cos') title = 'Coșul Meu - Chianti';
        else if (path === '/checkout') title = 'Finalizare Comandă - Chianti';

        // Legal pages
        else if (path === '/termeni') title = 'Termeni și Condiții - Chianti';
        else if (path === '/siguranta-datelor') title = 'Siguranța Datelor - Chianti';
        else if (path === '/confidentialitate') title = 'Confidențialitate - Chianti';
        else if (path === '/anulare') title = 'Politică Anulare - Chianti';
        else if (path === '/livrare') title = 'Politică Livrare - Chianti';
        else if (path === '/comercializare') title = 'Politică Comercializare - Chianti';

        // Careers
        else if (path === '/devino-livrator') title = 'Cariere - Chianti';

        // Admin
        else if (path.startsWith('/admin')) title = 'Admin Panel - Chianti';
        else if (path.startsWith('/driver')) title = 'Driver App - Chianti';

        // Dynamic routes handling (basic)
        else if (path.startsWith('/produs/')) title = 'Detalii Produs - Chianti';
        else if (path.startsWith('/blog/')) title = 'Articol Blog - Chianti';

        document.title = title;
    }, [location]);

    return null; // This component handles side effects only
};

export default PageTitleUpdater;
