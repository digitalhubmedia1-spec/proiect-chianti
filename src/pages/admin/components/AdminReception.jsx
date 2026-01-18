import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Save, Calendar, Search, FileText } from 'lucide-react';

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
        <div className="admin-reception p-4 bg-gray-50 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-blue-600" /> Recepție Marfă (NIR)
            </h2>

            {loading && <p>Se încarcă nomenclatoarele...</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {/* Header Factură */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Furnizor *</label>
                        <select
                            className="w-full p-2 border rounded-lg"
                            value={invoiceData.supplier_id}
                            onChange={(e) => setInvoiceData({ ...invoiceData, supplier_id: e.target.value })}
                        >
                            <option value="">Alege Furnizor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nr. Document *</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            placeholder="ex: FF 12345"
                            value={invoiceData.document_number}
                            onChange={(e) => setInvoiceData({ ...invoiceData, document_number: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-lg"
                            value={invoiceData.document_date}
                            onChange={(e) => setInvoiceData({ ...invoiceData, document_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recepție în Gestiunea *</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-blue-50"
                            value={invoiceData.location_id}
                            onChange={(e) => setInvoiceData({ ...invoiceData, location_id: e.target.value })}
                        >
                            <option value="">Alege Gestiune</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tabel Linii */}
                <div className="mb-4">
                    <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-gray-500 text-sm px-2">
                        <div className="col-span-3">Articol</div>
                        <div className="col-span-1">Cant.</div>
                        <div className="col-span-1">Preț (RON)</div>
                        <div className="col-span-2">Lot (Batch)</div>
                        <div className="col-span-2">Expiră La</div>
                        <div className="col-span-2">Total Linie</div>
                        <div className="col-span-1"></div>
                    </div>

                    {rows.map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center bg-gray-50 p-2 rounded-lg">
                            <div className="col-span-3">
                                <select
                                    className="w-full p-2 border rounded"
                                    value={row.item_id}
                                    onChange={(e) => handleRowChange(index, 'item_id', e.target.value)}
                                >
                                    <option value="">Selectează...</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="0"
                                    value={row.quantity}
                                    onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="0.00"
                                    value={row.price}
                                    onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded bg-yellow-50"
                                    placeholder="ex: LOT-A1"
                                    value={row.batch_number}
                                    onChange={(e) => handleRowChange(index, 'batch_number', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded bg-red-50"
                                    value={row.expiration_date}
                                    onChange={(e) => handleRowChange(index, 'expiration_date', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 font-bold text-right px-2">
                                {(row.quantity && row.price ? (parseFloat(row.quantity) * parseFloat(row.price)).toFixed(2) : '0.00')} RON
                            </div>
                            <div className="col-span-1 text-center">
                                <button type="button" onClick={() => handleRemoveRow(index)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg"
                    >
                        <Plus size={18} /> Adaugă Linie
                    </button>
                    <div className="text-xl font-bold">
                        Total General: {rows.reduce((acc, r) => acc + (parseFloat(r.quantity || 0) * parseFloat(r.price || 0)), 0).toFixed(2)} RON
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200"
                    >
                        <Save size={20} /> Salvează Recepția (NIR)
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminReception;
