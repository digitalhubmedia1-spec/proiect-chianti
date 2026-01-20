
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, ShoppingCart, Check, X, Calendar, User, FileText, ChevronRight, Calculator, Printer, Archive } from 'lucide-react';
import { logAction } from '../../../utils/adminLogger';

const AdminProcurement = () => {
    const [activeTab, setActiveTab] = useState('active_lists'); // 'active_lists', 'generator', 'history'
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null); // Full object with items
    const [loading, setLoading] = useState(false);

    // Nomenclatures
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchNomenclatures();
        fetchLists();
    }, []);

    const fetchNomenclatures = async () => {
        const { data: iData } = await supabase.from('inventory_items').select('*').order('name');
        const { data: sData } = await supabase.from('suppliers').select('*').order('name');
        if (iData) setItems(iData);
        if (sData) setSuppliers(sData);
    };

    const fetchLists = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('procurement_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setLists(data);
        setLoading(false);
    };

    const fetchListDetails = async (listId) => {
        setLoading(true);
        // Fetch list info
        const { data: listData } = await supabase.from('procurement_lists').select('*').eq('id', listId).single();

        // Fetch items
        const { data: itemsData } = await supabase
            .from('procurement_items')
            .select('*')
            .eq('list_id', listId)
            .order('is_bought', { ascending: true }) // Not bought first
            .order('item_name', { ascending: true });

        if (listData && itemsData) {
            setSelectedList({ ...listData, items: itemsData });
        }
        setLoading(false);
    };

    // --- ACTIONS ---

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
        else fetchListDetails(listId);
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
        setSelectedList(null);
        fetchLists();
        setActiveTab('history');
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

    const renderHistoryLists = () => (
        <div className="lists-grid">
            {lists.filter(l => l.status === 'closed').length === 0 && <p style={{ color: '#64748b' }}>Nu există liste finalizate.</p>}
            {lists.filter(l => l.status === 'closed').map(list => (
                <div key={list.id} className="list-card history-card" onClick={() => fetchListDetails(list.id)}>
                    <div className="list-icon" style={{ background: '#e2e8f0', color: '#64748b' }}><Archive size={24} /></div>
                    <div className="list-info">
                        <h4 style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{list.name}</h4>
                        <p>{new Date(list.created_at).toLocaleDateString('ro-RO')} • {list.shopper_name}</p>
                    </div>
                    <ChevronRight color="#cbd5e1" />
                </div>
            ))}
        </div>
    );

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
            <div className="procurement-detail">
                <div className="detail-header">
                    <button className="btn-back" onClick={() => setSelectedList(null)}>← Înapoi</button>
                    <div className="header-title">
                        <h2>{selectedList.name}</h2>
                        <span className={`badge ${isClosed ? 'badge-secondary' : 'badge-warning'}`}>{selectedList.status.toUpperCase()}</span>
                    </div>
                </div>

                {!isClosed && (
                    <div className="add-item-bar">
                        <select id="quick-add-item" onChange={(e) => {
                            if (e.target.value === 'custom') {
                                const name = prompt("Nume produs:");
                                if (name) addItemToList(selectedList.id, name);
                            } else {
                                const item = items.find(i => i.id == e.target.value);
                                if (item) addItemToList(selectedList.id, item.name, item.id, 1, item.unit);
                            }
                            e.target.value = '';
                        }}>
                            <option value="">+ Adaugă Produs Rapid</option>
                            <option value="custom">Produs Nou (Text)</option>
                            <optgroup label="Din Nomenclator">
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </optgroup>
                        </select>
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
        );
    };

    return (
        <div className="admin-procurement">
            {!selectedList && (
                <div className="procurement-tabs">
                    <button className={activeTab === 'active_lists' ? 'active' : ''} onClick={() => setActiveTab('active_lists')}>Liste Active</button>
                    <button className={activeTab === 'history' ? 'active' : ''} onClick={() => { setActiveTab('history'); fetchLists(); }}>Istoric</button>
                </div>
            )}

            <div className="procurement-content">
                {selectedList ? renderDetailView() : (
                    activeTab === 'active_lists' ? renderActiveLists() : renderHistoryLists()
                )}
            </div>

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
