
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Search, ChevronDown, ChevronRight, X, UtensilsCrossed, Users } from 'lucide-react';

const MENU_TYPES = [
    { key: 'invitati', label: 'Meniu Invitați', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { key: 'personal', label: 'Meniu Personal Chianti', icon: UtensilsCrossed, color: '#f59e0b', bg: '#fffbeb' }
];

const DEFAULT_CATEGORIES = [
    'Gustare Rece', 'Gustare Caldă', 'Ciorbă / Supă', 'Fel Principal',
    'Garnitură', 'Salată', 'Desert', 'Băutură', 'Altele'
];

const EventMenuPlanner = ({ eventId }) => {
    const [items, setItems] = useState([]);       // all event_menu_items for this event
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('invitati');

    // Add category state
    const [showAddCategory, setShowAddCategory] = useState(null); // menuType
    const [newCategoryName, setNewCategoryName] = useState('');

    // Search state
    const [searchState, setSearchState] = useState({ category: null, menuType: null, query: '', results: [] });
    const searchRef = useRef(null);

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        const [itemsRes, productsRes] = await Promise.all([
            supabase.from('event_menu_items')
                .select('*, products(id, name, price, category, weight)')
                .eq('event_id', eventId),
            supabase.from('products').select('id, name, price, category, weight')
        ]);
        setItems(itemsRes.data || []);
        setProducts(productsRes.data || []);
        setLoading(false);
    };

    // Get unique categories for a menu type
    const getCategories = (menuType) => {
        const cats = items
            .filter(i => i.menu_type === menuType)
            .map(i => i.category)
            .filter(Boolean);
        return [...new Set(cats)];
    };

    const getItemsForCategory = (menuType, category) => {
        return items.filter(i => i.menu_type === menuType && i.category === category);
    };

    // Add a new category (just opens the search for it)
    const handleAddCategory = (menuType) => {
        if (!newCategoryName.trim()) return;
        // Just open search for this new category - items will create the category implicitly
        setSearchState({ category: newCategoryName.trim(), menuType, query: '', results: [] });
        setNewCategoryName('');
        setShowAddCategory(null);
    };

    // Add product to a category
    const handleAddProduct = async (product, menuType, category) => {
        const { data, error } = await supabase.from('event_menu_items').insert([{
            event_id: eventId,
            product_id: product.id,
            menu_type: menuType,
            category: category,
            course_type: category.toLowerCase().replace(/\s/g, '_'),
            quantity_per_guest: 1
        }]).select('*, products(id, name, price, category, weight)').single();

        if (error) {
            alert("Eroare: " + error.message);
            return;
        }
        if (data) {
            setItems(prev => [...prev, data]);
            setSearchState({ category: null, menuType: null, query: '', results: [] });
        }
    };

    const handleDeleteItem = async (itemId) => {
        await supabase.from('event_menu_items').delete().eq('id', itemId);
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const handleDeleteCategory = async (menuType, category) => {
        if (!window.confirm(`Ștergi categoria "${category}" și toate produsele din ea?`)) return;
        const toDelete = items.filter(i => i.menu_type === menuType && i.category === category);
        for (const item of toDelete) {
            await supabase.from('event_menu_items').delete().eq('id', item.id);
        }
        setItems(prev => prev.filter(i => !(i.menu_type === menuType && i.category === category)));
    };

    // Search filtering
    const handleSearchChange = (query, menuType, category) => {
        const trimmed = query.trim().toLowerCase();
        let results = [];
        if (trimmed.length >= 1) {
            const existingProductIds = items
                .filter(i => i.menu_type === menuType && i.category === category)
                .map(i => i.product_id);
            results = products
                .filter(p => p.name.toLowerCase().includes(trimmed) && !existingProductIds.includes(p.id))
                .slice(0, 8);
        }
        setSearchState({ category, menuType, query, results });
    };

    // Close search on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchState(s => ({ ...s, results: [], query: '' }));
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se încarcă...</div>;

    // ---------- RENDER ----------

    const renderProductRow = (item) => (
        <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #f3f4f6',
            transition: 'background 0.15s'
        }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontWeight: '500', color: '#111827' }}>{item.products?.name || 'Produs necunoscut'}</span>
                {item.products?.weight && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.products.weight}g</span>
                )}
                {item.products?.price && (
                    <span style={{
                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                        background: '#f0fdf4', color: '#166534', fontWeight: '600'
                    }}>
                        {item.products.price} RON
                    </span>
                )}
            </div>
            <button onClick={() => handleDeleteItem(item.id)} style={{
                border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px'
            }}>
                <Trash2 size={16} />
            </button>
        </div>
    );

    const renderSearchInput = (menuType, category) => {
        const isActive = searchState.menuType === menuType && searchState.category === category;
        return (
            <div ref={isActive ? searchRef : null} style={{ position: 'relative', padding: '8px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} color="#9ca3af" />
                    <input
                        placeholder="Caută produs..."
                        value={isActive ? searchState.query : ''}
                        onChange={e => handleSearchChange(e.target.value, menuType, category)}
                        onFocus={() => { if (!isActive) setSearchState({ category, menuType, query: '', results: [] }); }}
                        style={{
                            flex: 1, padding: '8px', border: '1px solid #e5e7eb',
                            borderRadius: '6px', fontSize: '0.85rem', outline: 'none'
                        }}
                    />
                </div>
                {isActive && searchState.results.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: '14px', right: '14px',
                        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '240px', overflowY: 'auto'
                    }}>
                        {searchState.results.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleAddProduct(p, menuType, category)}
                                style={{
                                    padding: '10px 14px', cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                <div>
                                    <span style={{ fontWeight: '500' }}>{p.name}</span>
                                    {p.category && (
                                        <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '8px' }}>
                                            ({p.category})
                                        </span>
                                    )}
                                </div>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem',
                                    background: '#dbeafe', color: '#1e40af', fontWeight: '600'
                                }}>
                                    + Adaugă
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {isActive && searchState.query.length >= 1 && searchState.results.length === 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: '14px', right: '14px',
                        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, padding: '12px',
                        textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem'
                    }}>
                        Niciun produs găsit
                    </div>
                )}
            </div>
        );
    };

    const renderCategorySection = (menuType, category) => {
        const categoryItems = getItemsForCategory(menuType, category);
        return (
            <div key={category} style={{
                border: '1px solid #e5e7eb', borderRadius: '8px',
                marginBottom: '10px', overflow: 'hidden'
            }}>
                {/* Category Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>{category}</span>
                        <span style={{
                            padding: '1px 8px', borderRadius: '10px', fontSize: '0.7rem',
                            background: '#f3f4f6', color: '#6b7280', fontWeight: '600'
                        }}>
                            {categoryItems.length}
                        </span>
                    </div>
                    <button onClick={() => handleDeleteCategory(menuType, category)} style={{
                        border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer',
                        fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <Trash2 size={14} /> Șterge
                    </button>
                </div>

                {/* Items */}
                {categoryItems.map(renderProductRow)}

                {/* Search */}
                {renderSearchInput(menuType, category)}
            </div>
        );
    };

    const renderMenuSection = (menuType) => {
        const typeConfig = MENU_TYPES.find(t => t.key === menuType);
        const categories = getCategories(menuType);
        const totalItems = items.filter(i => i.menu_type === menuType).length;

        return (
            <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', background: typeConfig.bg,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <typeConfig.icon size={22} color={typeConfig.color} />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>{typeConfig.label}</h3>
                        <span style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem',
                            background: 'rgba(0,0,0,0.06)', color: '#374151', fontWeight: '600'
                        }}>
                            {totalItems} produse
                        </span>
                    </div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                    {/* Categories */}
                    {categories.map(cat => renderCategorySection(menuType, cat))}

                    {categories.length === 0 && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                            Nicio categorie adăugată încă. Adăugați prima categorie mai jos.
                        </div>
                    )}

                    {/* Add Category */}
                    {showAddCategory === menuType ? (
                        <div style={{
                            display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center'
                        }}>
                            <select
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 10px', borderRadius: '6px',
                                    border: '1px solid #e5e7eb', fontSize: '0.85rem'
                                }}
                            >
                                <option value="">— Selectați sau scrieți —</option>
                                {DEFAULT_CATEGORIES
                                    .filter(c => !categories.includes(c))
                                    .map(c => <option key={c} value={c}>{c}</option>)
                                }
                            </select>
                            <input
                                type="text"
                                placeholder="Sau scrieți altă categorie..."
                                value={DEFAULT_CATEGORIES.includes(newCategoryName) ? '' : newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                style={{
                                    flex: 1, padding: '8px 10px', borderRadius: '6px',
                                    border: '1px solid #e5e7eb', fontSize: '0.85rem'
                                }}
                            />
                            <button
                                onClick={() => handleAddCategory(menuType)}
                                disabled={!newCategoryName.trim()}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                                    background: newCategoryName.trim() ? '#111827' : '#d1d5db',
                                    color: 'white', cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap'
                                }}
                            >
                                Adaugă
                            </button>
                            <button onClick={() => { setShowAddCategory(null); setNewCategoryName(''); }} style={{
                                border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af'
                            }}>
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setShowAddCategory(menuType); setNewCategoryName(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                                padding: '10px 16px', borderRadius: '8px',
                                border: '1px dashed #d1d5db', background: 'transparent',
                                cursor: 'pointer', color: '#6b7280', fontSize: '0.85rem', fontWeight: '500',
                                width: '100%', justifyContent: 'center'
                            }}
                        >
                            <Plus size={16} /> Adaugă Categorie
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {MENU_TYPES.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveType(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px',
                            border: activeType === t.key ? `2px solid ${t.color}` : '1px solid #e5e7eb',
                            background: activeType === t.key ? t.bg : 'white',
                            cursor: 'pointer', fontWeight: activeType === t.key ? '700' : '500',
                            color: activeType === t.key ? t.color : '#6b7280',
                            fontSize: '0.9rem', transition: 'all 0.2s'
                        }}
                    >
                        <t.icon size={18} />
                        {t.label}
                        <span style={{
                            padding: '1px 8px', borderRadius: '10px', fontSize: '0.7rem',
                            background: activeType === t.key ? t.color : '#e5e7eb',
                            color: activeType === t.key ? 'white' : '#6b7280', fontWeight: '700'
                        }}>
                            {items.filter(i => i.menu_type === t.key).length}
                        </span>
                    </button>
                ))}
            </div>

            {renderMenuSection(activeType)}
        </div>
    );
};

export default EventMenuPlanner;
