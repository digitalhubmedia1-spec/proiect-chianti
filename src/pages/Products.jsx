import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { isRestaurantOpen, getScheduleMessage, isPreOrderPeriod } from '../utils/schedule';
import { Search } from 'lucide-react';
import './Products.css';

const Products = () => {
    const { products, categories, loading } = useMenu();
    const [activeCategory, setActiveCategory] = useState("Toate");
    const [isOpen, setIsOpen] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [closedMessage, setClosedMessage] = useState("");
    const { addToCart } = useCart();
    const navigate = useNavigate();

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("default"); // default, asc, desc

    // Prevent filtering before data is loaded
    if (loading) return <div className="loading-spinner">Se încarcă meniul...</div>;

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
            {showPopup && (
                <div className="schedule-popup-overlay">
                    <div className="schedule-popup">
                        <h2>{!isOpen ? "Restaurant Închis Momentan" : " informații Comenzi"}</h2>
                        <p>{getScheduleMessage()}</p>
                        <button className="btn-close-popup" onClick={() => setShowPopup(false)}>Am înțeles</button>
                    </div>
                </div>
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
                                <div key={product.id} className="product-card" onClick={() => navigate(`/produs/${product.id}`)} style={{ cursor: 'pointer' }}>
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
