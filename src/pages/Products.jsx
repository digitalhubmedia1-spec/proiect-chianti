import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { isRestaurantOpen, getScheduleStatus } from '../utils/schedule';
import { Search, Zap, UtensilsCrossed } from 'lucide-react';
import SEO from '../components/SEO';
import './Products.css';

const Products = () => {
    const { products, categories, loading, fetchDailyMenu } = useMenu();
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
    const [popupContent, setPopupContent] = useState({ title: "", message: "" });

    // Date Selection State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailyMenuIds, setDailyMenuIds] = useState(null); // null = not loaded yet, [] = empty

    // Helper to get YYYY-MM-DD in LOCAL time
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const loadDailyMenu = async () => {
            // If fetchDailyMenu is likely undefined if context wasn't updated live? 
            // Just in case, check context update. 
            // But we are in the same component.
            if (fetchDailyMenu) {
                const dateStr = formatDate(selectedDate);
                const ids = await fetchDailyMenu(dateStr);
                setDailyMenuIds(ids);
            }
        };
        loadDailyMenu();
    }, [selectedDate, fetchDailyMenu]);

    const changeDate = (days) => {
        const next = new Date();
        next.setDate(new Date().getDate() + days);
        setSelectedDate(next);
        // If clicking today/tomorrow, switch activeCategory to 'Toate' maybe?
        // setActiveCategory("Toate");
    };

    useEffect(() => {
        const updateStatus = () => {
            const status = getScheduleStatus();
            setIsOpen(status.isOpen);
            if (status.showWarning) {
                setPopupContent({ title: status.title, message: status.message });
                setShowPopup(true);
            } else {
                setShowPopup(false);
            }
        };

        updateStatus();
        const interval = setInterval(updateStatus, 60000);
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
                                Comandă simplu și rapid. Livrarea preparatelor gătite proaspăt se face zilnic, de luni până vineri, între orele 11:00 și 15:00.
                            </p>
                            <button className="btn btn-primary" style={{ marginTop: '2rem' }}>Vezi produsele noastre</button>
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
                                background: 'var(--color-accent-light)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: 'var(--color-primary)'
                            }}>
                                <UtensilsCrossed size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Precomenzi Platouri</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Livrăm platouri și preparate savuroase, gătite cu atenție pentru tine, prieteni și familie. Comandă cu cel puțin 48 de ore înainte.
                            </p>
                            <button className="btn btn-primary" style={{ marginTop: '2rem' }}>Vezi preparatele noastre</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW MODE: CATALOG (Existing Logic) ---

    // Filter logic to show ONLY delivery products
    // Filter Logic
    let filteredProducts = products.filter(product => {
        // 1. Delivery Check (Must NOT be catering)
        const cat = categories.find(c => c.name === product.category);
        if (cat?.type === 'catering') return false;

        // 2. Availability Check (is_available flag)
        if (product.is_available === false) return false;

        // 3. Daily Menu Check (If configured)
        if (dailyMenuIds !== null) {
            const isToday = formatDate(selectedDate) === formatDate(new Date());
            if (dailyMenuIds.length > 0) {
                // Explicit configuration exists
                if (!dailyMenuIds.includes(product.id)) return false;
            } else {
                // No configuration found
                if (!isToday) return false; // Future empty date -> Show nothing
                // Today empty -> Show Everything (Backup for safety)
            }
        }

        // 4. Category Filter
        if (activeCategory !== "Toate" && product.category !== activeCategory) {
            // Special handling for Platouri if needed, otherwise strict
            if (!(activeCategory === "Platouri Fel Principal" && product.name.includes("Platou"))) {
                return false;
            }
        }

        // 5. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!product.name.toLowerCase().includes(query) &&
                !(product.description && product.description.toLowerCase().includes(query))) {
                return false;
            }
        }

        return true;
    });

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
                        <h2>{popupContent.title}</h2>
                        <p>{popupContent.message}</p>
                        <button className="btn-close-popup" onClick={() => setShowPopup(false)}>Am înțeles</button>
                    </div>
                </div>,
                document.body
            )}

            <div className="page-header">
                <div className="container">
                    <h1 className="page-title">Meniul Nostru</h1>
                    <p className="page-subtitle">Comandă mâncare delicioasă pentru acasă sau birou</p>

                    {/* Date Navigation Dropdown */}
                    <div className="date-selector-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                        <select
                            value={formatDate(selectedDate)}
                            onChange={(e) => {
                                // Create date from YYYY-MM-DD string, setting it to noon to avoid timezone rollover
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                const newDate = new Date(y, m - 1, d, 12, 0, 0);
                                setSelectedDate(newDate);
                            }}
                            style={{
                                padding: '10px 20px',
                                fontSize: '1rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                color: '#333',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                minWidth: '250px',
                                textAlign: 'center'
                            }}
                        >
                            {[...Array(7)].map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                const dateStr = date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                const dayName = date.toLocaleDateString('ro-RO', { weekday: 'long' });
                                const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                                // Proper value formatting
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                const valueStr = `${y}-${m}-${d}`;

                                return (
                                    <option key={i} value={valueStr}>
                                        {dayNameCap} - {dateStr}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

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
