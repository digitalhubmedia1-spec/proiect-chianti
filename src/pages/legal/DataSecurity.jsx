import React from 'react';
import './Terms.css';

const DataSecurity = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">INFORMAȚII PRIVIND SIGURANȚA DATELOR CLIENȚILOR</h1>
            <h2 className="text-center mb-4">POLITICA DE COOKIE-URI</h2>
            <p className="text-center terms-update-date">Versiune actualizată la data de: 01.03.2026</p>

            <section className="mb-5 terms-section">
                <p>Pentru a-ți oferi o experiență de navigare fluidă pe platforma Chianti Catering și pentru a permite funcționarea corectă a serviciilor noastre (de la comanda rapidă a prânzului până la solicitarea ofertelor pentru evenimente), utilizăm module cookie și tehnologii similare.</p>
                <p>Acestea sunt fișiere text de mici dimensiuni stocate în browserul tău. Unele sunt șterse automat după închiderea sesiunii (cookie-uri de sesiune), în timp ce altele rămân stocate pe dispozitivul tău pentru a te recunoaște la o vizită ulterioară (cookie-uri persistente).</p>
                <p>În conformitate cu reglementările legale aplicabile (GDPR și Directiva ePrivacy), modulele cookie care nu sunt strict necesare tehnic funcționează doar pe baza consimțământului tău explicit.</p>
                <p>Pentru o transparență totală, clasificăm cookie-urile pe care le folosim în următoarele categorii:</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>1. Cookie-uri strict necesare (Tehnice)</h3>
                <p>Aceste module sunt indispensabile pentru navigarea pe site și utilizarea funcțiilor de bază. Fără ele, platforma Chianti nu poate funcționa corect.</p>
                <ul>
                    <li><strong>Cum le folosim:</strong> Le utilizăm pentru a-ți păstra active produsele în coș (de exemplu, când selectezi preparate din meniul zilnic „Comenzi Rapide” sau adaugi platouri în “pre-comandă”) chiar dacă navighezi pe alte pagini, pentru a reține stadiul completării unui formular de rezervare pentru saloane sau pentru a stoca opțiunea ta privind consimțământul cookie-urilor.</li>
                    <li><strong>Temei legal:</strong> Fiind vitale pentru funcționarea platformei și furnizarea serviciului cerut de tine, acestea sunt activate implicit și nu necesită consimțământul tău prealabil. Ele nu stochează informații care te pot identifica personal.</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>2. Cookie-uri de preferințe și funcționalitate</h3>
                <p>Aceste cookie-uri permit site-ului să rețină alegerile pe care le faci (cum ar fi datele de conectare pentru a te autentifica automat la următoarea vizită sau preferințele de afișare).</p>
                <ul>
                    <li><strong>Cum le folosim:</strong> Scopul lor este să îți ofere o experiență personalizată și mai rapidă, scutindu-te de reintroducerea datelor de fiecare dată când plasezi o nouă comandă de catering.</li>
                    <li><strong>Temei legal:</strong> Aceste cookie-uri sunt activate doar cu acordul tău.</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>3. Cookie-uri de statistică și analiză</h3>
                <p>Aceste module colectează informații agregate, anonimizate, despre modul în care vizitatorii interacționează cu site-ul nostru.</p>
                <ul>
                    <li><strong>Cum le folosim:</strong> Ne ajută să înțelegem ce pagini sunt cele mai vizitate (ex. dacă utilizatorii preferă secțiunea de "Rezervare Salon" sau pe cea de "Comandă Mâncare"), dacă întâmpină erori și cum putem optimiza structura platformei pentru a face plasarea comenzilor mai intuitivă.</li>
                    <li><strong>Temei legal:</strong> Aceste cookie-uri sunt activate doar cu acordul tău.</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>4. Cookie-uri de marketing și personalizare</h3>
                <p>Aceste module sunt setate de noi sau de partenerii noștri de publicitate pentru a-ți construi un profil de interese și a-ți afișa reclame relevante pe alte site-uri.</p>
                <ul>
                    <li><strong>Cum le folosim:</strong> De exemplu, dacă ai adăugat un platou pentru petreceri în coș dar nu ai finalizat pre-comanda, aceste cookie-uri ne permit să te re-țintim (retargeting) cu un memento vizual pe alte platforme (ex. rețele sociale) pentru a nu rata planificarea evenimentului.</li>
                    <li><strong>Temei legal:</strong> Aceste cookie-uri sunt activate doar cu acordul tău.</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>Gestionarea preferințelor și Opoziția la utilizarea cookie-urilor</h3>
                <p>Ai control total asupra datelor tale. Dacă dorești să modifici preferințele sau să retragi consimțământul (opt-out) pentru cookie-urile care nu sunt strict necesare, o poți face în orice moment:</p>
                <ol>
                    <li><strong>Din platforma noastră:</strong> Accesând panoul de setări cookie-uri (widget-ul dedicat aflat în subsolul site-ului), poți activa sau dezactiva modulele de Statistică, Preferințe sau Marketing cu un simplu click.</li>
                    <li><strong>Din setările browserului:</strong> Poți regla opțiunile browserului tău pentru a bloca, a fi informat sau a șterge cookie-urile stocate. Reține că blocarea din browser a cookie-urilor strict necesare poate duce la imposibilitatea de a plasa comenzi sau de a rezerva saloane pe site-ul nostru.</li>
                </ol>
                <p>Dacă folosești funcția de ștergere totală a cookie-urilor din browser sau dacă accesezi platforma de pe un alt dispozitiv/browser, platforma te va considera un vizitator nou și îți va solicita din nou setarea preferințelor.</p>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <p>Ai nevoie de asistență tehnică privind datele tale? Ne poți contacta oricând la <a href="mailto:suport@chianti.ro" className="terms-link">suport@chianti.ro</a> pentru detalii suplimentare referitoare la trasabilitatea datelor tale pe platforma noastră.</p>
            </section>
        </div>
    );
};

export default DataSecurity;
