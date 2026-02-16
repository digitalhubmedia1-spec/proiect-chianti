
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Search, FileText, Calendar, Trash2, Edit2, Save, X, Printer, Filter, CheckCircle, Package, BarChart2, History } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import InventorySearch from '../../../components/common/InventorySearch'; // Reusing search component
import { logAction } from '../../../utils/adminLogger';

const AdminReception = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new', 'history', 'reports'

    // --- NEW RECEPTION STATE ---
    const [newReception, setNewReception] = useState({
        supplier_id: '',
        document_type: 'factura', // New field
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0], // Data emitere
        reception_date: new Date().toISOString().split('T')[0], // Data intrare
        items: []
    });
    const [isSaving, setIsSaving] = useState(false);

    // --- DATA FETCHING ---
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]); // All inventory items for search fallback
    const [locations, setLocations] = useState([]); // Storage locations

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
    const [editingBatch, setEditingBatch] = useState(null); // { id, quantity, price }

    // --- REPORTS STATE ---
    const [reportItems, setReportItems] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchLocations();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchReceptions();
        } else if (activeTab === 'reports') {
            fetchReportData();
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

    const fetchLocations = async () => {
        const { data } = await supabase.from('locations').select('id, name, type').order('name');
        if (data) setLocations(data);
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
            price: 0, // Net Price
            price_gross: 0, // Gross Price (display/calc)
            vat_percent: item.vat_rate || 19,
            expiration_date: '',
            location_id: locations.length > 0 ? locations[0].id : null // Default to first location
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
        const item = { ...updated[index] };

        let val = value;
        if (field === 'quantity' || field === 'price' || field === 'price_gross' || field === 'vat_percent') {
            val = parseFloat(value) || 0;
        }

        item[field] = val;

        // Auto-calc logic
        if (field === 'price') {
            // Changed Net -> Calc Gross
            item.price_gross = +(val * (1 + item.vat_percent / 100)).toFixed(4);
        } else if (field === 'price_gross') {
            // Changed Gross -> Calc Net
            item.price = +(val / (1 + item.vat_percent / 100)).toFixed(4);
        } else if (field === 'vat_percent') {
            // Changed VAT -> Recalc Gross (keeping Net constant usually preferred in B2B, but let's see)
            // Or recalc Net if we assume Gross is fixed? Usually Net is base.
            item.price_gross = +(item.price * (1 + val / 100)).toFixed(4);
        } else if (field === 'location_id') {
            item.location_id = parseInt(value) || null;
            updated[index] = item; // Update immediately for non-numeric fields logic below relies on 'val' which is fine but let's be safe
            setNewReception({ ...newReception, items: updated });
            return;
        }

        updated[index] = item;
        setNewReception({ ...newReception, items: updated });
    };

    const calculateTotals = (items) => {
        let net = 0, vat = 0, gross = 0;
        items.forEach(i => {
            const qty = i.quantity || 0;
            const price = i.price || 0; // Net
            const vatRate = i.vat_percent || 0;

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
            alert("Vă rugăm selectați furnizorul și numărul documentului.");
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
                    document_type: newReception.document_type,
                    invoice_number: newReception.invoice_number,
                    invoice_date: newReception.invoice_date,
                    reception_date: newReception.reception_date,
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
                quantity: i.quantity,
                initial_quantity: i.quantity,
                purchase_price: i.price, // Saving Net Price
                vat_percent: i.vat_percent,
                location_id: i.location_id // Selected location
            }));

            const { error: batchError } = await supabase.from('inventory_batches').insert(batches);
            if (batchError) throw batchError;

            // 3. Update Item Metadata (Last Price)
            // Optional: update default purchase_price on item (commented out for safety/speed)
            // Or trigger function? We'll leave it simple.

            logAction('RECEPȚIE', `Creat NIR (${newReception.document_type}) ${newReception.invoice_number}`);
            alert("Recepție salvată cu succes!");

            // Reset
            setNewReception({
                supplier_id: '',
                document_type: 'factura',
                invoice_number: '',
                invoice_date: new Date().toISOString().split('T')[0],
                reception_date: new Date().toISOString().split('T')[0],
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

    const handleEditItemSave = async (batchId) => {
        // Validation
        if (!editingBatch || editingBatch.id !== batchId) return;
        const newQty = editingBatch.quantity;
        const newPrice = editingBatch.price;

        if (newQty === '' || newPrice === '') {
            alert("Completați ambele valori!");
            return;
        }

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
            setEditingBatch(null); // Clear editing state
            alert("Modificare salvată!");

        } catch (err) {
            alert("Eroare la actualizare: " + err.message);
        }
    };

    const fetchReportData = async () => {
        setLoadingReport(true);
        try {
            let query = supabase
                .from('inventory_batches')
                .select(`
                    *,
                    inventory_items (name, unit),
                    receptions!inner (
                        reception_date,
                        invoice_date,
                        invoice_number,
                        document_type,
                        suppliers (name)
                    )
                `)
                .gte('receptions.reception_date', filters.startDate)
                .lte('receptions.reception_date', filters.endDate);

            if (filters.supplierId !== 'all') {
                query = query.eq('receptions.supplier_id', filters.supplierId);
            }

            // Note: to order by nested relation field, we'd typically need to do it client side or ensure indexes
            // But supabase-js might support it if referenced correctly.
            // For now, let's just get data and sort client side if needed, or rely on inserted_at default

            const { data, error } = await query;
            if (error) throw error;

            // Sort by date desc
            const sorted = (data || []).sort((a, b) => {
                const dateA = new Date(a.receptions?.reception_date || 0);
                const dateB = new Date(b.receptions?.reception_date || 0);
                return dateB - dateA;
            });

            setReportItems(sorted);
        } catch (err) {
            console.error(err);
            alert("Eroare la încărcarea raportului.");
        } finally {
            setLoadingReport(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text(`Raport Achizitii: ${filters.startDate} - ${filters.endDate}`, 14, 20);

        const tableColumn = ["Data", "Tip", "Doc", "Furnizor", "Produs", "Cant", "Pret", "Total"];
        const tableRows = [];

        reportItems.forEach(item => {
            const receptionData = item.receptions || {};
            const supplierName = receptionData.suppliers?.name || '-';
            const itemData = item.inventory_items || {};

            const row = [
                receptionData.reception_date || '-',
                receptionData.document_type || '-',
                receptionData.invoice_number || '-',
                supplierName,
                itemData.name || '-',
                `${item.initial_quantity || item.quantity} ${itemData.unit || ''}`,
                item.purchase_price || 0,
                ((item.initial_quantity || item.quantity) * (item.purchase_price || 0)).toFixed(2)
            ];
            tableRows.push(row);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        doc.save(`Raport_Achizitii_${filters.startDate}_${filters.endDate}.pdf`);
    };

    const generateCSV = () => {
        const headers = ["Data Intrare", "Data Emitere", "Tip Document", "Numar Document", "Furnizor", "Produs", "Cantitate", "Pret Unitar", "Valoare Totala"];
        const rows = reportItems.map(item => [
            item.receptions?.reception_date || '-',
            item.receptions?.invoice_date || '-',
            item.receptions?.document_type || '-',
            item.receptions?.invoice_number || '-',
            item.receptions?.suppliers?.name || '-',
            item.inventory_items?.name || '-',
            `${item.initial_quantity || item.quantity} ${item.inventory_items?.unit}`,
            item.purchase_price || 0,
            ((item.initial_quantity || item.quantity) * (item.purchase_price || 0)).toFixed(2)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Raport_Achizitii_${filters.startDate}_${filters.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- RENDER HELPERS (REDESIGNED) ---

    // Common styling classes (using inline styles for simplicity in this replacement, or scoped css)
    // We will enhance the CSS block at the bottom.

    const renderNewReception = () => (
        <div className="reception-form-card">
            <div className="card-header primary-header">
                <h3><div className="icon-circle"><FileText size={20} /></div> Detalii Document (NIR)</h3>
                <p className="helper-text">Completați detaliile de pe factură/aviz.</p>
            </div>

            <div className="form-grid-airy">
                <div className="form-group-large">
                    <label>Tip Document</label>
                    <select
                        value={newReception.document_type}
                        onChange={e => setNewReception({ ...newReception, document_type: e.target.value })}
                        className="input-large"
                    >
                        <option value="factura">Factură Fiscală</option>
                        <option value="aviz">Aviz de Însoțire (Aviz)</option>
                        <option value="proforma">Proformă</option>
                        <option value="bon">Bon Fiscal</option>
                    </select>
                </div>
                <div className="form-group-large">
                    <label>Furnizor</label>
                    <select
                        value={newReception.supplier_id}
                        onChange={e => setNewReception({ ...newReception, supplier_id: e.target.value })}
                        className="input-large"
                    >
                        <option value="">-- Alegeți Furnizorul --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group-large">
                    <label>Număr Document</label>
                    <input
                        type="text"
                        value={newReception.invoice_number}
                        onChange={e => setNewReception({ ...newReception, invoice_number: e.target.value })}
                        placeholder="Ex: 12345"
                        className="input-large"
                    />
                </div>
                <div className="form-group-large">
                    <label>Data Emitere (de pe foaie)</label>
                    <input
                        type="date"
                        value={newReception.invoice_date}
                        onChange={e => setNewReception({ ...newReception, invoice_date: e.target.value })}
                        className="input-large"
                    />
                </div>
                <div className="form-group-large">
                    <label>Data Intrare (Azi)</label>
                    <input
                        type="date"
                        value={newReception.reception_date}
                        onChange={e => setNewReception({ ...newReception, reception_date: e.target.value })}
                        className="input-large"
                    />
                </div>
            </div>

            <div className="card-header secondary-header">
                <div style={{ flex: 1 }}>
                    <h3><div className="icon-circle"><CheckCircle size={20} /></div> Produse Recepționate</h3>
                    <p className="helper-text">Căutați produsele și adăugați-le în listă. Dacă nu există, creați-le întâi în Nomenclator.</p>
                </div>
                <div className="search-wrapper-large">
                    <InventorySearch
                        items={products}
                        onSelect={addItemToReception}
                        placeholder="🔍 Caută produs (nume)..."
                    />
                </div>
            </div>

            <div className="items-container-airy">
                {newReception.items.length === 0 ? (
                    <div className="empty-state-large">
                        <Package size={48} color="#cbd5e1" />
                        <p>Nu ați adăugat încă niciun produs.</p>
                        <small>Folosiți căsuța de căutare de mai sus.</small>
                    </div>
                ) : (
                    <>
                        {/* Header Row for Items */}
                        <div className="items-header-row">
                            <div className="col-hf" style={{ flex: 2 }}>Produs</div>
                            <div className="col-hf" style={{ flex: 1.5 }}>Gestiune</div>
                            <div className="col-hf">Cantitate</div>
                            <div className="col-hf">TVA</div>
                            <div className="col-hf">Preț Fără TVA</div>
                            <div className="col-hf">Preț Cu TVA</div>
                            <div className="col-hf">Total</div>
                            <div className="col-hf" style={{ width: '40px' }}></div>
                        </div>

                        {newReception.items.map((item, idx) => (
                            <div key={idx} className="item-row-card">
                                <div className="col-name" style={{ flex: 2 }}>
                                    <strong>{item.name}</strong>
                                    <span className="unit-badge">{item.unit}</span>
                                </div>

                                <div className="col-input" style={{ flex: 1.5 }}>
                                    <select
                                        value={item.location_id || ''}
                                        onChange={e => updateReceptionItem(idx, 'location_id', e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="">Alege...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-input">
                                    <input
                                        type="number" step="any"
                                        value={item.quantity}
                                        onChange={e => updateReceptionItem(idx, 'quantity', e.target.value)}
                                        className="qty-input"
                                    />
                                </div>

                                <div className="col-input small">
                                    <select
                                        value={item.vat_percent}
                                        onChange={e => updateReceptionItem(idx, 'vat_percent', e.target.value)}
                                    >
                                        <option value="21">21%</option>
                                        <option value="11">11%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>

                                <div className="col-input">
                                    <input
                                        type="number" step="any"
                                        value={item.price}
                                        onChange={e => updateReceptionItem(idx, 'price', e.target.value)}
                                        placeholder="Net"
                                    />
                                </div>

                                <div className="col-input">
                                    <input
                                        type="number" step="any"
                                        value={item.price_gross || 0}
                                        onChange={e => updateReceptionItem(idx, 'price_gross', e.target.value)}
                                        className="gross-input"
                                        placeholder="Brut"
                                    />
                                </div>

                                <div className="col-total">
                                    {((item.quantity * item.price) * (1 + item.vat_percent / 100)).toFixed(2)} RON
                                </div>
                                <button className="btn-remove-large" onClick={() => removeReceptionItem(idx)} title="Șterge rând">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="form-footer-large">
                <div className="total-display-large">
                    <span>Total General:</span>
                    <strong className="total-amount">{calculateTotals(newReception.items).gross.toFixed(2)} RON</strong>
                </div>
                <button className="btn-save-large" onClick={saveReception} disabled={isSaving}>
                    <CheckCircle size={24} />
                    {isSaving ? 'Se procesează...' : 'SALVEAZĂ RECEPȚIA'}
                </button>
            </div>
        </div >
    );

    const renderHistory = () => (
        <div className="history-view-airy">
            <div className="filters-card">
                <h4>Filtrare Istoric</h4>
                <div className="filters-row">
                    <div className="filter-group">
                        <label>De la</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div className="filter-group">
                        <label>Până la</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                    <div className="filter-group">
                        <label>Furnizor</label>
                        <select value={filters.supplierId} onChange={e => setFilters({ ...filters, supplierId: e.target.value })}>
                            <option value="all">Toți</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-group wide">
                        <label>Caută (Factură/Aviz)</label>
                        <input
                            type="text" placeholder="Ex: F123..."
                            value={filters.invoiceNumber}
                            onChange={e => setFilters({ ...filters, invoiceNumber: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {selectedReception ? (
                <div className="reception-detail-card">
                    <div className="detail-header-row">
                        <button className="btn-back-large" onClick={() => setSelectedReception(null)}>← Înapoi</button>
                        <div className="detail-meta">
                            <h2>{selectedReception.document_type?.toUpperCase()} {selectedReception.invoice_number}</h2>
                            <p>{selectedReception.suppliers?.name} • Intrare: {new Date(selectedReception.reception_date).toLocaleDateString('ro-RO')}</p>
                        </div>
                        <div className="detail-total-badge">
                            {selectedReception.total_value} RON
                        </div>
                    </div>

                    <table className="detail-table-airy">
                        <thead>
                            <tr>
                                <th>Produs</th>
                                <th>Cantitate Inițială</th>
                                <th>Preț Unitar Net</th>
                                <th>Valoare Netă</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedReception.items.map(batch => (
                                <tr key={batch.id}>
                                    <td>
                                        <div className="prod-cell">
                                            <strong>{batch.inventory_items?.name}</strong>
                                            <small>{batch.inventory_items?.unit}</small>
                                        </div>
                                    </td>
                                    <td>
                                        {editingBatch?.id === batch.id ? (
                                            <input
                                                type="number" step="any"
                                                className="input-edit-inline"
                                                value={editingBatch.quantity}
                                                onChange={e => setEditingBatch({ ...editingBatch, quantity: e.target.value })}
                                            />
                                        ) : batch.initial_quantity}
                                    </td>
                                    <td>
                                        {editingBatch?.id === batch.id ? (
                                            <input
                                                type="number" step="any"
                                                className="input-edit-inline"
                                                value={editingBatch.price}
                                                onChange={e => setEditingBatch({ ...editingBatch, price: e.target.value })}
                                            />
                                        ) : batch.purchase_price}
                                    </td>
                                    <td>{(batch.initial_quantity * batch.purchase_price).toFixed(2)}</td>
                                    <td>
                                        {editingBatch?.id === batch.id ? (
                                            <div className="actions-inline">
                                                <button className="btn-save-inline" onClick={() => handleEditItemSave(batch.id)}>
                                                    <CheckCircle size={16} /> Salvează
                                                </button>
                                                <button className="btn-cancel-inline" onClick={() => setEditingBatch(null)}>
                                                    <X size={16} /> Renunță
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="btn-edit-action" onClick={() => {
                                                setEditingBatch({
                                                    id: batch.id,
                                                    quantity: batch.initial_quantity,
                                                    price: batch.purchase_price
                                                });
                                            }}>
                                                <Edit2 size={16} /> Corectează
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="receptions-list-card">
                    <table className="main-table-airy">
                        <thead>
                            <tr>
                                <th>Data Intrare</th>
                                <th>Tip</th>
                                <th>Nr. Doc</th>
                                <th>Data Emitere</th>
                                <th>Furnizor</th>
                                <th>Valoare Totală</th>
                                <th>Detalii</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receptionsList.map(rec => (
                                <tr key={rec.id}>
                                    <td><strong>{new Date(rec.reception_date).toLocaleDateString('ro-RO')}</strong></td>
                                    <td><span className="tag-type">{rec.document_type || 'factura'}</span></td>
                                    <td>{rec.invoice_number}</td>
                                    <td>{new Date(rec.invoice_date).toLocaleDateString('ro-RO')}</td>
                                    <td>{rec.suppliers?.name}</td>
                                    <td className="font-bold">{rec.total_value} RON</td>
                                    <td>
                                        <button className="btn-view-details" onClick={() => fetchReceptionDetails(rec.id)}>
                                            <FileText size={18} /> Deschide
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

    const renderReports = () => {
        const totalValue = reportItems.reduce((acc, item) => acc + ((item.initial_quantity || item.quantity) * (item.purchase_price || 0)), 0);

        return (
            <div className="reports-view-airy">
                <div className="reports-header-card">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label>Perioada De la</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                        </div>
                        <div className="filter-group">
                            <label>Până la</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                        </div>
                        <div className="filter-group">
                            <label>Un Anume Furnizor?</label>
                            <select value={filters.supplierId} onChange={e => setFilters({ ...filters, supplierId: e.target.value })}>
                                <option value="all">Toți Furnizorii</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="export-actions-large">
                        <button className="btn-export pdf" onClick={generatePDF} disabled={reportItems.length === 0}>
                            <Printer size={20} /> Export PDF
                        </button>
                        <button className="btn-export csv" onClick={generateCSV} disabled={reportItems.length === 0}>
                            <FileText size={20} /> Export CSV (Excel)
                        </button>
                    </div>
                </div>

                <div className="report-summary-banner">
                    Total Achiziții conform filtrelor: <strong>{totalValue.toFixed(2)} RON</strong>
                </div>

                <div className="report-results-card">
                    {loadingReport ? <p style={{ padding: '2rem', textAlign: 'center' }}>Se construiește raportul...</p> : (
                        <table className="main-table-airy compact">
                            <thead>
                                <tr>
                                    <th>Dată</th>
                                    <th>Document</th>
                                    <th>Furnizor</th>
                                    <th>Produs</th>
                                    <th>Cantitate</th>
                                    <th>Preț Unitar</th>
                                    <th>Total Linie</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.receptions?.reception_date || item.receptions?.invoice_date}</td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem' }}>
                                                {item.receptions?.document_type}<br />
                                                <strong>{item.receptions?.invoice_number}</strong>
                                            </div>
                                        </td>
                                        <td>{item.receptions?.suppliers?.name}</td>
                                        <td><strong>{item.inventory_items?.name}</strong></td>
                                        <td>{item.initial_quantity || item.quantity} {item.inventory_items?.unit}</td>
                                        <td>{item.purchase_price}</td>
                                        <td>{((item.initial_quantity || item.quantity) * (item.purchase_price || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {reportItems.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Nu există date pentru filtrele selectate.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )
    };

    return (
        <div className="admin-reception-container">
            <div className="main-tabs-nav">
                <button className={activeTab === 'new' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('new')}><Plus size={18} /> Adaugă Recepție (NIR)</button>
                <button className={activeTab === 'history' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('history')}><History size={18} /> Istoric & Corecții</button>
                <button className={activeTab === 'reports' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('reports')}><BarChart2 size={18} /> Rapoarte Detaliate</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'new' && renderNewReception()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'reports' && renderReports()}
            </div>

            <style>{`
                /* Layout global */
                .admin-reception-container { padding: 1.5rem; background: #f1f5f9; min-height: 100%; font-family: 'Inter', sans-serif; }
                
                /* Tab Navigation */
                .main-tabs-nav {
                    display: flex; gap: 1rem; margin-bottom: 2rem;
                    background: white; padding: 0.75rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .tab-btn {
                    padding: 0.8rem 1.5rem; border: none; background: transparent; 
                    font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer;
                    display: flex; gap: 0.5rem; align-items: center; border-radius: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover { background: #f8fafc; color: #334155; }
                .tab-btn.active {
                    background: #990000; color: white;
                    box-shadow: 0 4px 6px -1px rgba(153, 0, 0, 0.2);
                }

                /* --- NEW RECEPTION FORM --- */
                .reception-form-card {
                    background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    max-width: 1100px; margin: 0 auto; overflow: hidden;
                }
                .card-header { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 0.25rem; }
                .primary-header { background: #fff; }
                .secondary-header { background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
                
                .card-header h3 { margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.75rem; color: #1e293b; }
                .icon-circle { background: #f1f5f9; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #475569; }
                .helper-text { margin: 0; color: #64748b; font-size: 0.9rem; padding-left: 52px; }

                .form-grid-airy {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 2rem; padding: 2rem;
                }
                .form-group-large { display: flex; flex-direction: column; gap: 0.6rem; }
                .form-group-large label { font-size: 0.95rem; font-weight: 600; color: #334155; }
                .input-large {
                    padding: 0.9rem; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 1.05rem;
                    background: #fff; transition: border-color 0.2s;
                }
                .input-large:focus { outline: none; border-color: #990000; box-shadow: 0 0 0 3px rgba(153, 0, 0, 0.1); }

                .search-wrapper-large { min-width: 350px; }

                /* Items List Redesign */
                .items-container-airy { padding: 1rem 2rem 2rem 2rem; background: #fff; min-height: 300px; }
                .empty-state-large { 
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 4rem; color: #94a3b8; gap: 1rem; border: 2px dashed #e2e8f0; border-radius: 12px;
                }
                
                .items-header-row {
                    display: flex; gap: 1rem; padding: 0.75rem 1rem; margin-bottom: 0.5rem;
                    border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 0.85rem; text-transform: uppercase;
                }
                .col-hf { flex: 1; }

                .item-row-card {
                    display: flex; align-items: center; gap: 1rem;
                    background: white; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;
                    margin-bottom: 0.75rem; transition: all 0.2s;
                }
                .item-row-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.03); transform: translateY(-1px); }
                
                .col-name { display: flex; flex-direction: column; }
                .col-name strong { color: #0f172a; font-size: 1.05rem; margin-bottom: 2px; }
                .unit-badge { font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; align-self: flex-start; }
                
                .col-input, .col-total { flex: 1; }
                .col-input input, .col-input select {
                    width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
                }
                .qty-input { background: #fffbeb; border-color: #FCD34D; font-weight: bold; }
                .gross-input { background: #f0f9ff; border-color: #bae6fd; color: #0284c7; font-weight: bold; }
                
                .col-total { font-weight: 800; font-size: 1.1rem; color: #0f172a; text-align: right; }
                .btn-remove-large {
                    width: 40px; height: 40px; background: #fee2e2; color: #ef4444; border: none; 
                    border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s;
                }
                .btn-remove-large:hover { background: #fecaca; }

                .form-footer-large {
                    background: #1e293b; color: white; padding: 2rem;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .total-display-large { display: flex; flex-direction: column; gap: 0.5rem; }
                .total-display-large span { font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                .total-amount { font-size: 2.5rem; color: white; line-height: 1; }
                
                .btn-save-large {
                    background: #22c55e; color: white; border: none; padding: 1rem 3rem;
                    border-radius: 10px; font-size: 1.1rem; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 0.75rem;
                    box-shadow: 0 4px 6px rgba(34, 197, 94, 0.4);
                    transition: transform 0.1s, box-shadow 0.2s;
                }
                .btn-save-large:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 6px 10px rgba(34, 197, 94, 0.5); }
                .btn-save-large:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

                /* --- HISTORY / AIRY TABLE --- */
                .filters-card { background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .filters-card h4 { margin: 0 0 1rem 0; color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .filters-row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-end; }
                .filter-group { display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px; }
                .filter-group.wide { flex: 1; }
                .filter-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
                .filter-group input, .filter-group select { padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px; }

                .main-table-airy { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; }
                .main-table-airy th { padding: 1rem; text-align: left; color: #64748b; font-weight: 600; font-size: 0.9rem; background: transparent; }
                .main-table-airy tbody tr { background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: transform 0.1s; border-radius: 8px; }
                .main-table-airy tbody tr:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .main-table-airy td { padding: 1.25rem 1rem; vertical-align: middle; }
                .main-table-airy td:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
                .main-table-airy td:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
                
                .tag-type { background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .font-bold { font-weight: 700; color: #0f172a; }
                
                .btn-view-details {
                    background: #f1f5f9; color: #475569; border: none; padding: 0.6rem 1rem; 
                    border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; gap: 0.5rem; align-items: center;
                }
                .btn-view-details:hover { background: #e2e8f0; color: #0f172a; }

                /* --- REPORTS & EXPORT --- */
                .reports-header-card { 
                    background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;
                    display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 2rem;
                }
                .export-actions-large { display: flex; gap: 1rem; }
                .btn-export {
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1.5rem; border-radius: 10px;
                    border: none; color: white; font-weight: 600; font-size: 1rem; cursor: pointer;
                    transition: transform 0.1s;
                }
                .btn-export.pdf { background: #ef4444; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); }
                .btn-export.pdf:hover { background: #dc2626; transform: translateY(-2px); }
                
                .btn-export.csv { background: #22c55e; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3); }
                .btn-export.csv:hover { background: #16a34a; transform: translateY(-2px); }

                .report-summary-banner {
                    background: linear-gradient(to right, #ecfdf5, white); border-left: 5px solid #22c55e;
                    padding: 1.5rem; border-radius: 8px; font-size: 1.2rem; color: #064e3b; margin-bottom: 2rem;
                }

                /* --- DETAIL VIEW (Missing styles) --- */
                .reception-detail-card {
                    background: white; border-radius: 16px; padding: 2rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    max-width: 1000px; margin: 0 auto;
                }
                .detail-header-row {
                    display: flex; align-items: center; gap: 1.5rem;
                    margin-bottom: 2rem; padding-bottom: 1.5rem;
                    border-bottom: 2px solid #f1f5f9;
                }
                .btn-back-large {
                    padding: 0.6rem 1.2rem; background: #f1f5f9; border: none; border-radius: 8px;
                    color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;
                }
                .btn-back-large:hover { background: #e2e8f0; color: #1e293b; transform: translateX(-2px); }

                .detail-meta { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
                .detail-meta h2 { margin: 0; font-size: 1.75rem; color: #0f172a; letter-spacing: -0.5px; }
                .detail-meta p { margin: 0; color: #64748b; font-size: 1rem; }

                .detail-total-badge {
                    background: #f0fdf4; color: #166534; font-size: 1.5rem; font-weight: 800;
                    padding: 0.75rem 1.5rem; border-radius: 12px; border: 1px solid #bbf7d0;
                }

                .detail-table-airy { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; margin-top: 1rem; }
                .detail-table-airy th {
                    text-align: left; padding: 1rem; color: #94a3b8; font-size: 0.8rem; 
                    text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
                    border-bottom: 2px solid #f1f5f9;
                }
                .detail-table-airy td { padding: 1rem; background: #fff; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
                .detail-table-airy tr:last-child td { border-bottom: none; }
                
                .prod-cell { display: flex; flex-direction: column; }
                .prod-cell strong { font-size: 1.05rem; color: #334155; }
                .prod-cell small { color: #94a3b8; font-size: 0.8rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; align-self: flex-start; margin-top: 4px; }

                .btn-edit-action {
                    background: white; border: 1px solid #cbd5e1; padding: 0.5rem 1rem;
                    border-radius: 8px; color: #475569; font-weight: 600; font-size: 0.9rem;
                    cursor: pointer; display: flex; gap: 0.5rem; align-items: center;
                    transition: all 0.2s;
                }
                .btn-edit-action:hover {
                    border-color: #f59e0b; color: #d97706; background: #fffbeb;
                    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
                }

                .input-edit-inline {
                    width: 80px; padding: 0.5rem; border: 2px solid #3b82f6; border-radius: 6px;
                    font-weight: 700; color: #1e293b;
                }
                .actions-inline { display: flex; gap: 0.5rem; }
                .btn-save-inline, .btn-cancel-inline {
                    border: none; padding: 0.4rem 0.8rem; border-radius: 6px;
                    cursor: pointer; display: flex; align-items: center; gap: 0.25rem;
                    font-size: 0.85rem; font-weight: 600; color: white;
                }
                .btn-save-inline { background: #22c55e; }
                .btn-save-inline:hover { background: #16a34a; }
                .btn-cancel-inline { background: #64748b; }
                .btn-cancel-inline:hover { background: #475569; }

                @media (max-width: 1024px) {
                     .items-header-row { display: none; }
                     .item-row-card { flex-direction: column; align-items: stretch; gap: 0.5rem; padding: 1.5rem; position: relative; }
                     .btn-remove-large { position: absolute; top: 10px; right: 10px; }
                     .advanced-row { grid-template-columns: 1fr !important; }
                     .form-footer-large { flex-direction: column; gap: 1.5rem; text-align: center; }
                     .reports-header-card { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
};

export default AdminReception;
