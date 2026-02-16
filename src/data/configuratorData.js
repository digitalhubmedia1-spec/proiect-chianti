// seed data

export const SEED_STEPS = [
    { id: 1, title: 'Gustări Reci', iconName: 'Utensils' },
    { id: 2, title: 'Gustări Calde', iconName: 'Utensils' },
    { id: 3, title: 'Sarmăluțe', iconName: 'Utensils' },
    { id: 4, title: 'Fel Principal', iconName: 'Utensils' },
    { id: 5, title: 'Pește', iconName: 'Utensils' },
    { id: 6, title: 'Tort & Prăjituri', iconName: 'Cake' },
    { id: 7, title: 'Băuturi', iconName: 'Wine' },
    { id: 8, title: 'Raport Final', iconName: 'FileText' },
];

export const SEED_PRODUCTS = {
    1: [
        {
            id: 101,
            title: 'GR1 - Champion',
            image: '/images/menu/gustari-reci/GR1 - Champion.jpg',
            desc: 'Cosulet telina, rulada Dobos, rulada broccoli, Rafaello branza.',
            fullDesc: 'Aceasta farfurie contine un cosulet central din salata telina cu bucati de carne de curcan, o rulada multicolora Dobos din cascaval si sunca presata, o rulada de broccoli din piept de pasare si smantana de gatit, o rulada de cascaval cu crema de unt si verdeata, floricele de salam italian mediu-uscat cu gust usor picant, Raffaello multicolore din pasta de branza rostogolite prin seminte si nelipsitele rosii cherry.'
        },
        {
            id: 102,
            title: 'GR2 - Gourme',
            image: '/images/menu/gustari-reci/GR2 - Gourme.jpg',
            desc: 'Salata Boeuf, rulada pasare bacon, chiftelute, muschiulet porc.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala un turnulet multi-strat din salata de Boeuf decorata cu o jumatate de ou de prepelita, o rulada de pasare si cascaval invelita in bacon, Raffaello multicolore din pasta de branza rostogolite prin seminte, chiftelute din carne de porc si vita trase prin seminte de susan, o rulada cu spanac si crema delicioasa de branza, pastrama din piept de pasare tinuta usor la fum, muschiulet de porc copt la jar si nelipsitele rosii cherry.'
        },
        {
            id: 103,
            title: 'GR3 - Advantage',
            image: '/images/menu/gustari-reci/GR3 - Advantage.jpg',
            desc: 'Tartina branza, tartina chiftea, rulada broccoli, muschiulet porc.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala o tartina delicioasa din crema fina de branza decorata pe paine de secara, tartina chiftea din carne amestec de vita si porc, Raffaello multicolore din pasta de branza rostogolite prin seminte, o rulada de broccoli din piept de pasare si smantana de gatit, o rulada de cascaval cu crema de unt si verdeata, o rulada cu spanac cu crema de branza, barcuta din ardei rosu umpluta cu pasta de branza, muschiulet de porc copt la jar, toate presarate cu putina verdeata.'
        },
        {
            id: 104,
            title: 'GR4 - Select',
            image: '/images/menu/gustari-reci/GR4 - Select.jpg',
            desc: 'Cosulet telina, pastrama pasare, tarta cascaval bacon, piftelute.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala un cosulet umplut cu salata de telina si bucatele din piept de curcan, decorat cu o jumatate de ou de prepelita, rosii uscate si putina verdeata, pastrama din piept de pasare tinuta usor la fum, muschiulet de porc copt la jar, Raffaello multicolore din pasta de branza rostogolite prin seminte, o rulada de pasare invelita in bacon, o rulada de spanac cu crema delicioasa de branza, o tarta de cascaval cu bacon coapta in cuptor, piftelute din carne amestec de vita si porc rostogolite prin seminte de susan, rosii cherry si putina verdeata.'
        },
        {
            id: 105,
            title: 'GR5 - Favorite',
            image: '/images/menu/gustari-reci/GR5 - Favorite.jpg',
            desc: 'Tartina branza, rulada pasare bacon, tartina chiftea, barcuta ardei.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala o tartina din crema fina de branza decorata pe paine de secara, o rulada din carne de pasare si cascaval invelita in bacon, tartina chiftea din carne amestec de vita si porc, Raffaello multicolore din pasta de branza rostogolite prin seminte, o rulada de broccoli cu piept de pasare si smantana de gatit, o rulada de cascaval cu crema de unt si verdeata, o rulada cu spanac si crema delicioasa de branza, barcuta din ardei rosu umpluta cu pasta de branza, muschiulet de porc copt la jar, toate presarate cu putina verdeata.'
        },
        {
            id: 106,
            title: 'GR6 - Soft',
            image: '/images/menu/gustari-reci/GR6 - Soft.jpg',
            desc: 'Briosa bacon, tartina chiftea, mini-frigaruie, pastrama pasare.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala o briosa preparata din aluat, bacon si masline verzi, decorata din belsug cu crema fina de branza, usor picanta amestecata cu ardei rosu, o tartina chiftea din carne amestec de vita si porc, doua rulade din carne de pasare si cascaval invelite in bacon, o rulada cu spanac si crema delicioasa de branza, pastrama din piept de pasare tinuta usor la fum, barcuta din ardei rosu umpluta cu pasta de branza, mini-frigaruie din telemea de capra, rosie, castravete si masline, rosii cherry, toate presarate cu putina verdeata.'
        },
        {
            id: 107,
            title: 'GR7 - Fancy',
            image: '/images/menu/gustari-reci/GR7 - Fancy.jpg',
            desc: 'Cosulet avocado somon, tartina mediteraniana, tarta branza.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala un cosulet inedit umplut cu pasta de avocado si somon, o piesa chiftea din carne amestec de vita si porc, o tartina mediteraniana pe pat de biscuit cu mix de pasta de branza, pasta de masline, o jumatate de ou de prepelita si o rosie cherry, o rulada multicolora Dobos, o rulada cu spanac si crema delicioasa de branza, pastrama din piept de pasare, o rulada din carne de pasare si cascaval invelita in bacon, o rulada de cascaval cu crema de unt si verdeata, o tarta speciala cu crema de branza, masline si rosii cherry.'
        },
        {
            id: 108,
            title: 'GR8 - Fantasy',
            image: '/images/menu/gustari-reci/GR8 - Fantasy.jpg',
            desc: 'Cosulet telina curcan, rulada spanac, mini-frigaruie, rondele cascaval.',
            fullDesc: 'Aceasta farfurie contine un cosulet umplut cu salata de telina amestecata cu bucati de piept de curcan, o rulada cu spanac si crema delicioasa de branza, pastrama din piept de pasare, barcuta din ardei rosu umpluta cu pasta de branza, muschiulet de porc copt la jar, o rulada multicolora Dobos din cascaval si sunca, mini-frigaruie din telemea de capra, rosie, castravete si masline, o rulada de broccoli cu piept de pasare si smantana de gatit, doua rondele de cascaval, piftelute din carne amestec de vita si porc rostogolite prin seminte de susan, rosii cherry si masline.'
        },
        {
            id: 109,
            title: 'GR9 - Traditional',
            image: '/images/menu/gustari-reci/GR9 - Traditional.jpg',
            desc: 'Briosa bacon, sunculita taraneasca, floricele salam, telemea capra.',
            fullDesc: 'Aceasta farfurie contine o briosa preparata din aluat, bacon si masline verzi decorata cu crema fina de branza, usor picanta amestecata cu ardei rosu, floricele de salam italian mediu-uscat, piftelute din carne amestec de vita si porc rostogolite prin seminte de susan, o rulada cu spanac si crema delicioasa de branza, muschiulet de porc copt la jar, pastrama din piept de pasare, sunculita taraneasca de casa, doua rulade din carne de pasare si cascaval invelite in bacon, barcuta din ardei rosu umpluta cu pasta de branza, telemea de capra, castravete, rosii cherry si masline.'
        },
        {
            id: 110,
            title: 'GR10 - Flower',
            image: '/images/menu/gustari-reci/GR10 - Flower.jpg',
            desc: 'Cosulet telina, rulada Dobos, sunculita taraneasca, Rafaello branza.',
            fullDesc: 'Aceasta farfurie contine ca piesa centrala un cosulet deosebit umplut cu salata de telina amestecata cu bucati de piept de curcan, decorat cu rosii coapte si verdeata, o rulada multicolora Dobos din cascaval si sunca presata presarata cu boabe de piper amestec proaspat macinat, doua bucati de rulada de broccoli cu piept de pasare si smantana de gatit, muschiulet de porc copt la jar, pastrama din piept de pasare tinuta usor la fum, sunculita taraneasca de casa, Raffaello multicolore din pasta de branza rostogolite prin seminte, rosii cherry si masline.'
        }
    ],
    2: [
        {
            id: 201,
            title: 'GC1 - Premier',
            image: '/images/menu/gustari-calde/GC1 - Premier.jpg',
            desc: 'Rulou pasare piersica, piure mazare, legume.',
            fullDesc: 'Aceasta farfurie contine ca produs un rulou de carne de pasare umplut cu piersica, un preparat cald delicios, suculent, cu un gust usor acrisor, realizat dupa o reteta speciala, ce se recomanda a fi servit cu piure de mazare si legume presarate cu cascaval trase la cuptor.'
        },
        {
            id: 202,
            title: 'GC2 - Elegance',
            image: '/images/menu/gustari-calde/GC2 - Elegance.jpg',
            desc: 'Pulpa pasare bacon, ciuperci, ardei rosu.',
            fullDesc: 'Aceasta farfurie contine ca produs o pulpa de pasare umpluta cu bacon, ciuperci si ardei rosu, un preparat cald apetisant, cu gust aromat si usor picant foarte apreciat de clientii nostri. Acest produs a fost realizat dupa o reteta traditionala si se recomanda a fi servit cu diverse piureuri, dulceata de ardei iute si un mix de legume la gratar.'
        },
        {
            id: 203,
            title: 'GC3 - Tasty',
            image: '/images/menu/gustari-calde/GC3 - Tasty.jpg',
            desc: 'Piept pui crusta pesmet, bacon, cascaval, ceapa verde.',
            fullDesc: 'Aceasta farfurie contine ca produs un piept de pui in crusta de pesmet, umplut cu bacon, cascaval si ceapa verde, un preparat cald foarte gustos gatit la cuptor, realizat dupa o reteta proprie ce se recomanda a fi servit cu dulceata de ardei iute si un mix de legume la gratar.'
        },
        {
            id: 204,
            title: 'GC4 - Great',
            image: '/images/menu/gustari-calde/GC4 - Great.jpg',
            desc: 'Pulpa pasare bacon, cascaval, legume gratar.',
            fullDesc: 'Aceasta farfurie contine ca produs o pulpa de pasare umpluta cu bacon si cascaval, un preparat cald gatit cu multa atentie la cuptor, usor suculent, cu un gust putin picant si foarte apreciat de clientii nostri ce a fost realizat dupa o reteta traditionala ce se recomanda a fi servit cu dulceata de ardei iute si un mix de legume la gratar.'
        }
    ],
    3: [
        {
            id: 301,
            title: 'S1 - Sărmăluțe tradiționale',
            image: '/images/menu/sarmalute/S1 - Sărmăluțe tradiționale.jpg',
            desc: 'Sarmalute moldovenesti, mamaliguta, bacon, smantana, ardei.',
            fullDesc: 'Aceasta farfurie contine ca produs vestitele sarmalute moldovenesti, din amestec de carne de vita si porc dupa o reteta proprie, gatite la cuptor, ce sunt servite cu mamaliguta pe plita si bacon la gratar, smantana si ardei iute copt.'
        },
        {
            id: 302,
            title: 'S2 - Sărmăluțe cu cârnăcior',
            image: '/images/menu/sarmalute/S2 - Sărmăluțe cu cârnăcior.jpg',
            desc: 'Sarmalute, carnacior de casa, mamaliguta, smantana.',
            fullDesc: 'Aceasta farfurie contine ca produs cunoscutele sarmalute cu carnacior, preparate din amestec de carne de vita si porc dupa o reteta proprie, gatite la cuptor cu multa atentie, ce sunt recomandate a fi servite cu mamaliguta si un carnacior de casa la gratar, smantana si ardei iute copt.'
        },
        {
            id: 303,
            title: 'S3 - Sărmăluțe cu bacon crocant',
            image: '/images/menu/sarmalute/S3 - Sărmăluțe cu bacon crocant.jpg',
            desc: 'Sarmalute moldovenesti, bacon crocant fripteuza, mamaliguta.',
            fullDesc: 'Aceasta farfurie contine ca produs sarmalutele moldovenesti traditionale, preparate din amestec de carne de vita si porc dupa o reteta proprie, gatite la cuptor, ce se recomanda a fi servite cu mamaliguta si bacon crocant prajit in fripteuza, garnisite cu smantana si ardei iute copt.'
        },
        {
            id: 304,
            title: 'S4 - Sărmăluțe Chianti',
            image: '/images/menu/sarmalute/S4 - Sărmăluțe chianti.jpg',
            desc: 'Sarmalute Chianti, mamaliguta, bacon gratar, smantana.',
            fullDesc: 'Aceasta farfurie contine ca produs Sarmalute moldovenesti marca Chianti, din amestec de carne de vita si porc preparate dupa o reteta proprie, gatite la cuptor, ce se recomanda a fi servite cu mamaliguta si bacon la gratar, smantana si ardei iute copt.'
        }
    ],
    4: [
        {
            id: 401,
            title: 'F1 - Cotlet purceluș caramelizat',
            image: '/images/menu/fel-principal/F1 - Cotlet purceluș caramelizat.jpg',
            desc: 'Cotlet purcelus, caramel caju, piure cartofi si mazare.',
            fullDesc: 'Aceasta farfurie contine ca produs o bucata de cotlet de purcelus tinut la rece, tavalit prin caramel din caju si miere de albine, un preparat excelent gatit la cuptor dupa o reteta speciala, usor suculent, cu un gust deosebit  ce se recomanda a fi servit cu un mixt de piure din cartofi si mazare si dulceata de ardei iute, usor picanta, preparata in casa.'
        },
        {
            id: 402,
            title: 'F2 - Mușchiuleț împletit',
            image: '/images/menu/fel-principal/F2 - Mușchiuleț împletit.jpg',
            desc: 'Muschiulet purcelus impletit, bacon, slaninuta, cartofi rozmarin.',
            fullDesc: 'Aceasta farfurie contine ca produs vestitul muschiulet de purcelus impletit cu bucatele de bacon si slaninuta, un preparat deosebit gatit la cuptor dupa o reteta speciala, suculent, cu un gust usor picant si cu aroma fina de usturoi, ce se recomanda a fi servit cu cartofi la cuptor cu rozmarin si dulceata de ardei iute, usor picanta preparata in casa.'
        },
        {
            id: 403,
            title: 'F3 - Cotlet de purceluș cu ananas',
            image: '/images/menu/fel-principal/F3 - Cotlet de purceluș cu ananas.jpg',
            desc: 'Cotlet purcelus, spanac, ananas, piure cartofi si mazare.',
            fullDesc: 'Aceasta farfurie contine ca produs un cotlet de purcelus maturat umplut cu spanac, ciuperci si cascaval, un preparat distins gatit la cuptor dupa o reteta proprie, cu un gust acrisor-picant si cu aroma deosebita de ananas, ce se recomanda a fi servit cu un mixt de piure din cartofi si mazare si dulceata de ardei iute preparata in casa.'
        },
        {
            id: 404,
            title: 'F4 - Mixt grill & cârnăcior',
            image: '/images/menu/fel-principal/F4 - Mixt grill & cârnăcior.jpg',
            desc: 'Mixt grill ceafa, pui, carnacior, cartofi rozmarin.',
            fullDesc: 'Aceasta farfurie contine ca produs un mixt grill din ceafa de porc, piept de pasare si carnacior de casa, toate atent preparate la gratar, ce se recomanda a fi servit cu cartofi cu rozmarin gatiti la cuptor si presarati cu verdeata, langa diferite salate sau muraturi asortate, dupa gust.'
        },
        {
            id: 405,
            title: 'F5 - Mixt grill tradițional',
            image: '/images/menu/fel-principal/F5 - Mixt grill tradițional.jpg',
            desc: 'Mixt grill ceafa, pui, cartofi rozmarin.',
            fullDesc: 'Aceasta farfurie contine ca produs un mixt grill traditional din ceafa de porc si piept de pasare atent preparate la gratar, ce se recomanda a fi servit cu cartofi cu rozmarin gatiti in cuptor si presarati cu verdeata langa diferite salate sau muraturi asortate, dupa gust.'
        }
    ],
    5: [
        {
            id: 501,
            title: 'P1 - File somon în crustă albă',
            image: '/images/menu/peste/P1 - File somon in crusta alba.jpg',
            desc: 'File somon, crusta susan alb, piure, sos butter lemon.',
            fullDesc: 'Aceasta farfurie contine un file de somon gatit in crusta de susan alb, ca preparat cald foarte gustos si apreciat de clientii nostri, recomandat a fi servit alaturi de un piure in doua culori din cartofi si mazare si de  celebrul sos butter lemon din unt si lamaie.'
        },
        {
            id: 502,
            title: 'P2 - File de cod în crustă neagră',
            image: '/images/menu/peste/P2 - File de cod in crusta neagra.jpg',
            desc: 'File cod, crusta susan negru, legume gratar.',
            fullDesc: 'Aceasta farfurie contine un file de cod gatit in crusta de susan negru, ca preparat cald excelent ce este recomandat a fi servit cu legume asortate la gratar stropite din belsug cu zeama de lamaie.'
        },
        {
            id: 503,
            title: 'P3 - File somon în crustă neagră',
            image: '/images/menu/peste/P3 - File somon in crusta neagra.jpg',
            desc: 'File somon, crusta susan negru, orez salbatic, ciuperci.',
            fullDesc: 'Aceasta farfurie contine fileul de somon gatit in crusta neagra de susan, ca preparat cald ce este bine apreciat de clientii nostri, recomandat a fi servit alaturi de orez salbatic, ciuperci si rosii cherry trase la gratar bine stropite cu zeama de lamaie.'
        },
        {
            id: 504,
            title: 'P4 - Păstrăv la grătar cu legume',
            image: '/images/menu/peste/P4 - Pastrav la gratar cu legume.jpg',
            desc: 'Pastrav gratar, legume cuptor, pat dovlecel, sos butter lemon.',
            fullDesc: 'Aceasta farfurie contine vestitul pastrav la gratar cu legume trase in cuptor garnisite pe pat de dovlecel copt, un preparat cald bine apreciat de clientii nostri ce este recomandat a fi servit cu sos butter lemon si/sau zeama de lamaie.'
        }
    ],
    6: [
        {
            id: 601,
            title: 'Tort și Prăjituri',
            image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            desc: 'Consiliere specializată, cele mai bune torturi și prăjituri.',
            fullDesc: 'Aici primiți consiliere de specialitate pentru a putea obține cele mai potrivite produse la cele mai bune prețuri de la laboratoarele de cofetărie din zonă. Bifați acest produs în configurator și specialiștii noștri vor lucra gratuit pentru Dvs. Drept urmare, dacă doriți să vă recomandăm diverse specialități de cofetărie și cele mai bune torturi din zonă, nu ezitați să bifați aici acest serviciu.'
        }
    ],
    7: [
        {
            id: 701,
            title: 'B1 - Pachet Starter',
            image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80',
            desc: 'Vin alb demisec carafă, apă, sucuri, cafea - Open Bar.',
            fullDesc: 'Acest pachet de băuturi include: Vin alb demisec la carafă, apă plată și suc la 0,5l, cafea – Open Bar*. *Aceste băuturi sunt oferite la discreție pe toată durata evenimentului. Fiecare categorie inclusă oferă posibilități de personalizare. Pe lângă acest pachet, puteți aduce alte băuturi din altă parte.'
        },
        {
            id: 702,
            title: 'B2 - Pachet Standard',
            image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
            desc: 'Vin alb/roze carafă, spirtoase (100ml), șampanie, Open Bar soft.',
            fullDesc: 'Acest pachet include: Vin alb + vin roze demisec la carafă, apă și suc, cafea – Open Bar*. Plus: Palincă, Whiskey, Lichioruri (0,100 ml/meniu) și Șampanie la recepție & tort (0,100 ml/meniu). băuturile soft sunt la discreție. Posibilitate personalizare.'
        },
        {
            id: 703,
            title: 'B3 - Pachet Premium',
            image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
            desc: 'Open Bar Complet: spirtoase, bere, vin carafă, șampanie.',
            fullDesc: 'Pentru pretențioși: Vin alb + vin roze demisec la carafă, apă, suc, espresso – Open Bar. Plus Open Bar alcoolic: Palincă, Whiskey, Vodcă, Lichioruri, Bere la draft/cutie, Șampanie/Prosecco. Totul la discreție pe toată durata evenimentului.'
        },
        {
            id: 704,
            title: 'B4 - Pachet Deluxe',
            image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
            desc: 'Vin sticlă HoReCa, Spirtoase, Bar Mobil Cocktail-uri, Open Bar.',
            fullDesc: 'Experiența supremă: Vin alb, roze, roșu (crame HoReCa) la sticlă. Spirtoase (Palincă, Whiskey, Vodcă, Lichior), Bere draft. Bar mobil cu barman dedicat pentru cocktail-uri alcoolice și non-alcoolice, shot-uri diverse. Șampanie/Prosecco la discreție.'
        }
    ]
};
