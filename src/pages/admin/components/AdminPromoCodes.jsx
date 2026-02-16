import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Trash2, Plus, Tag } from 'lucide-react';

const AdminPromoCodes = () => {
    const [codes, setCodes] = useState([]);
    const [newCode, setNewCode] = useState({ code: '', discount_percent: '', expires_at: '' });
    const [loading, setLoading] = useState(true);

    const fetchCodes = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setCodes(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleAddCode = async (e) => {
        e.preventDefault();
        if (!newCode.code || !newCode.discount_percent) return;

        const { data, error } = await supabase
            .from('promo_codes')
            .insert([{
                code: newCode.code.toUpperCase().trim(),
                discount_percent: parseInt(newCode.discount_percent),
                expires_at: newCode.expires_at || null,
                active: true
            }])
            .select();

        if (error) {
            alert('Eroare: ' + error.message);
        } else {
            setCodes([data[0], ...codes]);
            setNewCode({ code: '', discount_percent: '', expires_at: '' });
            logAction('PROMO', `Cod nou: ${newCode.code.toUpperCase()} (-${newCode.discount_percent}%)`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Ștergi acest cod?')) return;
        const { error } = await supabase.from('promo_codes').delete().eq('id', id);
        if (!error) {
            setCodes(codes.filter(c => c.id !== id));
            logAction('PROMO', `Cod șters #${id}`);
        }
    };

    const toggleActive = async (id, currentStatus) => {
        const { error } = await supabase.from('promo_codes').update({ active: !currentStatus }).eq('id', id);
        if (!error) {
            setCodes(codes.map(c => c.id === id ? { ...c, active: !currentStatus } : c));
            logAction('PROMO', `Cod #${id} ${!currentStatus ? 'activat' : 'dezactivat'}`);
        }
    };

    return (
        <div className="admin-promo-codes">
            <h3>Administrare Coduri de Reducere</h3>

            <div className="add-code-form mb-4 p-4 border rounded bg-light">
                <h4>Adaugă Cod Nou</h4>
                <form onSubmit={handleAddCode} className="form-row three-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Cod (ex: WINTER10)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newCode.code}
                            onChange={e => setNewCode({ ...newCode, code: e.target.value })}
                            placeholder="Cod..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Procent Reducere (%)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={newCode.discount_percent}
                            onChange={e => setNewCode({ ...newCode, discount_percent: e.target.value })}
                            placeholder="10"
                            min="1" max="100"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Expiră la (Opțional)</label>
                        <input
                            type="date"
                            className="form-control"
                            value={newCode.expires_at}
                            onChange={e => setNewCode({ ...newCode, expires_at: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary"><Plus size={18} /> Adaugă</button>
                </form>
            </div>

            <div className="codes-list">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Cod</th>
                            <th>Reducere</th>
                            <th>Expiră</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {codes.map(code => (
                            <tr key={code.id} style={{ opacity: code.active ? 1 : 0.6 }}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={code.active}
                                        onChange={() => toggleActive(code.id, code.active)}
                                        title="Activează/Dezactivează"
                                    />
                                </td>
                                <td><strong>{code.code}</strong></td>
                                <td>{code.discount_percent}%</td>
                                <td>{code.expires_at ? new Date(code.expires_at).toLocaleDateString('ro-RO') : 'Niciodată'}</td>
                                <td>
                                    <button className="btn-icon delete" onClick={() => handleDelete(code.id)}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {codes.length === 0 && (
                            <tr><td colSpan="5" className="text-center">Nu există coduri definite.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPromoCodes;
