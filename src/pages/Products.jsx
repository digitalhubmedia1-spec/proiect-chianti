import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import ProductExtras from '../components/ProductExtras';
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

    // Helper to get next N weekdays (Mon-Fri)
    const getNextWeekdays = (startDate = new Date(), count = 7) => {
        const days = [];
        const current = new Date(startDate);

        while (days.length < count) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sun (0) and Sat (6)
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        return days;
    };

    // Initial Date: Must be a weekday
    const getInitialDate = () => {
        const d = new Date();
        while (d.getDay() === 0 || d.getDay() === 6) {
            d.setDate(d.getDate() + 1);
        }
        return d;
    };

    // Date Selection State
    const validDates = getNextWeekdays(new Date(), 7);

    // Initial Date Logic: Check URL param -> Fallback to valid logic
    const getInitialDateFromUrl = () => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const parsed = new Date(dateParam);
            // Basic validation: is it a valid date?
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        return getInitialDate();
    };

    const [selectedDate, setSelectedDate] = useState(getInitialDateFromUrl());

    // Update URL when selectedDate changes (OPTIONAL: Do this in the change handler instead to avoid loops if needed, but effect is cleaner)
    useEffect(() => {
        const currentStr = formatDate(selectedDate);
        const urlStr = searchParams.get('date');

        // Persist to localStorage for "Continue Shopping" logic
        localStorage.setItem('chianti_last_date', currentStr);

        if (currentStr !== urlStr) {
            setSearchParams(prev => {
                prev.set('date', currentStr);
                return prev;
            }, { replace: true });
        }
    }, [selectedDate, setSearchParams]);
    const [dailyMenuData, setDailyMenuData] = useState(null); // Stores {id, stock} objects

    // --- PAGINATION HOOKS HOISTED ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Reset page when filters change (category, search, date)
    // Note: This effect must exist even if we return early, though it might run needlessly. 
    // Ideally, we move the conditional return logic to the END or use a sub-component.
    // But hoisting hooks is the quick fix for Error #310.
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, searchQuery, sortOrder, selectedDate]);

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
                const data = await fetchDailyMenu(dateStr);
                setDailyMenuData(data);
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



    // Build map for efficient lookup
    const dailyMenuMap = {};
    if (dailyMenuData) {
        dailyMenuData.forEach(item => {
            dailyMenuMap[item.id] = item.stock;
        });
    }

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
        // 3. Daily Menu Check (If configured) - THIS IS PRIMARY
        if (dailyMenuData !== null) {
            const isToday = formatDate(selectedDate) === formatDate(new Date());
            if (dailyMenuData.length > 0) {
                // Explicit configuration exists
                // Check if product is in the map. If it IS, we force inclusion (ignoring global disabled) unless catered?
                // Actually, let's keep it safe: 
                // If it IS in the menu, we return true (or continue logic).
                // If it is NOT in the menu, we return false.

                if (dailyMenuMap[product.id] !== undefined) {
                    // OPTIONAL: Filter out catering types if needed, but if Admin added it, display it.
                    // We SKIP the global availability check effectively by not returning false earlier if we structured it right.
                    // But we returned early above. We need to restructure.
                    return true;
                }
                return false;
            } else {
                // No configuration found -> SHOW NOTHING (User request: strict mode)
                return false;
            }
        }

        // Standard Checks (Only if no Daily Menu override active for this specific item?)
        // Wait, the logic above returns false if Daily Menu is active but item not found.
        // If Daily Menu IS active and item IS found, we returned true.
        // So we need to move the Standard Checks INTO the "else" of "Daily Menu exists" OR run them before but allow override?

        // BETTER LOGIC:
        // 1. Catering Check (Always enforce?)
        const cat = categories.find(c => c.name === product.category);
        if (cat?.type === 'catering') return false;

        // 2. Daily Menu Logic
        if (dailyMenuData !== null && dailyMenuData.length > 0) {
            // If Menu Configured: ONLY show if in menu.
            // If in menu -> SHOW (ignore global is_available)
            return dailyMenuMap[product.id] !== undefined;
        }

        // 3. Fallback (Standard Catalog)
        // If no daily menu configured (or today empty fallback):
        // Enforce is_available
        if (product.is_available === false) return false;

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

    const productsSorted = [...filteredProducts].sort((a, b) => {
        if (sortOrder === "asc") return a.price - b.price;
        if (sortOrder === "desc") return b.price - a.price;
        return 0;
    });



    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = productsSorted.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(productsSorted.length / itemsPerPage);

    const truncate = (str, n) => {
        return (str && str.length > n) ? str.substr(0, n - 1) + "..." : str;
    };

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
                                padding: '16px 24px',
                                fontSize: '1.3rem',
                                fontWeight: '700',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                background: 'white',
                                color: '#1e293b',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                minWidth: '320px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                height: 'auto',
                                appearance: 'none', // Remove default arrow to style better if needed, but standard select is safer for now
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 1rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '3.5rem' // Make space for custom arrow
                            }}
                        >
                            {validDates.map((date, i) => {
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

            <div className="container content-wrapper" style={{ display: 'block', gridTemplateColumns: 'none' }}>
                <main className="products-grid-container" style={{ width: '100%' }}>
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
                        alignItems: 'center',
                        width: '100%'
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
                                cursor: 'pointer',
                                flexShrink: 0
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

                    <div className="search-filter-bar" style={{ display: 'none' }}> {/* Keeping existing sort box structure but let's just insert debug before it for visibility */}
                    </div>

                    <div className="products-grid">
                        {currentProducts.length > 0 ? (
                            currentProducts.map(product => {
                                let stock = dailyMenuMap[product.id];
                                if (stock !== null && stock !== undefined) stock = parseInt(stock);

                                const isOutOfStock = stock === 0;
                                const isLowStock = stock !== null && stock !== undefined && stock < 10 && stock > 0;

                                return (
                                    <div key={product.id} className={`product-card ${product.is_available === false || isOutOfStock ? 'unavailable' : ''}`} onClick={() => navigate(`/produs/${product.id}?date=${formatDate(selectedDate)}`)} style={{ cursor: 'pointer', position: 'relative' }}>
                                        {isLowStock && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: '#ef4444',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                zIndex: 10
                                            }}>
                                                Ultimele {stock} porții
                                            </div>
                                        )}
                                        <div className="product-image">
                                            <img src={product.image} alt={product.name} style={isOutOfStock ? { filter: 'grayscale(100%)' } : {}} />
                                        </div>
                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-desc" title={product.description}>{truncate(product.description, 80)}</p>
                                            <div className="product-footer">
                                                <span className="product-price">{product.price.toFixed(2)} Lei</span>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(e, product);
                                                    }}
                                                    disabled={isOutOfStock}
                                                    title={isOutOfStock ? "Stoc epuizat" : "Adaugă în coș"}
                                                    style={isOutOfStock ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
                                                >
                                                    {isOutOfStock ? 'Stoc epuizat' : 'Adaugă'}
                                                </button>
                                            </div>
                                            <ProductExtras productId={product.id} dailyMenuMap={dailyMenuMap} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-products" style={{ width: '100%' }}>
                                <p>Nu am găsit produse conform criteriilor selectate.</p>
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

export default Products;
