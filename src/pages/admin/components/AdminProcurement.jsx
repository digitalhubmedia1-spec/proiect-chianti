
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

            .admin-procurement {
                padding: 1.5rem;
            background: #f8fafc;
            min-height: 100%;
                }

            .procurement-tabs {
                display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 1rem;
                }

            .procurement-tabs button {
                background: none;
            border: none;
            padding: 0.5rem 1rem;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
                }

            .procurement-tabs button.active {
                background: #990000;
            color: white;
                }

            .procurement-tabs button:hover:not(.active) {
                background: #e2e8f0;
            color: #1e293b;
                }

            .lists-grid {
                display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem; 
                }

            .list-card, .new-list-card {
                background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.2s ease;
            border: 1px solid transparent;
                }

            .new-list-card {
                border: 2px dashed #cbd5e1;
            background: #f8fafc;
            color: #64748b;
            justify-content: center;
            flex-direction: column;
            box-shadow: none;
                }

            .list-card:hover {
                transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-color: #cbd5e1;
                }

            .new-list-card:hover {
                border - color: #990000;
            color: #990000;
            background: white;
                }

            .list-icon {
                background: #fee2e2;
            padding: 1rem;
            border-radius: 12px;
            color: #990000;
            display: flex;
            align-items: center;
            justify-content: center;
                }

            .list-info h4 {margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #1e293b; }
            .list-info p {margin: 0; font-size: 0.85rem; color: #64748b; }

            /* Detail View */
            .procurement-detail {
                background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

            .detail-header {
                display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e2e8f0;
                }

            .detail-header h2 {margin: 0; font-size: 1.5rem; color: #1e293b; }
            .badge-warning {background: #fef3c7; color: #d97706; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

            .btn-back {
                background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; font-size: 0.9rem; margin-right: 1rem;
                }
            .btn-back:hover {color: #1e293b; text-decoration: underline; }

            .add-item-bar {
                margin - bottom: 2rem;
            background: #f8fafc;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
                }
            .add-item-bar select {
                width: 100%;
            padding: 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 1rem;
                }

            .shopping-list {margin - top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

            .shopping-item {
                background: white;
            border: 1px solid #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            gap: 1rem;
            align-items: flex-start;
            transition: all 0.2s;
                }
            .shopping-item:hover {border - color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .shopping-item.bought {background: #f0fdf4; border-color: #bbf7d0; opacity: 0.9; }

            .item-check {
                width: 28px; height: 28px;
            border: 2px solid #cbd5e1;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
            transition: all 0.2s;
            background: white;
                }
            .item-check:hover {border - color: #94a3b8; }
            .shopping-item.bought .item-check {background: #22c55e; border-color: #22c55e; }

            .item-main {flex: 1; }

            .item-inputs {
                display: flex; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap;
            background: rgba(255,255,255,0.8); padding: 0.75rem; border-radius: 6px;
            border: 1px solid #e2e8f0;
                }
            .input-group label {
                display: block; font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 2px;
                }
            .input-group input, .input-group select {
                padding: 0.4rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; font-size: 0.9rem;
                }

            .btn-delete-icon {
                background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 4px; border-radius: 4px;
                }
            .btn-delete-icon:hover {background: #fee2e2; color: #ef4444; }

            .list-footer-stats {
                margin - top: 2rem;
            padding: 1.5rem;
            background: #1e293b;
            color: white;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
            .list-footer-stats div {font - size: 1.1rem; }
            `}</style>
        </div >
    );
};

export default AdminProcurement;
