import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { Trash2, Minus, Plus, ArrowRight, Truck, Users } from 'lucide-react';
import './Cart.css';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { categories } = useMenu();
    const navigate = useNavigate();

    const getItemType = (item) => {
        const cat = categories.find(c => c.name === item.category);
        return cat ? (cat.type || 'delivery') : 'delivery';
    };

    const deliveryItems = cartItems.filter(item => getItemType(item) === 'delivery');
    const cateringItems = cartItems.filter(item => getItemType(item) === 'catering');

    if (cartItems.length === 0) {
        return (
            <div className="cart-page container empty-cart">
                <h2>Coșul tău este gol</h2>
                <p>Nu ai adăugat încă niciun produs.</p>
                <Link to="/produse" className="btn btn-primary">Vezi Meniul</Link>
            </div>
        );
    }

    const renderCartItem = (item) => (
        <div key={item.id} className="cart-item">
            <div className="cart-item-image">
                <img src={item.image} alt={item.name} />
            </div>
            <div className="cart-item-details">
                <h3><Link to={`/produs/${item.id}`}>{item.name}</Link></h3>
                <p className="item-price">{item.price.toFixed(2)} Lei</p>
            </div>
            <div className="cart-item-actions">
                <div className="qty-selector-small">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="qty-btn-s"><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="qty-btn-s"><Plus size={14} /></button>
                </div>
                <div className="item-total">
                    {(item.price * item.quantity).toFixed(2)} Lei
                </div>
                <button onClick={() => removeFromCart(item.id)} className="btn-remove" title="Șterge">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="cart-page container">
            <h1 className="page-title-small">Coșul Meu</h1>

            <div className="cart-grid">
                <div className="cart-items">
                    {deliveryItems.length > 0 && (
                        <div className="cart-section mb-4">
                            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#800020', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.1rem' }}>
                                <Truck size={20} style={{ flexShrink: 0 }} />
                                <span>Produse Livrare Regulară</span>
                            </h3>
                            {deliveryItems.map(renderCartItem)}
                        </div>
                    )}

                    {cateringItems.length > 0 && (
                        <div className="cart-section">
                            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#800020', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', fontSize: '1.1rem' }}>
                                <Users size={20} style={{ flexShrink: 0 }} />
                                <span>Produse Catering</span>
                            </h3>
                            <div className="alert-info-light" style={{ background: '#fff8f8', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fee2e2', fontSize: '0.9rem', color: '#b91c1c' }}>
                                <strong>Notă:</strong> Produsele de catering necesită comandă cu 48h înainte.
                            </div>
                            {cateringItems.map(renderCartItem)}
                        </div>
                    )}
                </div>

                <div className="cart-summary">
                    <h3>Sumar Comandă</h3>
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>{cartTotal.toFixed(2)} Lei</span>
                    </div>
                    <div className="summary-row">
                        <span>Livrare:</span>
                        <span>0.00 Lei</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>{cartTotal.toFixed(2)} Lei</span>
                    </div>
                    <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-block btn-checkout">
                        Spre Checkout <ArrowRight size={18} />
                    </button>
                    <Link to="/produse" className="continue-shopping">Continua cumpărăturile</Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;
