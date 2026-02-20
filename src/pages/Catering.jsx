import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { isRestaurantOpen, getScheduleMessage, isPreOrderPeriod } from '../utils/schedule';
import { Search } from 'lucide-react';
import SEO from '../components/SEO';
import './Catering.css';
import './Products.css'; // Reuse product grid styles

const Catering = () => {
    const { products, categories, loading } = useMenu();
    // Default to first catering category if available, else "Toate"
    const [activeCategory, setActiveCategory] = useState("Toate");
    const [isOpen, setIsOpen] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("default");

    // Filter only Catering categories
    const cateringCategories = categories.filter(cat => cat.type === 'catering' && cat.is_visible !== false);

    // Set initial active category to the first one if "Toate" isn't desired or just generic
    useEffect(() => {
        if (!loading && cateringCategories.length > 0 && activeCategory === "Toate") {
            setActiveCategory("Toate");
        }
    }, [loading, cateringCategories, activeCategory]);

    // Derived list including "Toate" for UI
    const displayCategories = [{ id: 'all', name: 'Toate', type: 'catering' }, ...cateringCategories];

    // State for the 48h advance notice popup
    const [showInfoPopup, setShowInfoPopup] = useState(true);

    // Always open for catering pre-orders, no popup needed
    useEffect(() => {
        setIsOpen(true);
    }, []);

    // Filter Logic
    let filteredProducts = activeCategory === "Toate"
        ? products.filter(p => cateringCategories.some(c => c.name === p.category) && p.is_available !== false)
        : products.filter(p => p.category === activeCategory && p.is_available !== false);

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

    // --- PAGINATION LOGIC ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, searchQuery, sortOrder]);

    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const truncate = (str, n) => {
        return (str && str.length > n) ? str.substr(0, n - 1) + "..." : str;
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    if (loading) return <div className="loading-spinner">Se încarcă meniul catering...</div>;

    return (
        <div className="products-page catering-page-dynamic">
            <SEO
                title="Catering Premium Roman - Evenimente Speciale"
                description="Platouri aperitiv cald și rece, meniuri complete pentru evenimente. Livrare catering la domiciliu sau birou în Roman."
                canonical="/catering"
            />

            {/* 48h Advance Notice Popup */}
            {/* Portals for Popups */}
            {showInfoPopup && ReactDOM.createPortal(
                <div className="schedule-popup-overlay" style={{ zIndex: 2000 }}>
                    <div className="schedule-popup">
                        <h2 style={{ color: '#800020' }}>Notă Importantă</h2>
                        <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
                            Vă rugăm să rețineți că <strong>produsele de catering</strong> se comandă cu minim <strong>48 de ore înainte</strong>.
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                            Acest lucru ne ajută să garantăm prospețimea și calitatea preparatelor pentru evenimentul dumneavoastră.
                        </p>
                        <button
                            className="btn-close-popup"
                            onClick={() => setShowInfoPopup(false)}
                            style={{ background: '#800020' }}
                        >
                            Am înțeles
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {showPopup && ReactDOM.createPortal(
                <div className="schedule-popup-overlay">
                    <div className="schedule-popup">
                        <h2>{!isOpen ? "Comenzi Indisponibile" : "Informații Catering"}</h2>
                        <p>{getScheduleMessage()}</p>
                        <button className="btn-close-popup" onClick={() => setShowPopup(false)}>Am înțeles</button>
                    </div>
                </div>,
                document.body
            )}

            <div className="page-header catering-header">
                <div className="container">
                    <h1 className="page-title">Catering & Evenimente</h1>
                    <p className="page-subtitle">Platouri delicioase pentru evenimentul tău special</p>
                    <p className="current-date-header" style={{ color: '#aaa', marginTop: '5px', fontSize: '0.95rem' }}>
                        {new Date().toLocaleDateString('ro-RO', { weekday: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('ro-RO', { weekday: 'long' }).slice(1)}, {new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    {!isOpen && <p className="status-closed" style={{ color: 'red', fontWeight: 'bold', marginTop: '1rem' }}>
                        COMENZI INDISPONIBILE MOMENTAN
                    </p>}
                </div>
            </div>

            <div className="container content-wrapper">
                <aside className="categories-sidebar">
                    <h3>Categorii</h3>
                    <ul>
                        {displayCategories.map(cat => (
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
                    {cateringCategories.length === 0 && (
                        <p className="text-muted mt-2">Nu există categorii de catering definite.</p>
                    )}
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
                        <div className="search-box" style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Caută produse catering..."
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
                        {currentProducts.length > 0 ? (
                            currentProducts.map(product => (
                                <div key={product.id} className={`product-card ${product.is_available === false ? 'unavailable' : ''}`} onClick={() => navigate(`/produs/${product.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="product-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-desc" title={product.description}>{truncate(product.description, 80)}</p>
                                        <div className="product-footer">
                                            <span className="product-price">{product.price.toFixed(2)} Lei</span>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!isOpen}
                                                title={!isOpen ? "Indisponibil" : "Adaugă în coș"}
                                            >
                                                {isOpen ? "Adaugă" : "Închis"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-products" style={{ width: '100%' }}>
                                <p>Nu am găsit produse conform criteriilor selectate.</p>
                                {cateringCategories.length === 0 && (
                                    <p>Adaugă categorii de tip "Catering" din panoul de administrare pentru a începe.</p>
                                )}
                            </div>
                        )}

                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', paddingBottom: '2rem' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                &laquo; Îmapoi
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        background: currentPage === i + 1 ? '#990000' : 'white',
                                        color: currentPage === i + 1 ? 'white' : '#1e293b',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Înainte &raquo;
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Catering;
