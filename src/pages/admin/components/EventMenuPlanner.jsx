
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { Plus, Trash2, Search, X, UtensilsCrossed, Users, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const sanitize = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ț/g, 't').replace(/Ț/g, 'T').replace(/ș/g, 's').replace(/Ș/g, 'S') : '';

const MENU_TYPES = [
    { key: 'invitati', label: 'Meniu Invitați', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { key: 'personal', label: 'Meniu Personal Chianti', icon: UtensilsCrossed, color: '#f59e0b', bg: '#fffbeb' }
];

const DEFAULT_CATEGORIES = [
    'Gustare Rece', 'Gustare Caldă', 'Ciorbă / Supă', 'Fel Principal',
    'Garnitură', 'Salată', 'Desert', 'Băutură', 'Altele'
];

const EventMenuPlanner = ({ eventId }) => {
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('invitati');

    // Pending categories (added but no items yet)
    const [pendingCategories, setPendingCategories] = useState({ invitati: [], personal: [] });

    // Add category UI
    const [showAddCategory, setShowAddCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Per-category search
    const [activeSearch, setActiveSearch] = useState(null); // "menuType|category"
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef(null);

    useEffect(() => { loadData(); }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        const [itemsRes, productsRes] = await Promise.all([
            supabase.from('event_menu_items')
                .select('*, products(id, name, price, category, weight, image, description)')
                .eq('event_id', eventId),
            supabase.from('products')
                .select('id, name, price, category, weight, image, description')
                .eq('is_active', true)
                .range(0, 9999)
        ]);
        console.log('Produse încărcate:', productsRes.data?.length, 'Eroare:', productsRes.error);
        setItems(itemsRes.data || []);
        setProducts(productsRes.data || []);
        setLoading(false);
    };

    // All categories for a menu type (from items + pending)
    const getAllCategories = (menuType) => {
        const fromItems = items
            .filter(i => i.menu_type === menuType)
            .map(i => i.category)
            .filter(Boolean);
        const pending = pendingCategories[menuType] || [];
        return [...new Set([...fromItems, ...pending])];
    };

    const getItemsForCategory = (menuType, category) =>
        items.filter(i => i.menu_type === menuType && i.category === category);

    // Add category
    const handleAddCategory = (menuType) => {
        const name = newCategoryName.trim();
        if (!name) return;
        const existing = getAllCategories(menuType);
        if (existing.includes(name)) {
            setNewCategoryName('');
            setShowAddCategory(null);
            return;
        }
        setPendingCategories(prev => ({
            ...prev,
            [menuType]: [...(prev[menuType] || []), name]
        }));
        setNewCategoryName('');
        setShowAddCategory(null);
        // Auto-open search for the new category
        setActiveSearch(`${menuType}|${name}`);
        setSearchQuery('');
    };

    // Delete category
    const handleDeleteCategory = async (menuType, category) => {
        if (!window.confirm(`Ștergi categoria "${category}" și toate produsele din ea?`)) return;
        const toDelete = items.filter(i => i.menu_type === menuType && i.category === category);
        for (const item of toDelete) {
            await supabase.from('event_menu_items').delete().eq('id', item.id);
        }
        setItems(prev => prev.filter(i => !(i.menu_type === menuType && i.category === category)));
        // Also remove from pending
        setPendingCategories(prev => ({
            ...prev,
            [menuType]: (prev[menuType] || []).filter(c => c !== category)
        }));
    };

    // Add product
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
            // Remove from pending since it now has items
            setPendingCategories(prev => ({
                ...prev,
                [menuType]: (prev[menuType] || []).filter(c => c !== category)
            }));
            setSearchQuery('');
            // Keep search open for adding more products
        }
    };

    const handleDeleteItem = async (itemId) => {
        await supabase.from('event_menu_items').delete().eq('id', itemId);
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    // Filtered products for search
    const getFilteredProducts = (menuType, category) => {
        if (searchQuery.length < 1) return [];
        const existingIds = getItemsForCategory(menuType, category).map(i => i.product_id);
        return products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !existingIds.includes(p.id))
            .slice(0, 10);
    };

    // Close search on outside click
    useEffect(() => {
        const handle = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setActiveSearch(null);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se încarcă...</div>;

    // ============ PDF EXPORT ============
    const getBase64ImageFromUrl = async (imageUrl) => {
        if (!imageUrl) return null;
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Error loading image", e);
            return null;
        }
    };

    const exportMenuPDF = async (menuType) => {
        const typeConfig = MENU_TYPES.find(t => t.key === menuType);
        const categories = getAllCategories(menuType);
        if (categories.length === 0) {
            alert('Nu există categorii de exportat.');
            return;
        }

        const loadingToast = document.createElement('div');
        loadingToast.innerText = 'Se generează PDF-ul...';
        loadingToast.style.position = 'fixed';
        loadingToast.style.bottom = '20px';
        loadingToast.style.right = '20px';
        loadingToast.style.background = '#333';
        loadingToast.style.color = '#fff';
        loadingToast.style.padding = '12px 24px';
        loadingToast.style.borderRadius = '8px';
        loadingToast.style.zIndex = '9999';
        document.body.appendChild(loadingToast);

        try {
            const doc = new jsPDF();
            doc.setFont('helvetica');
            doc.setFontSize(18);
            doc.setTextColor(153, 0, 0);
            doc.text(sanitize(typeConfig.label), 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const totalItems = items.filter(i => i.menu_type === menuType).length;
            doc.text(sanitize(`Total: ${totalItems} produse | Generat: ${new Date().toLocaleString('ro-RO')}`), 14, 28);

            let startY = 36;

            for (const category of categories) {
                const categoryItems = getItemsForCategory(menuType, category);
                if (categoryItems.length === 0) continue;

                const tableData = [];
                for (let i = 0; i < categoryItems.length; i++) {
                    const item = categoryItems[i];
                    const p = item.products || {};
                    
                    let imgData = null;
                    if (p.image) {
                        imgData = await getBase64ImageFromUrl(p.image);
                    }

                    let weightStr = '-';
                    if (p.weight) {
                        const w = String(p.weight);
                        weightStr = w.toLowerCase().endsWith('g') ? w : w + 'g';
                    }

                    tableData.push({
                        index: i + 1,
                        image: imgData,
                        name: sanitize(p.name || '-'),
                        description: sanitize(p.description || '-'),
                        weight: weightStr,
                        price: p.price != null ? p.price + ' RON' : '-'
                    });
                }

                autoTable(doc, {
                    head: [[
                        { content: sanitize(category), colSpan: 6, styles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold', fontSize: 11 } }
                    ], [
                        'Nr.', 'Imagine', 'Produs', 'Descriere', 'Gramaj', 'Preț'
                    ]],
                    body: tableData.map(row => [
                        row.index,
                        '', 
                        row.name,
                        row.description,
                        row.weight,
                        row.price
                    ]),
                    startY: startY,
                    styles: { fontSize: 10, cellPadding: 4, font: 'helvetica', valign: 'middle', overflow: 'linebreak' },
                    headStyles: { fillColor: [153, 0, 0] },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        1: { cellWidth: 25, minCellHeight: 20 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 'auto' },
                        4: { cellWidth: 20, halign: 'center' },
                        5: { cellWidth: 25, halign: 'right' }
                    },
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.column.index === 1) {
                            const rowIdx = data.row.index;
                            const imgData = tableData[rowIdx]?.image;
                            if (imgData) {
                                try {
                                    doc.addImage(imgData, 'JPEG', data.cell.x + 2, data.cell.y + 2, 21, 16);
                                } catch (err) {
                                    // ignore
                                }
                            }
                        }
                    }
                });

                startY = doc.lastAutoTable.finalY + 10;

                if (startY > 250) {
                    doc.addPage();
                    startY = 20;
                }
            }

            doc.save(sanitize(`meniu_${typeConfig.label.replace(/\s+/g, '_').toLowerCase()}_${eventId}.pdf`));
        } catch (error) {
            console.error(error);
            alert('Eroare la generarea PDF: ' + error.message);
        } finally {
            if (document.body.contains(loadingToast)) {
                document.body.removeChild(loadingToast);
            }
        }
    };

    // ============ RENDER ============

    const renderProductRow = (item) => (
        <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #f3f4f6'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontWeight: '500', color: '#111827' }}>{item.products?.name || '—'}</span>
                {item.products?.weight && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.products.weight}g</span>
                )}
                {item.products?.price != null && (
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

    const renderCategorySection = (menuType, category) => {
        const categoryItems = getItemsForCategory(menuType, category);
        const searchKey = `${menuType}|${category}`;
        const isSearchActive = activeSearch === searchKey;
        const filteredProducts = isSearchActive ? getFilteredProducts(menuType, category) : [];

        return (
            <div key={category} style={{
                border: '1px solid #e5e7eb', borderRadius: '8px',
                marginBottom: '10px', position: 'relative'
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
                            {categoryItems.length} produse
                        </span>
                    </div>
                    <button onClick={() => handleDeleteCategory(menuType, category)} style={{
                        border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer',
                        fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <Trash2 size={14} /> Șterge
                    </button>
                </div>

                {/* Existing Items */}
                {categoryItems.map(renderProductRow)}

                {/* Search Input */}
                <div ref={isSearchActive ? searchRef : null} style={{ position: 'relative', padding: '8px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={16} color="#9ca3af" />
                        <input
                            placeholder="Caută produs pentru a adăuga..."
                            value={isSearchActive ? searchQuery : ''}
                            onChange={e => {
                                setActiveSearch(searchKey);
                                setSearchQuery(e.target.value);
                            }}
                            onFocus={() => {
                                setActiveSearch(searchKey);
                                setSearchQuery('');
                            }}
                            style={{
                                flex: 1, padding: '8px 10px', border: '1px solid #e5e7eb',
                                borderRadius: '6px', fontSize: '0.85rem', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Dropdown Results */}
                    {isSearchActive && searchQuery.length >= 1 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: '14px', right: '14px',
                            background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto'
                        }}>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleAddProduct(p, menuType, category)}
                                        style={{
                                            padding: '10px 14px', cursor: 'pointer',
                                            borderBottom: '1px solid #f3f4f6',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                    >
                                        <div>
                                            <span style={{ fontWeight: '500' }}>{p.name}</span>
                                            {p.category && (
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '8px' }}>
                                                    ({p.category})
                                                </span>
                                            )}
                                            {p.weight && (
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '4px' }}>
                                                    {p.weight}g
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem',
                                            background: '#111827', color: 'white', fontWeight: '600'
                                        }}>
                                            + Adaugă
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                    Niciun produs găsit pentru „{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMenuSection = (menuType) => {
        const typeConfig = MENU_TYPES.find(t => t.key === menuType);
        const categories = getAllCategories(menuType);
        const totalItems = items.filter(i => i.menu_type === menuType).length;

        return (
            <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb'
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
                    <button
                        onClick={() => exportMenuPDF(menuType)}
                        disabled={totalItems === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: totalItems > 0 ? '#990000' : '#d1d5db',
                            color: 'white', cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
                            fontWeight: '600', fontSize: '0.85rem'
                        }}
                    >
                        <FileDown size={16} /> Export PDF
                    </button>
                </div>

                <div style={{ padding: '16px 20px' }}>
                    {/* Existing + Pending Categories */}
                    {categories.map(cat => renderCategorySection(menuType, cat))}

                    {categories.length === 0 && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                            Nicio categorie adăugată. Adăugați prima categorie mai jos.
                        </div>
                    )}

                    {/* Add Category Form */}
                    {showAddCategory === menuType ? (
                        <div style={{
                            display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap'
                        }}>
                            <select
                                value={DEFAULT_CATEGORIES.includes(newCategoryName) ? newCategoryName : ''}
                                onChange={e => setNewCategoryName(e.target.value)}
                                style={{
                                    minWidth: '200px', padding: '9px 10px', borderRadius: '6px',
                                    border: '1px solid #e5e7eb', fontSize: '0.85rem'
                                }}
                            >
                                <option value="">— Alegeți categorie —</option>
                                {DEFAULT_CATEGORIES
                                    .filter(c => !categories.includes(c))
                                    .map(c => <option key={c} value={c}>{c}</option>)
                                }
                            </select>
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>sau</span>
                            <input
                                type="text"
                                placeholder="Scrieți altă categorie..."
                                value={DEFAULT_CATEGORIES.includes(newCategoryName) ? '' : newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(menuType); }}
                                style={{
                                    flex: 1, minWidth: '180px', padding: '9px 10px', borderRadius: '6px',
                                    border: '1px solid #e5e7eb', fontSize: '0.85rem'
                                }}
                            />
                            <button
                                onClick={() => handleAddCategory(menuType)}
                                disabled={!newCategoryName.trim()}
                                style={{
                                    padding: '9px 18px', borderRadius: '6px', border: 'none',
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
                                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px',
                                padding: '12px 16px', borderRadius: '8px',
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
            {/* Menu Type Tabs */}
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
