import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Calendar, Save, Copy, CheckSquare, Square, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMenu } from '../../../context/MenuContext';

const AdminMenuPlanner = () => {
    const { products, categories, loading: menuLoading } = useMenu();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeItems, setActiveItems] = useState(new Set()); // Set of Product IDs
    const [stockValues, setStockValues] = useState({}); // Map of Product ID -> Stock Count
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState("Toate");

    // Format date for DB: YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const dateStr = formatDate(selectedDate);

    // Fetch config for selected date
    const fetchConfig = async () => {
        setLoading(true);
        setActiveItems(new Set());
        setStockValues({});

        const { data, error } = await supabase
            .from('daily_menu_items')
            .select('product_id, stock')
            .eq('date', dateStr);

        if (error) {
            console.error("Error fetching menu:", error);
        } else if (data) {
            const ids = new Set();
            const stocks = {};
            data.forEach(i => {
                ids.add(i.product_id);
                stocks[i.product_id] = i.stock;
            });
            setActiveItems(ids);
            setStockValues(stocks);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConfig();
    }, [dateStr]);

    const toggleItem = (id) => {
        const newSet = new Set(activeItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setActiveItems(newSet);
    };

    const handleSelectAll = (filteredProducts) => {
        const newSet = new Set(activeItems);
        filteredProducts.forEach(p => newSet.add(p.id));
        setActiveItems(newSet);
    };

    const handleDeselectAll = (filteredProducts) => {
        const newSet = new Set(activeItems);
        filteredProducts.forEach(p => newSet.delete(p.id));
        setActiveItems(newSet);
    };

    const saveConfiguration = async () => {
        setSaving(true);

        // 1. Delete existing for this date
        const { error: delError } = await supabase
            .from('daily_menu_items')
            .delete()
            .eq('date', dateStr);

        if (delError) {
            alert("Eroare la ștergerea vechii configurații: " + delError.message);
            setSaving(false);
            return;
        }

        // 2. Insert new ids
        const itemsToInsert = Array.from(activeItems).map(id => ({
            date: dateStr,
            product_id: id,
            is_available: true,
            stock: stockValues[id] === '' || stockValues[id] === undefined ? null : parseInt(stockValues[id])
        }));

        if (itemsToInsert.length > 0) {
            const { error: insError } = await supabase
                .from('daily_menu_items')
                .insert(itemsToInsert);

            if (insError) {
                alert("Eroare la salvare: " + insError.message);
                setSaving(false);
                return;
            }
        }

        logAction('MENIU_ZILNIC', `Configurat meniu pentru ${dateStr}: ${itemsToInsert.length} produse.`);
        setSaving(false);
        alert("Configurație salvată cu succes!");
    };

    const copyFromYesterday = async () => {
        if (!window.confirm("Această acțiune va suprascrie selecția curentă cu cea de ieri. Continui?")) return;

        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = formatDate(yesterday);

        setLoading(true);
        const { data, error } = await supabase
            .from('daily_menu_items')
            .select('product_id, stock')
            .eq('date', yStr);

        if (error) {
            alert("Eroare la copiere: " + error.message);
        } else if (data) {
            const ids = new Set();
            const stocks = {};
            data.forEach(i => {
                ids.add(i.product_id);
                stocks[i.product_id] = i.stock;
            });
            setActiveItems(ids);
            setStockValues(stocks);
            alert(`Copiat ${ids.size} produse de la ${yStr}. Nu uita să salvezi!`);
        }
        setLoading(false);
    };

    const changeDate = (days) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + days);
        setSelectedDate(next);
    };

    // Filter Logic: Exclude Catering + Apply Category Filter
    const standardProducts = products.filter(p => {
        const cat = categories.find(c => c.name === p.category);
        return cat && cat.type !== 'catering';
    });

    const displayProducts = filterCategory === "Toate"
        ? standardProducts
        : standardProducts.filter(p => p.category === filterCategory);

    // Group active count
    const activeCount = Array.from(activeItems).filter(id => standardProducts.find(p => p.id === id)).length;

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Planificator Meniu</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Selectează produsele disponibile și setează numărul de porții (opțional).
                </div>
            </div>

            {/* Date Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <button className="icon-btn" onClick={() => changeDate(-1)}><ChevronLeft /></button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                        {selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                    <span style={{ fontSize: '0.85rem', color: activeCount > 0 ? '#16a34a' : '#ef4444', fontWeight: '600' }}>
                        {activeCount > 0 ? `${activeCount} Produse Active` : 'Niciun produs setat (Meniu Gol)'}
                    </span>
                </div>
                <button className="icon-btn" onClick={() => changeDate(1)}><ChevronRight /></button>
            </div>

            {/* Controls */}
            <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    className="form-control"
                    style={{ width: 'auto', paddingRight: '2rem' }}
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="Toate">Toate Categoriile</option>
                    {categories.filter(c => c.type !== 'catering').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>

                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    <button
                        onClick={copyFromYesterday}
                        style={{
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                    >
                        <Copy size={18} /> Copiază de Ieri
                    </button>
                    <button
                        onClick={saveConfiguration}
                        disabled={saving}
                        style={{
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
                            transition: 'all 0.2s',
                            opacity: saving ? 0.7 : 1
                        }}
                        onMouseOver={(e) => !saving && (e.currentTarget.style.background = '#15803d')}
                        onMouseOut={(e) => !saving && (e.currentTarget.style.background = '#16a34a')}
                    >
                        {saving ? 'Se salvează...' : <><Save size={18} /> Salvează Configurația</>}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleSelectAll(displayProducts)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem' }}>Selectează Tot</button>
                <button onClick={() => handleDeselectAll(displayProducts)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>Deselectează Tot</button>
            </div>

            {/* Product Grid */}
            {loading || menuLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Se încarcă...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {displayProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => toggleItem(product.id)}
                            style={{
                                padding: '1rem',
                                background: activeItems.has(product.id) ? '#f0fdf4' : 'white',
                                border: activeItems.has(product.id) ? '2px solid #16a34a' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: `2px solid ${activeItems.has(product.id) ? '#16a34a' : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {activeItems.has(product.id) && <div style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '2px' }} />}
                            </div>

                            {product.image && (
                                <img src={product.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                            )}

                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                            </div>

                            {activeItems.has(product.id) && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    title="Număr de porții (Lasă gol pentru nelimitat)"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>Porții</span>
                                    <input
                                        type="number"
                                        placeholder="∞"
                                        min="0"
                                        style={{
                                            width: '60px',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            border: '1px solid #cbd5e1',
                                            textAlign: 'center',
                                            fontSize: '0.9rem'
                                        }}
                                        value={stockValues[product.id] ?? ''}
                                        onChange={(e) => setStockValues({ ...stockValues, [product.id]: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMenuPlanner;
