import React, { useState, useEffect } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useRecipes } from '../../../context/RecipeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabaseClient';
import { ShoppingCart, CreditCard, Banknote, Search, Plus, Minus, Trash2, Printer, CheckCircle, ChefHat } from 'lucide-react';

const ProductCard = ({ product, addToCart }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            onClick={() => addToCart(product)}
            style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                background: 'white',
                display: 'flex', flexDirection: 'column',
                height: '100%' 
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
            <div style={{ 
                height: '90px', 
                background: '#f8fafc', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                {!imgError && product.image ? (
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span style={{ fontSize: '2rem' }}>🍽️</span>
                )}
            </div>
            <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '2px', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</div>
                <div style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.9rem' }}>{product.price} Lei</div>
            </div>
        </div>
    );
};

const AdminPOS = () => {
    const { products, categories, fetchDailyMenu } = useMenu();
    const { recipes } = useRecipes();
    const { user } = useAuth();

    // State
    const [tables, setTables] = useState([]); // [{ id, name, items: [] }]
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [newTableName, setNewTableName] = useState('');
    
    // Auth Role
    const adminRole = localStorage.getItem('admin_role');

    // Fetch Tables from DB
    useEffect(() => {
        const fetchTables = async () => {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error("Error fetching tables:", error);
            } else {
                setTables(data || []);
            }
        };
        fetchTables();

        // Optional: Real-time subscription could go here
    }, []);

    // Helper to update table items (Optimistic UI + DB Sync)
    const updateTableItems = async (tableId, newItems) => {
        // Optimistic update
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, items: newItems } : t));
        
        // DB Update
        try {
            const { error } = await supabase
                .from('restaurant_tables')
                .update({ items: newItems })
                .eq('id', tableId);
            
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync table items:", err);
            // Optionally revert state here if critical
        }
    };
    
    const [dailyProducts, setDailyProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSaving, setIsSaving] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null); // { items, tableName, paymentMethod, total }
    const [tipAmount, setTipAmount] = useState(0); // For Bacsis (Tips)
    const [lastOrder, setLastOrder] = useState(null); // To allow printing after checkout

    // Date State for POS
    const [posDate, setPosDate] = useState(new Date());

    // Derived
    const selectedTable = tables.find(t => t.id === selectedTableId);
    const cart = selectedTable ? selectedTable.items : [];

    // Helper: Format Date for DB
    const formatDateForDB = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper: Format Date for Display
    const formatDateForDisplay = (date) => {
        return date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    // Change Date
    const changeDate = (days) => {
        const next = new Date(posDate);
        next.setDate(next.getDate() + days);
        setPosDate(next);
    };

    // Initialize: Load Daily Menu
    useEffect(() => {
        const loadMenu = async () => {
            const dateStr = formatDateForDB(posDate);
            console.log("Loading menu for:", dateStr); // Debug
            
            const dailyItems = await fetchDailyMenu(dateStr);

            // Map daily items to full product details
            const available = dailyItems.map(di => {
                const prod = products.find(p => p.id === di.id);
                return prod ? { ...prod, stock: di.stock } : null;
            }).filter(Boolean);

            setDailyProducts(available);
        };
        if (products.length > 0) loadMenu();
    }, [products, fetchDailyMenu, posDate]);

    // Table Actions
    const handleAddTable = async () => {
        if (!newTableName.trim()) return;

        // Role Check: Only 'admin_app' can create tables
        if (adminRole !== 'admin_app') {
            alert("Nu ai permisiunea de a crea mese. Doar administratorul poate face asta.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .insert([{ name: newTableName, items: [] }])
                .select();

            if (error) throw error;
            
            if (data && data[0]) {
                setTables(prev => [...prev, data[0]]);
                setSelectedTableId(data[0].id);
                setNewTableName('');
            }
        } catch (err) {
            console.error(err);
            alert("Eroare la crearea mesei: " + err.message);
        }
    };

    const handleDeleteTable = async (e, tableId) => {
        e.stopPropagation();

        // Role Check: Only 'admin_app' can delete tables
        if (adminRole !== 'admin_app') {
            alert("Nu ai permisiunea de a șterge mese. Doar administratorul poate face asta.");
            return;
        }

        if (window.confirm('Sigur vrei să ștergi această masă?')) {
            try {
                const { error } = await supabase
                    .from('restaurant_tables')
                    .delete()
                    .eq('id', tableId);

                if (error) throw error;

                setTables(prev => prev.filter(t => t.id !== tableId));
                if (selectedTableId === tableId) setSelectedTableId(null);
            } catch (err) {
                console.error(err);
                alert("Eroare la ștergerea mesei: " + err.message);
            }
        }
    };

    // Cart Actions
    const addToCart = (product) => {
        if (!selectedTableId) {
            alert("Te rog selectează sau creează o masă mai întâi!");
            return;
        }

        const table = tables.find(t => t.id === selectedTableId);
        if (!table) return;

        const existing = table.items.find(item => item.id === product.id);
        let newItems;
        if (existing) {
            newItems = table.items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
        } else {
            newItems = [...table.items, { ...product, qty: 1 }];
        }
        
        updateTableItems(selectedTableId, newItems);
    };

    const updateQty = (id, delta) => {
        const table = tables.find(t => t.id === selectedTableId);
        if (!table) return;

        const newItems = table.items.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        });
        
        updateTableItems(selectedTableId, newItems);
    };

    const removeFromCart = (id) => {
        const table = tables.find(t => t.id === selectedTableId);
        if (!table) return;

        const newItems = table.items.filter(item => item.id !== id);
        updateTableItems(selectedTableId, newItems);
    };

    // Send to Kitchen (Stock Deduction + Kanban)
    const handleSendToKitchen = async () => {
        if (!selectedTable) return alert("Selectează o masă!");
        if (cart.length === 0) return alert("Coșul este gol!");

        // Identify items that need to be sent (qty > sent_qty)
        const itemsToSend = cart.filter(item => (item.qty - (item.sent_qty || 0)) > 0);

        if (itemsToSend.length === 0) {
            return alert("Toate produsele au fost deja trimise la bucătărie!");
        }

        if (!window.confirm(`Trimiteți ${itemsToSend.length} produse noi la bucătărie? Stocul va fi scăzut automat.`)) return;

        setIsSaving(true);
        try {
            const finalTableName = selectedTable.name;
            
            // Calculate total for THIS kitchen ticket (only new items)
            const ticketTotal = itemsToSend.reduce((sum, item) => {
                const qtyToSend = item.qty - (item.sent_qty || 0);
                return sum + (item.price * qtyToSend);
            }, 0);

            // 1. Deduct Stock (FIFO Logic) - ONLY for new quantity
            for (const item of itemsToSend) {
                const qtyToSend = item.qty - (item.sent_qty || 0);
                const recipe = recipes.find(r => r.linked_product_id === item.id);
                
                if (recipe && recipe.ingredients) {
                    for (const ing of recipe.ingredients) {
                        let needed = parseFloat(ing.qty) * qtyToSend;
                        
                        // Fetch batches FIFO
                        const { data: batches } = await supabase
                            .from('inventory_batches')
                            .select('*')
                            .eq('item_id', ing.ingredient_id)
                            .gt('quantity', 0)
                            .order('expiration_date', { ascending: true })
                            .order('created_at', { ascending: true });

                        if (batches) {
                            for (const batch of batches) {
                                if (needed <= 0.0001) break;
                                const take = Math.min(batch.quantity, needed);

                                // Update batch
                                await supabase.from('inventory_batches')
                                    .update({ quantity: batch.quantity - take })
                                    .eq('id', batch.id);

                                // Log transaction
                                await supabase.from('inventory_transactions').insert([{
                                    transaction_type: 'OUT',
                                    batch_id: batch.id,
                                    item_id: ing.ingredient_id,
                                    quantity: take,
                                    reason: `Comandă Masa ${finalTableName}: ${item.name} (x${qtyToSend})`,
                                    operator_name: user?.email || 'POS'
                                }]);

                                needed -= take;
                            }
                        }
                    }
                }
            }

            // 2. Create Order (Status: preparing) - ONLY for new items
            const orderPayload = {
                id: Date.now(),
                user_id: user?.id,
                status: 'preparing', // Sends to Kitchen Kanban
                total: ticketTotal,
                final_total: ticketTotal,
                delivery_cost: 0,
                is_pos_order: true,
                table_number: finalTableName,
                fiscal_print_status: 'pending',
                items: itemsToSend.map(item => {
                    const qtyToSend = item.qty - (item.sent_qty || 0);
                    let cleanName = item.name || '';
                    cleanName = cleanName.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
                    return {
                        id: item.id,
                        name: cleanName,
                        price: item.price,
                        quantity: qtyToSend, // Only send new quantity
                        vat: 9
                    };
                }),
                created_at: new Date().toISOString(),
                customer_data: {
                    firstName: `Masa ${finalTableName}`,
                    lastName: '',
                    phone: '',
                    address: 'Restaurant',
                    city: 'Local',
                    email: '',
                    deliveryMethod: 'dinein',
                    paymentMethod: 'pending' 
                }
            };

            const { error } = await supabase.from('orders').insert([orderPayload]);
            if (error) throw error;

            alert("Comanda a fost trimisă la bucătărie!");

            // 3. Update Table Items: Mark items as sent (update sent_qty = current qty)
            const updatedItems = cart.map(item => ({
                ...item,
                sent_qty: item.qty
            }));
            updateTableItems(selectedTableId, updatedItems);

        } catch (err) {
            console.error(err);
            alert("Eroare la trimitere: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Generate FiscalNet XML Content
    const generateFiscalXML = (items, paymentMethod, tip = 0) => {
        let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
        content += '<BonFiscal>\n';
        content += '  <Articole>\n';
        
        items.forEach(item => {
            const price = item.price.toFixed(2);
            const qty = item.qty.toFixed(3);
            
            let name = item.name || '';
            name = name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
            name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            name = name.replace(/[<>&"']/g, ' ').replace(/\s+/g, ' ').trim();
            
            if (name.length > 30) name = name.substring(0, 30);

            content += '    <Articol>\n';
            content += `      <Nume>${name}</Nume>\n`;
            content += `      <Pret>${price}</Pret>\n`;
            content += `      <Cantitate>${qty}</Cantitate>\n`;
            content += `      <CotaTVA>1</CotaTVA>\n`;
            content += `      <Departament>1</Departament>\n`;
            content += '    </Articol>\n';
        });
        content += '  </Articole>\n';

        if (tip > 0) {
            content += '  <Bacsis>\n';
            content += `    <Suma>${tip.toFixed(2)}</Suma>\n`;
            content += '  </Bacsis>\n';
        }

        const payCode = paymentMethod === 'cash' ? '1' : '2';
        const payText = paymentMethod === 'cash' ? 'NUMERAR' : 'CARD';
        const totalAmount = items.reduce((sum, i) => sum + (i.price * i.qty), 0) + tip;

        content += '  <Plati>\n';
        content += '    <Plata>\n';
        content += `      <TipPlata>${payCode}</TipPlata>\n`;
        content += `      <Suma>${totalAmount.toFixed(2)}</Suma>\n`;
        content += `      <TextPlata>${payText}</TextPlata>\n`;
        content += '    </Plata>\n';
        content += '  </Plati>\n';
        content += '</BonFiscal>';

        return content;
    };

    // Download XML File
    const downloadXMLFile = (content, tableName) => {
        const blob = new Blob([content], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `bon_${tableName.replace(/\s+/g, '_')}_${timestamp}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Helper: Trigger SoftPos Payment (Android Intent)
    const triggerSoftPosPayment = (amount) => {
        // SoftPos UniCredit Intent structure
        // This usually triggers a custom scheme that the UniCredit SoftPos app listens for.
        // We will construct an intent URI.
        const intentUri = `intent:#Intent;action=com.unicredit.softpos.PAY;S.amount=${amount.toFixed(2)};S.currency=RON;S.transaction_type=SALE;end`;
        
        console.log("Triggering SoftPos Payment:", intentUri);
        
        // In a web app running in a WebView or browser on Android, 
        // assigning window.location.href to an 'intent:' URI will trigger the OS to open the app.
        try {
            window.location.href = intentUri;
            return true;
        } catch (err) {
            console.error("SoftPos Intent failed:", err);
            return false;
        }
    };

    // Checkout (Save Only)
    const handleCheckout = async (paymentMethod) => {
        if (!selectedTable) return;
        if (cart.length === 0) return alert("Coșul este gol!");

        // 1. If Card, trigger SoftPos first
        if (paymentMethod === 'card') {
            const totalWithTip = total + parseFloat(tipAmount || 0);
            if (window.confirm(`Plată CARD: ${totalWithTip.toFixed(2)} Lei (include ${tipAmount} Lei bacșiș). Trimiteți suma către terminal?`)) {
                triggerSoftPosPayment(totalWithTip);
                
                // Since this is a web app, we don't get an immediate response.
                // We'll ask the user to confirm if the payment was successful on the terminal.
                if (!window.confirm("Plata a fost efectuată cu succes pe terminal? Dacă da, apăsați OK pentru a genera bonul fiscal.")) {
                    return; // Abort if user says payment failed
                }
            } else {
                return; // User canceled payment trigger
            }
        }

        setIsSaving(true);
        try {
            // Save local variables before clearing table
            const finalCart = [...cart];
            const finalTableName = selectedTable.name;
            const finalTotal = total;
            const finalTip = parseFloat(tipAmount || 0);

            const orderPayload = {
                id: Date.now(), 
                user_id: user?.id,
                status: 'delivered',
                total: finalTotal,
                final_total: finalTotal + finalTip,
                tip_amount: finalTip,
                delivery_cost: 0,
                is_pos_order: true,
                table_number: finalTableName,
                fiscal_print_status: 'none', // Changed from 'pending' to 'none' to avoid automatic printing
                items: finalCart.map(item => {
                    let cleanName = item.name || '';
                    cleanName = cleanName.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
                    return {
                        id: item.id,
                        name: cleanName,
                        price: item.price,
                        quantity: item.qty,
                        vat: 9
                    };
                }),
                created_at: new Date().toISOString(),
                customer_data: {
                    firstName: `Masa ${finalTableName}`,
                    lastName: '',
                    phone: '',
                    address: 'Restaurant',
                    city: 'Local',
                    email: '',
                    deliveryMethod: 'dinein',
                    paymentMethod: paymentMethod,
                    tip_amount: finalTip
                }
            };

            const { error } = await supabase.from('orders').insert([orderPayload]);
            if (error) throw error;

            alert("Comandă salvată!");

            // Save last order data for potential printing
            setLastOrder({
                items: finalCart,
                tableName: finalTableName,
                tipAmount: finalTip
            });

            // Clear table items and tip
            updateTableItems(selectedTableId, []);
            setTipAmount(0);
            
        } catch (err) {
            console.error(err);
            alert("Eroare la salvare: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Manual Bon Generation
    const handleGenerateBon = (method = 'cash') => {
        // 1. Prefer current cart if available
        if (cart.length > 0 && selectedTable) {
            const content = generateFiscalXML(cart, method, tipAmount);
            downloadXMLFile(content, selectedTable.name);
            return;
        }

        // 2. Otherwise use last saved order
        if (lastOrder) {
            const content = generateFiscalXML(lastOrder.items, method, lastOrder.tipAmount);
            downloadXMLFile(content, lastOrder.tableName);
            return;
        }

        alert("Nu există produse pentru generarea bonului!");
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
                
                {/* Date Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                    <button onClick={() => changeDate(-1)} style={{ cursor: 'pointer', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px' }}>
                        <Minus size={16} />
                    </button>
                    <div style={{ fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' }}>
                        {formatDateForDisplay(posDate)}
                    </div>
                    <button onClick={() => changeDate(1)} style={{ cursor: 'pointer', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px' }}>
                        <Plus size={16} />
                    </button>
                </div>

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
                {dailyProducts.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>📅</span>
                        <p style={{ margin: 0 }}>Nu există produse planificate pentru {formatDateForDisplay(posDate)}.</p>
                        <small>Adaugă produse în meniul zilei din secțiunea Meniu.</small>
                    </div>
                ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                    gridAutoRows: 'minmax(160px, auto)', // Minimum height for each card
                    alignContent: 'start', // Prevent rows from stretching to fill container
                    gap: '0.5rem', 
                    overflowY: 'auto', 
                    paddingRight: '2px',
                    flex: 1 // Fill remaining vertical space
                }}>
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} addToCart={addToCart} />
                    ))}
                </div>
                )}
            </div>

            {/* Right: Cart / Table Info */}
            <div style={{ flex: 2, minWidth: '280px', maxWidth: '400px', background: 'white', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                
                {/* Table Management */}
                <div style={{ marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    {adminRole === 'admin_app' && (
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
                    )}

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
                                {adminRole === 'admin_app' && (
                                    <span 
                                        onClick={(e) => handleDeleteTable(e, table.id)} 
                                        style={{ 
                                            opacity: 0.8, cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '14px', height: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                                        }}
                                    >×</span>
                                )}
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
                            {/* Tip/Bacsis Input */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>BACȘIȘ (Tip)</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input 
                                        type="number" 
                                        value={tipAmount === 0 ? '' : tipAmount}
                                        onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '0.9rem' }}
                                    />
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lei</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                                <span>TOTAL</span>
                                <span>{(total + parseFloat(tipAmount || 0)).toFixed(2)} Lei</span>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                
                                {/* Send to Kitchen Button */}
                                <button
                                    onClick={handleSendToKitchen}
                                    disabled={isSaving || cart.length === 0}
                                    style={{
                                        background: '#e11d48', // Rose-600
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        cursor: isSaving || cart.length === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: isSaving || cart.length === 0 ? 0.7 : 1,
                                        boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.3)'
                                    }}
                                >
                                    <ChefHat size={20} />
                                    TRIMITE LA BUCĂTĂRIE
                                </button>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleCheckout('cash')}
                                        disabled={isSaving || cart.length === 0}
                                        style={{ 
                                            flex: 1, 
                                            background: '#10b981', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '6px', 
                                            padding: '12px', 
                                            fontSize: '1rem', 
                                            fontWeight: '700', 
                                            cursor: isSaving || cart.length === 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            opacity: isSaving || cart.length === 0 ? 0.7 : 1
                                        }}
                                    >
                                        <Banknote size={20} />
                                        NUMERAR
                                    </button>
                                    <button 
                                        onClick={() => handleCheckout('card')}
                                        disabled={isSaving || cart.length === 0}
                                        style={{ 
                                            flex: 1, 
                                            background: '#3b82f6', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '6px', 
                                            padding: '12px', 
                                            fontSize: '1rem', 
                                            fontWeight: '700', 
                                            cursor: isSaving || cart.length === 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            opacity: isSaving || cart.length === 0 ? 0.7 : 1
                                        }}
                                    >
                                        <CreditCard size={20} />
                                        CARD
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                     <button 
                                         onClick={() => handleGenerateBon('cash')}
                                         disabled={cart.length === 0 && !lastOrder}
                                         style={{ 
                                             flex: 1,
                                             background: '#64748b', 
                                             color: 'white', 
                                             border: 'none', 
                                             borderRadius: '6px', 
                                             padding: '8px', 
                                             fontSize: '0.85rem', 
                                             fontWeight: '600', 
                                             cursor: (cart.length === 0 && !lastOrder) ? 'not-allowed' : 'pointer',
                                             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                             opacity: (cart.length === 0 && !lastOrder) ? 0.7 : 1
                                         }}
                                     >
                                         <Printer size={16} />
                                         BON NUMERAR
                                     </button>
                                     <button 
                                         onClick={() => handleGenerateBon('card')}
                                         disabled={cart.length === 0 && !lastOrder}
                                         style={{ 
                                             flex: 1,
                                             background: '#64748b', 
                                             color: 'white', 
                                             border: 'none', 
                                             borderRadius: '6px', 
                                             padding: '8px', 
                                             fontSize: '0.85rem', 
                                             fontWeight: '600', 
                                             cursor: (cart.length === 0 && !lastOrder) ? 'not-allowed' : 'pointer',
                                             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                             opacity: (cart.length === 0 && !lastOrder) ? 0.7 : 1
                                         }}
                                     >
                                         <Printer size={16} />
                                         BON CARD
                                     </button>
                                 </div>
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
