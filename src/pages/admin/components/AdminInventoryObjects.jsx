import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Plus, Search, Trash2, Edit2, FileText, Download, Box, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminInventoryObjects = () => {
    // Data
    const [objects, setObjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // All, new, used
    const [conditionFilter, setConditionFilter] = useState('All'); // All, usable, partially_usable, unusable

    // Modals
    const [showObjectModal, setShowObjectModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingObject, setEditingObject] = useState(null);

    // New Object Form state
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        location_id: '',
        quantity: 1,
        status: 'new',
        condition: ''
    });

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [objsRes, catsRes, locsRes] = await Promise.all([
                supabase.from('inventory_objects').select(`
                    *,
                    inventory_object_categories(name),
                    locations(name)
                `).order('created_at', { ascending: false }),
                supabase.from('inventory_object_categories').select('*').order('name'),
                supabase.from('locations').select('*').order('name')
            ]);

            if (objsRes.error) throw new Error('Objects: ' + objsRes.error.message);
            if (catsRes.error) throw new Error('Categories: ' + catsRes.error.message);
            if (locsRes.error) throw new Error('Locations: ' + locsRes.error.message);

            setObjects(objsRes.data);
            setCategories(catsRes.data);
            setLocations(locsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Eroare detaliată: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- CRUD Objects ---

    const handleOpenModal = (obj = null) => {
        if (obj) {
            setEditingObject(obj);
            setFormData({
                name: obj.name,
                category_id: obj.category_id,
                location_id: obj.location_id,
                quantity: obj.quantity,
                status: obj.status,
                condition: obj.condition || ''
            });
        } else {
            setEditingObject(null);
            setFormData({
                name: '',
                category_id: categories.length > 0 ? categories[0].id : '',
                location_id: locations.length > 0 ? locations[0].id : '',
                quantity: 1,
                status: 'new',
                condition: ''
            });
        }
        setShowObjectModal(true);
    };

    const handleSaveObject = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.category_id || !formData.location_id) {
            alert("Completați câmpurile obligatorii (Nume, Categorie, Locație).");
            return;
        }
        if (formData.status === 'used' && !formData.condition) {
            alert("Pentru starea 'Uzat', trebuie să selectați condiția.");
            return;
        }

        const payload = { ...formData };
        if (payload.status === 'new') payload.condition = null; // Clear condition if new

        try {
            let error;
            if (editingObject) {
                const { error: updError } = await supabase
                    .from('inventory_objects')
                    .update(payload)
                    .eq('id', editingObject.id);
                error = updError;
            } else {
                const { error: insError } = await supabase
                    .from('inventory_objects')
                    .insert([payload]);
                error = insError;
            }

            if (error) throw error;

            if (editingObject) {
                logAction('OBIECTE_INVENTAR', `Actualizat obiect: ${payload.name} (ID: ${editingObject.id})`);
            } else {
                logAction('OBIECTE_INVENTAR', `Adăugat obiect nou: ${payload.name}`);
            }

            setShowObjectModal(false);
            fetchData();
        } catch (err) {
            alert('Eroare la salvare: ' + err.message);
        }
    };

    const handleDeleteObject = async (id) => {
        if (!window.confirm("Sigur ștergeți acest obiect?")) return;
        try {
            const objToDelete = objects.find(o => o.id === id);
            const { error } = await supabase.from('inventory_objects').delete().eq('id', id);
            if (error) throw error;

            setObjects(objects.filter(o => o.id !== id));
            logAction('OBIECTE_INVENTAR', `Șters obiect: ${objToDelete?.name || id}`);
        } catch (err) {
            alert('Eroare la ștergere: ' + err.message);
        }
    };

    // --- CRUD Categories ---

    // --- CRUD Categories ---

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from('inventory_object_categories')
                    .update({ name: newCategoryName })
                    .eq('id', editingCategory.id);

                if (error) throw error;

                setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: newCategoryName } : c));
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('inventory_object_categories')
                    .insert([{ name: newCategoryName }])
                    .select()
                    .single();

                if (error) throw error;
                setCategories([...categories, data]);
            }

            if (editingCategory) {
                logAction('OBIECTE_INVENTAR', `Actualizat categorie: ${newCategoryName} (ID: ${editingCategory.id})`);
            } else {
                logAction('OBIECTE_INVENTAR', `Creat categorie nouă: ${newCategoryName}`);
            }

            setNewCategoryName('');
            setEditingCategory(null);
            // Don't close modal, maybe user wants to add more? Or close? User request "schimb categorii", implies management.
            // Let's keep it open or clear the form.
        } catch (err) {
            alert("Eroare salvare categorie: " + err.message);
        }
    };

    const handleEditCategory = (cat) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
    };

    const handleCancelEditCategory = () => {
        setEditingCategory(null);
        setNewCategoryName('');
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Sigur ștergeți această categorie? Obiectele asociate vor rămâne fără categorie.")) return;
        try {
            const { error } = await supabase
                .from('inventory_object_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));

            logAction('OBIECTE_INVENTAR', `Șters categorie: ID ${id}`);

            if (editingCategory && editingCategory.id === id) {
                handleCancelEditCategory();
            }
        } catch (err) {
            alert("Eroare ștergere categorie: " + err.message);
        }
    };

    // --- Export ---

    const exportCSV = () => {
        const headers = ["Nume", "Categorie", "Locație", "Cantitate", "Status", "Condiție"];
        const rows = filteredObjects.map(o => [
            o.name,
            o.inventory_object_categories?.name || '-',
            o.locations?.name || '-',
            o.quantity,
            o.status === 'new' ? 'Nou' : 'Uzat',
            o.condition ? translateCondition(o.condition) : '-'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "obiecte_inventar.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Raport Obiecte de Inventar", 14, 15);

        const tableColumn = ["Nume", "Categorie", "Locație", "Cantitate", "Status", "Condiție"];
        const tableRows = filteredObjects.map(o => [
            o.name,
            o.inventory_object_categories?.name || '-',
            o.locations?.name || '-',
            o.quantity,
            o.status === 'new' ? 'Nou' : 'Uzat',
            o.condition ? translateCondition(o.condition) : '-'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20
        });

        doc.save("obiecte_inventar.pdf");
    };

    // --- Helpers ---

    const translateCondition = (c) => {
        switch (c) {
            case 'usable': return 'Utilizabil';
            case 'partially_usable': return 'Parțial Utilizabil';
            case 'unusable': return 'Neutilizabil';
            default: return c;
        }
    };

    // --- Filter Logic ---

    const filteredObjects = objects.filter(item => {
        const categoryMatch = selectedCategory === 'All' || item.inventory_object_categories?.name === selectedCategory;
        const statusMatch = statusFilter === 'All' || item.status === statusFilter;
        const conditionMatch = conditionFilter === 'All' || item.condition === conditionFilter;
        const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());

        return categoryMatch && statusMatch && conditionMatch && searchMatch;
    });

    return (
        <div className="admin-inventory-objects">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Box size={28} /> Obiecte de Inventar
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowCategoryModal(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
                        <Plus size={16} /> Categorii
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Plus size={16} /> Adaugă Obiect
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Caută</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Nume obiect..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '8px 8px 8px 35px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Categorie</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}
                    >
                        <option value="All">Toate</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '100px' }}
                    >
                        <option value="All">Toate</option>
                        <option value="new">Nou</option>
                        <option value="used">Uzat</option>
                    </select>
                </div>

                {/* Show Condition Filter only if Status is not 'new'? Or always show? User asked generally. Let's show always but logic filters correctly. */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Stare</label>
                    <select
                        value={conditionFilter}
                        onChange={(e) => setConditionFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '150px' }}
                    >
                        <option value="All">Toate</option>
                        <option value="usable">Utilizabil</option>
                        <option value="partially_usable">Parțial Utilizabil</option>
                        <option value="unusable">Neutilizabil</option>
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                    <button onClick={exportCSV} title="Export CSV" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}><FileText size={18} /></button>
                    <button onClick={exportPDF} title="Export PDF" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}><Download size={18} /></button>
                </div>
            </div>

            {/* Data Table */}
            <div className="table-container" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Nume</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Categorie</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Locație</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Cantitate</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Condiție</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Se încarcă...</td></tr>
                        ) : filteredObjects.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nu au fost găsite obiecte.</td></tr>
                        ) : (
                            filteredObjects.map(obj => (
                                <tr key={obj.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{obj.name}</td>
                                    <td style={{ padding: '12px 16px' }}>{obj.inventory_object_categories?.name}</td>
                                    <td style={{ padding: '12px 16px' }}>{obj.locations?.name}</td>
                                    <td style={{ padding: '12px 16px' }}>{obj.quantity} buc</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                            background: obj.status === 'new' ? '#dcfce7' : '#f1f5f9',
                                            color: obj.status === 'new' ? '#166534' : '#64748b'
                                        }}>
                                            {obj.status === 'new' ? 'Nou' : 'Uzat'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {obj.status === 'used' ? (
                                            <span style={{
                                                fontSize: '0.8rem', color:
                                                    obj.condition === 'usable' ? '#059669' :
                                                        obj.condition === 'partially_usable' ? '#d97706' : '#dc2626'
                                            }}>
                                                {translateCondition(obj.condition)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(obj)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteObject(obj.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Object Modal */}
            {showObjectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editingObject ? 'Editare Obiect' : 'Obiect Nou'}</h3>
                        <form onSubmit={handleSaveObject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Nume Obiect</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Categorie</label>
                                    <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Locație</label>
                                    <select value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Cantitate (buc)</label>
                                <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600' }}>Status</label>
                                <div style={{ display: 'flex', gap: '2rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="radio" name="status" value="new" checked={formData.status === 'new'} onChange={() => setFormData({ ...formData, status: 'new' })} />
                                        Nou
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="radio" name="status" value="used" checked={formData.status === 'used'} onChange={() => setFormData({ ...formData, status: 'used' })} />
                                        Uzat
                                    </label>
                                </div>
                            </div>

                            {formData.status === 'used' && (
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Stare (Condiție)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="radio" name="condition" value="usable" checked={formData.condition === 'usable'} onChange={() => setFormData({ ...formData, condition: 'usable' })} />
                                            Utilizabil
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="radio" name="condition" value="partially_usable" checked={formData.condition === 'partially_usable'} onChange={() => setFormData({ ...formData, condition: 'partially_usable' })} />
                                            Parțial utilizabil
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="radio" name="condition" value="unusable" checked={formData.condition === 'unusable'} onChange={() => setFormData({ ...formData, condition: 'unusable' })} />
                                            Neutilizabil
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowObjectModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Anulează</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal - Manager Style */}
            {showCategoryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Gestiune Categorii</h3>
                            <button onClick={() => setShowCategoryModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><box-icon name='x'></box-icon> X</button>
                        </div>

                        {/* List of existing categories */}
                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem', padding: '0.5rem' }}>
                            {categories.length === 0 ? (
                                <p style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Nu există categorii.</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {categories.map(cat => (
                                        <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f1f5f9', background: editingCategory?.id === cat.id ? '#f0f9ff' : 'transparent' }}>
                                            <span style={{ fontWeight: '500' }}>{cat.name}</span>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => handleEditCategory(cat)} title="Editează" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} title="Șterge" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Add / Edit Form */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>{editingCategory ? 'Editare Categorie' : 'Adaugă Categorie Nouă'}</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Nume Categorie..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                                {editingCategory && (
                                    <button onClick={handleCancelEditCategory} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Anulează</button>
                                )}
                                <button onClick={handleSaveCategory} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: editingCategory ? '#3b82f6' : '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {editingCategory ? 'Salvează' : 'Adaugă'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventoryObjects;
