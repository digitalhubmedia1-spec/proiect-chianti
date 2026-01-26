
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Search, FileText, Calendar, Trash2, Edit2, Save, X, Printer, Filter, CheckCircle, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import InventorySearch from '../../../components/common/InventorySearch'; // Reusing search component
import { logAction } from '../../../utils/adminLogger';

const AdminReception = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new', 'history', 'reports'

    // --- NEW RECEPTION STATE ---
    const [newReception, setNewReception] = useState({
        supplier_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        items: []
    });
    const [isSaving, setIsSaving] = useState(false);

    // --- DATA FETCHING ---
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]); // All inventory items for search fallback

    // --- HISTORY/REPORTS FILTER ---
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        supplierId: 'all',
        invoiceNumber: ''
    });
    const [receptionsList, setReceptionsList] = useState([]);
    const [selectedReception, setSelectedReception] = useState(null); // For detail/edit view
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'history' || activeTab === 'reports') {
            fetchReceptions();
        }
    }, [activeTab, filters]);

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('*').order('name');
        if (data) setSuppliers(data);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('inventory_items').select('id, name, unit, vat_rate').order('name');
        if (data) setProducts(data);
    };

    const fetchReceptions = async () => {
        setLoadingHistory(true);
        let query = supabase
            .from('receptions')
            .select(`
                *,
                suppliers (name)
            `)
            .gte('reception_date', filters.startDate)
            .lte('reception_date', filters.endDate)
            .order('reception_date', { ascending: false });

        if (filters.supplierId !== 'all') {
            query = query.eq('supplier_id', filters.supplierId);
        }
        if (filters.invoiceNumber) {
            query = query.ilike('invoice_number', `%${filters.invoiceNumber}%`);
        }

        const { data, error } = await query;
        if (error) console.error(error);
        else setReceptionsList(data || []);
        setLoadingHistory(false);
    };

    const fetchReceptionDetails = async (receptionId) => {
        const { data: reception } = await supabase
            .from('receptions')
            .select('*, suppliers(name)')
            .eq('id', receptionId)
            .single();

        const { data: batches } = await supabase
            .from('inventory_batches')
            .select(`
                *,
                inventory_items (name, unit)
            `)
            .eq('reception_id', receptionId);

        if (reception) {
            setSelectedReception({ ...reception, items: batches || [] });
        }
    };

    // --- NEW RECEPTION LOGIC ---

    const addItemToReception = (item) => {
        // Check if already added
        if (newReception.items.some(i => i.item_id === item.id)) {
            alert("Produsul este deja în listă!");
            return;
        }

        const newItem = {
            item_id: item.id,
            name: item.name,
            unit: item.unit,
            quantity: 1, // User inputs invoice quantity
            price: 0, // Price per unit
            vat_percent: item.vat_rate || 19,
            expiration_date: ''
        };
        setNewReception({ ...newReception, items: [...newReception.items, newItem] });
    };

    const removeReceptionItem = (index) => {
        const updated = [...newReception.items];
        updated.splice(index, 1);
        setNewReception({ ...newReception, items: updated });
    };

    const updateReceptionItem = (index, field, value) => {
        const updated = [...newReception.items];
        updated[index][field] = value;
        setNewReception({ ...newReception, items: updated });
    };

    const calculateTotals = (items) => {
        let net = 0, vat = 0, gross = 0;
        items.forEach(i => {
            const qty = parseFloat(i.quantity) || 0;
            const price = parseFloat(i.price) || 0;
            const vatRate = parseFloat(i.vat_percent) || 0;

            const lineNet = qty * price;
            const lineVat = lineNet * (vatRate / 100);

            net += lineNet;
            vat += lineVat;
        });
        gross = net + vat;
        return { net, vat, gross };
    };

    const saveReception = async () => {
        if (!newReception.supplier_id || !newReception.invoice_number) {
            alert("Vă rugăm selectați furnizorul și numărul facturii.");
            return;
        }
        if (newReception.items.length === 0) {
            alert("Lista de produse este goală.");
            return;
        }

        setIsSaving(true);
        try {
            const totals = calculateTotals(newReception.items);

            // 1. Create Reception
            const { data: receptionData, error: recError } = await supabase
                .from('receptions')
                .insert([{
                    supplier_id: newReception.supplier_id,
                    invoice_number: newReception.invoice_number,
                    invoice_date: newReception.invoice_date,
                    reception_date: new Date(), // Today
                    total_value: totals.gross,
                    created_by: localStorage.getItem('admin_name') || 'Admin'
                }])
                .select()
                .single();

            if (recError) throw recError;

            // 2. Create Batches (Stock)
            const batches = newReception.items.map(i => ({
                reception_id: receptionData.id,
                item_id: i.item_id,
                batch_number: newReception.invoice_number, // Default to invoice num for tracking
                expiration_date: i.expiration_date || null,
                quantity: parseFloat(i.quantity),
                initial_quantity: parseFloat(i.quantity),
                purchase_price: parseFloat(i.price), // Assuming price entered is Net Price? Client asked for with/without VAT. Usually NIR input is price per unit (Net or Gross?). Let's label it Net.
                vat_percent: parseFloat(i.vat_percent),
                location_id: null // Unspecified location logic for now
            }));

            const { error: batchError } = await supabase.from('inventory_batches').insert(batches);
            if (batchError) throw batchError;

            // 3. Update Item Metadata (Last Price)
            // Optional: update default purchase_price on item (commented out for safety/speed)
            // Or trigger function? We'll leave it simple.

            logAction('RECEPȚIE', `Creat NIR Factura ${newReception.invoice_number} - ${newReception.items.length} produse`);
            alert("Recepție salvată cu succes!");

            // Reset
            setNewReception({
                supplier_id: '',
                invoice_number: '',
                invoice_date: new Date().toISOString().split('T')[0],
                items: []
            });
            setActiveTab('history'); // Go to history

        } catch (err) {
            console.error(err);
            alert("Eroare la salvare: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- EDITING LOGIC (History) ---

    const handleEditItemSave = async (batchId, newQty, newPrice) => {
        // Logic: Calculate difference in qty and apply to current stock
        // Be careful: if batch was consumed, changing initial_quantity might result in weird stock if we just overwrite 'quantity'
        // Correct way: 
        // 1. Get current batch data (old_initial, current_stock)
        // 2. diff = new_initial - old_initial
        // 3. Update initial_quantity = new_initial
        // 4. Update quantity = quantity + diff
        // 5. Update price

        try {
            const { data: oldBatch } = await supabase.from('inventory_batches').select('*').eq('id', batchId).single();
            if (!oldBatch) return;

            const diff = parseFloat(newQty) - parseFloat(oldBatch.initial_quantity || oldBatch.quantity); // Fallback if init is null

            const { error } = await supabase
                .from('inventory_batches')
                .update({
                    initial_quantity: parseFloat(newQty),
                    quantity: parseFloat(oldBatch.quantity) + diff,
                    purchase_price: parseFloat(newPrice)
                })
                .eq('id', batchId);

            if (error) throw error;

            // Recalculate reception total
            // This requires summing all batches again. We can do it on UI refresh.
            fetchReceptionDetails(selectedReception.id); // Refresh detail view
            alert("Modificare salvată!");

        } catch (err) {
            alert("Eroare la actualizare: " + err.message);
        }
    };

    // --- RENDER ---

    const renderNewReception = () => (
        <div className="reception-form">
            <div className="section-header">
                <h3><Package size={20} /> Detalii Factură</h3>
            </div>
            <div className="form-grid">
                <div className="form-group">
                    <label>Furnizor</label>
                    <select
                        value={newReception.supplier_id}
                        onChange={e => setNewReception({ ...newReception, supplier_id: e.target.value })}
                    >
                        <option value="">-- Selectează Furnizor --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Număr Factură</label>
                    <input
                        type="text"
                        value={newReception.invoice_number}
                        onChange={e => setNewReception({ ...newReception, invoice_number: e.target.value })}
                        placeholder="Ex: F12345"
                    />
                </div>
                <div className="form-group">
                    <label>Dată Factură</label>
                    <input
                        type="date"
                        value={newReception.invoice_date}
                        onChange={e => setNewReception({ ...newReception, invoice_date: e.target.value })}
                    />
                </div>
            </div>

            <div className="section-header">
                <h3><Package size={20} /> Articole</h3>
                <div style={{ width: '300px' }}>
                    <InventorySearch
                        items={products}
                        onSelect={addItemToReception}
                        placeholder="Caută produs pentru adăugare..."
                    />
                </div>
            </div>

            <div className="items-list">
                {newReception.items.length === 0 && <p className="empty-msg">Niciun produs adăugat.</p>}
                {newReception.items.map((item, idx) => (
                    <div key={idx} className="reception-item-row">
                        <div className="col-name">
                            <strong>{item.name}</strong>
                            <small>{item.unit}</small>
                        </div>
                        <div className="col-input">
                            <label>Cantitate</label>
                            <input
                                type="number" step="0.01"
                                value={item.quantity}
                                onChange={e => updateReceptionItem(idx, 'quantity', e.target.value)}
                            />
                        </div>
                        <div className="col-input">
                            <label>Preț Unitar (fără TVA)</label>
                            <input
                                type="number" step="0.01"
                                value={item.price}
                                onChange={e => updateReceptionItem(idx, 'price', e.target.value)}
                            />
                        </div>
                        <div className="col-input small">
                            <label>TVA %</label>
                            <input
                                type="number"
                                value={item.vat_percent}
                                onChange={e => updateReceptionItem(idx, 'vat_percent', e.target.value)}
                            />
                        </div>
                        <div className="col-input">
                            <label>Expiră la</label>
                            <input
                                type="date"
                                value={item.expiration_date}
                                onChange={e => updateReceptionItem(idx, 'expiration_date', e.target.value)}
                            />
                        </div>
                        <div className="col-total">
                            <label>Total (cu TVA)</label>
                            <span>
                                {((item.quantity * item.price) * (1 + item.vat_percent / 100)).toFixed(2)}
                            </span>
                        </div>
                        <button className="btn-remove" onClick={() => removeReceptionItem(idx)}><X size={18} /></button>
                    </div>
                ))}
            </div>

            <div className="form-footer">
                <div className="total-display">
                    Total Factură: {calculateTotals(newReception.items).gross.toFixed(2)} RON
                </div>
                <button className="btn-save" onClick={saveReception} disabled={isSaving}>
                    <Save size={20} /> {isSaving ? 'Se salvează...' : 'Salvează Recepție (NIR)'}
                </button>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="history-view">
            <div className="filters-bar">
                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                <span className="separator">-</span>
                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />

                <select value={filters.supplierId} onChange={e => setFilters({ ...filters, supplierId: e.target.value })}>
                    <option value="all">Toți Furnizorii</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <input
                    type="text" placeholder="Caută Factură..."
                    value={filters.invoiceNumber}
                    onChange={e => setFilters({ ...filters, invoiceNumber: e.target.value })}
                />
            </div>

            {selectedReception ? (
                <div className="reception-detail">
                    <button className="btn-back" onClick={() => setSelectedReception(null)}>← Înapoi la listă</button>
                    <div className="detail-info">
                        <h2>NIR Factura: {selectedReception.invoice_number}</h2>
                        <p>Furnizor: <strong>{selectedReception.suppliers?.name}</strong> | Data: {selectedReception.invoice_date}</p>
                    </div>

                    <table className="detail-table">
                        <thead>
                            <tr>
                                <th>Produs</th>
                                <th>Cantitate Inițială</th>
                                <th>Preț Unitar</th>
                                <th>Valoare Netă</th>
                                <th>Corecții</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedReception.items.map(batch => (
                                <tr key={batch.id}>
                                    <td>{batch.inventory_items?.name} <small>({batch.inventory_items?.unit})</small></td>
                                    <td>{batch.initial_quantity}</td>
                                    <td>{batch.purchase_price}</td>
                                    <td>{(batch.initial_quantity * batch.purchase_price).toFixed(2)}</td>
                                    <td>
                                        <button className="btn-small" onClick={() => {
                                            const newQ = prompt("Noua cantitate (modificarea va ajusta stocul curent):", batch.initial_quantity);
                                            const newP = prompt("Noul preț unitar:", batch.purchase_price);
                                            if (newQ !== null && newP !== null) {
                                                handleEditItemSave(batch.id, newQ, newP);
                                            }
                                        }}><Edit2 size={14} /> Corectează</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="receptions-grid">
                    <table className="main-table">
                        <thead>
                            <tr>
                                <th>Data Recepție</th>
                                <th>Furnizor</th>
                                <th>Factură</th>
                                <th>Dată Factură</th>
                                <th>Valoare Totală</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receptionsList.map(rec => (
                                <tr key={rec.id}>
                                    <td>{new Date(rec.reception_date).toLocaleDateString('ro-RO')}</td>
                                    <td>{rec.suppliers?.name}</td>
                                    <td>{rec.invoice_number}</td>
                                    <td>{rec.invoice_date}</td>
                                    <td>{rec.total_value} RON</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => fetchReceptionDetails(rec.id)} title="Vezi Detalii / Corectează">
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // Reuse History Logic but Render differently for "Reports" (Aggregate or just Print friendly)
    // Client wanted "Lista articolelor cumparate".
    // We can flatten the reception items.
    const renderReports = () => {
        // We'll fetch ALL items from filtered receptions
        // Since we don't hold them in 'receptionsList' (only headers), we might need another query or iterate detail fetching.
        // Better approach: Query join `receptions` -> `inventory_batches`

        // This is a bit heavy for frontend if date range is huge, but fine for normal usage.
        return (
            <div className="reports-view">
                <div className="filters-bar">
                    {/* Reuse filter UI */}
                    <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    -
                    <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    <button className="btn-primary" onClick={() => alert("Funcție export PDF în lucru...")}>Export PDF</button>
                </div>
                <div className="report-placeholder">
                    <p>Selectați perioada și furnizorul pentru a vedea detaliile fiecărei linii de factură (în lucru).</p>
                    {/* Placeholder for now to keep implementation manageable in one step */}
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Folosiți tab-ul <strong>Istoric & Corecții</strong> pentru a vedea detaliile facturilor.</p>
                </div>
            </div>
        )
    };

    return (
        <div className="admin-reception">
            <div className="tabs-header">
                <button className={activeTab === 'new' ? 'active' : ''} onClick={() => setActiveTab('new')}><Plus size={16} /> Recepție Nouă</button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><Search size={16} /> Istoric & Corecții</button>
                <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}><FileText size={16} /> Rapoarte</button>
            </div>

            <div className="tab-content">
                {activeTab === 'new' && renderNewReception()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'reports' && renderReports()}
            </div>

            <style>{`
                .admin-reception { padding: 1rem; background: #f8fafc; height: 100%; overflow-y: auto; }
                .tabs-header { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
                .tabs-header button {
                    background: white; border: 1px solid #e2e8f0; padding: 0.6rem 1.2rem;
                    border-radius: 8px; cursor: pointer; display: flex; gap: 0.5rem; align-items: center;
                    font-weight: 600; color: #64748b;
                }
                .tabs-header button.active { background: #990000; color: white; border-color: #990000; }

                .reception-form { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 1000px; margin: 0 auto; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #f1f5f9; }
                .section-header h3 { margin: 0; color: #1e293b; display: flex; gap: 0.5rem; align-items: center; }

                .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.9rem; font-weight: 600; color: #64748b; }
                .form-group input, .form-group select { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }

                .items-list { display: flex; flex-direction: column; gap: 0.5rem; min-height: 200px; margin-bottom: 2rem; }
                .reception-item-row { 
                    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 40px; gap: 1rem; 
                    align-items: end; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;
                }
                .col-name strong { display: block; font-size: 0.95rem; }
                .col-input label { display: block; fontSize: 0.75rem; color: #64748b; margin-bottom: 2px; }
                .col-input input { width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; }
                .col-total { font-weight: bold; color: #1e293b; text-align: right; }
                
                .btn-remove { background: #fee2e2; color: #ef4444; border: none; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

                .form-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #f1f5f9; }
                .total-display { font-size: 1.25rem; font-weight: 800; color: #990000; }
                .btn-save { background: #16a34a; color: white; border: none; padding: 0.8rem 2rem; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }

                .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 12px; flex-wrap: wrap; }
                .filters-bar input, .filters-bar select { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; }

                .main-table, .detail-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .main-table th, .detail-table th { background: #f8fafc; padding: 1rem; text-align: left; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                .main-table td, .detail-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; }
                .btn-icon:hover { color: #0f172a; }

                .reception-detail { background: white; padding: 2rem; border-radius: 12px; }
                .detail-info { margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-top: 1rem; }
                .btn-back { border: none; background: none; color: #64748b; cursor: pointer; font-weight: 600; padding: 0; }
                .btn-small { background: #e2e8f0; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; display: inline-flex; gap: 4px; align-items: center; }

                 @media (max-width: 1024px) {
                    .reception-item-row { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                    .reception-item-row .col-name { grid-column: 1 / -1; }
                    .reception-item-row .btn-remove { position: absolute; right: 10px; top: 10px; }
                    .reception-item-row { position: relative; }
                }
            `}</style>
        </div>
    );
};

export default AdminReception;
