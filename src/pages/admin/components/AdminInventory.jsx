import React, { useState } from 'react';
import { useInventory } from '../../../context/InventoryContext';
import { Plus, Trash2, Edit2, Archive, ArrowUp, ArrowDown } from 'lucide-react';

const AdminInventory = () => {
    const { categories, items, addCategory, deleteCategory, addItem, updateItem, deleteItem } = useInventory();

    // Local State for Filtering/Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Toate');
    const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, stock_asc, stock_desc

    // Modal State
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState({
        name: '',
        category: '',
        stock: '',
        unit: 'buc',
        entryDate: new Date().toISOString().split('T')[0]
    });

    const [newCategory, setNewCategory] = useState('');

    // Handlers
    const handleSort = (itemsToSort) => {
        return [...itemsToSort].sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.entryDate) - new Date(a.entryDate);
            if (sortBy === 'date_asc') return new Date(a.entryDate) - new Date(b.entryDate);
            if (sortBy === 'stock_asc') return parseFloat(a.stock) - parseFloat(b.stock);
            if (sortBy === 'stock_desc') return parseFloat(b.stock) - parseFloat(a.stock);
            return 0;
        });
    };

    const getFilteredItems = () => {
        let filtered = items;
        if (activeCategory !== 'Toate') {
            filtered = filtered.filter(i => i.category === activeCategory);
        }
        if (searchTerm) {
            filtered = filtered.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return handleSort(filtered);
    };

    const handleItemSubmit = (e) => {
        e.preventDefault();
        const payload = { ...itemForm, name: itemForm.name.toUpperCase() };
        if (editingItem) {
            updateItem(editingItem.id, payload);
        } else {
            addItem(payload);
        }
        closeModal();
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setItemForm(item);
        } else {
            setEditingItem(null);
            setItemForm({
                name: '',
                category: categories[0] || '',
                stock: '',
                unit: 'buc',
                entryDate: new Date().toISOString().split('T')[0]
            });
        }
        setShowItemModal(true);
    };

    const closeModal = () => {
        setShowItemModal(false);
        setEditingItem(null);
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (newCategory.trim()) {
            addCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    return (
        <div className="admin-inventory">
            <div className="inventory-header">
                <h2>Gestiune Stocuri</h2>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} /> Adaugă Produs
                    </button>
                </div>
            </div>

            {/* Categories & Toolbar */}
            <div className="inventory-toolbar">
                <div className="category-chips">
                    <button
                        className={`chip ${activeCategory === 'Toate' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('Toate')}
                    >
                        Toate
                    </button>
                    {categories.map(cat => (
                        <div key={cat} className="chip-wrapper">
                            <button
                                className={`chip ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                            <button className="delete-cat-btn" onClick={() => deleteCategory(cat)} title="Șterge Categorie">
                                <XIcon size={12} />
                            </button>
                        </div>
                    ))}
                    <form onSubmit={handleAddCategory} className="add-cat-form">
                        <input
                            type="text"
                            placeholder="+ Categ"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                    </form>
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="Caută produse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                        <option value="date_desc">Data: Cele mai noi</option>
                        <option value="date_asc">Data: Cele mai vechi</option>
                        <option value="stock_asc">Stoc: Mic &#8594; Mare</option>
                        <option value="stock_desc">Stoc: Mare &#8594; Mic</option>
                    </select>
                </div>
            </div>

            {/* Items Table */}
            <div className="table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Categorie</th>
                            <th>Stoc</th>
                            <th>Data Intrare</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredItems().map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td><span className="badge">{item.category}</span></td>
                                <td>
                                    <span className="stock-value">{item.stock} {item.unit}</span>
                                </td>
                                <td>{new Date(item.entryDate).toLocaleDateString('ro-RO')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => deleteItem(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {getFilteredItems().length === 0 && (
                            <tr>
                                <td colSpan="5" className="empty-state">Nu există produse în stoc.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showItemModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingItem ? 'Editează Stoc' : 'Adaugă în Stoc'}</h3>
                        <form onSubmit={handleItemSubmit}>
                            <div className="form-group">
                                <label>Nume Produs</label>
                                <input
                                    type="text"
                                    required
                                    value={itemForm.name}
                                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Categorie</label>
                                    <select
                                        value={itemForm.category}
                                        onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Alege...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group half">
                                    <label>Data Intrare</label>
                                    <input
                                        type="date"
                                        required
                                        value={itemForm.entryDate}
                                        onChange={e => setItemForm({ ...itemForm, entryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Stoc</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={itemForm.stock}
                                        onChange={e => setItemForm({ ...itemForm, stock: e.target.value })}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Unitate</label>
                                    <select
                                        required
                                        className="form-control"
                                        value={itemForm.unit}
                                        onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                    >
                                        <option value="buc">buc</option>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="l">l</option>
                                        <option value="ml">ml</option>
                                        <option value="cutie">cutie</option>
                                        <option value="bax">bax</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Anulează</button>
                                <button type="submit" className="btn btn-primary">Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .admin-inventory { padding: 1rem; }
                .inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .inventory-toolbar { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
                .category-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
                .chip { padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
                .chip.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
                .chip-wrapper { display: flex; align-items: center; position: relative; }
                .delete-cat-btn { background: #fee2e2; border: none; color: #dc2626;  border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; position: absolute; top: -5px; right: -5px; cursor: pointer; opacity: 0; transition: opacity 0.2s; font-size: 10px; }
                .chip-wrapper:hover .delete-cat-btn { opacity: 1; }
                .filters { display: flex; gap: 1rem; }
                .search-input { flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
                .sort-select { padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; background: white; }
                .add-cat-form input { width: 80px; padding: 0.4rem; border: 1px dashed #cbd5e1; border-radius: 20px; font-size: 0.85rem; text-align: center; }
                
                .inventory-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .inventory-table th, .inventory-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
                .inventory-table th { background: #f8fafc; font-weight: 600; color: #475569; }
                .badge { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; }
                .low-stock { background-color: #fef2f2; }
                .low-stock .stock-value { color: #dc2626; font-weight: bold; }
                .warning-icon { margin-left: 0.5rem; cursor: help; }
                .empty-state { text-align: center; padding: 2rem; color: #94a3b8; }
                
                .form-row { display: flex; gap: 1rem; }
                .half { flex: 1; }
                
                /* Reusing some Admin.css styles implicitly or adding scoped ones here for speed */
            `}</style>
        </div>
    );
};

// Simple X icon since we missed importing it in destructuring above
const XIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default AdminInventory;
