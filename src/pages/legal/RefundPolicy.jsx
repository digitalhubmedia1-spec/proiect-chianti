import React from 'react';
import './Terms.css';

const RefundPolicy = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">POLITICA DE ANULARE ȘI RETUR</h1>
            <p className="text-center terms-update-date">Versiune actualizată: 01.03.2026</p>

            <section className="mb-5 terms-section">
                <h3>1. PREAMBUL: Regimul Comenzilor Chianti</h3>
                <p>Vă informăm că pe platforma Chianti Catering SRL (<a href="http://www.chianti.ro" className="terms-link">www.chianti.ro</a>), interacțiunile comerciale sunt împărțite în trei categorii distincte, fiecare având reguli specifice de procesare:</p>
                <ul>
                    <li><strong>Comandă Rapidă (Livrare în aceeași zi):</strong> Aplicabilă exclusiv programului de prânz „Ieftin și Bun” (Luni–Vineri, 11:00–15:00).</li>
                    <li><strong>Pre-comandă (Catering/Platouri):</strong> Comenzi pentru preparate care necesită un timp de producție și se plasează, în mod uzual, cu minim 48 de ore înainte.</li>
                    <li><strong>Rezervări Saloane / Evenimente:</strong> Solicitări confirmate prin mecanismul de Gift Rezervare sau contracte personalizate.</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>2. POLITICA DE ANULARE</h3>
                <h4>2.1. Anularea de către Client</h4>
                <p>Dacă dorești anularea unei comenzi, trebuie să ne notifici imediat telefonic (la numerele afișate pe site) și în scris la <a href="mailto:comenzi@chianti.ro" className="terms-link">comenzi@chianti.ro</a>, menționând numărul comenzii.</p>
                <ul>
                    <li><strong>Pentru Comenzile Rapide (Prânz):</strong> Anularea este posibilă doar în primele minute de la plasare, înainte ca bucătăria să înceapă prepararea produselor.</li>
                    <li><strong>Pentru Pre-comenzi (Catering 48h):</strong> Anularea fără penalități se poate face doar dacă produsele nu au intrat încă în fluxul de aprovizionare/preparare.</li>
                    <li><strong>Situații în care anularea NU este acceptată:</strong> Dacă prepararea a început sau comanda a fost deja predată livratorului, aceasta nu mai poate fi anulată, iar contravaloarea ei nu va fi rambursată.</li>
                    <li><strong>Rezervări Evenimente:</strong> Anularea se supune condițiilor contractuale specifice agreate prin Gift Rezervare sau contractul de prestări servicii semnat anterior.</li>
                </ul>

                <h4>2.2. Anularea de către Chianti Catering</h4>
                <p>Ne rezervăm dreptul de a anula o Comandă/Rezervare, informându-te în prealabil și rambursând integral sumele achitate (dacă este cazul), în următoarele situații:</p>
                <ul>
                    <li>Neacceptarea sau invalidarea tranzacției de către procesatorul de plăți (NETOPIA).</li>
                    <li>Datele de contact sau de livrare furnizate sunt incomplete, false sau incorecte.</li>
                    <li>Produsul comandat a devenit indisponibil din motive tehnice sau de aprovizionare (în acest caz, te vom contacta telefonic pentru a-ți propune o alternativă similară; dacă refuzi alternativa, comanda se anulează și primești banii înapoi).</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>3. POLITICA DE RETUR ȘI EXCEPȚIILE LEGALE</h3>
                <p><strong>3.1. Restricții legale (Produse Perisabile)</strong><br />
                Conform prevederilor Art. 16 lit. d) și e) din O.U.G. 34/2014 privind drepturile consumatorilor, produsele alimentare, preparatele culinare proaspete și băuturile desigilate sunt exceptate de la dreptul de retragere (retur). Fiind produse perisabile și susceptibile a se deteriora rapid, nu acceptăm retururi bazate pe motive de preferințe personale (ex: „m-am răzgândit” sau „nu îmi place gustul”).</p>
                <p><strong>3.2. Livrarea ratată din culpa Clientului</strong><br />
                Pregătirea produselor de catering necesită resurse și organizare majore. Dacă livratorul ajunge la adresa indicată și nu te găsește, va încerca să te contacteze telefonic de minim 3 ori. Dacă nu poți fi contactat și livrarea eșuează din motive ce îți sunt imputabile, produsele se vor întoarce la restaurant. În acest caz, contravaloarea comenzii nu se rambursează, iar produsele vor fi distruse conform normelor de igienă.</p>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>4. PRODUSE NECONFORME SAU LIPSĂ</h3>
                <p>Misiunea noastră este să îți oferim o experiență perfectă. Dacă, la livrare, constați o problemă, te rugăm să procedezi astfel:</p>
                <ul>
                    <li><strong>Produse deteriorate sau comenzi greșite:</strong> Dacă primești un produs diferit față de cel comandat sau într-o stare neconformă, ai dreptul să îl refuzi la recepție. Alternativ, contactează-ne în cel mai scurt timp la <a href="mailto:comenzi@chianti.ro" className="terms-link">comenzi@chianti.ro</a> atașând dovada neconformității (fotografii clare/video) și bonul fiscal.</li>
                    <li><strong>Produse lipsă:</strong> Dacă lipsește un produs din comandă, semnalează acest lucru imediat livratorului la recepție și contactează-ne.</li>
                    <li><strong>Remedii:</strong> În urma evaluării (care se face rapid), îți vom oferi ca soluție, la alegerea ta și în limita posibilităților operaționale: înlocuirea produsului în cel mai scurt timp posibil SAU rambursarea contravalorii produsului lipsă/neconform. Reclamațiile nefondate sau făcute cu rea-credință pot duce la restricționarea accesului pe platformă.</li>
                </ul>
            </section>

            <hr className="my-5" />

            <section className="mb-5 terms-section">
                <h3>5. PROCESAREA RAMBURSĂRILOR</h3>
                <p>Toate rambursările aprobate (pentru anulări valide, produse lipsă sau neconforme) se procesează prompt.</p>
                <ul>
                    <li><strong>Suma va fi returnată</strong> în termen de maxim 14 zile calendaristice de la data soluționării favorabile a reclamației/anulării.</li>
                    <li><strong>Metoda de rambursare:</strong> Contravaloarea va fi restituită în contul aferent cardului cu care s-a făcut plata online. Pentru comenzile achitate ramburs/numerar, restituirea se va face într-un cont bancar (IBAN) furnizat de tine în scris.</li>
                    <li><strong>Taxele de livrare:</strong> Dacă reclamația vizează doar o parte din comandă (ex: un singur produs lipsă), taxa de livrare inițială nu se rambursează.</li>
                </ul>
            </section>
        </div>
    );
};

export default RefundPolicy;
