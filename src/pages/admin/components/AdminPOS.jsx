import React, { useState, useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabaseClient';
import { ShoppingCart, CreditCard, Banknote, Search, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';

const AdminPOS = () => {
    const { products, categories, fetchDailyMenu } = useMenu();
    const { user } = useAuth();

    // State
    const [tables, setTables] = useState([]); // [{ id, name, items: [] }]
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [newTableName, setNewTableName] = useState('');
    
    const [dailyProducts, setDailyProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSaving, setIsSaving] = useState(false);

    // Derived
    const selectedTable = tables.find(t => t.id === selectedTableId);
    const cart = selectedTable ? selectedTable.items : [];

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

            setDailyProducts(available.length > 0 ? available : products);
        };
        if (products.length > 0) loadMenu();
    }, [products, fetchDailyMenu]);

    // Table Actions
    const handleAddTable = () => {
        if (!newTableName.trim()) return;
        const newTable = {
            id: Date.now().toString(),
            name: newTableName,
            items: []
        };
        setTables(prev => [...prev, newTable]);
        setSelectedTableId(newTable.id);
        setNewTableName('');
    };

    const handleDeleteTable = (e, tableId) => {
        e.stopPropagation();
        if (window.confirm('Sigur vrei să ștergi această masă?')) {
            setTables(prev => prev.filter(t => t.id !== tableId));
            if (selectedTableId === tableId) setSelectedTableId(null);
        }
    };

    // Cart Actions
    const addToCart = (product) => {
        if (!selectedTableId) {
            alert("Te rog selectează sau creează o masă mai întâi!");
            return;
        }

        setTables(prev => prev.map(table => {
            if (table.id === selectedTableId) {
                const existing = table.items.find(item => item.id === product.id);
                let newItems;
                if (existing) {
                    newItems = table.items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
                } else {
                    newItems = [...table.items, { ...product, qty: 1 }];
                }
                return { ...table, items: newItems };
            }
            return table;
        }));
    };

    const updateQty = (id, delta) => {
        setTables(prev => prev.map(table => {
            if (table.id === selectedTableId) {
                const newItems = table.items.map(item => {
                    if (item.id === id) {
                        const newQty = Math.max(1, item.qty + delta);
                        return { ...item, qty: newQty };
                    }
                    return item;
                });
                return { ...table, items: newItems };
            }
            return table;
        }));
    };

    const removeFromCart = (id) => {
        setTables(prev => prev.map(table => {
            if (table.id === selectedTableId) {
                return { ...table, items: table.items.filter(item => item.id !== id) };
            }
            return table;
        }));
    };

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Generate FiscalNet INP File Content
    const generateInpContent = (items, paymentMethod) => {
        let content = '';
        
        // S,1,______,_,__;NumeProdus;Pret;Cantitate;Tva;Dept;Grupa;TipDisc;ValDisc;UM;
        items.forEach(item => {
            // FORCE PRICE 0 FOR TESTING AS REQUESTED
            const price = "0.00"; 
            const qty = item.qty.toFixed(3);
            const name = item.name.substring(0, 22).replace(/;/g, ' '); // Limit name length and remove semicolons
            
            content += `S,1,______,_,__;${name};${price};${qty};1;1;1;0;0;BUC;\n`;
        });

        // T,1,______,_,__;TipPlata;Suma;;;;
        // 0 = Numerar, 1 = Card (Verificați maparea exactă a casei de marcat, de obicei 0-Cash, 1-Card)
        const payCode = paymentMethod === 'cash' ? '0' : '1';
        
        // Suma este goală ;; pentru a achita tot restul (sau 0 pt test cu produse de 0 lei)
        content += `T,1,______,_,__;${payCode};;;;;\n`;

        return content;
    };

    // Download INP File
    const downloadInpFile = (content, tableName) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Nume unic: bon_MasaX_timestamp.inp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `bon_${tableName.replace(/\s+/g, '_')}_${timestamp}.inp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Checkout
    const handleCheckout = async (paymentMethod) => {
        if (!selectedTable) return;
        if (cart.length === 0) return alert("Coșul este gol!");

        setIsSaving(true);
        try {
            // 1. Generate and Download INP File FIRST
            const inpContent = generateInpContent(cart, paymentMethod);
            downloadInpFile(inpContent, selectedTable.name);

            // 2. Save to Database
            const orderPayload = {
                user_id: user?.id,
                status: 'delivered',
                total: total,
                finalTotal: total,
                paymentMethod: paymentMethod,
                deliveryCost: 0,
                is_pos_order: true,
                table_number: selectedTable.name,
                fiscal_print_status: 'pending',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.qty,
                    vat: 9
                })),
                created_at: new Date().toISOString(),
                customer: {
                    firstName: `Masa ${selectedTable.name}`,
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

            alert("Comandă salvată și bon generat!");
            // Close table
            setTables(prev => prev.filter(t => t.id !== selectedTableId));
            setSelectedTableId(null);
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
        <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#f1f5f9', gap: '0.5rem', padding: '0.5rem' }}>

            {/* Left: Product Catalog */}
            <div style={{ flex: 3, background: 'white', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {/* Search & Filter */}
                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: 8, top: 9, color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Caută produse..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 8px 8px 35px', fontSize: '0.9rem',
                                borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '16px',
                                border: '1px solid',
                                borderColor: selectedCategory === cat ? '#2563eb' : '#e2e8f0',
                                background: selectedCategory === cat ? '#eff6ff' : 'white',
                                color: selectedCategory === cat ? '#2563eb' : '#64748b',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {cat === 'all' ? 'Toate' : cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', overflowY: 'auto', paddingRight: '2px' }}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                background: 'white',
                                display: 'flex', flexDirection: 'column'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ height: '70px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                                )}
                            </div>
                            <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.8rem', marginBottom: '2px', lineHeight: '1.1', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                                <div style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.85rem' }}>{product.price} Lei</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart / Table Info */}
            <div style={{ flex: 2, minWidth: '280px', maxWidth: '400px', background: 'white', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                
                {/* Table Management */}
                <div style={{ marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input 
                            type="text" 
                            placeholder="Masă nouă..."
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                            style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                        <button onClick={handleAddTable} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', padding: '0 0.75rem', cursor: 'pointer' }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Active Tables Chips */}
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxHeight: '60px', overflowY: 'auto' }}>
                        {tables.length === 0 && <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>Fără mese</span>}
                        {tables.map(table => (
                            <div 
                                key={table.id}
                                onClick={() => setSelectedTableId(table.id)}
                                style={{ 
                                    padding: '4px 8px', borderRadius: '12px', 
                                    background: selectedTableId === table.id ? '#2563eb' : '#f1f5f9',
                                    color: selectedTableId === table.id ? 'white' : '#64748b',
                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    border: '1px solid', borderColor: selectedTableId === table.id ? '#2563eb' : '#e2e8f0'
                                }}
                            >
                                <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{table.name}</span>
                                <span 
                                    onClick={(e) => handleDeleteTable(e, table.id)} 
                                    style={{ 
                                        opacity: 0.8, cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '14px', height: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                                    }}
                                >×</span>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedTable ? (
                    <>
                        <div style={{ marginBottom: '0.5rem', textAlign: 'center', fontWeight: '700', fontSize: '1rem', color: '#0f172a', padding: '0.25rem', background: '#f8fafc', borderRadius: '4px' }}>
                            {selectedTable.name}
                        </div>

                        {/* Cart Items */}
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.5rem', paddingRight: '2px' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1rem' }}>
                                    <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.8rem' }}>Coș gol</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #f1f5f9' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.price} Lei</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                                            <button onClick={() => updateQty(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Minus size={12} />
                                            </button>
                                            <span style={{ fontWeight: '700', minWidth: '16px', textAlign: 'center', fontSize: '0.85rem' }}>{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={12} />
                                            </button>
                                            <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: '4px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Totals */}
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                                <span>TOTAL</span>
                                <span>{total.toFixed(2)} Lei</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleCheckout('cash')}
                                    disabled={isSaving}
                                    style={{
                                        background: '#16a34a', color: 'white', border: 'none',
                                        padding: '0.75rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        opacity: isSaving ? 0.7 : 1, fontSize: '0.9rem'
                                    }}
                                >
                                    <Banknote size={18} /> NUMERAR
                                </button>
                                <button
                                    onClick={() => handleCheckout('card')}
                                    disabled={isSaving}
                                    style={{
                                        background: '#2563eb', color: 'white', border: 'none',
                                        padding: '0.75rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        opacity: isSaving ? 0.7 : 1, fontSize: '0.9rem'
                                    }}
                                >
                                    <CreditCard size={18} /> CARD
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Nicio masă selectată</p>
                        <p style={{ fontSize: '0.8rem' }}>Creează sau selectează o masă pentru a începe</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPOS;
