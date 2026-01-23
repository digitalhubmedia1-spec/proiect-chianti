import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import InventorySearch from '../../../components/common/InventorySearch';
import './AdminReception.css';

const AdminReception = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Invoice Header Data
    const [invoiceData, setInvoiceData] = useState({
        supplier_id: '',
        document_number: '',
        document_date: new Date().toISOString().split('T')[0],
        location_id: '' // Where are we receiving the goods? Default: Depozit
    });

    // Invoice Items (Rows)
    const [rows, setRows] = useState([
        { item_id: '', quantity: '', price: '', batch_number: '', expiration_date: '' }
    ]);

    useEffect(() => {
        fetchNomenclature();
    }, []);

    const fetchNomenclature = async () => {
        setLoading(true);
        const [supRes, locRes, itemRes] = await Promise.all([
            supabase.from('suppliers').select('*').order('name'),
            supabase.from('locations').select('*').order('name'),
            supabase.from('inventory_items').select('*').order('name')
        ]);

        if (supRes.data) setSuppliers(supRes.data);
        if (locRes.data) {
            setLocations(locRes.data);
            // Default to 'Depozit Central' if exists
            const depozit = locRes.data.find(l => l.type === 'storage');
            if (depozit) setInvoiceData(prev => ({ ...prev, location_id: depozit.id }));
        }
        if (itemRes.data) setItems(itemRes.data);
        setLoading(false);
    };

    const handleAddRow = () => {
        setRows([...rows, { item_id: '', quantity: '', price: '', batch_number: '', expiration_date: '' }]);
    };

    const handleRemoveRow = (index) => {
        if (rows.length === 1) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const getItemUnit = (itemId) => {
        const item = items.find(i => i.id === parseInt(itemId));
        return item ? item.unit : '-';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!invoiceData.supplier_id || !invoiceData.document_number || !invoiceData.location_id) {
            alert("Completează datele facturii (Furnizor, Nr, Locație)!");
            return;
        }

        // Validate Rows
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r.item_id || !r.quantity || !r.price || !r.batch_number || !r.expiration_date) {
                alert(`Rândul ${i + 1} este incomplet! Toate câmpurile (inclusiv Lot și Expirare) sunt obligatorii.`);
                return;
            }
        }

        if (!window.confirm("Confirmi recepția? Stocurile vor fi actualizate.")) return;

        setLoading(true);

        try {
            // Process each row
            for (const row of rows) {
                // 1. Create Batch (Stoc)
                const { data: batchData, error: batchError } = await supabase
                    .from('inventory_batches')
                    .insert([{
                        item_id: row.item_id,
                        location_id: invoiceData.location_id,
                        batch_number: row.batch_number,
                        expiration_date: row.expiration_date,
                        quantity: parseFloat(row.quantity),
                        purchase_price: parseFloat(row.price)
                    }])
                    .select()
                    .single();

                if (batchError) throw batchError;

                // 2. Create Transaction Log
                const { error: transError } = await supabase
                    .from('inventory_transactions')
                    .insert([{
                        transaction_type: 'IN',
                        item_id: row.item_id,
                        batch_id: batchData.id,
                        to_location_id: invoiceData.location_id,
                        quantity: parseFloat(row.quantity),
                        reason: 'Receptie Factura',
                        document_ref: `Factura ${invoiceData.document_number}`,
                        operator_name: localStorage.getItem('admin_name') || 'Admin'
                    }]);

                if (transError) throw transError;
            }

            alert("Recepție salvată cu succes!");
            // Reset Form (keep location default)
            setInvoiceData(prev => ({
                ...prev,
                document_number: '',
                supplier_id: ''
            }));
            setRows([{ item_id: '', quantity: '', price: '', batch_number: '', expiration_date: '' }]);

        } catch (error) {
            console.error(error);
            alert("Eroare la salvare: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-reception-container">
            <h2 className="reception-header-title">
                <FileText size={32} className="text-primary" /> Recepție Marfă (NIR)
            </h2>

            {loading && <p>Se încarcă nomenclatoarele...</p>}

            <form onSubmit={handleSubmit} className="reception-card">
                {/* Header Factură */}
                <div className="invoice-header-grid">
                    <div className="form-group">
                        <label>Furnizor *</label>
                        <select
                            className="form-control"
                            value={invoiceData.supplier_id}
                            onChange={(e) => setInvoiceData({ ...invoiceData, supplier_id: e.target.value })}
                        >
                            <option value="">Alege Furnizor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nr. Document *</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="ex: FF 12345"
                            value={invoiceData.document_number}
                            onChange={(e) => setInvoiceData({ ...invoiceData, document_number: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Data *</label>
                        <input
                            type="date"
                            className="form-control"
                            value={invoiceData.document_date}
                            onChange={(e) => setInvoiceData({ ...invoiceData, document_date: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Recepție în Gestiunea *</label>
                        <select
                            className="form-control"
                            value={invoiceData.location_id}
                            onChange={(e) => setInvoiceData({ ...invoiceData, location_id: e.target.value })}
                            style={{ backgroundColor: '#f0f9ff' }}
                        >
                            <option value="">Alege Gestiune</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tabel Linii */}
                <div className="invoice-lines-section">
                    <div className="lines-header">
                        <div>Articol</div>
                        <div>Cant.</div>
                        <div>Preț (RON)</div>
                        <div>Lot (Batch)</div>
                        <div>Expiră La</div>
                        <div style={{ textAlign: 'right' }}>Total Linie</div>
                        <div></div>
                    </div>

                    {rows.map((row, index) => (
                        <div key={index} className="line-row">
                            <div>
                                <InventorySearch
                                    items={items}
                                    placeholder="Caută articol..."
                                    defaultQuery={items.find(i => i.id === parseInt(row.item_id || 0))?.name || ''}
                                    onSelect={(item) => {
                                        if (item) {
                                            handleRowChange(index, 'item_id', item.id);
                                        } else {
                                            handleRowChange(index, 'item_id', '');
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    value={row.quantity}
                                    onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={row.price}
                                    onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="form-control bg-warn"
                                    placeholder="ex: LOT-A1"
                                    value={row.batch_number}
                                    onChange={(e) => handleRowChange(index, 'batch_number', e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={row.expiration_date}
                                    onChange={(e) => handleRowChange(index, 'expiration_date', e.target.value)}
                                />
                            </div>
                            <div className="line-total">
                                {(row.quantity && row.price ? (parseFloat(row.quantity) * parseFloat(row.price)).toFixed(2) : '0.00')} RON
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveRow(index)} className="btn-remove-line" title="Șterge rând">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reception-footer">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="btn-add-line"
                    >
                        <Plus size={18} /> Adaugă Linie
                    </button>
                    <div className="total-general">
                        Total General: {rows.reduce((acc, r) => acc + (parseFloat(r.quantity || 0) * parseFloat(r.price || 0)), 0).toFixed(2)} RON
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-save-reception"
                    >
                        <Save size={20} /> Salvează Recepția (NIR)
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminReception;
