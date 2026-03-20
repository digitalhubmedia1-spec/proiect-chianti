import React from 'react';
import './Terms.css';

const CommercePolicy = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">POLITICI DE COMERCIALIZARE</h1>
            <p className="text-center terms-update-date">Versiune actualizată: 01.03.2026</p>

            <section className="mb-5 terms-section">
                <p>Modelul de comercializare al Chianti Catering SRL este adaptat în funcție de complexitatea serviciului solicitat. Pe platforma noastră, comercializarea se desfășoară pe două fluxuri operaționale distincte:</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>A. Fluxul E-commerce Direct (Comenzi Mâncare)</h3>
                <p>Acest flux se aplică pentru Comenzile Rapide (meniul zilnic de prânz „Ieftin și Bun”, disponibil L-V) și pentru Pre-comenzi (platouri și preparate de catering solicitate cu minim 48h înainte).</p>
                <ol>
                    <li><strong>Selecția și Comanda:</strong> Clientul adaugă produsele dorite în coș direct din platformă.</li>
                    <li><strong>Plata:</strong> Se realizează online (prin procesatorul securizat NETOPIA), prin ordin de plată sau numerar/card la livrare/ridicare.</li>
                    <li><strong>Confirmarea și Execuția:</strong> Contractul se consideră încheiat la primirea confirmării pe suport durabil (e-mail). Comanda este livrată la adresa indicată sau ridicată din locația noastră, conform Politicii de Livrare.</li>
                </ol>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>B. Fluxul Consultativ (Evenimente & Rezervări Saloane)</h3>
                <p>Procesul de comercializare pentru organizarea evenimentelor în unul din cele trei saloane elegante sau pentru serviciile complexe de catering personalizat implică un parcurs în 7 pași clari. Anumiți pași se execută prin intermediul acestui site, alții offline, direct cu echipa noastră:</p>
                <ol>
                    <li><strong>1. Cererea clientului:</strong> Clientul inițiază procesul solicitând un serviciu sau o ofertă personalizată prin completarea unui formular dedicat pe site (ex. secțiunile Contact, Saloane sau Meniuri Eveniment).</li>
                    <li><strong>2. Consiliere de specialitate gratuită:</strong> Pentru a ne asigura că evenimentul va fi exact așa cum îți dorești, îți oferim consultanță gratuită. Discutăm detaliile meniurilor și serviciilor prin intermediul chat-ului de pe site, prin e-mail sau telefonic, în funcție de disponibilitate.</li>
                    <li><strong>3. Prima propunere (Oferta Inițială):</strong> Reprezentanții Chianti Catering îți vor prezenta (în scris sau telefonic) unul sau mai multe pachete predefinite de servicii. Vom discuta referințele de preț (estimări) și îți vom oferi link-uri cu descrierea detaliată a fiecărui serviciu. În urma acestor ajustări inițiale, vei primi o Oferta/Pachet Standard.</li>
                    <li><strong>4. Verificarea disponibilității (Dată / Salon):</strong> Stabilim și verificăm disponibilitatea datei dorite și a salonului preferat pentru organizarea evenimentului (detalii disponibile pe pagina dedicată saloanelor).</li>
                    <li><strong>5. Rezervarea fermă a datei (Gift Rezervare):</strong> Pentru a bloca data și salonul, clientul achită o taxă de rezervare (mecanismul Gift Rezervare menționat în Termeni și Condiții). Aceasta se poate achita online (pe baza unui link de plată și a facturii emise) sau direct la casieria noastră. În urma plății, vei primi confirmarea oficială a rezervării. Această sumă se va deduce 100% din factura finală a evenimentului.</li>
                    <li><strong>6. Ajustări finale și Contractare:</strong> Cu minim 14 zile înainte de data evenimentului, au loc discuțiile finale pentru ajustarea meniurilor, numărului de invitați și serviciilor extra. Această etapă se finalizează cu:
                        <ul>
                            <li>Ajustarea ofertei și agrearea valorii finale.</li>
                            <li>Emiterea a trei documente esențiale: Contractul de prestări servicii, Oferta personalizată finală (anexă) și o factură proformă pentru restul de plată. (Acest pas se desfășoară offline/prin e-mail, fără a implica direct platforma web).</li>
                        </ul>
                    </li>
                    <li><strong>7. Execuția evenimentului și Recepția:</strong> Chianti Catering prestează serviciile la standardul calitativ agreat. La finalul evenimentului:
                        <ul>
                            <li>Clientul beneficiază de serviciile contractate și semnează un Proces Verbal de execuție, validând conformitatea serviciilor.</li>
                            <li>În baza acestui Proces Verbal și a facturii fiscale finale, se achită diferența de plată direct către reprezentanții Chianti Catering la fața locului.</li>
                        </ul>
                    </li>
                </ol>
            </section>

            <section className="mb-5 terms-section">
                <div className="alert-info-custom">
                    <p><strong>Excepții Importante (Proiecte Speciale)</strong></p>
                    <p>Proiectele speciale sau evenimentele de tip unicat organizate de Terți și/sau de Chianti Catering (ex. concepte atipice, festivaluri, colaborări corporate extinse) fac excepție de la fluxul standard în 7 pași prezentat mai sus. Acestea pot fi planificate, organizate și executate diferit, conform angajamentelor specifice asumate de părți prin contracte dedicate.</p>
                </div>
            </section>
        </div>
    );
};

export default CommercePolicy;
