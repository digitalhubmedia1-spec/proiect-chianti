import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { isRestaurantOpen, getScheduleMessage, isPreOrderPeriod } from '../utils/schedule';
import { Search, Zap, UtensilsCrossed } from 'lucide-react';
import SEO from '../components/SEO';
import './Products.css';

const Products = () => {
    const { products, categories, loading } = useMenu();
    const [activeCategory, setActiveCategory] = useState("Toate");
    const [isOpen, setIsOpen] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [closedMessage, setClosedMessage] = useState("");
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view');

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("default"); // default, asc, desc

    useEffect(() => {
        // Helper to check and update status
        const updateStatus = () => {
            const currentStatus = isRestaurantOpen();
            const currentPreOrder = isPreOrderPeriod();
            setIsOpen(currentStatus.isOpen);
            setClosedMessage(getScheduleMessage());
            return { isOpen: currentStatus.isOpen, preOrder: currentPreOrder };
        };

        // Initial check on mount
        const initial = updateStatus();

        // Show popup if closed OR if in pre-order period, on mount
        if (!initial.isOpen || initial.preOrder) {
            setShowPopup(true);
        }

        // Periodic check for status updates
        const interval = setInterval(() => {
            const current = updateStatus();
            // Auto-close popup if restaurant opens while user is on page
            if (current.isOpen && !current.preOrder) {
                setShowPopup(false);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Prevent filtering before data is loaded
    if (loading) return <div className="loading-spinner">Se încarcă meniul...</div>;

    // --- VIEW MODE: SELECTION SCREEN (Gateway) ---
    if (viewMode !== 'catalog') {
        return (
            <div className="products-page">
                <SEO
                    title="Meniu Comandă Mâncare - Chianti Roman"
                    description="Alege tipul de comandă: Livrare Rapidă pentru preparate calde sau Catering pentru evenimente speciale."
                    canonical="/produse"
                />

                <div className="page-header" style={{ padding: '80px 0 40px' }}>
                    <div className="container">
                        <h1 className="page-title">Cum dorești să comanzi?</h1>
                        <p className="page-subtitle">Alege opțiunea potrivită pentru tine</p>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '80px' }}>
                    <div className="selection-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        maxWidth: '900px',
                        margin: '0 auto'
                    }}>
                        {/* Option 1: Comenzi Rapide */}
                        <div
                            className="selection-card"
                            onClick={() => navigate('/produse?view=catalog')}
                            style={{
                                background: 'white',
                                padding: '3rem 2rem',
                                borderRadius: '16px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                border: '2px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <div className="icon-wrapper" style={{
                                width: '80px',
                                height: '80px',
                                background: 'var(--color-accent-light)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: 'var(--color-primary)'
                            }}>
                                <Zap size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Comenzi Rapide</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Pizza, Paste, Burgeri și alte preparate calde cu livrare imediată la domiciliu sau birou.
                            </p>
                            <button className="btn btn-primary" style={{ marginTop: '2rem' }}>Vezi Meniul</button>
                        </div>

                        {/* Option 2: Catering */}
                        <div
                            className="selection-card"
                            onClick={() => navigate('/catering')}
                            style={{
                                background: 'white',
                                padding: '3rem 2rem',
                                borderRadius: '16px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                border: '2px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <div className="icon-wrapper" style={{
                                width: '80px',
                                height: '80px',
                                background: '#fff1f2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: '#e11d48'
                            }}>
                                <UtensilsCrossed size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Comenzi Catering</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Platouri și meniuri complete pentru evenimente. <br /><strong>Comandă cu minim 48h înainte.</strong>
                            </p>
                            <button className="btn btn-primary" style={{ marginTop: '2rem', background: '#e11d48', borderColor: '#e11d48' }}>Vezi Oferta Catering</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW MODE: CATALOG (Existing Logic) ---

    // Filter logic to show ONLY delivery products
    const deliveryCategories = categories.filter(cat => !cat.type || cat.type === 'delivery');
    const deliveryProducts = products.filter(p => deliveryCategories.some(c => c.name === p.category));

    // Filter Logic based on active category
    let filteredProducts = activeCategory === "Toate"
        ? deliveryProducts
        : deliveryProducts.filter(p => p.category === activeCategory || (activeCategory === "Platouri Fel Principal" && p.name.includes("Platou")));

    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }

    // Sort Logic
    if (sortOrder === 'asc') {
        filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
        filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
    }

    const handleAddToCart = (e, product) => {
        e.preventDefault(); // Prevent navigation if clicking the button inside a Link wrapper
        e.stopPropagation();
        addToCart(product);
        // Optional: toast notification here
    };

    return (
        <div className="products-page">
            <SEO
                title="Meniul Nostru - Comandă Online Pizza & Paste Roman"
                description="Explorează meniul nostru complet: pizza, paste, fructe de mare și deserturi. Livrare rapidă la domiciliu în Roman."
                canonical="/produse?view=catalog"
            />
            {showPopup && ReactDOM.createPortal(
                <div className="schedule-popup-overlay">
                    <div className="schedule-popup">
                        <h2>{!isOpen ? "Restaurant Închis Momentan" : " informații Comenzi"}</h2>
                        <p>{getScheduleMessage()}</p>
                        <button className="btn-close-popup" onClick={() => setShowPopup(false)}>Am înțeles</button>
                    </div>
                </div>,
                document.body
            )}

            <div className="page-header">
                <div className="container">
                    <h1 className="page-title">Meniul Nostru</h1>
                    <p className="page-subtitle">Comandă mâncare delicioasă pentru acasă sau birou</p>

                </div>
            </div>

            <div className="container content-wrapper">
                <aside className="categories-sidebar">
                    <h3>Categorii</h3>
                    <ul>
                        <li>
                            <button
                                className={`category-btn ${activeCategory === "Toate" ? 'active' : ''}`}
                                onClick={() => setActiveCategory("Toate")}
                            >
                                Toate
                            </button>
                        </li>
                        {categories
                            .filter(cat => !cat.type || cat.type === 'delivery')
                            .map(cat => (
                                <li key={cat.id || cat.name}>
                                    <button
                                        className={`category-btn ${activeCategory === cat.name ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(cat.name)}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                    </ul>
                </aside>

                <main className="products-grid-container" style={{ flex: 1 }}>
                    {/* Search & Sort Toolbar */}
                    <div className="products-toolbar" style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        alignItems: 'center'
                    }}>
                        {/* BACK BUTTON for easy return to mode selection */}
                        <button
                            onClick={() => navigate('/produse')}
                            title="Înapoi la selecție"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#64748b',
                                cursor: 'pointer'
                            }}
                        >
                            <Zap size={20} />
                        </button>

                        <div className="search-box" style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Caută produse..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div className="sort-box" style={{ minWidth: '180px' }}>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="default">Sortare implicită</option>
                                <option value="asc">Preț: Crescător</option>
                                <option value="desc">Preț: Descrescător</option>
                            </select>
                        </div>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <div key={product.id} className={`product-card ${product.is_available === false ? 'unavailable' : ''}`} onClick={() => navigate(`/produs/${product.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="product-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-desc">{product.description}</p>
                                        <div className="product-footer">
                                            <span className="product-price">{product.price.toFixed(2)} Lei</span>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                title="Adaugă în coș"
                                            >
                                                Adaugă
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-products" style={{ width: '100%' }}>
                                <p>Nu am găsit produse conform criteriilor selectate.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Products;
