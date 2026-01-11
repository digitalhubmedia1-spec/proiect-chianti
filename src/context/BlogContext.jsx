import React, { createContext, useContext, useState } from 'react';

const BlogContext = createContext();

export const useBlog = () => useContext(BlogContext);

export const BlogProvider = ({ children }) => {
    const [posts, setPosts] = useState(() => {
        const savedPosts = localStorage.getItem('chianti_blog_posts');
        if (savedPosts) {
            return JSON.parse(savedPosts);
        }
        return [
            {
                id: '1',
                title: 'Povestea Vinului Chianti',
                image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                excerpt: 'Descoperă istoria fascinantă a regiunii Chianti și cum a devenit unul dintre cele mai apreciate vinuri din lume.',
                content: `
                    <p>Regiunea Chianti din inima Toscanei este mai mult decât o simplă zonă geografică; este un simbol al tradiției viticole italiene. Istoria sa începe încă din epoca etruscă, dar numele "Chianti" a fost folosit pentru prima dată în documente în secolul al XIII-lea.</p>
                    
                    <h3>O Tradiție de Secole</h3>
                    <p>Vinul Chianti Classico, recunoscut după celebra emblemă "Gallo Nero" (Cocoșul Negru), se produce după reguli stricte. Pentru a purta acest nume, vinul trebuie să conțină cel puțin 80% struguri Sangiovese, soiul rege al Toscanei.</p>

                    <h3>Gustul Autentic</h3>
                    <p>Un Chianti veritabil se remarcă prin arome de cireșe roșii, ierburi uscate și o aciditate vibrantă care îl face perfect pentru a fi asociat cu mâncăruri. De la paste cu sos de roșii până la o friptură suculentă "Bistecca alla Fiorentina", Chianti este partenerul ideal la masă.</p>

                    <p>Te invităm în restaurantul nostru să deguști o selecție atent aleasă de vinuri Chianti, perfecte pentru a aduce un strop din soarele Italiei în inima orașului.</p>
                `
            },
            {
                id: '2',
                title: 'Secretele Pasta Carbonara',
                image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                excerpt: 'Cum se prepară o Carbonara autentică? Află ingredientele secrete și greșelile de evitat.',
                content: `
                    <p>Pastele Carbonara sunt, probabil, cel mai discutat fel de mâncare italian. Deși rețeta originală este incredibil de simplă, variantele moderne tind să complice lucrurile inutil (și greșit!).</p>

                    <h3>Fără Smântână!</h3>
                    <p>Aceasta este regula de aur: o Carbonara autentică NU conține smântână. Cremozitatea sosului vine din emulsia creată de ouă (gălbenușuri), brânză Pecorino Romano și puțină apă bogată în amidon de la fierberea pastelor.</p>

                    <h3>Ingredientele Cheie</h3>
                    <ul>
                        <li><strong>Guanciale:</strong> Falcă de porc maturată, nu simplă șuncă sau bacon. Grăsimea sa se topește și oferă aroma inconfundabilă.</li>
                        <li><strong>Pecorino Romano:</strong> O brânză de oaie sărată și picantă, esențială pentru echilibrarea gustului.</li>
                        <li><strong>Piper Negru:</strong> Proaspăt măcinat, din abundență ("Carbonara" vine de la "carbonari" - cărbunari, sugerând aspectul piperului).</li>
                    </ul>

                    <p>Vino la noi să guști o Carbonara făcută ca la carte, respectând cu sfințenie tradiția romană!</p>
                `
            },
            {
                id: '3',
                title: 'Organizarea Evenimentelor Perfecte',
                image: 'https://images.unsplash.com/photo-1519225468359-2996bc01c083?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                excerpt: 'Fie că e o nuntă sau un botez, detaliile fac diferența. Iată câteva sfaturi pentru un eveniment memorabil.',
                content: `
                    <p>Un eveniment reușit nu se întâmplă pur și simplu; este rezultatul unei planificări atente și a pasiunii pentru ospitalitate. La Chianti, am găzduit sute de evenimente și am învățat câteva lecții prețioase.</p>

                    <h3>Atmosfera Contează</h3>
                    <p>Muzica, iluminatul și decorul trebuie să lucreze împreună. O sală prea luminoasă poate ucide intimitatea, în timp ce una prea întunecată poate fi obositoare. Echilibrul este cheia.</p>

                    <h3>Meniul Personalizat</h3>
                    <p>Nu există "o mărime universală" când vine vorba de mâncare. Oferim degustări prealabile pentru a ne asigura că meniul ales reflectă gusturile gazdelor și satisface toți invitații.</p>

                    <p>Te gândești să organizezi un eveniment? Suntem aici să te ajutăm să transformi viziunea ta în realitate, cu acel "touch" de eleganță italiană.</p>
                `
            }
        ];
    });

    React.useEffect(() => {
        localStorage.setItem('chianti_blog_posts', JSON.stringify(posts));
    }, [posts]);

    const addPost = (newPost) => {
        const postWithId = { ...newPost, id: Date.now().toString() };
        setPosts(prev => [postWithId, ...prev]);
    };

    const updatePost = (id, updatedPost) => {
        setPosts(prev => prev.map(post => post.id === id ? { ...post, ...updatedPost } : post));
    };

    const deletePost = (id) => {
        if (window.confirm('Ești sigur că vrei să ștergi acest articol?')) {
            setPosts(prev => prev.filter(post => post.id !== id));
        }
    };

    const getPostById = (id) => posts.find(p => p.id === id);

    return (
        <BlogContext.Provider value={{ posts, getPostById, addPost, updatePost, deletePost }}>
            {children}
        </BlogContext.Provider>
    );
};
