import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Plus, Trash2, Edit2, Save, X, MapPin } from 'lucide-react';
// import './AdminLogs.css'; // Reusing generic admin styles if possible, else inline

const AdminDelivery = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');

    // New zone state
    const [newCity, setNewCity] = useState('');
    const [newPrice, setNewPrice] = useState('');

    const fetchZones = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .order('price', { ascending: true }); // Order by price for easier viewing

        if (error) console.error("Error fetching zones:", error);
        else setZones(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleAddZone = async (e) => {
        e.preventDefault();
        if (!newCity || !newPrice) return;

        const { data, error } = await supabase
            .from('delivery_zones')
            .insert([{ city: newCity.trim(), price: parseFloat(newPrice), active: true }])
            .select();

        if (error) {
            alert('Eroare: ' + error.message);
        } else {
            setZones([...zones, data[0]]);
            setNewCity('');
            setNewPrice('');
            logAction('LIVRARE', `Adăugat zonă: ${data[0].city} (${data[0].price} RON)`);
        }
    };

    const handleDelete = async (id, city) => {
        if (!window.confirm(`Sigur ștergi zona ${city}?`)) return;

        const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
        if (!error) {
            setZones(zones.filter(z => z.id !== id));
            logAction('LIVRARE', `Șters zonă: ${city}`);
        } else {
            alert('Eroare la ștergere.');
        }
    };

    const startEdit = (zone) => {
        setEditingId(zone.id);
        setEditPrice(zone.price);
    };

    const saveEdit = async (id, city) => {
        const { error } = await supabase
            .from('delivery_zones')
            .update({ price: parseFloat(editPrice) })
            .eq('id', id);

        if (!error) {
            setZones(zones.map(z => z.id === id ? { ...z, price: parseFloat(editPrice) } : z));
            setEditingId(null);
            logAction('LIVRARE', `Actualizat preț ${city}: -> ${editPrice} RON`);
        } else {
            alert('Eroare la actualizare.');
        }
    };

    return (
        <div className="admin-logs-container">
            <div className="actions-bar">
                <h3>Zone de Livrare</h3>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Gestionează localitățile și costurile de livrare.
                </div>
            </div>

            {/* Add New Zone Form */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} color="#16a34a" /> Adaugă Zonă Nouă
                </h4>
                <form onSubmit={handleAddZone} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Localitate</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="ex: Săbăoani"
                            value={newCity}
                            onChange={e => setNewCity(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ width: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Preț (RON)</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            value={newPrice}
                            onChange={e => setNewPrice(e.target.value)}
                            required
                            min="0"
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '0 24px',
                            height: '42px',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                    >
                        <Plus size={18} /> Adaugă Zonă
                    </button>
                </form>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Localitate</th>
                            <th>Preț Livrare (RON)</th>
                            <th style={{ textAlign: 'right' }}>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Se încarcă...</td></tr>
                        ) : zones.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Nu există zone definite.</td></tr>
                        ) : (
                            zones.map(zone => (
                                <tr key={zone.id}>
                                    <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} color="#475569" /> {zone.city}
                                    </td>
                                    <td>
                                        {editingId === zone.id ? (
                                            <input
                                                type="number"
                                                value={editPrice}
                                                onChange={e => setEditPrice(e.target.value)}
                                                className="form-control"
                                                style={{ width: '100px', padding: '4px 8px' }}
                                                autoFocus
                                            />
                                        ) : (
                                            <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 'bold', color: zone.price == 0 ? '#16a34a' : '#1e293b' }}>
                                                {zone.price} RON
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {editingId === zone.id ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => saveEdit(zone.id, zone.city)} className="icon-btn text-green" title="Salvează">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="icon-btn text-muted" title="Anulează">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => startEdit(zone)} className="icon-btn text-blue" title="Editează Preț">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(zone.id, zone.city)} className="icon-btn text-red" title="Șterge">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDelivery;
