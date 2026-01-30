import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRecipes } from '../../../context/RecipeContext';
import { useInventory } from '../../../context/InventoryContext';
import { useMenu } from '../../../context/MenuContext';
import { Plus, Trash2, Edit2, Calculator, Save, CheckCircle, AlertTriangle, BookOpen, X, Settings } from 'lucide-react';
import InventorySearch from '../../../components/common/InventorySearch';

const AdminRecipes = () => {
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
    const { items: inventoryItems, addItem } = useInventory();
    const { products, categories, addCategory, updateCategory, deleteCategory } = useMenu();

    const [activeTab, setActiveTab] = useState('manage');

    // --- MANAGE STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatManagerOpen, setIsCatManagerOpen] = useState(false); // New Manager Modal
    const [editingId, setEditingId] = useState(null);
    const [recipeForm, setRecipeForm] = useState({
        name: '',
        category: '', // New Field
        linked_product_id: '',
        preparation_method: '',
        ingredients: []
    });

    // --- CATEGORY MANAGER STATE ---
    const [newCatName, setNewCatName] = useState('');
    const [editingCatId, setEditingCatId] = useState(null);
    const [editingCatName, setEditingCatName] = useState('');

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        await addCategory(newCatName, 'catering'); // Default to catering as per request implied context? Or let user choose?
        // User asked for "recipes categories". These are likely "Food" categories.
        // Products usually use these.
        setNewCatName('');
    };

    const handleUpdateCategory = async (id) => {
        if (!editingCatName.trim()) return;
        await updateCategory(id, { name: editingCatName });
        setEditingCatId(null);
        setEditingCatName('');
    };

    // --- ITEM CREATION STATE ---
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('kg');

    const handleCreateNewItem = async () => {
        if (!newItemName.trim()) return;
        await addItem({
            name: newItemName,
            category: 'Ingrediente',
            stock: 0,
            unit: newItemUnit
        });
        setNewItemName('');
        setIsItemModalOpen(false);
    };

    // --- CALCULATOR STATE ---
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [portions, setPortions] = useState(1);
    const [calculationResult, setCalculationResult] = useState(null);

    // --- MANAGE HANDLERS ---
    const openModal = (recipe = null) => {
        if (recipe) {
            setEditingId(recipe.id);
            setRecipeForm({
                name: recipe.name,
                category: recipe.category || '', // Load category
                linked_product_id: recipe.linked_product_id || '',
                preparation_method: recipe.preparation_method || '',
                ingredients: recipe.ingredients.map(i => ({
                    ingredient_id: i.ingredient_id,
                    qty: i.qty,
                    unit: i.unit
                }))
            });
        } else {
            setEditingId(null);
            setRecipeForm({ name: '', category: '', linked_product_id: '', ingredients: [], preparation_method: '' }); // Reset category
        }
        setIsModalOpen(true);
    };

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...recipeForm.ingredients];
        newIngredients[index][field] = value;

        // Auto-update unit if item selected
        if (field === 'ingredient_id') {
            const item = inventoryItems.find(i => i.id == value);
            if (item) {
                newIngredients[index].unit = item.unit;
                newIngredients[index].ingredient_id = parseInt(value);
            }
        }

        setRecipeForm({ ...recipeForm, ingredients: newIngredients });
    };

    const addIngredientRow = () => {
        setRecipeForm({
            ...recipeForm,
            ingredients: [...recipeForm.ingredients, { ingredient_id: '', qty: '', unit: '' }]
        });
    };

    const removeIngredientRow = (index) => {
        const newIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
        setRecipeForm({ ...recipeForm, ingredients: newIngredients });
    };

    const handleSaveRecipe = async (e) => {
        e.preventDefault();
        // Filter out empty rows
        const validIngredients = recipeForm.ingredients.filter(i => i.ingredient_id && i.qty);

        if (!recipeForm.name.trim()) {
            alert("Numele rețetei este obligatoriu!");
            return;
        }

        const data = {
            name: recipeForm.name,
            category: recipeForm.category || null, // Include category
            linked_product_id: recipeForm.linked_product_id || null,
            preparation_method: recipeForm.preparation_method,
            ingredients: validIngredients.map(ing => ({
                ingredient_id: ing.ingredient_id,
                qty: ing.qty
            }))
        };

        let result;
        if (editingId) {
            result = await updateRecipe(editingId, data);
        } else {
            result = await addRecipe(data);
        }

        if (result && result.success) {
            setIsModalOpen(false);
        }
    };

    // --- CALCULATOR HANDLERS (FIFO Logic) ---
    const calculateRequirements = async () => {
        if (!selectedRecipeId || portions <= 0) return;
        const recipe = recipes.find(r => r.id === parseInt(selectedRecipeId)); // Ensure ID match
        if (!recipe) return;

        // Fetch valid batches for all ingredients involved
        // We assume recipe.ingredients already contains { ingredient_id } from our Context refactor
        const results = [];

        for (const ing of recipe.ingredients) {
            if (!ing.ingredient_id) continue;

            // Find item def just for name/unit fallback
            const itemDef = inventoryItems.find(i => i.id === ing.ingredient_id);
            const itemName = itemDef ? itemDef.name : ing.itemName;
            const unit = itemDef ? itemDef.unit : ing.unit;

            const neededTotal = parseFloat(ing.qty) * portions;

            // Fetch batches FIFO
            const { data: batches } = await supabase
                .from('inventory_batches')
                .select('*')
                .eq('item_id', ing.ingredient_id)
                .gt('quantity', 0)
                .order('expiration_date', { ascending: true }) // FIFO
                .order('created_at', { ascending: true });

            const totalAvailable = batches ? batches.reduce((acc, b) => acc + b.quantity, 0) : 0;

            results.push({
                itemName: itemName,
                item_id: ing.ingredient_id,
                needed: neededTotal,
                unit: unit,
                available: totalAvailable,
                batches: batches || [],
                isSufficient: totalAvailable >= neededTotal
            });
        }

        setCalculationResult(results);
    };

    const handleDeductStock = async () => {
        if (!calculationResult || !selectedRecipeId) return;
        if (!window.confirm(`Sigur doriți să scădeți ingredientele pentru ${portions} porții din stoc (FIFO)?`)) return;

        const adminName = localStorage.getItem('admin_name') || 'Admin';

        try {
            for (const res of calculationResult) {
                let remainingNeeded = res.needed;

                // Batches are already sorted by expiry (FIFO) from fetch
                for (const batch of res.batches) {
                    if (remainingNeeded <= 0.0001) break; // Tolerance

                    const currentStock = batch.quantity;
                    let take = 0;

                    if (currentStock >= remainingNeeded) {
                        take = remainingNeeded;
                        remainingNeeded = 0;
                    } else {
                        take = currentStock;
                        remainingNeeded -= currentStock;
                    }

                    // 1. Update Batch (If reaches 0, it stays 0 and is effectively "deleted" from active view)
                    const { error: batchErr } = await supabase
                        .from('inventory_batches')
                        .update({ quantity: currentStock - take })
                        .eq('id', batch.id);

                    if (batchErr) throw batchErr;

                    // 2. Log Transaction (OUT)
                    // If batch becomes 0, it's logged here as taking the full remainder.
                    await supabase.from('inventory_transactions').insert([{
                        transaction_type: 'OUT',
                        batch_id: batch.id,
                        item_id: res.item_id,
                        quantity: take,
                        reason: `Producție Rețetă: ${portions} x ${recipes.find(r => r.id === selectedRecipeId)?.name || 'N/A'}`,
                        operator_name: adminName
                    }]);
                }
            }

            // 3. Log to Global Admin Logs
            const recipeName = recipes.find(r => r.id === selectedRecipeId)?.name || 'Rețetă';
            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: 'PRODUCTIE',
                details: `S-au produs ${portions} porții de ${recipeName}. Stocul a fost scăzut (FIFO).`,
                created_at: new Date().toISOString()
            }]);

            alert("Stocul a fost actualizat cu succes!");
            setCalculationResult(null);
            setPortions(1);
            setSelectedRecipeId('');
        } catch (error) {
            console.error(error);
            alert("Eroare la actualizarea stocului: " + error.message);
        }
    };

    // Helper to get unique ingredient names for Select
    const uniqueInventoryNames = [...new Set(inventoryItems.map(i => i.name))].sort();

    return (
        <div className="admin-recipes" style={{ padding: '1rem' }}>
            {/* Header Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manage')}
                    style={{ padding: '1rem', border: 'none', background: 'none', borderBottom: activeTab === 'manage' ? '2px solid #990000' : 'none', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'manage' ? '#990000' : '#64748b' }}
                >
                    Gestionare Rețete
                </button>
                <button
                    className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calculator')}
                    style={{ padding: '1rem', border: 'none', background: 'none', borderBottom: activeTab === 'calculator' ? '2px solid #990000' : 'none', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'calculator' ? '#990000' : '#64748b' }}
                >
                    Calculator & Stoc
                </button>
            </div>

            {/* --- TAB 1: MANAGE RECIPES --- */}
            {activeTab === 'manage' && (
                <div>
                    <button className="btn btn-primary mb-3" onClick={() => openModal()} style={{ marginBottom: '1rem' }}>
                        <Plus size={18} /> Adaugă Rețetă Nouă
                    </button>

                    <div className="recipes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="recipe-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0 }}>{recipe.name}</h3>
                                    <div>
                                        <button className="btn-icon" onClick={() => openModal(recipe)} style={{ marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                                        <button className="btn-icon btn-delete" onClick={() => deleteRecipe(recipe.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                    {recipe.ingredients.slice(0, 3).map((ing, i) => (
                                        <li key={i}>• {ing.itemName || 'Nume lipsă'} ({ing.qty} {ing.unit})</li>
                                    ))}
                                    {recipe.ingredients.length > 3 && <li>... (+{recipe.ingredients.length - 3} altele)</li>}
                                </ul>
                                {recipe.preparation_method && (
                                    <div style={{ fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                        <strong>Preparare:</strong>
                                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {recipe.preparation_method}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB 2: CALCULATOR --- */}
            {activeTab === 'calculator' && (
                <div>
                    <div className="calculator-panel" style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>Calculator Producție (FIFO)</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Alege Produsul / Rețeta</label>
                                <select
                                    className="form-control"
                                    value={selectedRecipeId}
                                    onChange={(e) => { setSelectedRecipeId(parseInt(e.target.value)); setCalculationResult(null); }}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Selectează --</option>
                                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div style={{ width: '150px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nr. Porții</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={portions}
                                    onChange={(e) => setPortions(parseInt(e.target.value) || 0)}
                                    min="1"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={calculateRequirements} disabled={!selectedRecipeId}>
                                    <Calculator size={18} /> Calculează Necesar
                                </button>
                            </div>
                        </div>

                        {calculationResult && (
                            <div style={{ marginTop: '2rem' }}>
                                <h4>Rezultat Calcul pentru {portions} porții:</h4>

                                {recipes.find(r => r.id === selectedRecipeId)?.preparation_method && (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderLeft: '4px solid #990000', marginBottom: '1rem', borderRadius: '4px' }}>
                                        <h5 style={{ marginTop: 0, color: '#990000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BookOpen size={18} /> Mod de preparare:
                                        </h5>
                                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                            {recipes.find(r => r.id === selectedRecipeId).preparation_method}
                                        </p>
                                    </div>
                                )}

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Ingredient</th>
                                            <th style={{ padding: '1rem' }}>Necesar</th>
                                            <th style={{ padding: '1rem' }}>Disponibil Total (Toate Loturile)</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculationResult.map((res, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '1rem' }}>{res.itemName}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{res.needed.toFixed(2)} {res.unit}</td>
                                                <td style={{ padding: '1rem' }}>{res.available} {res.unit}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {res.isSufficient ? (
                                                        <span style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <CheckCircle size={16} /> OK
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'red', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                                            <AlertTriangle size={16} /> Insuficient
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Global Action */}
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <div style={{ alignSelf: 'center', color: '#64748b' }}>
                                        Verifică tabelul înainte de a scădea din stoc.
                                    </div>
                                    <button
                                        className="btn"
                                        style={{ background: calculationResult.every(r => r.isSufficient) ? '#990000' : '#cbd5e1', color: 'white', cursor: calculationResult.every(r => r.isSufficient) ? 'pointer' : 'not-allowed' }}
                                        disabled={!calculationResult.every(r => r.isSufficient)}
                                        onClick={handleDeductStock}
                                    >
                                        Scade Produsele din Stoc
                                    </button>
                                </div>
                                {!calculationResult.every(r => r.isSufficient) && (
                                    <p style={{ color: 'red', textAlign: 'right', marginTop: '0.5rem' }}>Nu se poate efectua scăderea din stoc. Unele ingrediente sunt insuficiente.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CATEGORY MANAGER MODAL */}
            {isCatManagerOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Gestionare Categorii</h3>
                            <button onClick={() => setIsCatManagerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {/* Add New Category */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nume Categorie Nouă"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                            <button className="btn btn-primary" onClick={handleAddCategory}>Adaugă</button>
                        </div>

                        {/* List */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Nume Categorie</th>
                                        <th style={{ padding: '0.75rem', width: '100px', borderBottom: '1px solid #e2e8f0' }}>Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                {editingCatId === cat.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingCatName}
                                                        onChange={e => setEditingCatName(e.target.value)}
                                                        className="form-control"
                                                        autoFocus
                                                        style={{ width: '100%', padding: '0.25rem' }}
                                                    />
                                                ) : (
                                                    cat.name
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                {editingCatId === cat.id ? (
                                                    <>
                                                        <button
                                                            className="btn-icon text-success"
                                                            onClick={() => handleUpdateCategory(cat.id)}
                                                            title="Salvează"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            className="btn-icon text-secondary"
                                                            onClick={() => { setEditingCatId(null); setEditingCatName(''); }}
                                                            title="Anulează"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn-icon text-primary"
                                                            onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                                                            title="Editează"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            className="btn-icon text-danger"
                                                            onClick={() => deleteCategory(cat.name)}
                                                            title="Șterge"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editingId ? 'Editează Rețetă' : 'Adaugă Rețetă Nouă'}</h3>
                        <form onSubmit={handleSaveRecipe}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nume Rețetă *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    placeholder="ex: Sos Pizza sau Burger Chianti"
                                    value={recipeForm.name}
                                    onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Categorie Rețetă</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        className="form-control"
                                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        value={recipeForm.category}
                                        onChange={e => setRecipeForm({ ...recipeForm, category: e.target.value })}
                                    >
                                        <option value="">-- Alege Categorie --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setIsCatManagerOpen(true)}
                                        title="Gestionează Categorii"
                                        style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}
                                    >
                                        <Settings size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Asociază cu Produs din Meniu (Opțional)</label>
                                <select
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    value={recipeForm.linked_product_id}
                                    onChange={e => {
                                        const p = products.find(prod => prod.id == e.target.value);
                                        setRecipeForm({
                                            ...recipeForm,
                                            linked_product_id: e.target.value,
                                            // Auto-fill name only if empty
                                            name: (recipeForm.name === '' && p) ? p.name : recipeForm.name
                                        });
                                    }}
                                >
                                    <option value="">-- Niciunul (Doar rețetă internă) --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                                    ))}
                                </select>
                                <small style={{ color: '#64748b' }}>Dacă selectați un produs, calculatorul va putea fi folosit automat din Meniu.</small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mod de preparare (Instrucțiuni)</label>
                                <textarea
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.5rem', minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Descrie pașii de preparare..."
                                    value={recipeForm.preparation_method}
                                    onChange={e => setRecipeForm({ ...recipeForm, preparation_method: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ingrediente (per 1 porție)</label>
                                {recipeForm.ingredients.map((ing, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ flex: 2, display: 'flex', gap: '5px' }}>
                                            <div style={{ flex: 1 }}>
                                                <InventorySearch
                                                    items={inventoryItems}
                                                    placeholder="Caută ingredient..."
                                                    defaultQuery={inventoryItems.find(x => x.id === ing.ingredient_id)?.name || ''}
                                                    onSelect={(item) => {
                                                        if (item) {
                                                            handleIngredientChange(i, 'ingredient_id', item.id);
                                                            handleIngredientChange(i, 'unit', item.unit);
                                                        } else {
                                                            handleIngredientChange(i, 'ingredient_id', '');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-icon"
                                                title="Creează ingredient nou"
                                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onClick={() => { setIsItemModalOpen(true); }}
                                            >
                                                <Plus size={18} color="#0f172a" />
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.001"
                                            placeholder="Cantitate"
                                            value={ing.qty}
                                            onChange={e => handleIngredientChange(i, 'qty', e.target.value)}
                                            style={{ flex: 1, padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            value={ing.unit}
                                            onChange={e => handleIngredientChange(i, 'unit', e.target.value)}
                                            style={{ width: '60px', border: '1px solid #cbd5e1', padding: '0.6rem', borderRadius: '4px', background: '#f8fafc' }}
                                            title="Unitatea se completează automat din stoc, dar poate fi modificată"
                                        />
                                        <button type="button" onClick={() => removeIngredientRow(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addIngredientRow} className="btn-text" style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <Plus size={16} /> Adaugă rând ingredient
                                </button>
                            </div>

                            {/* ITEM CREATION MODAL */}
                            {/* ITEM CREATION MODAL */}
                            {isItemModalOpen && (
                                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                        <h4>Creează Ingredient Nou</h4>
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nume Ingredient</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                autoFocus
                                                value={newItemName}
                                                onChange={e => setNewItemName(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Unitate de Măsură</label>
                                            <select
                                                className="form-control"
                                                value={newItemUnit}
                                                onChange={e => setNewItemUnit(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="buc">buc</option>
                                                <option value="L">L</option>
                                                <option value="cutie">cutie</option>
                                                <option value="bax">bax</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setIsItemModalOpen(false)}>Anulează</button>
                                            <button type="button" className="btn btn-primary" onClick={handleCreateNewItem}>Creează</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Anulează</button>
                                <button type="submit" className="btn btn-primary">Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default AdminRecipes;
