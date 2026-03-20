import React from 'react';
import './Terms.css';

const Terms = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">TERMENI ȘI CONDIȚII</h1>
            <p className="text-center terms-update-date">Ultima actualizare: 01.03. 2026</p>

            <section className="mb-5 terms-section">
                <p>Acest document stabilește termenii de utilizare ai platformei Chianti și condițiile contractuale aplicabile comenzilor, cererilor de ofertă, rezervărilor și proiectelor/evenimentelor organizate sau facilitate de Chianti. Prin accesarea platformei și/sau plasarea unei comenzi/rezervări/cereri, confirmi că ai citit, ai înțeles și accepți prezentul document, împreună cu politicile asociate afișate în site.</p>
            </section>

            <div className="terms-toc">
                <h4 className="mb-3">Cuprinsul acestuia este următorul:</h4>
                <ol className="list-unstyled mb-0">
                    <li>1. Prezentare generală</li>
                    <li>2. Definiții</li>
                    <li>3. Scopul site-ului</li>
                    <li>4. Domeniul de aplicare</li>
                    <li>5. Acceptarea termenilor și condițiilor</li>
                    <li>6. Comandă/Rezervare</li>
                    <li>7. Contractul – Procesul de comercializare...</li>
                    <li>8. Link-uri pentru site-uri terțe</li>
                    <li>9. Limitarea răspunderii</li>
                    <li>10. Utilizarea Platformei</li>
                    <li>11. Prelucrarea datelor cu caracter personal</li>
                    <li>12. Folosirea cookie-urilor</li>
                    <li>13. Revizuiri ale termenilor și condițiilor</li>
                    <li>14. Legislație aplicabilă și jurisdicție</li>
                    <li>15. Modalități de contact</li>
                </ol>
            </div>

            <section className="terms-section">
                <h3>1. PREZENTARE GENERALĂ</h3>
                <p><strong>1.1. Identificarea profesionistului</strong><br/>
                Platforma este operată de CHIANTI CATERING SRL, CUI 17707040, Nr. Reg. Com. J27/984/2005.<br/>
                Sediu social: Roman, Bulevardul Republicii 46, jud. Neamț.<br/>
                Punct de lucru: Str. Mihai Viteazu 3–5, Roman, jud. Neamț.<br/>
                Contact: <a href="mailto:comenzi@chianti.ro" className="terms-link">comenzi@chianti.ro</a>, 0729 881 854, 0374 968 884.<br/>
                Program orientativ contact: L–V 10:00–17:00, S–D 10:00–14:00.</p>
                <p><strong>1.2. Documente asociate</strong><br/>
                Prezentul document se completează cu următoarele pagini/politici ale site-ului (acolo unde sunt publicate):</p>
                <ul>
                    <li>Informații privind siguranța datelor clienților</li>
                    <li>Politica de confidențialitate</li>
                    <li>Politica de anulare și retur</li>
                    <li>Politica de livrare</li>
                    <li>Politici de comercializare</li>
                </ul>
                <p>În caz de neconcordanță între Termeni și Condiții și o politică specială, prevalează politica specială pentru subiectul respectiv (ex.: livrare, anulare/retur).</p>
                <p><strong>1.3. Observație importantă despre tipurile de comenzi</strong><br/>
                În modelul Chianti există două regimuri operaționale:</p>
                <ul>
                    <li>Pre-comandă pentru produse de catering/preparate la comandă (în mod uzual minim 48 ore înainte).</li>
                    <li>Comandă rapidă doar pentru servicii marcate explicit ca atare (L-V)</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>2. DEFINIȚII</h3>
                <p>În sensul prezentului document:</p>
                <p><strong>Platforma:</strong> site-ul Chianti (chianti.ro) și paginile digitale asociate, inclusiv eventuale oglinzi tehnice folosite pentru a furniza aceleași servicii publicului.</p>
                <p><strong>Utilizator/Client:</strong> orice persoană care accesează Platforma și/sau transmite o comandă, cerere de ofertă ori rezervare.</p>
                <p><strong>Consumator:</strong> persoană fizică ce acționează în scopuri din afara activității sale comerciale/industriale/artizanale/profesionale.</p>
                <p><strong>Produs:</strong> produse alimentare/preparate/platouri listate pe Platformă.</p>
                <p><strong>Serviciu:</strong> servicii de catering, organizare evenimente, rezervare salon/datǎ și alte servicii listate pe Platformă.</p>
                <p><strong>Comandă:</strong> solicitarea transmisă de Client pentru achiziția unuia sau mai multor Produse/Servicii.</p>
                <p><strong>Pre-comandă:</strong> comandă programată la o dată viitoare, transmisă cu termen minim înainte de livrare/ridicare (în mod uzual minim 48 ore pentru produsele de catering/preparate la comandă).</p>
                <p><strong>Comandă rapidă:</strong> comandă care poate fi executată în aceeași zi, doar pentru servicii dedicate marcate explicit (ex.: prânz Ieftin și Bun).</p>
                <p><strong>Cerere de ofertă:</strong> solicitare de ofertare/consiliere pentru servicii/evenimente, care nu produce automat un contract final până la confirmarea pe suport durabil.</p>
                <p><strong>Rezervare:</strong> blocarea unei date/unei capacități (ex.: salon) sau rezervarea participării la un proiect/eveniment, confirmată pe suport durabil.</p>
                <p><strong>Gift Rezervare:</strong> mecanism de rezervare dată/salon, prin care o sumă achitată poate fi dedusă 100% din factura finală a evenimentului, în condițiile comunicate pe suport durabil.</p>
                <p><strong>Suport durabil:</strong> instrument ce permite stocarea și accesarea ulterioară a informațiilor (de regulă e-mail).</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>3. SCOPUL SITE-ULUI</h3>
                <p>Platforma are ca scop prezentarea și, după caz, comercializarea/facilitarea următoarelor:</p>
                <ul>
                    <li>vizualizarea produselor și serviciilor Chianti;</li>
                    <li>plasarea comenzilor pentru produse alimentare în regim de pre-comandă;</li>
                    <li>plasarea unor comenzi în regim de comandă rapidă, doar acolo unde este afișat explicit (ex.: Ieftin și Bun);</li>
                    <li>transmiterea de cereri de ofertă pentru evenimente/catering;</li>
                    <li>efectuarea de rezervări pentru saloane/date și proiecte/evenimente;</li>
                    <li>efectuarea de plăți securizate online, acolo unde este disponibil (procesator: NETOPIA).</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>4. DOMENIUL DE APLICARE</h3>
                <p><strong>4.1. Eligibilitate</strong><br/>
                Platforma poate fi utilizată de persoane care furnizează date reale, exacte și complete. Pentru anumite proiecte/evenimente pot exista condiții suplimentare de participare.</p>
                <p><strong>4.2. Minorii</strong><br/>
                În cazul proiectelor/evenimentelor dedicate tinerilor sau în care participă minori, pot fi solicitate acorduri/confirmări suplimentare ale părintelui/reprezentantului legal, acolo unde legea o impune.</p>
                <p><strong>4.3. Produse cu vârstă minimă</strong><br/>
                Dacă, în anumite contexte, sunt oferite produse cu restricție de vârstă (ex. băuturi alcoolice), acestea pot fi livrate/servite doar persoanelor care îndeplinesc condițiile legale.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>5. ACCEPTAREA TERMENILOR ȘI CONDIȚIILOR</h3>
                <p>Dacă nu ești de acord cu prezentul document și politicile asociate, te rugăm să nu utilizezi Platforma și să nu plasezi comenzi/rezervări/cereri.</p>
                <p>Prin finalizarea unei comenzi/rezervări (inclusiv apăsarea butonului de finalizare), confirmi că informațiile furnizate sunt corecte și că accepți prezentul set de documente.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>6. COMANDA/REZERVARE</h3>
                <h4>6.1. Plasarea comenzii/cererii/rezervării</h4>
                <p><strong>A. Produse alimentare în regim de pre-comandă</strong></p>
                <ul>
                    <li>Comenzile pentru produse de catering/preparate la comandă se fac, de regulă, în regim de pre-comandă cu minim 48 ore înainte de data/ora dorită.</li>
                    <li>Se aplică un prag minim de comandă 100 lei, acolo unde este afișat în fluxul de comandă.</li>
                    <li>Plata poate fi: card online (prin NETOPIA), ordin de plată, numerar la livrare (în funcție de opțiunile afișate).</li>
                </ul>
                <p><strong>B. Comandă rapidă pentru programul Ieftin și Bun</strong><br />
                Programul Ieftin și Bun este comunicat ca prânz disponibil L–V, 11:00–15:00, cu opțiuni de livrare, ridicare sau servire în restaurant.</p>
                <p><strong>C. Cerere de ofertă pentru evenimente</strong><br />
                Cerere de ofertă nu reprezintă automat un contract final. Contractarea se face ulterior, prin documente transmise pe suport durabil (ofertă acceptată, contract, factură/confirmare).</p>
                
                <h4>6.2. Servicii Gift Rezervare valabile pentru rezervarea unei date și a unui salon</h4>
                <p>Gift Rezervare are rolul de a bloca o dată/un salon. Condițiile concrete (valoare, ce acoperă, reprogramare/anulare, termen, deducere) sunt cele comunicate pe suport durabil (factură/contract/confirmare).<br />
                Dacă evenimentul se execută la data prestabilită, valoarea Gift Rezervare se deduce 100% din factura finală, în condițiile comunicate.</p>

                <h4>6.3. Anularea comenzii/rezervării</h4>
                <p>Regimul de anulare este detaliat în Politica de anulare și retur și depinde de:</p>
                <ul>
                    <li>natura produsului (perisabil / neperisabil);</li>
                    <li>stadiul execuției (înainte/după începerea preparării);</li>
                    <li>existența unei date fixe (rezervări/evenimente).</li>
                </ul>
            </section>

            <section className="mb-5 terms-section">
                <h3>7. CONTRACTUL – Procesul de comercializare a serviciilor de catering, prețul, livrarea și returul</h3>
                <p><strong>7.1. Contractul și momentul încheierii contractului</strong><br />
                Contractul se consideră încheiat în momentul în care Chianti transmite confirmarea acceptării comenzii/rezervării către Client, pe suport durabil (e-mail).</p>
                <p><strong>7.2. Prețul și plata</strong><br />
                Prețurile afișate sunt exprimate în RON și includ TVA, conform legii. Plata se poate efectua online (card), prin OP sau numerar la livrare (unde este permis). În cazul plăților online, tranzacția este procesată prin NETOPIA Payments.</p>
                <p><strong>7.3. Livrarea</strong><br />
                Livrarea se face la adresa indicată de Client. Termenul de livrare este cel agreat la momentul confirmării comenzii (regim pre-comandă sau comandă rapidă). Clientul este responsabil pentru furnizarea datelor corecte de contact și adresă.</p>
                <p><strong>7.4. Returul, livrarea neconformă sau parțială</strong><br />
                Produsele alimentare care sunt preparate la comandă (perisabile) nu se pot returna după începerea procesului de preparare sau după livrare, conform legislației (OUG 34/2014). În cazul produselor neconforme, Clientul trebuie să sesizeze Chianti imediat la recepție.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>8. LINK-URI PENTRU SITE-URI TERȚE</h3>
                <p>Platforma poate conține link-uri către site-uri operate de terți (ex.: procesatori de plăți, rețele sociale). Chianti nu controlează și nu este responsabilă pentru conținutul sau politicile acestor site-uri.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>9. LIMITAREA RĂSPUNDERII</h3>
                <p>Chianti depune eforturi pentru menținerea acurateței informațiilor, însă nu garantează că Platforma va fi fără erori sau neîntreruptă. Răspunderea Chianti este limitată, în măsura maximă permisă de lege, la valoarea comenzii/serviciului achitat.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>10. UTILIZAREA PLATFORMEI</h3>
                <p>Este interzisă utilizarea Platformei în scopuri ilegale, frauduloase sau care pot afecta integritatea tehnică a acesteia (hacking, spam, etc.).</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>11. PRELUCRAREA DATELOR CU CARACTER PERSONAL (GDPR)</h3>
                <p>Prelucrarea datelor se face conform Politicii de Confidențialitate disponibile pe site. Datele sunt colectate în scopul procesării comenzilor, informării clienților și, opțional, pentru marketing (dacă există consimțământ).</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>12. FOLOSIREA COOKIE-URILOR</h3>
                <p>Platforma utilizează cookie-uri pentru funcționare și analiză. Detalii în Politica de Cookie-uri.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>13. REVIZUIRI ALE TERMENILOR ȘI CONDIȚIILOR</h3>
                <p>Chianti poate modifica prezentul document oricând. Versiunea aplicabilă este cea afișată pe site la momentul plasării comenzii/rezervării.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>14. LEGISLAȚIE APLICABILĂ ȘI JURISDICȚIE</h3>
                <p>Prezentul document este guvernat de legea română. Orice litigiu va fi soluționat pe cale amiabilă sau de către instanțele judecătorești competente din Roman/jud. Neamț.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>15. MODALITĂȚI DE CONTACT</h3>
                <p>Pentru orice solicitare, ne puteți contacta la:<br/>
                E-mail: <a href="mailto:comenzi@chianti.ro" className="terms-link">comenzi@chianti.ro</a><br/>
                Telefon: 0729 881 854 / 0374 968 884</p>
            </section>
        </div>
    );
};

export default Terms;
