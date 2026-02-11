import React, { useState, useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabaseClient';
import { ShoppingCart, CreditCard, Banknote, Search, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';

const AdminPOS = () => {
    const { products, categories, fetchDailyMenu } = useMenu();
    const { user } = useAuth();

    // State
    const [currentTable, setCurrentTable] = useState('');
    const [cart, setCart] = useState([]); // [{ product, qty, price }]
    const [dailyProducts, setDailyProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize: Load Daily Menu
    useEffect(() => {
        const loadMenu = async () => {
            const today = new Date().toISOString().split('T')[0];
            const dailyItems = await fetchDailyMenu(today);

            // Map daily items to full product details
            const available = dailyItems.map(di => {
                const prod = products.find(p => p.id === di.id);
                return prod ? { ...prod, stock: di.stock } : null;
            }).filter(Boolean);

            setDailyProducts(available.length > 0 ? available : products); // Fallback to all if empty? Or strict?
        };
        if (products.length > 0) loadMenu();
    }, [products, fetchDailyMenu]);

    // Cart Actions
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Checkout
    const handleCheckout = async (paymentMethod) => {
        if (!currentTable) return alert("Te rog introdu numărul mesei!");
        if (cart.length === 0) return alert("Coșul este gol!");

        setIsSaving(true);
        try {
            const orderPayload = {
                user_id: user?.id, // Operator ID
                status: 'delivered', // Immediate delivery for Dine-in? Or 'completed'?
                total: total,
                finalTotal: total,
                paymentMethod: paymentMethod, // 'card' or 'cash'
                deliveryCost: 0,
                is_pos_order: true,
                table_number: currentTable,
                fiscal_print_status: 'pending', // Triggers the Bridge
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.qty,
                    vat: 9 // Default food VAT, ideally from product
                })),
                created_at: new Date().toISOString(),
                customer: {
                    firstName: `Masa ${currentTable}`,
                    lastName: '',
                    phone: '',
                    address: 'Restaurant',
                    city: 'Local',
                    email: '',
                    deliveryMethod: 'dinein'
                }
            };

            const { error } = await supabase.from('orders').insert([orderPayload]);
            if (error) throw error;

            alert("Comandă salvată și trimisă la marcat!");
            setCart([]);
            setCurrentTable('');
        } catch (err) {
            console.error(err);
            alert("Eroare la salvare: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Derived UI Data
    const filteredProducts = dailyProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'all' || p.category === selectedCategory)
    );

    const categoriesList = ['all', ...new Set(dailyProducts.map(p => p.category))];

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: '#f1f5f9', gap: '1rem', padding: '1rem' }}>

            {/* Left: Product Catalog */}
            <div style={{ flex: 2, background: 'white', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Search & Filter */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Caută produse..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 10px 10px 40px',
                                borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: selectedCategory === cat ? '#2563eb' : '#e2e8f0',
                                background: selectedCategory === cat ? '#eff6ff' : 'white',
                                color: selectedCategory === cat ? '#2563eb' : '#64748b',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                            }}
                        >
                            {cat === 'all' ? 'Toate' : cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '5px' }}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                background: 'white',
                                display: 'flex', flexDirection: 'column'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ height: '100px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>🍽️</span>
                                )}
                            </div>
                            <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px', lineHeight: '1.2' }}>{product.name}</div>
                                <div style={{ color: '#2563eb', fontWeight: '700' }}>{product.price} Lei</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart / Table Info */}
            <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {/* Table Input */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>MASA / CLIENT</label>
                    <input
                        type="text"
                        placeholder="Ex: Masa 5"
                        value={currentTable}
                        onChange={(e) => setCurrentTable(e.target.value)}
                        style={{
                            width: '100%', fontSize: '1.5rem', fontWeight: 'bold',
                            padding: '10px', borderRadius: '8px', border: '2px solid #e2e8f0',
                            textAlign: 'center', color: '#0f172a'
                        }}
                    />
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '3rem' }}>
                            <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Selectează produse din stânga</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #f1f5f9' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.price} Lei / buc</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Minus size={14} />
                                    </button>
                                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus size={14} />
                                    </button>
                                    <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: '8px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Totals */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                        <span>TOTAL</span>
                        <span>{total.toFixed(2)} Lei</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                            onClick={() => handleCheckout('cash')}
                            disabled={isSaving}
                            style={{
                                background: '#16a34a', color: 'white', border: 'none',
                                padding: '1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            <Banknote size={20} /> NUMERAR
                        </button>
                        <button
                            onClick={() => handleCheckout('card')}
                            disabled={isSaving}
                            style={{
                                background: '#2563eb', color: 'white', border: 'none',
                                padding: '1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            <CreditCard size={20} /> CARD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPOS;
