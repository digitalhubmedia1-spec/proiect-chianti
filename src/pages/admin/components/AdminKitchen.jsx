import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useMenu } from '../../../context/MenuContext';
import { Calendar as CalendarIcon, Info, Calculator, X, ChevronRight, CheckCircle, ChefHat, FileText, List } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AdminKitchen.css'; // We will create this CSS file

const AdminKitchen = () => {
    const { products } = useMenu();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [plannedItems, setPlannedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modals
    const [selectedProduct, setSelectedProduct] = useState(null); // For Info Modal
    const [calculatorProduct, setCalculatorProduct] = useState(null); // For Calculator Modal
    const [calculatorMode, setCalculatorMode] = useState('single'); // 'single' or 'total'
    
    // Lightbox State
    const [lightboxImage, setLightboxImage] = useState(null);

    // Recipe Data Cache
    const [recipesCache, setRecipesCache] = useState({}); // { productId: { recipe, ingredients } }

    useEffect(() => {
        fetchDailyPlan();
    }, [selectedDate]);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchDailyPlan = async () => {
        setLoading(true);
        const dateStr = formatDate(selectedDate);
        
        try {
            const { data, error } = await supabase
                .from('daily_menu_items')
                .select('product_id, stock')
                .eq('date', dateStr);

            if (error) throw error;

            if (data) {
                // Merge with product details from context
                const items = data.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    return product ? { ...product, planned_stock: item.stock } : null;
                }).filter(Boolean);
                setPlannedItems(items);
            } else {
                setPlannedItems([]);
            }
        } catch (err) {
            console.error("Error fetching plan:", err);
            setPlannedItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipeDetails = async (productId) => {
        if (recipesCache[productId] !== undefined) return recipesCache[productId];

        try {
            // 1. Get Defined Recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('defined_recipes')
                .select('*')
                .eq('linked_product_id', productId)
                .single();

            if (recipeError) {
                // It's normal to not have a recipe, but let's log if it's a real error
                if (recipeError.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
                     console.error("Error fetching recipe for product", productId, recipeError);
                }
                setRecipesCache(prev => ({ ...prev, [productId]: null }));
                return null;
            }

            // 2. Get Ingredients
            const { data: ingredientsData, error: ingError } = await supabase
                .from('recipes')
                .select(`
                    quantity_required,
                    ingredient_id,
                    inventory_items (id, name, unit)
                `)
                .eq('recipe_id', recipeData.id);

            if (ingError) {
                setRecipesCache(prev => ({ ...prev, [productId]: null }));
                return null;
            }

            const result = {
                recipe: recipeData,
                ingredients: ingredientsData.map(i => ({
                    id: i.ingredient_id,
                    name: i.inventory_items?.name || 'Necunoscut',
                    unit: i.inventory_items?.unit || '',
                    qty: i.quantity_required
                }))
            };

            setRecipesCache(prev => ({ ...prev, [productId]: result }));
            return result;
        } catch (err) {
            console.error("Error fetching recipe:", err);
            setRecipesCache(prev => ({ ...prev, [productId]: null }));
            return null;
        }
    };

    const handleOpenInfo = async (product) => {
        setSelectedProduct(product);
        // Fetch recipe if not in cache
        if (!recipesCache[product.id]) {
            await fetchRecipeDetails(product.id);
        }
    };

    const handleOpenCalculator = async (product) => {
        setCalculatorProduct(product);
        setCalculatorMode('single');
        // Fetch recipe if not in cache
        if (!recipesCache[product.id]) {
            await fetchRecipeDetails(product.id);
        }
    };

    return (
        <div className="admin-kitchen-container">
            <div className="kitchen-header">
                <div className="header-title">
                    <ChefHat size={32} color="#dc2626" />
                    <h1>Bucătărie - Plan Producție</h1>
                </div>
                <div className="date-picker-wrapper">
                    <CalendarIcon size={20} />
                    <input 
                        type="date" 
                        value={formatDate(selectedDate)}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="date-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Se încarcă planul...</div>
            ) : plannedItems.length === 0 ? (
                <div className="empty-state">
                    <p>Nu există produse planificate pentru această dată.</p>
                </div>
            ) : (
                <div className="kitchen-grid">
                    {plannedItems.map(item => (
                        <div key={item.id} className="kitchen-card">
                            <div className="card-image">
                                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} />
                                <span className="stock-badge">{item.planned_stock} Porții</span>
                            </div>
                            <div className="card-content">
                                <h3>{item.name}</h3>
                                <div className="card-actions">
                                    <button onClick={() => handleOpenInfo(item)} className="btn-info">
                                        <Info size={18} /> Info
                                    </button>
                                    <button onClick={() => handleOpenCalculator(item)} className="btn-calc">
                                        <Calculator size={18} /> Calculator
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* INFO MODAL */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-content kitchen-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedProduct(null)}><X size={32} /></button>
                        
                        <div className="modal-header-kitchen">
                            <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-prod-img" />
                            <div>
                                <h2>{selectedProduct.name}</h2>
                                <span className="category-tag">{selectedProduct.category}</span>
                            </div>
                        </div>

                        <div className="modal-body-scroll">
                            <div className="section">
                                <h3><FileText size={20} /> Instrucțiuni Interne</h3>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{(selectedProduct.internal_instructions || "Nu există instrucțiuni specifice.").trim()}</p>
                            </div>

                            {recipesCache[selectedProduct.id]?.recipe && (
                                <div className="section">
                                    <h3><List size={20} /> Mod de Preparare (Rețetă)</h3>
                                    <div className="recipe-instructions">
                                        {recipesCache[selectedProduct.id].recipe.preparation_method ? (
                                            <p style={{ whiteSpace: 'pre-wrap' }}>{recipesCache[selectedProduct.id].recipe.preparation_method.trim()}</p>
                                        ) : (
                                            <p className="text-muted">Fără instrucțiuni în rețetă.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {recipesCache[selectedProduct.id]?.ingredients && (
                                <div className="section">
                                    <h3>Ingrediente (per porție)</h3>
                                    <ul className="info-ingredients-list">
                                        {recipesCache[selectedProduct.id].ingredients.map(ing => (
                                            <li key={ing.id}>
                                                <strong>{ing.name}</strong>: {ing.qty} {ing.unit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedProduct.production_gallery && selectedProduct.production_gallery.length > 0 && (
                                <div className="section">
                                    <h3>Galerie Uz Intern</h3>
                                    <div className="internal-gallery">
                                        {selectedProduct.production_gallery.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Internal ${idx}`} onClick={() => setLightboxImage(img)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL */}
            {lightboxImage && (
                <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
                            <X size={32} />
                        </button>
                        <img src={lightboxImage} alt="Fullscreen Preview" className="lightbox-img" />
                    </div>
                </div>
            )}

            {/* CALCULATOR MODAL */}
            {calculatorProduct && (
                <div className="modal-overlay" onClick={() => setCalculatorProduct(null)}>
                    <div className="modal-content kitchen-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setCalculatorProduct(null)}><X size={32} /></button>
                        
                        <div className="modal-header-kitchen">
                            <div>
                                <h2>Calculator Ingrediente</h2>
                                <p className="subtitle">{calculatorProduct.name}</p>
                            </div>
                        </div>

                        <div className="calculator-controls">
                            <button 
                                className={`calc-mode-btn ${calculatorMode === 'single' ? 'active' : ''}`}
                                onClick={() => setCalculatorMode('single')}
                            >
                                1 Porție
                            </button>
                            <button 
                                className={`calc-mode-btn ${calculatorMode === 'total' ? 'active' : ''}`}
                                onClick={() => setCalculatorMode('total')}
                            >
                                Total ({calculatorProduct.planned_stock} Porții)
                            </button>
                        </div>

                        <div className="ingredients-table-wrapper">
                            {recipesCache[calculatorProduct.id] === undefined ? (
                                <div className="loading-text">Se încarcă rețeta...</div>
                            ) : !recipesCache[calculatorProduct.id] ? (
                                <div className="error-text">Acest produs nu are o rețetă asociată.</div>
                            ) : (
                                <table className="ingredients-table">
                                    <thead>
                                        <tr>
                                            <th>Ingredient</th>
                                            <th>Cantitate / {calculatorMode === 'single' ? 'Porție' : 'Total'}</th>
                                            <th>Unitate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipesCache[calculatorProduct.id].ingredients.map(ing => (
                                            <tr key={ing.id}>
                                                <td>{ing.name}</td>
                                                <td className="qty-cell">
                                                    {(ing.qty * (calculatorMode === 'total' ? calculatorProduct.planned_stock : 1)).toFixed(3)}
                                                </td>
                                                <td>{ing.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKitchen;
