
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, ShoppingCart, Check, X, Calendar, User, FileText, ChevronRight, Calculator, Printer, Archive, Trash2 } from 'lucide-react';
import InventorySearch from '../../../components/common/InventorySearch';
import { logAction } from '../../../utils/adminLogger';
import { useConsumption } from '../../../hooks/useConsumption';

const AdminProcurement = () => {
    const [activeTab, setActiveTab] = useState('active_lists'); // 'active_lists', 'generator', 'history'
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null); // Full object with items
    const [loading, setLoading] = useState(false);

    // Nomenclatures
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Generator State
    const [generatorDate, setGeneratorDate] = useState(new Date().toISOString().split('T')[0]);
    const [defaultPortions, setDefaultPortions] = useState(20); // Fallback if no stock set
    const [generatedNeeds, setGeneratedNeeds] = useState(null); // Array of { item, needed, stock, requested }

    // Use Consumption Hook
    const { calculateNeeds: calculateConsumption, loading: calcLoading, error: calcError } = useConsumption();

    // History Filter
    const [historyFilter, setHistoryFilter] = useState({
        month: new Date().getMonth().toString(), // 0-11
        year: new Date().getFullYear().toString(),
        shopper: 'all' // 'all' or specific name
    });

    const [availableShoppers, setAvailableShoppers] = useState([]);

    const fetchLists = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('procurement_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching lists:", error);
        else setLists(data || []);
        setLoading(false);
    };

    const fetchListDetails = async (listId) => {
        setLoading(true);
        const { data: list, error: listError } = await supabase
            .from('procurement_lists')
            .select('*')
            .eq('id', listId)
            .single();

        if (listError) {
            console.error("Error fetching list details:", listError);
            setLoading(false);
            return;
        }

        const { data: items, error: itemsError } = await supabase
            .from('procurement_items')
            .select('*')
            .eq('list_id', listId);

        if (itemsError) {
            console.error("Error fetching list items:", itemsError);
        } else {
            setSelectedList({ ...list, items: items || [] });
        }
        setLoading(false);
    };

    const fetchItems = async () => {
        const { data } = await supabase
            .from('inventory_items')
            .select('id, name, unit')
            .order('name');
        if (data) setItems(data);
    };

    const fetchSuppliers = async () => {
        const { data } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');
        if (data) setSuppliers(data);
    };

    const fetchShoppers = async () => {
        const { data } = await supabase
            .from('admin_users')
            .select('name')
            .eq('role', 'achizitor')
            .order('name');

        if (data) {
            setAvailableShoppers(data.map(u => u.name));
        }
    };

    useEffect(() => {
        fetchLists();
        fetchItems();
        fetchSuppliers();
        fetchShoppers();
    }, []);


    // --- ACTIONS ---

    const handleCalculate = async () => {
        const results = await calculateConsumption({
            startDate: generatorDate,
            endDate: generatorDate // Single day calculation for this component
        });

        // Filter out items that don't need buying? The old logic purely showed what's missing.
        // The old logic only showed items where current < required.
        // Let's filter that here to match previous behavior for the "Generator Necesar" tab.
        const missingItems = results.filter(n => n.stock < n.required);

        if (results.length > 0 && missingItems.length === 0) {
            setGeneratedNeeds([]); // Shows "All good" message
        } else {
            setGeneratedNeeds(missingItems);
        }
    };

    const generateListFromNeeds = async () => {
        if (!generatedNeeds || generatedNeeds.length === 0) return;

        const listName = `Necesar Meniu ${new Date(generatorDate).toLocaleDateString('ro-RO')}`;
        await createNewList(listName); // Creates and sets active

        // We need the ID of the newly created list. 
        // createNewList sets state but we need to wait or grab it differently?
        // Actually createNewList sets ActiveTab to 'active_lists' and fetching lists. 
        // We should hack it slightly or retrieve the latest list.

        // Let's optimize createNewList to return the ID or handle this better.
        // For now, I'll fetch the latest list immediately after creation.
        setTimeout(async () => {
            const { data } = await supabase.from('procurement_lists').select('id').order('created_at', { ascending: false }).limit(1).single();
            if (data) {
                // Insert items
                const inserts = generatedNeeds.map(n => ({
                    list_id: data.id,
                    item_id: n.id, // linked to inventory_items
                    item_name: n.name,
                    quantity_requested: Math.ceil(n.to_buy * 100) / 100, // round up slightly
                    unit: n.unit
                }));

                const { error } = await supabase.from('procurement_items').insert(inserts);
                if (error) alert("Eroare la adăugarea produselor: " + error.message);

                logAction('ACHIZIȚII', `Generat necesar pentru ${new Date(generatorDate).toLocaleDateString('ro-RO')}: ${inserts.length} produse.`);
                fetchListDetails(data.id);
                setGeneratedNeeds(null); // Reset
            }
        }, 500);
    };

    const createNewList = async (name) => {
        if (!name) return;
        const shopperName = localStorage.getItem('admin_name') || 'Unknown';

        const { data, error } = await supabase
            .from('procurement_lists')
            .insert([{ name, shopper_name: shopperName, status: 'open' }])
            .select()
            .single();

        if (error) {
            alert("Eroare la creare listă: " + error.message);
        } else {
            setLists([data, ...lists]);
            setActiveTab('active_lists');
            fetchListDetails(data.id); // Open it immediately
            logAction('ACHIZIȚII', `Listă nouă creată: ${name}`);
            return data; // Return data for caller
        }
    };

    const addItemToList = async (listId, itemName, itemId = null, qty = 0, unit = '') => {
        const { error } = await supabase.from('procurement_items').insert([{
            list_id: listId,
            item_name: itemName,
            item_id: itemId,
            quantity_requested: qty,
            unit: unit
        }]);

        if (error) alert("Eroare adăugare produs: " + error.message);
        else {
            fetchListDetails(listId);
            logAction('ACHIZIȚII', `Adăugat produs în listă: ${itemName} (${qty} ${unit})`);
        }
    };

    const updateItem = async (itemId, field, value) => {
        // Optimistic update
        const updatedItems = selectedList.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
        setSelectedList({ ...selectedList, items: updatedItems });

        // Build update object
        const updateObj = { [field]: value };

        // Auto-calc net price if gross changes (handled by DB generated column usually, but for UI feedback we wait for refresh or calc locally)
        // Actually DB handles price_net via generated column, so we just send price_gross.

        const { error } = await supabase.from('procurement_items').update(updateObj).eq('id', itemId);
        if (error) console.error("Error updating item:", error);
    };

    const toggleBought = async (item) => {
        await updateItem(item.id, 'is_bought', !item.is_bought);
    };

    const finalizeList = async () => {
        if (!confirm("Ești sigur că vrei să finalizezi această listă? Ea va fi mutată în istoric.")) return;

        await supabase.from('procurement_lists').update({ status: 'closed' }).eq('id', selectedList.id);
        logAction('ACHIZIȚII', `Finalizat listă: ${selectedList.name}`);
        setSelectedList(null);
        fetchLists();
        setActiveTab('history');
    };

    const deleteList = async (listId, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Ești sigur că vrei să ștergi această listă? Acțiunea este ireversibilă.')) return;

        try {
            // Check if it has items first? Cascade delete should be handled by DB or manual?
            // Assuming DB cascade or manual delete. Safest is manual if no cascade.
            // Let's assume manual delete of items first just in case.
            await supabase.from('procurement_items').delete().eq('list_id', listId);

            const { error } = await supabase.from('procurement_lists').delete().eq('id', listId);
            if (error) throw error;

            logAction('ACHIZIȚII', `Șters listă ID: ${listId}`);
            setLists(prev => prev.filter(l => l.id !== listId));
            if (selectedList && selectedList.id === listId) setSelectedList(null);
        } catch (error) {
            alert("Eroare la ștergere: " + error.message);
        }
    };

    // --- RENDER HELPERS ---

    const renderActiveLists = () => (
        <div className="lists-grid">
            <div className="new-list-card" onClick={() => {
                const name = prompt("Numele noii liste de cumpărături (ex: Piața Obor):");
                if (name) createNewList(name);
            }}>
                <Plus size={32} />
                <span>Listă Nouă</span>
            </div>
            {lists.filter(l => l.status === 'open').map(list => (
                <div key={list.id} className="list-card" onClick={() => fetchListDetails(list.id)}>
                    <div className="list-icon"><ShoppingCart size={24} /></div>
                    <div className="list-info">
                        <h4>{list.name}</h4>
                        <p>{new Date(list.created_at).toLocaleDateString('ro-RO')} • {list.shopper_name}</p>
                    </div>
                    <ChevronRight />
                </div>
            ))}
        </div>
    );

    const renderHistoryLists = () => {
        const months = [
            'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
            'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
        ];

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

        // Extract unique shoppers from history AND registered users
        const closedLists = lists.filter(l => l.status === 'closed');
        const historyShoppers = closedLists.map(l => l.shopper_name);
        const uniqueShoppers = [...new Set([...historyShoppers, ...availableShoppers])].filter(Boolean).filter(s => s !== 'DigitalHub Media').sort();

        const filteredLists = lists.filter(l => {
            if (l.status !== 'closed') return false;
            const d = new Date(l.created_at);
            const matchesDate = d.getMonth().toString() === historyFilter.month && d.getFullYear().toString() === historyFilter.year;
            const matchesShopper = historyFilter.shopper === 'all' || l.shopper_name === historyFilter.shopper;
            return matchesDate && matchesShopper;
        });

        // Calculate totals for table (requires fetching items? No, we don't have items for all lists in `lists` state)
        // `lists` only has headers.
        // To show total, we might need to fetch it or store it.
        // For now, we show basic info. If accurate total needed, we need a view or join.
        // User asked for "History Table".

        return (
            <div>
                {/* Filter Controls */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Lună</label>
                        <select
                            value={historyFilter.month}
                            onChange={(e) => setHistoryFilter({ ...historyFilter, month: e.target.value })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx.toString()}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>An</label>
                        <select
                            value={historyFilter.year}
                            onChange={(e) => setHistoryFilter({ ...historyFilter, year: e.target.value })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '100px' }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Achizitor</label>
                        <select
                            value={historyFilter.shopper}
                            onChange={(e) => setHistoryFilter({ ...historyFilter, shopper: e.target.value })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}
                        >
                            <option value="all">Toți</option>
                            {uniqueShoppers.map((s, idx) => (
                                <option key={idx} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Data</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Nume Listă</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Achizitor</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '1rem', color: '#64748b', textAlign: 'right' }}>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLists.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nu există liste arhivate în această perioadă.</td>
                                </tr>
                            ) : (
                                filteredLists.map(list => (
                                    <tr key={list.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(list.created_at).toLocaleDateString('ro-RO')}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{list.name}</td>
                                        <td style={{ padding: '1rem' }}>{list.shopper_name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className="badge-secondary" style={{ padding: '0.25rem 0.5rem', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                {list.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                className="btn-icon"
                                                title="Vezi Detalii"
                                                onClick={() => fetchListDetails(list.id)}
                                                style={{ marginRight: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Archive size={18} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Șterge"
                                                onClick={(e) => deleteList(list.id, e)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderDetailView = () => {
        if (!selectedList) return null;

        // Calculate totals
        const totalGross = selectedList.items.reduce((acc, i) => acc + (i.is_bought ? (parseFloat(i.price_gross) * parseFloat(i.quantity_bought || 0)) : 0), 0);
        const totalNet = selectedList.items.reduce((acc, i) => {
            const price = parseFloat(i.price_gross) || 0;
            const vat = parseFloat(i.vat_percent) || 19;
            const net = price / (1 + vat / 100);
            return acc + (i.is_bought ? (net * parseFloat(i.quantity_bought || 0)) : 0);
        }, 0);

        const isClosed = selectedList.status === 'closed';

        return (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                <div className="modal-content procurement-detail-modal" style={{ background: '#f8fafc', padding: '0', borderRadius: '12px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div className="detail-header" style={{ padding: '1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                        <div className="header-title">
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{selectedList.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <span className={`badge ${isClosed ? 'badge-secondary' : 'badge-warning'}`}>{selectedList.status.toUpperCase()}</span>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>• {new Date(selectedList.created_at).toLocaleDateString('ro-RO')} • {selectedList.shopper_name}</span>
                            </div>
                        </div>
                        <button className="btn-icon" onClick={() => setSelectedList(null)} style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '50%' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        {!isClosed && (
                            <div className="add-item-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <InventorySearch
                                        items={items}
                                        placeholder="Caută și adaugă produs din Nomenclator..."
                                        onSelect={(item) => {
                                            if (item) {
                                                addItemToList(selectedList.id, item.name, item.id, 1, item.unit);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn"
                                    style={{ background: '#e2e8f0', color: '#475569', whiteSpace: 'nowrap' }}
                                    onClick={() => {
                                        const name = prompt("Nume produs nou (care nu există în nomenclator):");
                                        if (name) addItemToList(selectedList.id, name);
                                    }}
                                >
                                    + Produs Custom
                                </button>
                            </div>
                        )}

                        <div className="shopping-list">
                            {selectedList.items.map(item => (
                                <div key={item.id} className={`shopping-item ${item.is_bought ? 'bought' : ''}`}>
                                    {!isClosed && (
                                        <div className="item-check" onClick={() => toggleBought(item)}>
                                            {item.is_bought ? <Check size={20} color="white" /> : null}
                                        </div>
                                    )}

                                    <div className="item-main">
                                        <div className="item-header-row">
                                            <div className="item-name">
                                                <strong>{item.item_name}</strong>
                                                <span className="text-muted">Necesar: {item.quantity_requested} {item.unit}</span>
                                            </div>
                                            {!isClosed && (
                                                <button className="btn-delete-icon mobile-only" onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Stergi produsul?')) {
                                                        await supabase.from('procurement_items').delete().eq('id', item.id);
                                                        logAction('ACHIZIȚII', `Șters produs din listă: ${item.item_name}`);
                                                        fetchListDetails(selectedList.id);
                                                    }
                                                }}><X size={16} /></button>
                                            )}
                                        </div>

                                        {(item.is_bought || isClosed) && (
                                            <div className="item-inputs">
                                                <div className="input-group">
                                                    <label>Cantitate</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity_bought}
                                                        onChange={(e) => !isClosed && updateItem(item.id, 'quantity_bought', e.target.value)}
                                                        readOnly={isClosed}
                                                        placeholder={item.quantity_requested}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Preț (cu TVA)</label>
                                                    <input
                                                        type="number"
                                                        value={item.price_gross}
                                                        onChange={(e) => !isClosed && updateItem(item.id, 'price_gross', e.target.value)}
                                                        readOnly={isClosed}
                                                    />
                                                </div>
                                                <div className="input-group full-width-mobile">
                                                    <label>Furnizor</label>
                                                    <select
                                                        value={item.supplier_id || ''}
                                                        onChange={(e) => !isClosed && updateItem(item.id, 'supplier_id', e.target.value)}
                                                        disabled={isClosed}
                                                    >
                                                        <option value="">-</option>
                                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isClosed && (
                                        <button className="btn-delete-icon desktop-only" onClick={async () => {
                                            if (confirm('Stergi produsul?')) {
                                                await supabase.from('procurement_items').delete().eq('id', item.id);
                                                logAction('ACHIZIȚII', `Șters produs din listă: ${item.item_name}`);
                                                fetchListDetails(selectedList.id);
                                            }
                                        }}><X size={16} /></button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="list-footer-stats">
                            <div className="stats-row">
                                <div>Total Net: <strong>{totalNet.toFixed(2)}</strong></div>
                                <div>Total Brut: <strong>{totalGross.toFixed(2)}</strong></div>
                            </div>
                            {!isClosed && (
                                <button className="btn-finalize" onClick={finalizeList}>
                                    <Check size={18} /> Finalizează Lista
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderGenerator = () => (
        <div className="generator-container">
            <div className="generator-controls">
                <div className="control-group">
                    <label>Dată Meniu</label>
                    <input type="date" value={generatorDate} onChange={e => setGeneratorDate(e.target.value)} />
                </div>
                <div className="control-group">
                    <label>Porții Implicite (dacă nu-s setate)</label>
                    <input type="number" value={defaultPortions} onChange={e => setDefaultPortions(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={handleCalculate} disabled={calcLoading || loading}>
                    <Calculator size={18} /> {calcLoading ? 'Se calculează...' : 'Calculează Necesar'}
                </button>
            </div>

            {generatedNeeds && (
                <div className="needs-preview">
                    <h3>Rezultat Calcul: {generatedNeeds.length} produse necesare</h3>
                    {generatedNeeds.length === 0 ? (
                        <p className="success-msg"><Check size={18} /> Stocul curent acoperă tot necesarul!</p>
                    ) : (
                        <>
                            <table className="needs-table">
                                <thead>
                                    <tr>
                                        <th>Produs</th>
                                        <th>Necesar (Total)</th>
                                        <th>Stoc Curent</th>
                                        <th>De Cumpărat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedNeeds.map(n => (
                                        <tr key={n.id}>
                                            <td>{n.name}</td>
                                            <td>{n.required.toFixed(2)} {n.unit}</td>
                                            <td>{n.stock.toFixed(2)} {n.unit}</td>
                                            <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{n.to_buy.toFixed(2)} {n.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="preview-actions">
                                <button className="btn-finalize" onClick={generateListFromNeeds}>
                                    <ShoppingCart size={18} /> Generează Lista de Cumpărături
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .generator-container { padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .generator-controls { display: flex; gap: 1.5rem; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; }
                .control-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .control-group label { font-weight: 600; color: #64748b; font-size: 0.9rem; }
                .control-group input { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
                .btn-primary { background: #0f172a; color: white; padding: 0.7rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
                .btn-primary:hover { background: #1e293b; }
                
                .needs-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.95rem; }
                .needs-table th { text-align: left; padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #64748b; }
                .needs-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
                .needs-table tr:hover { background: #f8fafc; }
                
                .preview-actions { margin-top: 2rem; display: flex; justify-content: flex-end; }
                .success-msg { color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; }
            `}</style>
        </div>
    );

    return (
        <div className="admin-procurement">
            <div className="procurement-tabs">
                <button className={activeTab === 'active_lists' ? 'active' : ''} onClick={() => setActiveTab('active_lists')}>Liste Active</button>
                <button className={activeTab === 'generator' ? 'active' : ''} onClick={() => setActiveTab('generator')}>Generator Necesar</button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => { setActiveTab('history'); fetchLists(); }}>Istoric</button>
            </div>

            <div className="procurement-content">
                {activeTab === 'active_lists' ? renderActiveLists() : (
                    activeTab === 'generator' ? renderGenerator() : renderHistoryLists()
                )}
            </div>

            {selectedList && renderDetailView()}

            <style>{`
                .admin-procurement {
                    padding: 1rem;
                    background: #f8fafc;
                    min-height: 100%;
                }
                
                .procurement-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 1rem;
                    overflow-x: auto;
                }
                
                .procurement-tabs button {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0.6rem 1.2rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                
                .procurement-tabs button.active {
                    background: #990000;
                    color: white;
                    border-color: #990000;
                }

                .lists-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
                    gap: 1rem; 
                }
                
                .list-card, .new-list-card {
                    background: white; 
                    border-radius: 12px; 
                    padding: 1.5rem; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
                    cursor: pointer;
                    display: flex; 
                    align-items: center; 
                    gap: 1rem; 
                    transition: all 0.2s;
                }
                
                .new-list-card { 
                    border: 2px dashed #cbd5e1; 
                    flex-direction: column; 
                    justify-content: center;
                    color: #64748b;
                    background: #f8fafc;
                }
                
                .list-icon { 
                    width: 48px; height: 48px;
                    background: #fee2e2; 
                    border-radius: 12px; 
                    color: #990000; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .list-info { flex: 1; min-width: 0; }
                .list-info h4 { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .list-info p { margin: 0; font-size: 0.85rem; color: #64748b; }
                
                /* Detail View */
                .procurement-detail {
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .detail-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .header-title { flex: 1; }
                .header-title h2 { margin: 0; font-size: 1.25rem; }
                
                .badge-secondary { background: #e2e8f0; color: #475569; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; }
                .badge-warning { background: #fef3c7; color: #d97706; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; }
                
                .btn-back {
                    background: #f1f5f9; border: none; padding: 0.5rem 1rem; border-radius: 6px; 
                    margin-right: 1rem; font-size: 0.9rem; cursor: pointer; color: #475569;
                }

                .add-item-bar { margin-bottom: 1.5rem; }
                .add-item-bar select {
                    width: 100%; padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
                    background: #f8fafc;
                }

                .shopping-list { display: flex; flex-direction: column; gap: 0.75rem; }
                
                .shopping-item {
                    background: white; 
                    border: 1px solid #e2e8f0; 
                    padding: 1rem; 
                    border-radius: 10px;
                    display: flex; 
                    gap: 0.75rem; 
                    align-items: flex-start;
                }
                
                .item-check {
                    width: 32px; height: 32px; 
                    border: 2px solid #cbd5e1; 
                    border-radius: 8px;
                    cursor: pointer; 
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; 
                }
                .shopping-item.bought .item-check { background: #22c55e; border-color: #22c55e; }
                
                .item-main { flex: 1; min-width: 0; }
                
                .item-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
                .item-name strong { display: block; font-size: 1rem; color: #0f172a; margin-bottom: 0.2rem; }
                .item-name .text-muted { font-size: 0.85rem; color: #64748b; }
                
                .item-inputs {
                    display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;
                }
                .input-group { flex: 1; min-width: 80px; }
                .input-group label { display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 2px; }
                .input-group input, .input-group select {
                    width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;
                }
                
                .btn-delete-icon {
                    background: #fee2e2; border: none; color: #ef4444; 
                    width: 32px; height: 32px; border-radius: 6px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; flex-shrink: 0;
                }
                
                .list-footer-stats {
                    margin-top: 2rem; 
                    padding: 1rem; 
                    background: #1e293b; 
                    color: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .stats-row { display: flex; gap: 1.5rem; }
                
                .btn-finalize {
                    background: #22c55e; color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                /* Mobile Optimizations */
                .mobile-only { display: none; }
                .desktop-only { display: flex; }

                @media (max-width: 768px) {
                    .admin-procurement { padding: 0.5rem; }
                    .procurement-detail { padding: 0.75rem; }
                    .lists-grid { grid-template-columns: 1fr; }
                    
                    .shopping-item { padding: 0.75rem; gap: 0.75rem; }
                    
                    .item-inputs { flex-direction: row; }
                    .input-group { min-width: 45%; }
                    .input-group.full-width-mobile { min-width: 100%; width: 100%; }
                    
                    .desktop-only { display: none; }
                    .mobile-only { display: flex; }
                    
                    .list-footer-stats { flex-direction: column; align-items: stretch; text-align: center; }
                    .stats-row { justify-content: space-around; margin-bottom: 1rem; }
                    .btn-finalize { justify-content: center; width: 100%; padding: 1rem; font-size: 1.1rem; }
                }
            `}</style>
        </div >
    );
};

export default AdminProcurement;
