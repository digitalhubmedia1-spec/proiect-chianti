
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Edit2, Trash2, MapPin, Save, X } from 'lucide-react';
import './AdminReception.css'; // Reusing generic admin styles

const AdminLocations = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'storage' // Default
    });

    const locationTypes = [
        { value: 'storage', label: 'Depozit' },
        { value: 'production', label: 'Producție (Bucătărie)' },
        { value: 'point_of_sale', label: 'Punct de Vânzare (Bar)' }
    ];

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('name');

            if (error) throw error;
            setLocations(data || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
            alert("Eroare la încărcarea gestiunilor.");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (loc = null) => {
        if (loc) {
            setEditingLocation(loc);
            setFormData({ name: loc.name, type: loc.type || 'storage' });
        } else {
            setEditingLocation(null);
            setFormData({ name: '', type: 'storage' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
        setFormData({ name: '', type: 'storage' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return alert("Numele este obligatoriu.");

        try {
            if (editingLocation) {
                // Update
                const { error } = await supabase
                    .from('locations')
                    .update({ name: formData.name, type: formData.type })
                    .eq('id', editingLocation.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('locations')
                    .insert([{ name: formData.name, type: formData.type }]);
                if (error) throw error;
            }

            fetchLocations();
            closeModal();
        } catch (error) {
            console.error("Error saving location:", error);
            alert("Eroare la salvare: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sigur dorești să ștergi această gestiune? Atenție: Dacă există stocuri asociate, ștergerea poate eșua sau cauza inconsistențe.")) return;

        try {
            const { error } = await supabase
                .from('locations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchLocations();
        } catch (error) {
            console.error("Error deleting location:", error);
            alert("Eroare la ștergere (posibil să fie folosită în alte înregistrări).");
        }
    };

    return (
        <div className="admin-reception">
            <div className="actions-bar">
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Adaugă Gestiune
                </button>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nume Gestiune</th>
                            <th>Tip</th>
                            <th style={{ textAlign: 'right' }}>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Se încarcă...</td></tr>
                        ) : locations.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Nu există gestiuni definite.</td></tr>
                        ) : (
                            locations.map(loc => (
                                <tr key={loc.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                                            <MapPin size={16} color="#475569" />
                                            {loc.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${loc.type === 'storage' ? 'pending' : 'completed'}`} style={{ textTransform: 'capitalize' }}>
                                            {locationTypes.find(t => t.value === loc.type)?.label || loc.type}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-icon edit" onClick={() => openModal(loc)} title="Editează">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(loc.id)} title="Șterge">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingLocation ? 'Editează Gestiune' : 'Adaugă Gestiune Nouă'}</h3>
                            <button className="close-btn" onClick={closeModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nume Gestiune</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Depozit Central, Bar..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Tip Gestiune</label>
                                <select
                                    className="form-control"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {locationTypes.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>
                                    Tipul ajută la organizarea fluxurilor (ex: producție vs vânzare).
                                </small>
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Anulează</button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> Salvează
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLocations;
