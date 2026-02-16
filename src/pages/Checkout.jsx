import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import { useNavigate } from 'react-router-dom';
import { isRestaurantOpen, getScheduleMessage } from '../utils/schedule';
import { generateInvoice } from '../utils/invoiceGenerator';
import { useOrder } from '../context/OrderContext';
import { supabase } from '../supabaseClient';
import './Checkout.css';

// DELIVERY_COSTS removed - fetched from DB now

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { addOrder } = useOrder();
    const { categories } = useMenu();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        city: 'Roman',
        neighborhood: '',
        deliveryTime: '',
        details: '',
        paymentMethod: 'ramburs',
        deliveryMethod: 'delivery', // 'delivery', 'pickup', 'dinein' OR 'event-restaurant', 'event-location'
        clientType: 'fizica',
        companyName: '',
        cui: ''
    });
    const [isOpen, setIsOpen] = useState(true);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(null); // { code: '...', percent: 10 }

    // Dynamic Zones State
    const [deliveryZones, setDeliveryZones] = useState([]);

    useEffect(() => {
        const fetchZones = async () => {
            if (!supabase) return;
            const { data } = await supabase.from('delivery_zones').select('*');
            if (data) setDeliveryZones(data);
        };
        fetchZones();
    }, []);

    // Check for Catering Items
    const hasCateringItems = cartItems.some(item => {
        const cat = categories.find(c => c.name === item.category);
        return cat?.type === 'catering';
    });

    useEffect(() => {
        setIsOpen(isRestaurantOpen());

        // Autofill if user is logged in
        if (user) {
            // Retrieve data from metadata or top-level properties (depending on auth provider)
            const fullName = user.user_metadata?.full_name || user.name || '';
            const phone = user.user_metadata?.phone || user.phone || '';

            const nameParts = fullName.split(' ');
            // If only one word, assume it's Last Name or split intelligently?
            // Usually: First Last. Let's assume First is [0], Last is [1...]
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData(prev => ({
                ...prev,
                firstName: prev.firstName || firstName, // Only autofill if empty
                lastName: prev.lastName || lastName,
                email: prev.email || user.email || '',
                phone: prev.phone || phone
            }));
        }
    }, [user]);

    // Catering: Set default method if needed
    useEffect(() => {
        if (hasCateringItems) {
            // Default to restaurant event if not already set to a valid catering option
            if (formData.deliveryMethod !== 'event-restaurant' && formData.deliveryMethod !== 'event-location') {
                setFormData(prev => ({ ...prev, deliveryMethod: 'event-restaurant' }));
            }
        } else {
            // Default normal options
            if (formData.deliveryMethod === 'event-restaurant' || formData.deliveryMethod === 'event-location') {
                setFormData(prev => ({ ...prev, deliveryMethod: 'delivery' }));
            }
        }
    }, [hasCateringItems]);

    // Calculate Delivery Cost
    useEffect(() => {
        const isDelivery = formData.deliveryMethod === 'delivery' || formData.deliveryMethod === 'event-location';

        if (isDelivery && formData.city) {
            // Find logic: case insensitive match
            const zone = deliveryZones.find(z => z.city.toLowerCase() === formData.city.toLowerCase());

            if (zone) {
                setDeliveryCost(Number(zone.price));
            } else {
                // Default fallback if not found? Or 0? Or maybe Roman default?
                // Keeping 0 but maybe we should warn user if they type unknown city.
                // For now, if "Roman" is typed and exists in DB, it works.
                setDeliveryCost(0);
            }
        } else {
            setDeliveryCost(0);
        }
    }, [formData.city, formData.deliveryMethod, deliveryZones]);

    if (cartItems.length === 0) {
        navigate('/cos');
        return null;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const applyPromoCode = async () => {
        if (!promoCode) return;
        if (!supabase) return alert("Eroare conexiune server.");

        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promoCode.toUpperCase().trim())
            .eq('active', true)
            .single();

        if (error || !data) {
            alert('Cod invalid sau expirat.');
            setDiscount(null);
            return;
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            alert('Acest cod a expirat.');
            setDiscount(null);
            return;
        }

        setDiscount({ code: data.code, percent: data.discount_percent });
        alert(`Codul ${data.code} a fost aplicat!`);
    };

    const discountAmount = discount ? (cartTotal * discount.percent / 100) : 0;
    const finalTotal = (cartTotal - discountAmount) + deliveryCost;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalTotal = (cartTotal - discountAmount) + deliveryCost;

        // 1. Decrement Stock
        try {
            if (supabase) {
                const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
                const stockItems = {};
                cartItems.forEach(item => {
                    stockItems[item.id] = (stockItems[item.id] || 0) + item.quantity;
                });

                await supabase.rpc('decrement_stock', { p_date: today, p_items: stockItems });
            }
        } catch (err) {
            console.error("Error decrementing stock:", err);
        }

        // 2. Generate Invoice (Auto-download)
        try {
            generateInvoice(new Date(), formData, cartItems, finalTotal);
        } catch (error) {
            console.error("Error creating invoice:", error);
            alert(`Eroare la generarea facturii: ${error.message}`);
        }

        // 3. Add Order to Admin System
        await addOrder({
            customer: formData,
            items: cartItems,
            finalTotal: finalTotal,
            subtotal: cartTotal,
            deliveryCost: deliveryCost,
            isCatering: hasCateringItems,
            discount: discount ? { code: discount.code, amount: discountAmount, percent: discount.percent } : null,
            userId: user?.id || null
        });

        // 4. Clear Cart & Redirect
        alert('Comandă plasată cu succes! Factura se va descărca automat.');
        clearCart();
        navigate('/');
    };



    return (
        <div className="checkout-page container">
            <h1 className="page-title-small">Finalizare Comandă {hasCateringItems && "(Catering)"}</h1>

            <div className="checkout-grid">
                <div className="checkout-form-section">
                    <h2>{hasCateringItems ? "Detalii" : "Detalii Livrare"}</h2>
                    <form id="checkout-form" onSubmit={handleSubmit}>

                        {/* 1. Delivery/Event Method */}
                        <div className="form-group mb-4">
                            <label className="section-label">
                                {hasCateringItems ? "Locație Eveniment" : "Metoda de Livrare"}
                            </label>

                            <div className="delivery-method-options">
                                {hasCateringItems ? (
                                    <>
                                        <label className={`radio-card ${formData.deliveryMethod === 'event-restaurant' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="event-restaurant"
                                                checked={formData.deliveryMethod === 'event-restaurant'}
                                                onChange={handleChange}
                                            />
                                            <span>Ridicare Personală</span>
                                        </label>
                                        <label className={`radio-card ${formData.deliveryMethod === 'event-location' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="event-location"
                                                checked={formData.deliveryMethod === 'event-location'}
                                                onChange={handleChange}
                                            />
                                            <span>Livrare la Domiciliu</span>
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <label className={`radio-card ${formData.deliveryMethod === 'delivery' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="delivery"
                                                checked={formData.deliveryMethod === 'delivery'}
                                                onChange={handleChange}
                                            />
                                            <span>Livrare la Domiciliu</span>
                                        </label>
                                        <label className={`radio-card ${formData.deliveryMethod === 'pickup' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="pickup"
                                                checked={formData.deliveryMethod === 'pickup'}
                                                onChange={handleChange}
                                            />
                                            <span>Ridicare Personală</span>
                                        </label>
                                        <label className={`radio-card ${formData.deliveryMethod === 'dinein' ? 'active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="dinein"
                                                checked={formData.deliveryMethod === 'dinein'}
                                                onChange={handleChange}
                                            />
                                            <span>Servire în Restaurant</span>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Personal Details */}
                        <div className="form-row two-cols">
                            <div className="form-group">
                                <label>Prenume *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    onChange={handleChange}
                                    value={formData.firstName || ''}
                                />
                            </div>
                            <div className="form-group">
                                <label>Nume *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    onChange={handleChange}
                                    value={formData.lastName || ''}
                                />
                            </div>
                        </div>

                        <div className="form-row two-cols">
                            <div className="form-group">
                                <label>Telefon *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    onChange={handleChange}
                                    value={formData.phone || ''}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    onChange={handleChange}
                                    value={formData.email || ''}
                                />
                            </div>
                        </div>

                        {/* 3. Date & Time Selection */}
                        <div className="form-group">
                            <label>Ora {hasCateringItems ? "Livrare" : "de Livrare / Ridicare"} *</label>
                            <select name="deliveryTime" required onChange={handleChange} value={formData.deliveryTime}>
                                <option value="" disabled>Selectează ora...</option>
                                <option value="11:00">11:00</option>
                                <option value="11:30">11:30</option>
                                <option value="12:00">12:00</option>
                                <option value="12:30">12:30</option>
                                <option value="13:00">13:00</option>
                                <option value="13:30">13:30</option>
                                <option value="14:00">14:00</option>
                                <option value="14:30">14:30</option>
                                <option value="15:00">15:00</option>
                                {hasCateringItems && (
                                    <>
                                        {/* Extended hours for events */}
                                        <option value="16:00">16:00</option>
                                        <option value="17:00">17:00</option>
                                        <option value="18:00">18:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="20:00">20:00</option>
                                    </>
                                )}
                            </select>
                            <small className="form-text text-muted">
                                {hasCateringItems
                                    ? "Pentru catering, data exactă va fi confirmată telefonic (minim 48h avans)."
                                    : "Program livrări: Luni - Vineri, 11:00 - 15:00"}
                            </small>
                        </div>

                        {/* 4. Address Details (Conditional) */}
                        {/* Show if Standard Delivery OR Catering Event at Location */}
                        {(formData.deliveryMethod === 'delivery' || formData.deliveryMethod === 'event-location') && (
                            <div className="address-section slide-down">
                                <h3 className="section-subtitle">
                                    {formData.deliveryMethod === 'event-location' ? "Adresa Locației" : "Adresa de Livrare"}
                                </h3>

                                <div className="form-row two-cols">
                                    <div className="form-group">
                                        <label>Localitate *</label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={hasCateringItems ? "" : "disabled-input"}
                                            disabled={!hasCateringItems && formData.deliveryMethod === 'delivery'} // Force Roman for standard delivery if that's the rule
                                        >
                                            {/* If standard delivery is ONLY Roman, keep it locked. If we want to open it up, remove disabled. 
                                                User requirement implied costs are for "sat din vecinatate" which usually implies CATERING scale or maybe delivery too.
                                                For safety, let's allow changing city for CATERING only initially, or both if consistent.
                                                Ref: "cand cineva comanda produse de catering... daca alege alta locatie... livrare gratuita in roman dar daca e in sat..."
                                                So this logic specifically applies to Catering. Standard delivery rules weren't explicitly changed to allow villages yet.
                                            */}
                                            {deliveryZones.map(zone => (
                                                <option key={zone.id || zone.city} value={zone.city}>
                                                    {zone.city} {Number(zone.price) > 0 ? `(+${Number(zone.price)} Lei)` : '(Gratuit)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Cartier / Detalii Zonă *</label>
                                        {formData.city === 'Roman' ? (
                                            <select name="neighborhood" required onChange={handleChange} value={formData.neighborhood}>
                                                <option value="" disabled>Alege cartierul...</option>
                                                <option value="Centru">Centru</option>
                                                <option value="Smirodava">Smirodava</option>
                                                <option value="Favorit">Favorit</option>
                                                <option value="Gara">Gară</option>
                                                <option value="Abator">Abator</option>
                                                <option value="Nicolae Balcescu">Nicolae Bălcescu</option>
                                                <option value="Lipoveni">Lipoveni</option>
                                                <option value="Moldova">Moldova</option>
                                                <option value="Zona Industriala">Zona Industrială</option>
                                                <option value="Muncitoresc">Muncitoresc</option>
                                                <option value="Tic-Tac">Tic-Tac</option>
                                                <option value="Republicii">Republicii</option>
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                name="neighborhood"
                                                placeholder="Ex: Zona Centrală, Lângă Biserică..."
                                                required
                                                onChange={handleChange}
                                                value={formData.neighborhood}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Adresa exactă *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Strada, Număr, Bloc, Scara, Etaj, Apartament"
                                        required
                                        onChange={handleChange}
                                        value={formData.address || ''}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Detalii suplimentare (opțional)</label>
                            <textarea
                                name="details"
                                rows="3"
                                placeholder="Interfon, repere, mesaj pentru bucătărie..."
                                onChange={handleChange}
                                value={formData.details || ''}
                            ></textarea>
                        </div>

                        {/* Billing Details */}
                        <div className="billing-section mt-4">
                            <h3 className="section-subtitle">Date Facturare</h3>
                            <div className="delivery-method-options mb-3">
                                <label className={`radio-card ${formData.clientType === 'fizica' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="clientType"
                                        value="fizica"
                                        checked={formData.clientType === 'fizica'}
                                        onChange={handleChange}
                                    />
                                    <span>Persoană Fizică</span>
                                </label>
                                <label className={`radio-card ${formData.clientType === 'juridica' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="clientType"
                                        value="juridica"
                                        checked={formData.clientType === 'juridica'}
                                        onChange={handleChange}
                                    />
                                    <span>Persoană Juridică</span>
                                </label>
                            </div>

                            {formData.clientType === 'juridica' && (
                                <div className="company-details slide-down">
                                    <div className="form-row two-cols">
                                        <div className="form-group">
                                            <label>Denumire Firmă *</label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                required={formData.clientType === 'juridica'}
                                                onChange={handleChange}
                                                placeholder="Ex: SC NUME SRL"
                                                value={formData.companyName || ''}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>CUI *</label>
                                            <input
                                                type="text"
                                                name="cui"
                                                required={formData.clientType === 'juridica'}
                                                onChange={handleChange}
                                                placeholder="RO123456"
                                                value={formData.cui || ''}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <h2 className="mt-4">Metoda de Plată</h2>
                        <div className="payment-options">
                            <label className="radio-option">
                                <input type="radio" name="paymentMethod" value="ramburs" checked={formData.paymentMethod === 'ramburs'} onChange={handleChange} />
                                <span>Plată Ramburs (Numerar)</span>
                            </label>
                            <label className="radio-option disabled">
                                <input type="radio" name="paymentMethod" value="card" disabled />
                                <span>Card Online (Indisponibil momentan)</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="checkout-summary">
                    <div className="order-summary-card">
                        <h3>Sumar Comandă</h3>
                        <div className="order-items-list">
                            {cartItems.map(item => (
                                <div key={item.id} className="order-item-row">
                                    <span>{item.quantity} x {item.name}</span>
                                    <span>{(item.price * item.quantity).toFixed(2)} Lei</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-divider"></div>

                        <div className="promo-code-section" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cod reducere"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    disabled={!!discount}
                                    style={{ marginBottom: 0 }}
                                />
                                {discount ? (
                                    <button className="btn btn-outline-danger" type="button" onClick={() => { setDiscount(null); setPromoCode(''); }}>X</button>
                                ) : (
                                    <button className="btn btn-outline-primary" type="button" onClick={applyPromoCode}>Aplică</button>
                                )}
                            </div>
                            {discount && <small className="text-success" style={{ display: 'block', marginTop: '5px' }}>Reducere aplicată: {discount.percent}% ({discount.code})</small>}
                        </div>

                        <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>{cartTotal.toFixed(2)} Lei</span>
                        </div>
                        {discount && (
                            <div className="summary-row" style={{ color: 'green' }}>
                                <span>Reducere:</span>
                                <span>-{discountAmount.toFixed(2)} Lei</span>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Transport ({formData.city}):</span>
                            <span>{deliveryCost === 0 ? "Gratuit" : `${deliveryCost.toFixed(2)} Lei`}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total de plată:</span>
                            <span>{finalTotal.toFixed(2)} Lei</span>
                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            className="btn btn-primary btn-block btn-lg mt-2"
                            disabled={(!isOpen && !hasCateringItems)}
                            style={{ opacity: (!isOpen && !hasCateringItems) ? 0.5 : 1, cursor: (!isOpen && !hasCateringItems) ? 'not-allowed' : 'pointer' }}
                        >
                            {(!isOpen && !hasCateringItems) ? "Restaurant Închis" : "Plasează Comanda"}
                        </button>
                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>
                            <a href="tel:+40374968884" style={{ textDecoration: 'none', color: 'inherit' }}>
                                +40 (374) 968 884
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
