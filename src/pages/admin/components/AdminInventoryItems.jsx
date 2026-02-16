import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Trash2, Edit, Plus, X, Package, Search, Settings, Save } from 'lucide-react';

const DEFAULT_CATEGORIES = [
    { name: 'Materii Prime', label: 'Materii Prime (Ingrediente)' },
    { name: 'Ambalaje', label: 'Ambalaje & Consumabile' },
    { name: 'Bauturi', label: 'Băuturi (Bar)' },
    { name: 'Obiecte Inventar', label: 'Obiecte de Inventar (Veselă/Echipamente)' }
];

const UNITS = ['kg', 'g', 'l', 'ml', 'buc', 'porție'];

const AdminInventoryItems = () => {
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Materii Prime');
    const [searchQuery, setSearchQuery] = useState('');

    // Category Management State
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', label: '' });
    const [editingCatId, setEditingCatId] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Materii Prime',
        unit: 'kg',
        min_stock_alert: 5,
        sale_price: 0,
        vat_rate: 21,
        is_asset: false,
        responsible_person: '',
        asset_state: 'Nou'
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [activeCategory]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('inventory_categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
        } else if (data && data.length > 0) {
            setCategories(data);
            // Validate activeCategory matches one of the loaded categories
            const exists = data.find(c => c.name === activeCategory);
            if (!exists) setActiveCategory(data[0].name);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        let query = supabase
            .from('inventory_items')
            .select('*')
            .eq('category', activeCategory)
            .order('name');

        const { data, error } = await query;
        if (error) console.error('Error fetching inventory items:', error);
        else setItems(data || []);
        setLoading(false);
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            unit: item.unit,
            min_stock_alert: item.min_stock_alert || 0,
            sale_price: item.sale_price || 0,
            vat_rate: item.vat_rate || 19,
            is_asset: item.is_asset || false,
            responsible_person: item.responsible_person || '',
            asset_state: item.asset_state || 'Nou'
        });
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentItem(null);
        setFormData({
            name: '',
            category: activeCategory,
            unit: activeCategory === 'Bauturi' ? 'l' : (activeCategory === 'Materii Prime' ? 'kg' : 'buc'),
            min_stock_alert: 5,
            sale_price: 0,
            vat_rate: 21,
            is_asset: activeCategory === 'Obiecte Inventar',
            responsible_person: '',
            asset_state: 'Nou'
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ești sigur? Vor fi șterse și stocurile/tranzacțiile asociate!')) return;

        const { error } = await supabase.from('inventory_items').delete().eq('id', id);
        if (error) alert('Eroare: ' + error.message);
        else fetchItems();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for duplicates
        const { data: existing } = await supabase
            .from('inventory_items')
            .select('id')
            .ilike('name', formData.name) // Case insensitive check
            .maybeSingle();

        if (existing) {
            // If editing, it's fine if the found item is the one we are editing
            if (currentItem && existing.id === currentItem.id) {
                // proceed
            } else {
                alert(`Produsul "${formData.name}" există deja în nomenclator! Nu se acceptă duplicate.`);
                return;
            }
        }

        // Auto-detect asset flag based on category
        const isAsset = formData.category === 'Obiecte Inventar';
        const payload = { ...formData, is_asset: isAsset };

        if (currentItem) {
            const { error } = await supabase.from('inventory_items').update(payload).eq('id', currentItem.id);
            if (error) alert('Eroare: ' + error.message);
            else { setIsEditing(false); fetchItems(); }
        } else {
            const { error } = await supabase.from('inventory_items').insert([payload]);
            if (error) alert('Eroare: ' + error.message);
            else { setIsEditing(false); fetchItems(); }
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Helper for Category Manager logic
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            if (editingCatId) {
                const { error } = await supabase
                    .from('inventory_categories')
                    .update({ name: catForm.name, label: catForm.label })
                    .eq('id', editingCatId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('inventory_categories')
                    .insert([{ name: catForm.name, label: catForm.label }]);
                if (error) throw error;
            }
            fetchCategories();
            setCatForm({ name: '', label: '' });
            setEditingCatId(null);
        } catch (err) {
            alert('Eroare: ' + err.message);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Sigur ștergi această categorie? Dacă există produse asociate, acestea ar putea deveni invizibile.')) return;
        try {
            const { error } = await supabase.from('inventory_categories').delete().eq('id', id);
            if (error) throw error;
            fetchCategories();
        } catch (err) {
            alert('Eroare la ștergere: ' + err.message);
        }
    };

    const startEditCategory = (cat) => {
        setCatForm({ name: cat.name, label: cat.label });
        setEditingCatId(cat.id);
    };

    return (
        <div className="admin-inventory-items">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Nomenclator Produse Gestiune</h2>

            {/* Category Tabs */}
            {/* Category Tabs & Manager */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id || cat.name}
                            onClick={() => setActiveCategory(cat.name)}
                            style={{
                                padding: '8px 16px',
                                whiteSpace: 'nowrap',
                                borderRadius: '20px',
                                border: '1px solid #cbd5e1',
                                background: activeCategory === cat.name ? '#990000' : 'white',
                                color: activeCategory === cat.name ? 'white' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.label || cat.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setIsCategoryManagerOpen(true)}
                    style={{
                        marginLeft: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        cursor: 'pointer',
                        color: '#64748b'
                    }}
                    title="Gestionează Categorii"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Toolbar */}
            <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder={`Caută în ${activeCategory}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px', borderRadius: '8px', background: '#990000', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    <Plus size={18} /> Adaugă Articol
                </button>
            </div>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>
                <div>Denumire</div>
                <div>Unitate</div>
                <div>Alertă Stoc</div>
                {activeCategory === 'Obiecte Inventar' ? <div>Responsabil</div> : <div>Categorie</div>}
                <div style={{ textAlign: 'right' }}>Acțiuni</div>
            </div>

            {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>Se încarcă...</div> : (
                <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {filteredItems.map(item => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', background: 'white', padding: '12px 10px', borderRadius: '8px', border: '1px solid #f1f5f9', alignItems: 'center' }}>
                            <div style={{ fontWeight: '500' }}>{item.name}</div>
                            <div>
                                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{item.unit}</span>
                            </div>
                            <div style={{ color: '#eab308', fontWeight: '500' }}>{'< '}{item.min_stock_alert}</div>
                            {activeCategory === 'Obiecte Inventar' ?
                                <div>{item.responsible_person || '-'}</div> :
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.category}</div>
                            }
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => handleEdit(item)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#2563eb' }}><Edit size={16} /></button>
                                <button onClick={() => handleDelete(item.id)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Niciun articol găsit.</div>}
                </div>
            )}

            {isEditing && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{currentItem ? 'Editează Articol' : 'Articol Nou'}</h3>
                            <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Denumire Produs *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Unitate de Măsură</label>
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Alertă Stoc Minim</label>
                                    <input
                                        type="number"
                                        value={formData.min_stock_alert}
                                        onChange={e => setFormData({ ...formData, min_stock_alert: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Preț Vânzare (Estimat)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.sale_price}
                                        onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Cota TVA (%)</label>
                                    <select
                                        value={formData.vat_rate}
                                        onChange={e => setFormData({ ...formData, vat_rate: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="21">21%</option>
                                        <option value="11">11%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conditional Fields for Assets */}
                            {formData.category === 'Obiecte Inventar' && (
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Persoană Responsabilă</label>
                                        <input
                                            type="text"
                                            value={formData.responsible_person}
                                            onChange={e => setFormData({ ...formData, responsible_person: e.target.value })}
                                            placeholder="ex: Șef Sala, Bucătar Șef"
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '500' }}>Stare Inițială</label>
                                        <select
                                            value={formData.asset_state}
                                            onChange={e => setFormData({ ...formData, asset_state: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                                        >
                                            <option value="Nou">Nou</option>
                                            <option value="Uzat">Uzat</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Anulează</button>
                                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#990000', color: 'white', cursor: 'pointer' }}>Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* CATEGORY MANAGER MODAL */}
            {isCategoryManagerOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Gestionare Categorii</h3>
                            <button onClick={() => setIsCategoryManagerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        </div>

                        {/* Add/Edit Form */}
                        <form onSubmit={handleSaveCategory} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>ID Intern (Unic)</label>
                                <input
                                    type="text"
                                    placeholder="ex: Lactate"
                                    value={catForm.name}
                                    onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>Etichetă Afișată</label>
                                <input
                                    type="text"
                                    placeholder="ex: Lactate și Brânzeturi"
                                    value={catForm.label}
                                    onChange={e => setCatForm({ ...catForm, label: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <button type="submit" style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', height: '35px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {editingCatId ? <Save size={16} /> : <Plus size={16} />}
                                    {editingCatId ? 'Salvează' : 'Adaugă'}
                                </button>
                                {editingCatId && (
                                    <button type="button" onClick={() => { setEditingCatId(null); setCatForm({ name: '', label: '' }); }} style={{ marginLeft: '5px', background: 'none', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', cursor: 'pointer', height: '35px' }}>
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {categories.map(cat => (
                                <div key={cat.id || cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{cat.label || cat.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {cat.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => startEditCategory(cat)} style={{ padding: '6px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventoryItems;
