import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Trash2, Edit, Plus, X, Package, Search } from 'lucide-react';

const CATEGORIES = [
    { id: 'Materii Prime', label: 'Materii Prime (Ingrediente)' },
    { id: 'Ambalaje', label: 'Ambalaje & Consumabile' },
    { id: 'Bauturi', label: 'Băuturi (Bar)' },
    { id: 'Obiecte Inventar', label: 'Obiecte de Inventar (Veselă/Echipamente)' }
];

const UNITS = ['kg', 'l', 'buc', 'porție', 'ml'];

const AdminInventoryItems = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Materii Prime');
    const [searchQuery, setSearchQuery] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Materii Prime',
        unit: 'kg',
        min_stock_alert: 5,
        is_asset: false,
        responsible_person: '',
        asset_state: 'Nou'
    });

    useEffect(() => {
        fetchItems();
    }, [activeCategory]);

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

    return (
        <div className="admin-inventory-items">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Nomenclator Produse Gestiune</h2>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '1rem' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            padding: '8px 16px',
                            whiteSpace: 'nowrap',
                            borderRadius: '20px',
                            border: '1px solid #cbd5e1',
                            background: activeCategory === cat.id ? '#990000' : 'white',
                            color: activeCategory === cat.id ? 'white' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
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
        </div>
    );
};

export default AdminInventoryItems;
