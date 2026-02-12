
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Search, Save, ChevronDown, ChevronUp } from 'lucide-react';

const EventMenuPlanner = ({ eventId }) => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [expandedMenuId, setExpandedMenuId] = useState(null);

    // New Menu State
    const [newMenuName, setNewMenuName] = useState('');
    const [newMenuPrice, setNewMenuPrice] = useState('');

    // Add Item State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeMenuForAdd, setActiveMenuForAdd] = useState(null);

    useEffect(() => {
        fetchMenus();
        fetchProducts(); // Pre-load products for autocomplete
    }, [eventId]);

    const fetchMenus = async () => {
        setLoading(true);
        // In this simplified version, we assume we create specific packages for this event
        // We'll store them in 'event_menu_packages' with a reference or a naming convention?
        // Actually, schema doesn't link package to event directly, which is a flaw if we want event-specific custom menus.
        // Let's assume we link via a naming convention "EventID: MenuName" or we need to add event_id to menu_packages.
        // CHECK SCHEMA: event_menu_packages(id, name, price). No event_id!
        // FIX: We should add event_id to event_menu_packages to allow custom menus per event.
        // For now, I will add a column via SQL or just work with global menus?
        // User wants "Configurare Meniu". Usually events have custom menus.
        // I will assume we add 'event_id' to 'event_menu_packages'.

        let { data, error } = await supabase
            .from('event_menu_packages')
            .select(`
                *,
                event_menu_items (
                    *,
                    products (name, weight, price)
                )
            `)
            .eq('event_id', eventId);

        if (error) {
            console.error("Error fetching menus", error);
        }
        setMenus(data || []);
        setLoading(false);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('id, name, price, category');
        setProducts(data || []);
    };

    const handleCreateMenu = async () => {
        if (!newMenuName) return;
        const { data, error } = await supabase.from('event_menu_packages').insert([{
            event_id: eventId,
            name: newMenuName,
            price: parseFloat(newMenuPrice || 0)
        }]).select().single();

        if (data) {
            setMenus([...menus, { ...data, event_menu_items: [] }]);
            setNewMenuName('');
            setNewMenuPrice('');
        }
    };

    const handleDeleteMenu = async (id) => {
        if (!window.confirm("Stergi acest meniu?")) return;
        await supabase.from('event_menu_packages').delete().eq('id', id);
        setMenus(menus.filter(m => m.id !== id));
    };

    const handleAddItem = async (menuId, product) => {
        const { data, error } = await supabase.from('event_menu_items').insert([{
            package_id: menuId,
            product_id: product.id,
            course_type: 'fel_principal', // Default, user can change
            quantity_per_guest: 1
        }]).select('*, products(name, weight, price)').single();

        if (data) {
            setMenus(menus.map(m => {
                if (m.id === menuId) {
                    return { ...m, event_menu_items: [...(m.event_menu_items || []), data] };
                }
                return m;
            }));
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleUpdateItem = async (itemId, updates, menuId) => {
        const { error } = await supabase.from('event_menu_items').update(updates).eq('id', itemId);
        if (!error) {
            setMenus(menus.map(m => {
                if (m.id === menuId) {
                    return {
                        ...m,
                        event_menu_items: m.event_menu_items.map(i => i.id === itemId ? { ...i, ...updates } : i)
                    };
                }
                return m;
            }));
        }
    };

    const deleteItem = async (itemId, menuId) => {
        await supabase.from('event_menu_items').delete().eq('id', itemId);
        setMenus(menus.map(m => {
            if (m.id === menuId) {
                return { ...m, event_menu_items: m.event_menu_items.filter(i => i.id !== itemId) };
            }
            return m;
        }));
    };

    // Filter products for search
    useEffect(() => {
        if (searchQuery.length > 2) {
            setSearchResults(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10));
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Configurare Meniuri Eveniment</h3>

            {/* Create Menu */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Nume Meniu (ex: Standard/Vegetarian)</label>
                    <input
                        value={newMenuName}
                        onChange={e => setNewMenuName(e.target.value)}
                        placeholder="Nume Meniu"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ width: '150px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Preț / Persoană</label>
                    <input
                        type="number"
                        value={newMenuPrice}
                        onChange={e => setNewMenuPrice(e.target.value)}
                        placeholder="RON"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
                <button onClick={handleCreateMenu} style={{ padding: '11px 20px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Plus size={18} /> Creează
                </button>
            </div>

            {/* List Menus */}
            {menus.map(menu => (
                <div key={menu.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div
                        style={{
                            background: '#f9fafb', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                        }}
                        onClick={() => setExpandedMenuId(expandedMenuId === menu.id ? null : menu.id)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {expandedMenuId === menu.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{menu.name}</span>
                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                                {menu.price} RON
                            </span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu.id); }} style={{ border: 'none', background: 'transparent', color: '#ef4444' }}>
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {expandedMenuId === menu.id && (
                        <div style={{ padding: '1.5rem' }}>
                            {/* Items List */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #eee' }}>
                                        <th style={{ padding: '8px' }}>Produs</th>
                                        <th style={{ padding: '8px' }}>Tip Servire</th>
                                        <th style={{ padding: '8px' }}>Gramaj</th>
                                        <th style={{ padding: '8px' }}>Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menu.event_menu_items && menu.event_menu_items.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '8px', fontWeight: '500' }}>{item.products?.name}</td>
                                            <td style={{ padding: '8px' }}>
                                                <select
                                                    value={item.course_type || 'fel_principal'}
                                                    onChange={(e) => handleUpdateItem(item.id, { course_type: e.target.value }, menu.id)}
                                                    style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '4px' }}
                                                >
                                                    <option value="aperitiv">Aperitiv</option>
                                                    <option value="fel_principal">Fel Principal</option>
                                                    <option value="ciorba">Ciorbă</option>
                                                    <option value="desert">Desert</option>
                                                    <option value="bautura">Băutură</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '8px' }}>{item.products?.weight}g</td>
                                            <td style={{ padding: '8px' }}>
                                                <button onClick={() => deleteItem(item.id, menu.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Add Item */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Search size={18} style={{ color: '#9ca3af' }} />
                                    <input
                                        placeholder="Caută produse pentru a adăuga..."
                                        value={activeMenuForAdd === menu.id ? searchQuery : ''}
                                        onChange={(e) => { setActiveMenuForAdd(menu.id); setSearchQuery(e.target.value); }}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                                    />
                                </div>
                                {activeMenuForAdd === menu.id && searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', border: '1px solid #ddd', borderRadius: '6px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {searchResults.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => handleAddItem(menu.id, p)}
                                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <span>{p.name} <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>({p.category})</span></span>
                                                <span style={{ fontWeight: 'bold' }}>+</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EventMenuPlanner;
