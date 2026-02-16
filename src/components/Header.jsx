import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import logoAlb from '../assets/logo/logoalb.png';
import logoColorat from '../assets/logo/logocolorat.png';
import './Header.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const { cartCount, cartItems, cartTotal, removeFromCart } = useCart();
    const { categories } = useMenu();
    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // On non-home pages, the header should always look "scrolled" (solid background, dark text)
    // or we can add a specific class. Let's reuse 'scrolled' for simplicity as it has the right styles.
    // MODIFIED: User wants header to stay transparent on home top even if menu is open.
    const headerClass = (isHome && !isScrolled) ? 'header transparent' : 'header scrolled';

    const getItemType = (item) => {
        const cat = categories.find(c => c.name === item.category);
        return cat ? (cat.type || 'delivery') : 'delivery';
    };

    const deliveryItems = cartItems.filter(item => getItemType(item) === 'delivery');
    const cateringItems = cartItems.filter(item => getItemType(item) === 'catering');

    const renderMinicartItem = (item) => (
        <div key={item.cartId || item.id} className="minicart-item">
            <img src={item.image} alt={item.name} />
            <div className="minicart-item-info">
                <p className="name">{item.name}</p>
                <p className="price">{item.quantity} x {item.price.toFixed(2)} Lei</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <p className="options" style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                        {Object.values(item.selectedOptions).join(', ')}
                    </p>
                )}
            </div>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromCart(item.cartId || item.id); }}
                className="minicart-delete"
                title="Șterge din coș"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <header className={headerClass}>
            {/* Main Navigation */}
            <div className="main-nav">
                <div className="container nav-container">
                    <Link to="/" className="logo">
                        <img
                            src={headerClass.includes('transparent') ? logoAlb : logoColorat}
                            alt="Chianti"
                            style={{ height: '50px', width: 'auto' }}
                        />
                    </Link>

                    {/* Desktop Menu - REMOVED as per request, replaced by Burger/Drawer */}

                    <div className="header-actions">
                        {/* Auth Buttons - Always visible now on Desktop */}
                        <div className="auth-buttons desktop-only">
                            <div className="cart-dropdown-wrapper">
                                <Link to="/cos" className="btn-cart-icon">
                                    <ShoppingCart size={24} />
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>

                                {/* Minicart Dropdown */}
                                {cartCount > 0 && (
                                    <div className="minicart-dropdown">
                                        <div className="minicart-items">
                                            {cateringItems.length > 0 && (
                                                <>
                                                    <div className="minicart-section-title">Catering</div>
                                                    {cateringItems.slice(0, 3).map(renderMinicartItem)}
                                                    {cateringItems.length > 3 && <p className="minicart-more">și încă {cateringItems.length - 3} produse...</p>}
                                                    {deliveryItems.length > 0 && <div className="minicart-divider" />}
                                                </>
                                            )}

                                            {deliveryItems.length > 0 && (
                                                <>
                                                    {cateringItems.length > 0 && <div className="minicart-section-title">Livrări</div>}
                                                    {deliveryItems.slice(0, 3).map(renderMinicartItem)}
                                                    {deliveryItems.length > 3 && <p className="minicart-more">și încă {deliveryItems.length - 3} produse...</p>}
                                                </>
                                            )}
                                        </div>
                                        <div className="minicart-footer">
                                            <div className="minicart-total">
                                                <span>Total:</span>
                                                <strong>{cartTotal.toFixed(2)} Lei</strong>
                                            </div>
                                            <Link to="/cos" className="btn btn-primary btn-sm btn-block">Vezi Coșul</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {user ? (
                                <Link to="/contul-meu" className="btn-auth btn-account">
                                    <User size={18} />
                                    <span>Contul Meu</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-auth btn-login">Autentificare</Link>
                                    <Link to="/register" className="btn-auth btn-register">Înregistrare</Link>
                                </>
                            )}
                        </div>

                        {/* Menu Toggle Button (Visible on both Desktop and Mobile now) */}
                        {/* Mobile Menu Button - shows on both but triggers different menus via CSS/Media Queries */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown (Visible ONLY on Mobile) */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <NavLink to="/" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Pagina Principală</NavLink>
                    <NavLink to="/produse" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Comandă Mâncare</NavLink>
                    <NavLink to="/servicii-evenimente" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Servicii Evenimente</NavLink>
                    <NavLink to="/saloane" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Servicii Rezervări</NavLink>
                    <NavLink to="/blog" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Blog & Informații</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Contact & Oferte</NavLink>

                    <div className="mobile-auth" style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        {/* Mobile Cart */}
                        <Link to="/cos" className="mobile-btn mobile-login" style={{ borderColor: '#333', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '200px' }} onClick={() => setIsMenuOpen(false)}>
                            <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Coșul Meu {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {user ? (
                            <Link to="/contul-meu" className="mobile-btn mobile-account" style={{ width: '200px', justifyContent: 'center' }} onClick={() => setIsMenuOpen(false)}>
                                <User size={18} style={{ marginRight: '8px' }} /> Contul Meu
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-btn mobile-login" style={{ width: '200px', justifyContent: 'center' }} onClick={() => setIsMenuOpen(false)}>Autentificare</Link>
                                <Link to="/register" className="mobile-btn mobile-register" style={{ width: '200px', justifyContent: 'center' }} onClick={() => setIsMenuOpen(false)}>Înregistrare</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Side Drawer (Visible ONLY on Desktop) */}
            <div className={`side-drawer-overlay desktop-only-drawer ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`side-drawer desktop-only-drawer ${isMenuOpen ? 'open' : ''}`}>
                <div className="side-drawer-header">
                    <span className="drawer-title">Meniu</span>
                    <button className="drawer-close" onClick={() => setIsMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="drawer-nav">
                    <NavLink to="/" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Pagina Principală</NavLink>
                    <NavLink to="/produse" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Comandă Mâncare</NavLink>
                    <NavLink to="/servicii-evenimente" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Servicii Evenimente</NavLink>
                    <NavLink to="/saloane" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Servicii Rezervări</NavLink>
                    <NavLink to="/blog" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Blog & Informații</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Contact & Oferte</NavLink>
                </nav>
            </div>
        </header>
    );
};

export default Header;
