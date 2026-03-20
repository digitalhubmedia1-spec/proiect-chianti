import React from 'react';
import './Terms.css';

const ConfidentialityPage = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">POLITICA DE CONFIDENȚIALITATE</h1>
            <p className="text-center terms-update-date">Versiune_01.03.2026</p>

            <section className="mb-5 terms-section">
                <p>Dragul nostru client,</p>
                <p>Suntem încântați că manifești interes referitor la protecția datelor cu caracter personal. Dorim să îți oferim o imagine de ansamblu ușor de înțeles asupra procesului nostru de protecție a datelor.</p>
                <p>Scopul nostru este să oferim clienților o experiență uimitoare, ceea ce înseamnă, de asemenea, că poți avea încredere în noi, că suntem întotdeauna transparenți și sinceri. Încrederea pe care o acorzi produselor și serviciilor noastre este motivul pentru care îți putem oferi această experiență. Dorim să îți mulțumim pentru această cooperare.</p>
                
                <h4>Cine suntem</h4>
                <p>Suntem <strong>CHIANTI CATERING SRL</strong>, o societate cu răspundere limitată, organizată și funcționând în baza legilor din România, cu sediul social în Roman, Str. Mihai Viteazu 3-5, Jud. Neamț, având CUI 17707040 și fiind înregistrată la Oficiul Național al Registrului Comerțului sub numărul J27/984/2005, dar de obicei folosim doar numele Chianti Catering.</p>
                <p>Ne poți contacta întotdeauna prin următoarele metode:</p>
                <ul>
                    <li>În scris, la adresa sediului nostru din Roman, Str. Mihai Viteazu 3-5, Jud. Neamț.</li>
                    <li>Prin e-mail la adresa: <a href="mailto:suport@chianti.ro" className="terms-link">suport@chianti.ro</a></li>
                </ul>
                <p>În timp ce navighezi pe site-ul nostru, te înregistrezi, plasezi o comandă de mâncare, soliciți o ofertă pentru evenimente sau rezervi un salon, îți exprimi acordul cu această politică de confidențialitate.</p>
                <p>În calitatea noastră de operator de date, determinăm modul în care prelucrăm datele personale, în ce scopuri și prin ce mijloace. Deși încunoștințarea ta cu privire la toate informațiile de mai jos este impusa de lege, facem acest lucru, în primul rând, din convingerea că un parteneriat trebuie să fie întotdeauna sincer.</p>
                <p>Dacă ai întrebări cu privire la protecția datelor de către Chianti Catering SRL, poți contacta în orice moment managerul nostru, trimițând un e-mail la <a href="mailto:comenzi@chianti.ro" className="terms-link">comenzi@chianti.ro</a>.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>Domeniu de aplicare</h3>
                <p>Prezenta politică de confidențialitate furnizează informații despre prelucrarea datelor cu caracter personal ale Clienților/Utilizatorilor platformei Chianti Catering SRL care interacționează cu noile noastre servicii, inclusiv:</p>
                <ul>
                    <li>Comanda de mâncare (platouri pentru petreceri sau birou, precomenzi cu 48h înainte).</li>
                    <li>Rezervarea unuia din cele trei saloane elegante pentru evenimente.</li>
                    <li>Solicitarea de oferte personalizate pentru "Servicii Evenimente".</li>
                    <li>Comenzile pentru programul nostru zilnic de prânz „Ieftin și Bun” (Luni–Vineri, 11:00–15:00).</li>
                    <li>Opțiunile de livrare la domiciliu, ridicare rapidă sau servire direct în restaurant.</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>Confidențialitatea este dreptul tău și ai posibilitatea de a alege</h3>
                <p>În calitate de client, poți alege ce informații dorești să ne transmiți. Desigur, anumite informații vor fi necesare pentru îndeplinirea contractului (de exemplu, o adresă pentru livrare sau un număr de telefon pentru confirmarea unui eveniment).</p>
                <p>De asemenea, poți utiliza următoarele drepturi garantate de Regulamentul General privind Protecția Datelor (GDPR), oricând:</p>
                <ul>
                    <li><strong>Dreptul de acces:</strong> Ai dreptul să fii informat ce date stocăm despre tine și cum le prelucrăm.</li>
                    <li><strong>Dreptul la rectificare:</strong> Ne poți cere întotdeauna să corectăm datele incorecte.</li>
                    <li><strong>Dreptul la ștergere („dreptul de a fi uitat”):</strong> Ne poți solicita oricând să ștergem datele pe care le-am stocat despre tine.</li>
                    <li><strong>Dreptul la restricționarea prelucrării:</strong> Ne poți cere să restrângem utilizarea datelor tale, caz în care le vom arhiva.</li>
                    <li><strong>Dreptul de a te opune prelucrării:</strong> Îți poți retrage consimțământul (inclusiv pentru marketing) sau te poți opune prelucrării bazate pe interesul nostru legitim (scrie-ne la comenzi@chianti.ro).</li>
                    <li><strong>Procesul decizional individual automatizat:</strong> Ai dreptul de a nu fi supus unor decizii bazate exclusiv pe prelucrări automate.</li>
                    <li><strong>Dreptul de a formula o plângere:</strong> Te poți adresa oricând Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP - <a href="mailto:anspdcp@dataprotection.ro" className="terms-link">anspdcp@dataprotection.ro</a>).</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>Ce date prelucrăm și în ce scopuri</h3>
                <p>Procesăm datele tale cu caracter personal doar în conformitate cu cerințele legale (Art. 6 GDPR) pentru a-ți putea oferi serviciile Chianti:</p>
                
                <h4 className="mt-4">1. Crearea contului și administrarea profilului</h4>
                <ul>
                    <li><strong>Categorii de date:</strong> Date de profil (nume, adresă de e-mail, număr de telefon), informații despre dispozitiv.</li>
                    <li><strong>Scop / Temei legal:</strong> Executarea contractului. Fără aceste date nu putem genera comenzi sau rezervări.</li>
                </ul>

                <h4 className="mt-4">2. Comandă Mâncare și Livrare (inclusiv meniul zilnic „Ieftin și Bun”)</h4>
                <ul>
                    <li><strong>Categorii de date:</strong> Date de locație (adresă livrare), informații de contact, informații despre comandă (inclusiv alegerile din selecția zilnică rotită), metoda de plată.</li>
                    <li><strong>Scop:</strong> Organizarea livrării la tine acasă, ridicării rapide de la noi sau servirii în restaurant.</li>
                    <li><strong>Temei legal:</strong> Executarea contractului. Furnizăm livratorilor noștri (sau subcontractaților) doar informațiile strict necesare pentru a-ți aduce prânzul cald și proaspăt.</li>
                </ul>

                <h4 className="mt-4">3. Rezervare Salon și Servicii Evenimente</h4>
                <ul>
                    <li><strong>Categorii de date:</strong> Nume, număr de telefon, e-mail, preferințe culinare, număr de invitați, data evenimentului.</li>
                    <li><strong>Scop:</strong> Pentru a organiza evenimentul mult dorit într-unul din cele trei saloane elegante și a-ți oferi o ofertă personalizată.</li>
                    <li><strong>Temei legal:</strong> Executarea contractului / Demersuri precontractuale la cererea ta.</li>
                </ul>

                <h4 className="mt-4">4. Apeluri telefonice de la colaboratori pentru livrarea serviciului</h4>
                <ul>
                    <li><strong>Scop / Temei:</strong> Dacă un preparat din meniul zilei nu mai este disponibil sau livratorul nu găsește adresa, te vom contacta telefonic pentru a rezolva problema rapid, pe baza executării contractului și a interesului nostru legitim de a oferi servicii prompte.</li>
                </ul>

                <h4 className="mt-4">5. Publicitate, Marketing și Scorul NPS</h4>
                <ul>
                    <li><strong>Scop:</strong> Pentru a te ține la curent cu meniul „Ieftin și Bun” care se rotește zilnic sau cu oferte speciale pentru platouri de petrecere. Folosim e-mail sau SMS doar cu consimțământul tău. De asemenea, ocazional, trimitem sondaje (NPS) pentru a ne asigura că păstrăm mereu standardul calității cu care te-am obișnuit.</li>
                    <li><strong>Temei legal:</strong> Interesul nostru legitim (pentru clienții existenți la produse similare) sau consimțământul tău expres (Art. 6 alin. 1 lit. a și f GDPR). Te poți dezabona oricând la <a href="mailto:suport@chianti.ro" className="terms-link">suport@chianti.ro</a>.</li>
                </ul>

                <h4 className="mt-4">6. Cookies, Targeting și Retargeting</h4>
                <ul>
                    <li><strong>Scop:</strong> Pentru a asigura funcționarea optimă a platformei, a salva coșul de cumpărături (buffering) și a afișa reclame relevante.</li>
                    <li><strong>Temei legal:</strong> Consimțământul tău (pentru cookie-uri de marketing/analitice) și interesul legitim (pentru cookie-uri strict necesare). Detalii suplimentare găsești în Politica noastră privind modulele cookie.</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>Cine sunt colaboratorii noștri</h3>
                <p>Nu vindem sau închiriem datele tale cu caracter personal către terți. Trimitem datele tale doar livratorilor (pentru a-ți aduce mâncarea), procesatorilor de plăți (pentru a securiza tranzacția) sau consultanților noștri legali/fiscali, sub clauze stricte de confidențialitate și acorduri de prelucrare a datelor.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>Rețele de socializare</h3>
                <p>Interacționăm cu tine pe platforme precum Facebook și Instagram. Noi și operatorii acestor platforme (ex: Facebook Ireland Ltd.) acționăm în calitate de operatori asociați pentru datele de tip "Insights" (informații despre pagină).</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>Cât timp îți stocăm datele</h3>
                <p>Ștergem datele tale după ce scopul prelucrării a fost îndeplinit. Dacă contul tău este inactiv timp de 3 ani, îl vom șterge automat, informându-te în prealabil prin e-mail. Vom reține datele doar pentru perioada impusă de obligațiile legale (ex: facturile fiscale între 5 și 10 ani, conform legislației românești în vigoare).</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>Dreptul la modificare</h3>
                <p>Ne rezervăm dreptul de a modifica prezenta declarație privind prelucrarea datelor cu caracter personal, în conformitate cu prevederile legale. Te vom informa cu privire la orice modificări semnificative pe e-mail sau direct pe platforma Chianti.</p>
            </section>
        </div>
    );
};

export default ConfidentialityPage;
