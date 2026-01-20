
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

    const renderDetailView = () => {
        if (!selectedList) return null;

        // Calculate totals
        const totalGross = selectedList.items.reduce((acc, i) => acc + (i.is_bought ? (parseFloat(i.price_gross) * parseFloat(i.quantity_bought || 0)) : 0), 0);
        const totalNet = selectedList.items.reduce((acc, i) => {
            // Calculate net per item roughly for display if not fetched freshly
            const price = parseFloat(i.price_gross) || 0;
            const vat = parseFloat(i.vat_percent) || 19;
            const net = price / (1 + vat / 100);
            return acc + (i.is_bought ? (net * parseFloat(i.quantity_bought || 0)) : 0);
        }, 0);

        return (
            <div className="procurement-detail">
                <div className="detail-header">
                    <button className="btn-back" onClick={() => setSelectedList(null)}>← Înapoi</button>
                    <div>
                        <h2>{selectedList.name}</h2>
                        <span className="badge badge-warning">{selectedList.status.toUpperCase()}</span>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={18} /> Print</button>
                    </div>
                </div>

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

                <div className="shopping-list">
                    {selectedList.items.map(item => (
                        <div key={item.id} className={`shopping-item ${item.is_bought ? 'bought' : ''}`}>
                            <div className="item-check" onClick={() => toggleBought(item)}>
                                {item.is_bought ? <Check size={20} color="white" /> : null}
                            </div>

                            <div className="item-main">
                                <div className="item-name">
                                    <strong>{item.item_name}</strong>
                                    <span className="text-muted">Necesar: {item.quantity_requested} {item.unit}</span>
                                </div>

                                {item.is_bought && (
                                    <div className="item-inputs">
                                        <div className="input-group">
                                            <label>Cant. Cumpărată</label>
                                            <input
                                                type="number"
                                                value={item.quantity_bought}
                                                onChange={(e) => updateItem(item.id, 'quantity_bought', e.target.value)}
                                                placeholder={item.quantity_requested}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Preț (cu TVA)</label>
                                            <input
                                                type="number"
                                                value={item.price_gross}
                                                onChange={(e) => updateItem(item.id, 'price_gross', e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Furnizor</label>
                                            <select
                                                value={item.supplier_id || ''}
                                                onChange={(e) => updateItem(item.id, 'supplier_id', e.target.value)}
                                            >
                                                <option value="">-</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="btn-delete-icon" onClick={async () => {
                                if (confirm('Stergi produsul?')) {
                                    await supabase.from('procurement_items').delete().eq('id', item.id);
                                    fetchListDetails(selectedList.id);
                                }
                            }}><X size={16} /></button>
                        </div>
                    ))}
                </div>

                <div className="list-footer-stats">
                    <div>Total Net (estimat): <strong>{totalNet.toFixed(2)} RON</strong></div>
                    <div>Total Brut (bon fiscal): <strong>{totalGross.toFixed(2)} RON</strong></div>
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
                    activeTab === 'active_lists' ? renderActiveLists() : (
                        <div>Istoric (Work in Progress)</div>
                    )
                )}
            </div>

            <style>{`
                .lists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
                .list-card, .new-list-card {
                    background: white; border-radius: 8px; padding: 1.5rem; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer;
                    display: flex; align-items: center; gap: 1rem; transition: transform 0.2s;
                }
                .new-list-card { border: 2px dashed #cbd5e1; color: #64748b; justify-content: center; flex-direction: column; }
                .list-card:hover, .new-list-card:hover { transform: translateY(-3px); }
                .list-icon { background: #f1f5f9; padding: 0.8rem; border-radius: 50%; color: #990000; }
                
                .shopping-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .shopping-item {
                    background: white; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px;
                    display: flex; gap: 1rem; align-items: flex-start;
                }
                .shopping-item.bought { background: #f0fdf4; border-color: #bbf7d0; }
                
                .item-check {
                    width: 30px; height: 30px; border: 2px solid #cbd5e1; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 0.2rem;
                }
                .shopping-item.bought .item-check { background: #22c55e; border-color: #22c55e; }
                
                .item-main { flex: 1; }
                .item-inputs {
                    display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;
                    background: rgba(255,255,255,0.5); padding: 0.5rem; border-radius: 4px;
                }
                .input-group { display: flex; flex-direction: column; font-size: 0.8rem; }
                .input-group input, .input-group select {
                    padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;
                }
                .list-footer-stats {
                    margin-top: 2rem; padding: 1rem; background: #1e293b; color: white;
                    border-radius: 8px; display: flex; justify-content: space-between;
                }
            `}</style>
        </div>
    );
};

export default AdminProcurement;
