import React, { useState } from 'react';
import { useRecipes } from '../../../context/RecipeContext';
import { useInventory } from '../../../context/InventoryContext';
import { Plus, Trash2, Edit2, Calculator, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminRecipes = () => {
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
    const { items: inventoryItems, updateStock } = useInventory();

    const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'calculator'

    // --- MANAGE STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [recipeForm, setRecipeForm] = useState({
        name: '',
        ingredients: [] // { itemId, qty, unit }
    });

    // --- CALCULATOR STATE ---
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [portions, setPortions] = useState(1);
    const [calculationResult, setCalculationResult] = useState(null);

    // --- MANAGE HANDLERS ---
    const openModal = (recipe = null) => {
        if (recipe) {
            setEditingId(recipe.id);
            setRecipeForm(recipe);
        } else {
            setEditingId(null);
            setRecipeForm({ name: '', ingredients: [] });
        }
        setIsModalOpen(true);
    };

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...recipeForm.ingredients];
        newIngredients[index][field] = value;

        // Auto-fill unit if item selected
        if (field === 'itemId') {
            const item = inventoryItems.find(i => i.id == value);
            if (item) newIngredients[index].unit = item.unit;
        }

        setRecipeForm({ ...recipeForm, ingredients: newIngredients });
    };

    const addIngredientRow = () => {
        setRecipeForm({
            ...recipeForm,
            ingredients: [...recipeForm.ingredients, { itemId: '', qty: '', unit: '' }]
        });
    };

    const removeIngredientRow = (index) => {
        const newIngredients = recipeForm.ingredients.filter((_, i) => i !== index);
        setRecipeForm({ ...recipeForm, ingredients: newIngredients });
    };

    const handleSaveRecipe = (e) => {
        e.preventDefault();
        // Filter out empty rows
        const validIngredients = recipeForm.ingredients.filter(i => i.itemId && i.qty);
        const data = { ...recipeForm, ingredients: validIngredients };

        if (editingId) {
            updateRecipe(editingId, data);
        } else {
            addRecipe(data);
        }
        setIsModalOpen(false);
    };

    // --- CALCULATOR HANDLERS ---
    const calculateRequirements = () => {
        if (!selectedRecipeId || portions <= 0) return;
        const recipe = recipes.find(r => r.id === selectedRecipeId);
        if (!recipe) return;

        const results = recipe.ingredients.map(ing => {
            const stockItem = inventoryItems.find(i => i.id == ing.itemId);
            const needed = parseFloat(ing.qty) * portions;
            const available = stockItem ? parseFloat(stockItem.stock) : 0;
            return {
                ...ing,
                itemName: stockItem ? stockItem.name : 'Unknown',
                needed,
                available,
                isSufficient: available >= needed,
                stockItem // keep ref for updates
            };
        });

        setCalculationResult(results);
    };

    const handleDeductStock = () => {
        if (!calculationResult) return;

        // Confirm action
        if (!window.confirm(`Sigur doriți să scădeți ingredientele pentru ${portions} porții din stoc?`)) return;

        calculationResult.forEach(res => {
            if (res.stockItem) {
                // Get fresh stock value from the current inventoryItems list
                const freshItem = inventoryItems.find(i => i.id === res.stockItem.id);
                const currentStock = freshItem ? parseFloat(freshItem.stock) : parseFloat(res.available);

                // Calculate new stock
                const preciseResult = parseFloat((currentStock - res.needed).toFixed(4));
                const newStock = Math.max(0, preciseResult);

                updateStock(res.stockItem.id, newStock);
            }
        });

        alert("Stocul a fost actualizat!");
        calculateRequirements(); // Refresh calculations
    };

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
                                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', color: '#64748b' }}>
                                    {recipe.ingredients.slice(0, 3).map((ing, i) => {
                                        const item = inventoryItems.find(inv => inv.id == ing.itemId);
                                        return <li key={i}>• {item ? item.name : 'Item șters'} ({ing.qty} {ing.unit})</li>
                                    })}
                                    {recipe.ingredients.length > 3 && <li>... (+{recipe.ingredients.length - 3} altele)</li>}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB 2: CALCULATOR --- */}
            {activeTab === 'calculator' && (
                <div>
                    <div className="calculator-panel" style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>Calculator Producție</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Alege Produsul / Rețeta</label>
                                <select
                                    className="form-control"
                                    value={selectedRecipeId}
                                    onChange={(e) => { setSelectedRecipeId(e.target.value); setCalculationResult(null); }}
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Ingredient</th>
                                            <th style={{ padding: '1rem' }}>Necesar</th>
                                            <th style={{ padding: '1rem' }}>Disponibil în Stoc</th>
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

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editingId ? 'Editează Rețetă' : 'Adaugă Rețetă Nouă'}</h3>
                        <form onSubmit={handleSaveRecipe}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nume Produs / Rețetă</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={recipeForm.name}
                                    onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ingrediente (per 1 porție)</label>
                                {recipeForm.ingredients.map((ing, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <select
                                            value={ing.itemId}
                                            onChange={e => handleIngredientChange(i, 'itemId', e.target.value)}
                                            style={{ flex: 2, padding: '0.3rem' }}
                                            required
                                        >
                                            <option value="">Alege Ingredient...</option>
                                            {inventoryItems.map(item => (
                                                <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            step="0.001"
                                            placeholder="Cantitate"
                                            value={ing.qty}
                                            onChange={e => handleIngredientChange(i, 'qty', e.target.value)}
                                            style={{ flex: 1, padding: '0.3rem' }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            value={ing.unit}
                                            onChange={e => handleIngredientChange(i, 'unit', e.target.value)}
                                            style={{ width: '55px', border: '1px solid #ccc', padding: '0.3rem', borderRadius: '4px' }}
                                        />
                                        <button type="button" onClick={() => removeIngredientRow(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addIngredientRow} className="btn-text" style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={16} /> Adaugă rând ingredient
                                </button>
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Anulează</button>
                                <button type="submit" className="btn btn-primary">Salvează</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRecipes;
