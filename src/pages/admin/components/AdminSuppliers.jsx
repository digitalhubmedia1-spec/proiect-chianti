import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Trash2, Edit, Plus, Save, X, Phone, Mail, Building } from 'lucide-react';

const AdminSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        cui: '',
        contact_name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

        if (error) console.error('Error fetching suppliers:', error);
        else setSuppliers(data || []);
        setLoading(false);
    };

    const handleEdit = (supplier) => {
        setCurrentSupplier(supplier);
        setFormData({
            name: supplier.name,
            cui: supplier.cui || '',
            contact_name: supplier.contact_name || '',
            phone: supplier.phone || '',
            email: supplier.email || ''
        });
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentSupplier(null);
        setFormData({
            name: '',
            cui: '',
            contact_name: '',
            phone: '',
            email: ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sigur dorești să ștergi acest furnizor?')) return;

        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Eroare la ștergere: ' + error.message);
        } else {
            fetchSuppliers();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Numele furnizorului este obligatoriu!');
            return;
        }

        const payload = { ...formData };

        if (currentSupplier) {
            // Update
            const { error } = await supabase
                .from('suppliers')
                .update(payload)
                .eq('id', currentSupplier.id);

            if (error) alert('Eroare la actualizare: ' + error.message);
            else {
                setIsEditing(false);
                fetchSuppliers();
            }
        } else {
            // Insert
            const { error } = await supabase
                .from('suppliers')
                .insert([payload]);

            if (error) alert('Eroare la adăugare: ' + error.message);
            else {
                setIsEditing(false);
                fetchSuppliers();
            }
        }
    };

    return (
        <div className="admin-suppliers-container">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Furnizori</h2>
                <button
                    onClick={handleAdd}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: '#e11d48', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    <Plus size={18} /> Adaugă Furnizor
                </button>
            </div>

            {loading ? (
                <div>Se încarcă...</div>
            ) : (
                <div className="suppliers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {suppliers.map(supplier => (
                        <div key={supplier.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{supplier.name}</h3>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {supplier.cui && <div><strong>CUI:</strong> {supplier.cui}</div>}
                                {supplier.contact_name && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14} /> {supplier.contact_name}</div>}
                                {supplier.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {supplier.phone}</div>}
                                {supplier.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {supplier.email}</div>}
                            </div>

                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEdit(supplier)} style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#2563eb' }}><Edit size={16} /></button>
                                <button onClick={() => handleDelete(supplier.id)} style={{ border: 'none', background: '#fef2f2', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {suppliers.length === 0 && <p>Nu există furnizori definiți.</p>}
                </div>
            )}

            {isEditing && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{currentSupplier ? 'Editează Furnizor' : 'Furnizor Nou'}</h3>
                            <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Numele Companiei *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>CUI / CIF</label>
                                <input
                                    type="text"
                                    value={formData.cui}
                                    onChange={e => setFormData({ ...formData, cui: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Persoană de Contact</label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Anulează</button>
                                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#e11d48', color: 'white', cursor: 'pointer' }}>Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSuppliers;
