import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { ClipboardList, Save, CheckCircle } from 'lucide-react';
import './AdminReception.css';

const AdminInventoryCheck = () => {
    const [locations, setLocations] = useState([]);
    const [locationId, setLocationId] = useState('');
    const [inventoryList, setInventoryList] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (locationId) fetchInventory(locationId);
    }, [locationId]);

    const fetchLocations = async () => {
        const { data } = await supabase.from('locations').select('*');
        setLocations(data || []);
    };

    const fetchInventory = async (locId) => {
        const { data } = await supabase
            .from('inventory_batches')
            .select(`
                id, batch_number, quantity, expiration_date,
                inventory_items (name, unit, category)
            `)
            .eq('location_id', locId)
            .gt('quantity', 0)
            .order('inventory_items(name)');

        // Add 'counted' field
        const list = data.map(item => ({
            ...item,
            counted_quantity: item.quantity, // Default to scriptic
            diff: 0
        }));
        setInventoryList(list || []);
    };

    const handleCountChange = (id, val) => {
        setInventoryList(prev => prev.map(item => {
            if (item.id === id) {
                const counted = parseFloat(val) || 0;
                return { ...item, counted_quantity: val, diff: counted - item.quantity };
            }
            return item;
        }));
    };

    const handleSave = async () => {
        const adjustments = inventoryList.filter(i => Math.abs(i.diff) > 0.001);
        if (adjustments.length === 0) return alert("Nu există diferențe de salvat.");

        if (!window.confirm(`Confirmi reglarea a ${adjustments.length} articole cu diferențe?`)) return;

        try {
            for (const adj of adjustments) {
                // 1. Update Batch
                await supabase
                    .from('inventory_batches')
                    .update({ quantity: parseFloat(adj.counted_quantity) })
                    .eq('id', adj.id);

                // 2. Log Adjustment
                await supabase.from('inventory_transactions').insert([{
                    transaction_type: 'ADJUST',
                    batch_id: adj.id,
                    from_location_id: locationId, // Context
                    quantity: adj.diff, // Can be negative or positive
                    reason: 'Inventar Fizic',
                    operator_name: localStorage.getItem('admin_name')
                }]);

                // Global Log
                await supabase.from('admin_logs').insert([{
                    admin_name: localStorage.getItem('admin_name') || 'Admin',
                    action: 'INVENTAR',
                    details: `Corecție stoc pentru ${adj.inventory_items?.name}: ${adj.diff > 0 ? '+' : ''}${adj.diff} ${adj.inventory_items?.unit}. Motiv: Inventar Fizic`,
                    created_at: new Date().toISOString()
                }]);
            }
            alert("Inventar reglat cu succes!");
            fetchInventory(locationId);
        } catch (e) {
            console.error(e);
            alert("Eroare: " + e.message);
        }
    };

    const filteredList = inventoryList.filter(i =>
        i.inventory_items.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.batch_number && i.batch_number.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="admin-reception-container">
            <h2 className="reception-header-title">
                <ClipboardList size={32} className="text-primary" /> Inventar Fizic
            </h2>

            <div className="reception-card">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <select className="form-control" style={{ maxWidth: '300px' }} value={locationId} onChange={e => setLocationId(e.target.value)}>
                        <option value="">Alege Gestiune de Inventariat</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Caută articol..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {locationId && (
                    <>
                        <div className="invoice-lines-section">
                            <div className="lines-header" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr' }}>
                                <div>Articol / Lot</div>
                                <div>Expiră</div>
                                <div>Scriptic (Sistem)</div>
                                <div>Faptic (Numărat)</div>
                                <div>Diferență</div>
                            </div>

                            {filteredList.map(item => {
                                const isDiff = Math.abs(item.diff) > 0.001;
                                return (
                                    <div key={item.id} className="line-row" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', background: isDiff ? '#fff7ed' : '#f8fafc' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{item.inventory_items.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Lot: {item.batch_number}</div>
                                        </div>
                                        <div>{item.expiration_date}</div>
                                        <div style={{ fontWeight: 'bold' }}>{item.quantity} {item.inventory_items.unit}</div>
                                        <div>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{ borderColor: isDiff ? '#f97316' : '#ddd' }}
                                                value={item.counted_quantity}
                                                onChange={e => handleCountChange(item.id, e.target.value)}
                                            />
                                        </div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            color: item.diff < 0 ? '#ef4444' : (item.diff > 0 ? '#16a34a' : '#94a3b8')
                                        }}>
                                            {item.diff > 0 ? '+' : ''}{item.diff.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button onClick={handleSave} className="btn-save-reception">
                                <CheckCircle size={20} /> Salvează Diferențele
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminInventoryCheck;
