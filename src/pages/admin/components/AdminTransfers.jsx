import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { ArrowRightLeft, Save, Search, AlertTriangle } from 'lucide-react';
import './AdminReception.css'; // Reuse existing styles for consistency

const AdminTransfers = () => {
    const [locations, setLocations] = useState([]);
    const [sourceStock, setSourceStock] = useState([]); // Available batches in source
    const [loading, setLoading] = useState(true);

    const [transferData, setTransferData] = useState({
        from_location_id: '',
        to_location_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        document_ref: '' // Optional internal ref
    });

    const [rows, setRows] = useState([
        { batch_id: '', item_name: '', quantity: '', available: 0, unit: '', expiry: '' }
    ]);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (transferData.from_location_id) {
            fetchSourceStock(transferData.from_location_id);
            // Reset rows when source changes
            setRows([{ batch_id: '', item_name: '', quantity: '', available: 0, unit: '', expiry: '' }]);
        }
    }, [transferData.from_location_id]);

    const fetchLocations = async () => {
        const { data } = await supabase.from('locations').select('*').order('name');
        setLocations(data || []);
    };

    const fetchSourceStock = async (locId) => {
        const { data, error } = await supabase
            .from('inventory_batches')
            .select(`
                id, batch_number, quantity, expiration_date, purchase_price, item_id,
                inventory_items (name, unit)
            `)
            .eq('location_id', locId)
            .gt('quantity', 0) // Only positive stock
            .order('inventory_items(name)');

        if (!error && data) {
            setSourceStock(data);
        }
    };

    const handleAddRow = () => {
        setRows([...rows, { batch_id: '', item_name: '', quantity: '', available: 0, unit: '', expiry: '' }]);
    };

    const handleRemoveRow = (index) => {
        if (rows.length === 1) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleBatchSelect = (index, batchId) => {
        const newRows = [...rows];
        const batch = sourceStock.find(b => b.id === parseInt(batchId));

        if (batch) {
            newRows[index] = {
                batch_id: batchId,
                item_name: batch.inventory_items.name,
                quantity: '',
                available: batch.quantity,
                unit: batch.inventory_items.unit,
                expiry: batch.expiration_date,
                purchase_price: batch.purchase_price, // Hidden but needed for transfer
                item_id: batch.item_id,
                batch_number: batch.batch_number
            };
        } else {
            newRows[index] = { batch_id: '', item_name: '', quantity: '', available: 0, unit: '', expiry: '' };
        }
        setRows(newRows);
    };

    const handleQuantityChange = (index, qty) => {
        const newRows = [...rows];
        const val = parseFloat(qty);
        if (val > newRows[index].available) {
            alert(`Cantitatea nu poate depăși stocul disponibil (${newRows[index].available})!`);
            newRows[index].quantity = newRows[index].available;
        } else {
            newRows[index].quantity = qty;
        }
        setRows(newRows);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!transferData.from_location_id || !transferData.to_location_id) {
            alert("Selectează ambele gestiuni!");
            return;
        }
        if (transferData.from_location_id === transferData.to_location_id) {
            alert("Gestiunea sursă și destinatară trebuie să fie diferite!");
            return;
        }

        // Validate
        for (const row of rows) {
            if (!row.batch_id || !row.quantity || parseFloat(row.quantity) <= 0) {
                alert("Completează toate liniile cu produse și cantități valide.");
                return;
            }
        }

        if (!window.confirm("Confirmi transferul?")) return;
        setLoading(true);

        try {
            for (const row of rows) {
                const qty = parseFloat(row.quantity);

                // 1. Decrement Source Batch
                // Ideally this should be a DB function/RPC to be atomic, but separate calls for now.
                // We create a generic OUT transaction for source logic, but here we explicitly update.

                // Option A: Update source batch directly
                await supabase.rpc('decrement_batch', { batch_id_input: row.batch_id, qty_input: qty });
                // Wait, I haven't defined this RPC yet. Let's stick to direct manual update for Phase 4 MVP.
                // Or better, creating a new "Split" batch logic is complex.
                // For MVP:
                // 1. Subtract from Source Batch.
                const { error: subError } = await supabase
                    .from('inventory_batches')
                    .update({ quantity: row.available - qty })
                    .eq('id', row.batch_id);

                if (subError) throw subError;

                // 2. Create/Add to Destination Batch
                // Check if destination has same batch/expiry/price for this item?
                // For full traceability, usually we create a NEW batch ID linked to the old one or reuse if identical.
                // Simpler approach: Create a NEW batch record at destination with same properties.
                const { data: newBatch, error: addError } = await supabase
                    .from('inventory_batches')
                    .insert([{
                        item_id: row.item_id,
                        location_id: transferData.to_location_id,
                        batch_number: row.batch_number,
                        expiration_date: row.expiry,
                        quantity: qty,
                        purchase_price: row.purchase_price
                    }])
                    .select()
                    .single();

                if (addError) throw addError;

                // 3. Log Transaction (TRANSFER)
                const { error: logError } = await supabase
                    .from('inventory_transactions')
                    .insert([{
                        transaction_type: 'TRANSFER',
                        item_id: row.item_id,
                        batch_id: row.batch_id, // Source batch ref or Dest? Usually we might want 2 logs (OUT from source, IN to dest)
                        // Simplified single log for Transfer:
                        from_location_id: transferData.from_location_id,
                        to_location_id: transferData.to_location_id,
                        quantity: qty,
                        reason: 'Transfer Intern',
                        document_ref: transferData.document_ref || 'Transfer Manual',
                        operator_name: localStorage.getItem('admin_name')
                    }]);

                if (logError) throw logError;
            }

            // Global Log
            await supabase.from('admin_logs').insert([{
                admin_name: localStorage.getItem('admin_name') || 'Admin',
                action: 'TRANSFER',
                details: `Transfer ${rows.length} linii din Gestiunea ${transferData.from_location_id} în ${transferData.to_location_id}`,
                created_at: new Date().toISOString()
            }]);

            alert("Transfer realizat cu succes!");
            setTransferData({
                from_location_id: '',
                to_location_id: '',
                transfer_date: new Date().toISOString().split('T')[0],
                document_ref: ''
            });
            setRows([{ batch_id: '', item_name: '', quantity: '', available: 0, unit: '', expiry: '' }]);
            fetchSourceStock(transferData.from_location_id); // Refresh source

        } catch (error) {
            console.error(error);
            alert("Eroare la transfer: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-reception-container">
            <h2 className="reception-header-title">
                <ArrowRightLeft size={32} className="text-primary" /> Transfer între Gestiuni
            </h2>

            <div className="reception-card">
                <div className="invoice-header-grid">
                    <div className="form-group">
                        <label>De la (Sursă)</label>
                        <select
                            className="form-control"
                            value={transferData.from_location_id}
                            onChange={e => setTransferData({ ...transferData, from_location_id: e.target.value })}
                        >
                            <option value="">Alege Gestiune Sursă</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Către (Destinație)</label>
                        <select
                            className="form-control"
                            value={transferData.to_location_id}
                            onChange={e => setTransferData({ ...transferData, to_location_id: e.target.value })}
                            style={{ backgroundColor: '#f0f9ff' }}
                        >
                            <option value="">Alege Gestiune Destinație</option>
                            {locations.filter(l => l.id != transferData.from_location_id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Dată Transfer</label>
                        <input
                            type="date"
                            className="form-control"
                            value={transferData.transfer_date}
                            onChange={e => setTransferData({ ...transferData, transfer_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="invoice-lines-section">
                    <div className="lines-header" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 50px' }}>
                        <div>Lot Produs (Din Sursă)</div>
                        <div>Disponibil</div>
                        <div>Cantitate Transfer</div>
                        <div>Detalii Lot</div>
                        <div></div>
                    </div>

                    {rows.map((row, index) => (
                        <div key={index} className="line-row" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 50px' }}>
                            <div>
                                <select
                                    className="form-control"
                                    value={row.batch_id}
                                    onChange={e => handleBatchSelect(index, e.target.value)}
                                    disabled={!transferData.from_location_id}
                                >
                                    <option value="">Selectează Produs/Lot...</option>
                                    {sourceStock.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.inventory_items.name} - Lot: {b.batch_number || 'N/A'} (Exp: {b.expiration_date})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ fontWeight: '600' }}>
                                {row.available} {row.unit}
                            </div>
                            <div>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    value={row.quantity}
                                    onChange={e => handleQuantityChange(index, e.target.value)}
                                />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                <div>Exp: {row.expiry}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveRow(index)} className="btn-remove-line">
                                    <ArrowRightLeft size={16} /> {/* Reuse icon just for visual */}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reception-footer">
                    <button type="button" onClick={handleAddRow} className="btn-add-line">
                        + Adaugă Linie
                    </button>
                    <div></div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSubmit} className="btn-save-reception">
                        <Save size={20} /> Finalizează Transfer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminTransfers;
