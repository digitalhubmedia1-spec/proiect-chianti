import React from 'react';
import './Terms.css'; // Reusing the same CSS for consistency

const DataSecurity = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">Informații privind siguranța datelor clienților</h1>

            <section className="mb-5 terms-section">
                <h3>Politica Cookie</h3>
                <p>
                    Pentru a face vizita ta pe site-ul / aplicatia noastra cat mai placuta si pentru a permite utilizarea anumitor functii,
                    folosim asa-numitele cookie-uri pe diverse pagini. Acestea sunt mici fisiere text care sunt stocate in browser.
                    Unele dintre cookie-urile pe care le folosim sunt sterse dupa incheierea sesiunii browserului, adica dupa inchiderea browserului.
                </p>
                <p>
                    Alte cookie-uri raman pe browserul tau si permit noua sau afiliatului nostru sa va recunoastem browserul la urmatoarea vizita (cookie-uri persistente).
                    Poti regla optiunile browserului tau astfel incat sa fi informat cu privire la setarea cookie-urilor si sa decizi in mod individual acceptarea acestora
                    sau excluderea cookie-urilor pentru anumite cazuri specifice sau in general. Excluderea folosirii anumitor module cookie poate limita functionalitatea site-ului / aplicatiei noastre.
                </p>

                <h4 className="mt-4">Clasificam cookie-urile pe care le folosim in trei categorii:</h4>
                <ul>
                    <li>strict necesare</li>
                    <li>de functionalitate</li>
                    <li>personalizate</li>
                </ul>
                <p>Mai jos vei gasi mai multe informatii cu privire la alegerile tale, precum si o lista detaliata a modulelor cookie pe care le folosim.</p>
            </section>

            <section className="mb-5 terms-section">
                <h3>1. Cookie-urile strict necesare</h3>
                <p>
                    Sunt indispensabile pentru a naviga pe site-ul nostru si pentru a utiliza caracteristicile furnizate.
                    Fara utilizarea unor astfel de module cookie, functionarea corecta a site-ului nostru nu poate fi asigurata (de exemplu, introducerea textului),
                    in timp ce navigati prin paginile de pe site. In plus, sunt cookie-uri care colecteaza informatii despre modul in care vizitatorii folosesc site-ul nostru web,
                    de exemplu, paginile pe care le viziteaza cel mai des si daca primesc mesaje de eroare de pe site-uri web.
                </p>
                <p>
                    Aceste cookie-uri colecteaza informatii anonime agregate, care nu identifica un vizitator.
                    De asemenea, permit site-ului nostru sa-si aminteasca alegerile tale, cum ar fi limba sau regiunea, pentru a oferi functii imbunatatite.
                    Conform reglementarilor legale, nu este necesara nicio actiune a ta pentru a le accepta.
                    De asemenea, folosim aceste cookie-uri pentru a stoca daca ne-ati dat consimtamantul de a utiliza cookie-uri sau pentru a stoca temporar informatiile introduse.
                </p>
            </section>

            <section className="mb-5 terms-section">
                <h3>2. Cookie-urile de functionalitate</h3>
                <p>
                    Colecteaza informatii anonime si nu va pot urmari miscarile pe alte site-uri web.
                    In plus, acestea ar putea fi utilizate pentru a trimite reclame / oferte sau pentru a masura eficienta unei campanii publicitare.
                    Ele ar putea fi utilizate pentru a determina care canale de marketing online sunt cele mai eficiente.
                    Cu aceste cookie-uri, vom stoca si datele de conectare in browserul tau astfel incat sa te poti autentifica automat data viitoare cand vizitati site-ul nostru web.
                    Deoarece dorim sa iti oferim un site web conceput pentru o utilizare optima, cookie-urile functionale sunt de obicei activate atunci cand vizitezi site-ul nostru web.
                </p>
                <p>
                    Pentru a activa aceste masuri, folosim si cookie-uri de la terti din aceasta categorie.
                    Analizand modul tau de utilizare a site-ului/aplicatiei, in mod anonimizat, putem identifica zonele in care ne putem imbunatati site-ul.
                </p>
            </section>

            <section className="mb-5 terms-section">
                <h3>3. Cookie-urile personalizate</h3>
                <p>
                    Sunt folosite pentru a efectua o publicitate directionata, relevanta pentru utilizator si adaptata intereselor sale.
                    Aceste cookie-uri ne ajuta sa furnizam liste de audiente de marketing personalizate partenerilor nostri de marketing.
                    Avem nevoie de acordul tau pentru a le activa.
                </p>
            </section>

            <section className="mb-5 terms-section">
                <h3>Opozitia la utilizarea modulelor cookie</h3>
                <p>
                    Daca nu doresti ca noi sa colectam si sa analizam informatii despre vizita ta, te poti opune in orice moment pentru viitor (renuntare/opt-out).
                </p>
                <p>
                    Pentru implementarea tehnica a acestei opozitii, in browserul tau va fi setat un modul cookie de renuntare.
                    Acest cookie este exclusiv in scopul maparii opozitiei tale. Te rugam sa retii ca, din motive tehnice,
                    un cookie de excludere poate fi utilizat doar pentru browserul de la care a fost setat.
                    Daca stergi cookie-urile sau utilizezi un browser sau dispozitiv diferit, va trebui sa renunti din nou,
                    adica sa iti exerciti din nou dreptul de opozitie.
                </p>
            </section>

            <p className="text-center terms-update-date">Versiune actualizata la data de 01 septembrie 2022</p>
        </div>
    );
};

export default DataSecurity;
