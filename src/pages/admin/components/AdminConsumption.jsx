import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { MinusCircle, Save, AlertTriangle } from 'lucide-react';
import './AdminReception.css';

const REASONS = [
    'Consum Producție (Manual)',
    'Expirat / Deteriorat',
    'Protocol / Degustare',
    'Pierdere / Spart',
    'Corecție Inventar (Minus)'
];

const AdminConsumption = () => {
    const [locations, setLocations] = useState([]);
    const [locationId, setLocationId] = useState('');
    const [stock, setStock] = useState([]);

    const [rows, setRows] = useState([
        { batch_id: '', quantity: '', reason: 'Consum Producție (Manual)', available: 0, unit: '' }
    ]);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (locationId) fetchStock(locationId);
    }, [locationId]);

    const fetchLocations = async () => {
        const { data } = await supabase.from('locations').select('*').order('name');
        setLocations(data || []);
    };

    const fetchStock = async (locId) => {
        const { data } = await supabase
            .from('inventory_batches')
            .select(`
                id, batch_number, quantity, expiration_date,
                inventory_items (name, unit)
            `)
            .eq('location_id', locId)
            .gt('quantity', 0)
            .order('inventory_items(name)');
        setStock(data || []);
    };

    const handleBatchSelect = (index, batchId) => {
        const newRows = [...rows];
        const batch = stock.find(b => b.id === parseInt(batchId));
        if (batch) {
            newRows[index] = {
                ...newRows[index],
                batch_id: batchId,
                available: batch.quantity,
                unit: batch.inventory_items.unit,
                item_id: batch.item_id // Needed for log? Wait, batch has item_id
            };
        }
        setRows(newRows);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!locationId) return alert("Alege Gestiunea!");

        if (!window.confirm("Confirmi scăderea stocului? Această acțiune este ireversibilă.")) return;

        try {
            for (const row of rows) {
                if (!row.batch_id || !row.quantity) continue;
                const qty = parseFloat(row.quantity);

                // 1. Decrement Batch
                const { error: updError } = await supabase
                    .from('inventory_batches')
                    .update({ quantity: row.available - qty })
                    .eq('id', row.batch_id);

                if (updError) throw updError;

                // 2. Log Transaction (OUT)
                // Need item_id, we can get it from stock list again or fetch it.
                // Optimally we'd store it in row state. Let's assume we do via batch find or simplifiction.
                // We'll trust the batch link in transaction log if we had it, but transaction table links item_id directly usually.
                // Let's get item_id from the batch object in `stock` array.
                const batchObj = stock.find(b => b.id === parseInt(row.batch_id));

                await supabase.from('inventory_transactions').insert([{
                    transaction_type: 'OUT',
                    batch_id: row.batch_id,
                    from_location_id: locationId,
                    quantity: qty,
                    reason: row.reason,
                    operator_name: localStorage.getItem('admin_name')
                }]);
            }

            // Log to Global Logs
            await supabase.from('admin_logs').insert([{
                admin_name: localStorage.getItem('admin_name') || 'Admin',
                action: 'CONSUM',
                details: `Consum/Ieșire din gestiunea ${locationId}: ${rows.length} linii.`,
                created_at: new Date().toISOString()
            }]);

            alert("Consum înregistrat!");
            setRows([{ batch_id: '', quantity: '', reason: 'Consum Producție (Manual)', available: 0, unit: '' }]);
            fetchStock(locationId);
        } catch (error) {
            console.error(error);
            alert("Eroare: " + error.message);
        }
    };

    const handleAddRow = () => setRows([...rows, { batch_id: '', quantity: '', reason: 'Consum Producție (Manual)', available: 0, unit: '' }]);
    const handleRemoveRow = (idx) => {
        if (rows.length === 1) return;
        const newRows = [...rows];
        newRows.splice(idx, 1);
        setRows(newRows);
    };

    return (
        <div className="admin-reception-container">
            <h2 className="reception-header-title">
                <MinusCircle size={32} className="text-danger" /> Consum Manual / Ieșiri
            </h2>

            <div className="reception-card">
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label>Din Gestiunea</label>
                    <select className="form-control" value={locationId} onChange={e => setLocationId(e.target.value)}>
                        <option value="">Alege Gestiune</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>

                <div className="invoice-lines-section">
                    <div className="lines-header" style={{ gridTemplateColumns: '3fr 1fr 1fr 2fr 50px' }}>
                        <div>Lot / Produs</div>
                        <div>Stoc Curent</div>
                        <div>Cantitate Ieșită</div>
                        <div>Motiv</div>
                        <div></div>
                    </div>

                    {rows.map((row, index) => (
                        <div key={index} className="line-row" style={{ gridTemplateColumns: '3fr 1fr 1fr 2fr 50px' }}>
                            <div>
                                <select
                                    className="form-control"
                                    value={row.batch_id}
                                    onChange={e => handleBatchSelect(index, e.target.value)}
                                    disabled={!locationId}
                                >
                                    <option value="">Alege...</option>
                                    {stock.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.inventory_items.name} (Lot: {b.batch_number}) - Exp: {b.expiration_date}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ fontWeight: 'bold' }}>{row.available} {row.unit}</div>
                            <div>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={row.quantity}
                                    onChange={e => {
                                        const newRows = [...rows];
                                        newRows[index].quantity = e.target.value;
                                        setRows(newRows);
                                    }}
                                />
                            </div>
                            <div>
                                <select
                                    className="form-control"
                                    value={row.reason}
                                    onChange={e => {
                                        const newRows = [...rows];
                                        newRows[index].reason = e.target.value;
                                        setRows(newRows);
                                    }}
                                >
                                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveRow(index)} className="btn-remove-line"><MinusCircle size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reception-footer">
                    <button type="button" onClick={handleAddRow} className="btn-add-line">+ Adaugă Linie</button>
                    <button onClick={handleSubmit} className="btn-save-reception" style={{ background: '#ef4444' }}>
                        Înregistrează Ieșire
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminConsumption;
