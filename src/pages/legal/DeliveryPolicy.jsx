import React from 'react';
import './Terms.css';

const DeliveryPolicy = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">POLITICA DE LIVRARE</h1>
            <p className="text-center terms-update-date">Versiune actualizată: 01.03.2026</p>

            <section className="mb-5 terms-section">
                <h3>1. PREAMBUL: Tipuri de Comenzi și Livrare</h3>
                <p>Platforma Chianti Catering SRL (<a href="http://www.chianti.ro" className="terms-link">www.chianti.ro</a>) deservește clienții prin două regimuri distincte de comandă, fiecare având propriile reguli de livrare:</p>
                <ul>
                    <li><strong>Comandă Rapidă (Livrare în aceeași zi):</strong> Aplicabilă exclusiv programului zilnic de prânz „Ieftin și Bun”. Aceste comenzi sunt preparate și livrate rapid la adresa indicată.</li>
                    <li><strong>Pre-comandă (Sistem Catering):</strong> Aplicabilă pentru platouri și meniuri de evenimente listate pe site. Acestea se procesează pe bază de pre-comandă, plasată cu minim 48 de ore înainte de data și ora dorite pentru recepție.</li>
                </ul>
                <p>Pentru ambele regimuri, produsele pot fi livrate de către flota noastră/partenerii noștri la adresa solicitată sau pot fi ridicate personal de către Client (Ridicare rapidă) de la punctul nostru de lucru: Str. Mihai Viteazu 3-5, Roman.</p>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>2. PROGRAMUL DE LIVRARE</h3>
                <p>Programul de livrare diferă în funcție de tipul serviciului accesat:</p>
                <p><strong>A. Pentru Meniul Zilnic „Ieftin și Bun” (Comenzi Rapide):</strong></p>
                <ul>
                    <li>Luni – Vineri: 11:00 – 15:00</li>
                    <li>Sâmbătă și Duminică: Închis pentru acest serviciu.</li>
                </ul>
                <p><strong>B. Pentru Produsele de Catering și Platouri (Pre-comenzi cu 48h înainte):</strong></p>
                <ul>
                    <li>Marți – Duminică: 10:00 – 16:00</li>
                    <li>Luni: Nu se efectuează livrări pentru serviciile de pre-comandă.</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>3. ZONELE ȘI COSTURILE DE LIVRARE</h3>
                <p>Serviciul nostru de livrare acoperă o zonă de aproximativ 30 km în jurul orașului Roman, incluzând circa 90 de localități, structurate în 6 zone tarifare.</p>
                <ul>
                    <li>Pentru Municipiul Roman (Zona 0), serviciul de livrare este GRATUIT.</li>
                    <li>Pentru localitățile limitrofe, livrarea poate fi gratuită în funcție de valoarea coșului de cumpărături sau poate atrage un cost suplimentar, care va fi calculat și afișat automat la finalizarea comenzii (Checkout).</li>
                </ul>
                <div className="mt-4">
                    <h4>Harta Zonelor de Livrare:</h4>
                    <ul>
                        <li><strong>Zona 0:</strong> Municipiul Roman</li>
                        <li><strong>Zona 1:</strong> Lutca, Cordun, Horia</li>
                        <li><strong>Zona 2:</strong> Cotu Vameș, Gâdinți, Sagna, Tămășeni, Adjudeni, Izvoarele, Simionești, Pildești, Săbăoani, Trifești, Secuienii Noi, Basta, Ion Creangă</li>
                        <li><strong>Zona 3:</strong> Vulpașești, Buruienești, Bâra, Mircești, Răchiteni, Gherăești, Tețcani, Iugani, Gherăeștii Noi, Miron Costin, Dulcești, Roșiori, Corhana, Bogzești, Butnărești, Uncești, Secuieni, Stejaru, Izvoru, Muncelu, Recea, Icușești, Averești, Bunghi</li>
                        <li><strong>Zona 4:</strong> Rotunda, Doljești, Buhonca, Rediu, Negrești, Stănița, Todireni, Poienile Oancei, Căușeni, Boghicea, Slobozia, Oțeleni, Butea, Miclăușeni, Barticești, Botești, Nisiporești, Cârlig, Poiana, Brițcani, Munteni, Moreni, Bozienii de Sus, Ruginoasa, Budești, Făurei, Climești, Giulești, Bârjoveni, Moldoveni, Baratca, Dârloaia, Bălușești, Spiridonești, Rocna, Bătrânești, Valea Ursului, Chilii, Bucium, Poienari, Pâncești</li>
                        <li><strong>Zona 5:</strong> Ghidion, Veja, Nistria, Văleni, Micșunești, Giurgeni</li>
                    </ul>
                </div>
                <div className="alert-info-custom mt-4">
                    <p><strong>Notă:</strong> Ne rezervăm dreptul de a nu putea onora comenzi în locații greu accesibile, clădiri cu acces restricționat publicului larg sau instituții cu reguli speciale de securitate. În astfel de situații, te vom contacta imediat pentru a găsi o adresă de livrare alternativă.</p>
                </div>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>4. TIMPII DE LIVRARE, ÎNTÂRZIERI ȘI RĂSPUNDERE</h3>
                <p>Durata livrării afișată/comunicată este estimativă. Obiectivul nostru este să livrăm produsele calde și proaspete în cel mai scurt timp posibil.</p>
                <ul>
                    <li>Totuși, timpul de livrare poate varia în funcție de factori independenți de voința noastră (condiții meteo severe, trafic intens, accidente, forță majoră).</li>
                    <li>Dacă există probabilitatea unei întârzieri semnificative, reprezentanții Chianti te vor contacta telefonic pentru a te informa.</li>
                    <li><strong>Compensări:</strong> Pentru pre-comenzile de catering, întârzierile majore (de peste 90 de minute) raportate imediat pe chat sau e-mail pot fi compensate cu vouchere de reducere sau servicii complementare, după o evaluare a situației. Chianti Catering nu își asumă răspunderea pentru daune, costuri sau pierderi indirecte cauzate de o întârziere a livrării.</li>
                    <li><strong>Imposibilitatea recepției:</strong> Dacă livratorul ajunge la adresă și nu poți fi contactat, produsele vor fi returnate la restaurant. Contravaloarea acestora nu se rambursează (conform Politicii de Anulare și Retur), având în vedere natura lor perisabilă.</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>5. PROTECȚIA DATELOR ÎN PROCESUL DE LIVRARE</h3>
                <p>Prin plasarea comenzii, ne autorizezi să prelucrăm și să transmitem datele tale de contact (nume, adresă de livrare, număr de telefon) exclusiv către echipa noastră de livratori sau terții contractori care asigură transportul, strict în scopul îndeplinirii contractului (livrarea comenzii). Detalii complete privind prelucrarea datelor se regăsesc în secțiunea Politica de Confidențialitate.</p>
            </section>
        </div>
    );
};

export default DeliveryPolicy;
