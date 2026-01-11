import React from 'react';
import './Terms.css';

const CommercePolicy = () => {
    return (
        <div className="container py-5 terms-container">
            <h1 className="text-center terms-header-title">Politici de comercializare</h1>

            <section className="mb-5 terms-section">
                <p>
                    Procesul de comercializare a `Serviciilor de Catering` implica 7 pasi. Anumiti pasi se vor executa prin intermediul acestui site, altii nu. Hai sa vedem care sunt cei 7 pasi si ce reprezinta fiecare…
                </p>

                <div className="terms-toc mt-4">
                    <h4>Cei 7 pași ai procesului de comercializare</h4>
                    <ol>
                        <li>
                            <strong>Cerere client</strong>
                            <p>Clientul poate cere un serviciu completand un formular. Ex: <a href="https://chianti.ro/contact/" className="terms-link">https://chianti.ro/contact/</a></p>
                        </li>
                        <li>
                            <strong>Chianti Catering ofera consiliere de specialitate gratuita clientului</strong>
                            <p>Pentru organizarea unui eveniment sau pentru completarea corecta a unui formular de cerere de oferta ce poate include meniurile/serviciile listate pe <a href="https://chianti.ro/meniuri-eveniment/" className="terms-link">https://chianti.ro/meniuri-eveniment/</a> – consilierea se poate asigura prin intermediul serviciului de Chat, pe mail sau telefonic in functie de disponibilitatea partilor;</p>
                        </li>
                        <li>
                            <strong>Chianti Catering inainteaza o prima propunere clientului</strong>
                            <p>Chianti Catering, prin reprezentantii sai, va raspunde in scris/telefonic cererii clientului care a trecut prin etapele descrise la P.1/P.2 si va inainta/discuta/prezenta acestuia unul sau mai multe pachete predefinite de servicii; Drept urmare, va discuta telefonic cu clientul sau va transmite clientului pe serviciul de Chat sau pe mail (in functie de datele de contact alese de client la momentul cererii de oferta) atat referinte de pret (estimate in lei/euro) pentru fiecare pachet de servicii ofertat/agreat cat si un link cu descrierea explicita a fiecarui serviciu; În urma acestor discutii, clientul poate face diferite ajustari de continut si/sau valoare si va primi din partea Chianti Catering o Oferta/Pachet Standard;</p>
                        </li>
                        <li>
                            <strong>Verifica disponibilitatea datei/salonului</strong>
                            <p>Clientul cere/primeste informatii legate de disponibilitatea unei date sau a unui salon preferat pentru organizarea unui eveniment – <a href="https://chianti.ro/saloane/" className="terms-link">https://chianti.ro/saloane/</a></p>
                        </li>
                        <li>
                            <strong>Rezervare data</strong>
                            <p>Clientul poate achita online (sau direct la casieria noastra), pe baza facturii emise, prin intermediul chianti.ro rezervarea unei date/unui salon disponibil/agreat (in urma discutiilor legate de disponibilitatea unei date sau a unui salon purtate cu reprezentantii Chianti Catering, clientul va primi o confirmare de rezervare, o factura si un link pentru a putea face plata online daca asa a optat);</p>
                        </li>
                        <li>
                            <strong>Ajustari finale eveniment</strong>
                            <p>Cu minim 14 zile inainte de data evenimentului, clientul discuta, ajusteaza si negociaza ultimele cerinte legate de meniurile/serviciile dorite a fi executate/prestate. Aceste discutii conduc la:</p>
                            <ul>
                                <li>ajustari de servicii si valoare pe baza pachetului de servicii agreat/ofertat initial – vezi mai sus – P.3 sau, daca se partile convin in acord, se pot produce discutii, negocieri si schimbari de pachet de servicii (meniuri, servicii, valoare);</li>
                                <li>emiterea/transmiterea din partea Chianti Catering a trei documente: Contract de prestari servicii, Oferta personalizata finala care defineste serviciile si o factura proforma (acest proces/pas nu include direct site-ul chianti.ro);</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Executie eveniment</strong>
                            <ul>
                                <li>Chianti Catering presteaza serviciul promis/ofertat final (executa serviciile personalizate agreate prin pachetul de servicii ofertat/facturat);</li>
                                <li>Clientul primeste/beneficiaza de serviciul ofertat final si semneaza un Proces Verbal de executie prin care va valida/atesta implementarea serviciilor la calitatea promisa /agreata de parti;</li>
                                <li>In urma semnarii acestui Proces Verbal, clientul achita contravaloarea serviciilor prestate direct catre reprezentantii Chianti Catering, conform intelegerii si pe baza facturii emise, la fata locului, fara a implica direct site-ul chianti.ro;</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div className="alert-info-custom mt-5">
                    <p><strong>IMPORTANT</strong></p>
                    <p>Proiectele (vezi Definitii in Termeni si Conditii) organizate de Terti si/sau de Chianti Catering fac exceptie de la regulile de comercializare prezentate mai sus, acestea avand caracter de unicitate, drept urmare, Proiectele pot fi planificate, organizate si executate diferit, conform angajamentelor asumate de parti prin contracte si/sau concept.</p>
                </div>
            </section>
        </div>
    );
};

export default CommercePolicy;
