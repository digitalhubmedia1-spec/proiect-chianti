import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
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
    const headerClass = (isHome && !isScrolled && !isMenuOpen) ? 'header transparent' : 'header scrolled';

    const getItemType = (item) => {
        const cat = categories.find(c => c.name === item.category);
        return cat ? (cat.type || 'delivery') : 'delivery';
    };

    const deliveryItems = cartItems.filter(item => getItemType(item) === 'delivery');
    const cateringItems = cartItems.filter(item => getItemType(item) === 'catering');

    const renderMinicartItem = (item) => (
        <div key={item.id} className="minicart-item">
            <img src={item.image} alt={item.name} />
            <div className="minicart-item-info">
                <p className="name">{item.name}</p>
                <p className="price">{item.quantity} x {item.price.toFixed(2)} Lei</p>
            </div>
            <button
                onClick={(e) => { e.preventDefault(); removeFromCart(item.id); }}
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

                    {/* Desktop Menu */}
                    <nav className="desktop-menu">
                        <Link to="/" className="nav-link">Acasă</Link>
                        <Link to="/produse" className="nav-link">Comandă Mâncare</Link>
                        <Link to="/catering" className="nav-link">Catering</Link>
                        <Link to="/configurator" className="nav-link">Meniuri</Link>
                        <Link to="/saloane" className="nav-link">Saloane</Link>
                        <Link to="/blog" className="nav-link">Blog</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                    </nav>

                    {/* Auth Buttons */}
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

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Acasă</Link>
                    <Link to="/produse" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Comandă Mâncare</Link>
                    <Link to="/catering" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Catering</Link>
                    <Link to="/configurator" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Meniuri</Link>
                    <Link to="/saloane" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Saloane</Link>
                    <Link to="/blog" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Blog</Link>
                    <Link to="/contact" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Contact</Link>

                    <div className="mobile-auth">
                        <Link to="/cos" className="mobile-btn mobile-login" style={{ borderColor: '#333', color: '#333' }} onClick={() => setIsMenuOpen(false)}>
                            <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Coșul Meu {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {user ? (
                            <Link to="/contul-meu" className="mobile-btn mobile-account" onClick={() => setIsMenuOpen(false)}>
                                <User size={18} style={{ marginRight: '8px' }} /> Contul Meu
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-btn mobile-login" onClick={() => setIsMenuOpen(false)}>Autentificare</Link>
                                <Link to="/register" className="mobile-btn mobile-register" onClick={() => setIsMenuOpen(false)}>Înregistrare</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
