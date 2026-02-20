import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { logAction } from '../../../utils/adminLogger';
import { Calendar, Save, Copy, CheckSquare, Square, Filter, ChevronLeft, ChevronRight, Grid, List, FileText, Settings, X, Search, Trash2, Plus } from 'lucide-react';
import ConsumptionReportModal from './ConsumptionReportModal';
import { useMenu } from '../../../context/MenuContext';

const AdminMenuPlanner = () => {
    const { products, categories, loading: menuLoading, fetchExtras, addExtra, removeExtra } = useMenu();
    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly'
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // --- EXTRAS STATE ---
    const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
    const [editingExtrasProduct, setEditingExtrasProduct] = useState(null);
    const [currentExtras, setCurrentExtras] = useState([]);
    const [extraSearchTerm, setExtraSearchTerm] = useState("");

    const handleOpenExtras = async (e, product) => {
        e.stopPropagation();
        setEditingExtrasProduct(product);

        // Check if we have specific extras configured for this day
        const specificExtrasIds = extrasValues[product.id];
        let extras = [];

        if (specificExtrasIds !== undefined && specificExtrasIds !== null) {
            // Use specific day config
            // We need to fetch the actual product objects for these IDs
            // We can find them in the global products list
            extras = specificExtrasIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        } else {
            // Fallback: Fetch global defaults
            extras = await fetchExtras(product.id);
            // Initialize local state with global defaults so user starts from there
            // But we don't set extrasValues yet to keep it "default" until modified?
            // Actually, if user opens it, they probably want to see current effective extras.
            // Let's set the initial state for editing.
        }
        
        setCurrentExtras(extras);
        setIsExtrasModalOpen(true);
    };

    const handleSelectExtra = async (extraProd) => {
        if (!editingExtrasProduct) return;
        
        // Update local state only (don't write to DB yet)
        const newExtras = [...currentExtras, extraProd];
        setCurrentExtras(newExtras);
        setExtraSearchTerm("");

        // Mark as overridden for this day
        setExtrasValues(prev => ({
            ...prev,
            [editingExtrasProduct.id]: newExtras.map(e => e.id)
        }));
    };

    const handleRemoveExtra = async (extraId) => {
        if (!editingExtrasProduct) return;
        
        // Update local state only
        const newExtras = currentExtras.filter(e => e.id !== extraId);
        setCurrentExtras(newExtras);

        // Mark as overridden for this day
        setExtrasValues(prev => ({
            ...prev,
            [editingExtrasProduct.id]: newExtras.map(e => e.id)
        }));
    };


    // --- SHARED UTILS ---
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- DAILY VIEW STATE ---
    const getInitialDate = () => {
        const d = new Date();
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        return d;
    };
    const [selectedDate, setSelectedDate] = useState(getInitialDate());
    const [activeItems, setActiveItems] = useState(new Set());
    const [stockValues, setStockValues] = useState({});
    const [extrasValues, setExtrasValues] = useState({}); // { productId: [extraId1, extraId2] }

    // --- WEEKLY VIEW STATE ---
    // Start of current week (Monday)
    const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    };
    const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
    const [weeklyData, setWeeklyData] = useState({}); // { "YYYY-MM-DD": { product_id: stock } }

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState("Toate");

    // --- DATA FETCHING (DAILY) ---
    const fetchDaily = async () => {
        setLoading(true);
        setActiveItems(new Set());
        setStockValues({});
        setExtrasValues({});

        const dateStr = formatDate(selectedDate);

        const { data, error } = await supabase.from('daily_menu_items').select('product_id, stock, specific_extras_ids').eq('date', dateStr);
        if (data) {
            const ids = new Set();
            const stocks = {};
            const extrasMap = {};

            data.forEach(i => {
                ids.add(i.product_id);
                stocks[i.product_id] = i.stock;
                if (i.specific_extras_ids !== null) {
                    extrasMap[i.product_id] = i.specific_extras_ids;
                }
            });
            setActiveItems(ids);
            setStockValues(stocks);
            setExtrasValues(extrasMap);
        }
        setLoading(false);
    };

    // --- DATA FETCHING (WEEKLY) ---
    const fetchWeekly = async () => {
        setLoading(true);
        setWeeklyData({});

        const startStr = formatDate(weekStart);
        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endStr = formatDate(endDate);

        const { data, error } = await supabase
            .from('daily_menu_items')
            .select('product_id, stock, date')
            .gte('date', startStr)
            .lte('date', endStr);

        if (data) {
            const mapping = {};
            data.forEach(item => {
                if (!mapping[item.date]) mapping[item.date] = {};
                mapping[item.date][item.product_id] = item.stock;
            });
            setWeeklyData(mapping);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (viewMode === 'daily') fetchDaily();
        else fetchWeekly();
    }, [selectedDate, weekStart, viewMode]);


    // --- DAILY HANDLERS ---
    const changeDate = (days) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + days);
        while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + (days > 0 ? 1 : -1));
        setSelectedDate(next);
    };

    const toggleItem = (id) => {
        const newSet = new Set(activeItems);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setActiveItems(newSet);
    };

    const saveDaily = async () => {
        // Validation: Verify if all selected items have portions defined
        const invalidItems = Array.from(activeItems).filter(id => {
            const val = stockValues[id];
            // Check if value is missing, empty string, or <= 0
            return val === undefined || val === '' || parseInt(val) <= 0;
        });

        if (invalidItems.length > 0) {
            // Optional: You could list the names of invalid items for better UX
            const invalidNames = invalidItems.map(id => products.find(p => p.id === id)?.name).filter(Boolean).slice(0, 3).join(", ");
            alert(`Eroare: Trebuie să setați un număr minim de porții (mai mare ca 0) pentru toate produsele selectate!\nVerificați: ${invalidNames}${invalidItems.length > 3 ? '...' : ''}`);
            return;
        }

        // --- VALIDATION: CHECK IF RECIPES EXIST ---
        const activeIds = Array.from(activeItems);

        // Query HEADERS (defined_recipes) by linked_product_id
        const { data: recipeHeaders, error: headError } = await supabase
            .from('defined_recipes')
            .select('id, linked_product_id, name')
            .in('linked_product_id', activeIds);

        if (headError) {
            alert("Eroare la verificare rețete: " + headError.message);
            return;
        }

        // Map product_id -> defined_recipe_id
        const productToRecipeMap = {};
        recipeHeaders.forEach(r => {
            if (r.linked_product_id) productToRecipeMap[r.linked_product_id] = r.id;
        });

        const missingRecipeProducts = activeIds.filter(id => !productToRecipeMap[id]);
        if (missingRecipeProducts.length > 0) {
            const missingNames = missingRecipeProducts.map(id => products.find(p => p.id === id)?.name).join(", ");
            alert(`EROARE PLANIFICARE:\nUrmătoarele produse selectate NU au o rețetă asociată:\n\n${missingNames}\n\nVă rugăm să asociați rețete acestor produse în secțiunea 'Rețete' (butonul 'Aprobă ca Produs' sau editând rețeta) înainte de a planifica.`);
            return;
        }

        setSaving(true);
        const dateStr = formatDate(selectedDate);

        // --- PRODUCTION LOGIC (STOCK DEDUCTION) ---
        // Need to fetch INGREDIENTS for the identified recipes
        const recipeIds = Object.values(productToRecipeMap);

        const { data: ingredientsData, error: ingError } = await supabase
            .from('recipes') // The ingredients table
            .select(`
                recipe_id, 
                ingredient_id, 
                quantity_required,
                inventory_items (name, unit)
            `)
            .in('recipe_id', recipeIds);

        if (ingError) {
            alert("Eroare la citire ingrediente: " + ingError.message);
            setSaving(false);
            return;
        }

        // 1. Calculate TOTAL Required Stock per Ingredient
        const requiredStock = {}; // ingredient_id -> { qty, name, unit }

        activeIds.forEach(prodId => {
            const portions = parseInt(stockValues[prodId]);
            const recipeId = productToRecipeMap[prodId];
            const recIngredients = ingredientsData.filter(ri => ri.recipe_id === recipeId);

            recIngredients.forEach(ing => {
                const qtyNeeded = ing.quantity_required * portions;
                if (!requiredStock[ing.ingredient_id]) {
                    requiredStock[ing.ingredient_id] = {
                        qty: 0,
                        name: ing.inventory_items?.name || 'Unknown',
                        unit: ing.inventory_items?.unit || ''
                    };
                }
                requiredStock[ing.ingredient_id].qty += qtyNeeded;
            });
        });

        // 2. Fetch Available Stock from Inventory Batches
        const requiredIngredientIds = Object.keys(requiredStock);
        if (requiredIngredientIds.length > 0) {
            const { data: batches, error: batchError } = await supabase
                .from('inventory_batches')
                .select('item_id, quantity')
                .in('item_id', requiredIngredientIds)
                .gt('quantity', 0); // Only consider positive stock

            if (batchError) {
                alert("Eroare la verificare stoc: " + batchError.message);
                setSaving(false);
                return;
            }

            // Sum up available stock
            const availableStock = {};
            batches?.forEach(b => {
                availableStock[b.item_id] = (availableStock[b.item_id] || 0) + Number(b.quantity);
            });

            // 3. Compare and Validate
            const missingItems = [];
            for (const [ingId, req] of Object.entries(requiredStock)) {
                const available = availableStock[ingId] || 0;
                // Use a small epsilon for floating point comparison if needed, but usually strict < is fine
                if (available < req.qty) {
                    missingItems.push({
                        name: req.name,
                        needed: req.qty,
                        available: available,
                        unit: req.unit
                    });
                }
            }

            if (missingItems.length > 0) {
                const errorMsg = missingItems.map(m =>
                    `- ${m.name}: Necesar ${m.needed.toFixed(2)} ${m.unit} (Disponibil: ${m.available.toFixed(2)} ${m.unit})`
                ).join('\n');

                if (!confirm(`STOC INSUFICIENT!\nUrmătoarele produse nu au suficiente ingrediente:\n\n${errorMsg}\n\nDoriți să continuați totuși? (Stocul va deveni negativ)`)) {
                    setSaving(false);
                    return;
                }
            }
        }

        const transactions = [];

        activeIds.forEach(prodId => {
            const portions = parseInt(stockValues[prodId]);
            const recipeId = productToRecipeMap[prodId];

            // Find ingredients for this recipe
            const recIngredients = ingredientsData.filter(ri => ri.recipe_id === recipeId);

            recIngredients.forEach(ing => {
                const qtyNeeded = ing.quantity_required * portions;
                transactions.push({
                    transaction_type: 'OUT', // Consumption / Production
                    item_id: ing.ingredient_id,
                    quantity: qtyNeeded,
                    reason: `Productie Meniu ${dateStr} - ${products.find(p => p.id === prodId)?.name} (${portions} portii)`,
                    operator_name: localStorage.getItem('admin_name') || 'Admin Planner',
                    created_at: new Date().toISOString()
                });
            });
        });

        if (transactions.length > 0) {
            const { error: transError } = await supabase.from('inventory_transactions').insert(transactions);
            if (transError) {
                console.error("Stock deduction error", transError);
                alert("Atentie! Planificarea s-a salvat dar scaderea din stoc a esuat: " + transError.message);
                setSaving(false);
                return;
            }
        }

        await supabase.from('daily_menu_items').delete().eq('date', dateStr);

        const itemsToInsert = Array.from(activeItems).map(id => ({
            date: dateStr,
            product_id: id,
            is_available: true,
            stock: parseInt(stockValues[id]),
            specific_extras_ids: extrasValues[id] !== undefined ? extrasValues[id] : null
        }));

        if (itemsToInsert.length > 0) {
            const { error } = await supabase.from('daily_menu_items').insert(itemsToInsert);
            if (error) {
                console.error(error);
                alert("Eroare la salvare meniu: " + error.message);
                setSaving(false);
                return;
            }
        }

        logAction('MENIU_ZILNIC', `Configurat meniu pentru ${dateStr}: ${itemsToInsert.length} produse. Scazut stoc automat.`);
        setSaving(false);
        alert("Configurație salvată și stoc actualizat (Producție Înregistrată)!");
    };

    const copyFromYesterday = async () => {
        if (!confirm("Suprascrii ziua curentă cu cea anterioară?")) return;
        const srcDate = new Date(selectedDate);
        do { srcDate.setDate(srcDate.getDate() - 1); } while (srcDate.getDay() === 0 || srcDate.getDay() === 6);

        setLoading(true);
        const { data } = await supabase.from('daily_menu_items').select('product_id, stock, specific_extras_ids').eq('date', formatDate(srcDate));
        if (data) {
            const ids = new Set();
            const stocks = {};
            const extrasMap = {};
            data.forEach(i => {
                ids.add(i.product_id);
                stocks[i.product_id] = i.stock;
                if (i.specific_extras_ids !== null) extrasMap[i.product_id] = i.specific_extras_ids;
            });
            setActiveItems(ids);
            setStockValues(stocks);
            setExtrasValues(extrasMap);
        }
        setLoading(false);
    };

    // --- NEW: GENERATE REPORT (PREVIEW) ---
    const handleGenerateReport = () => {
        if (viewMode === 'daily') {
            const items = [];
            activeItems.forEach(id => {
                const stock = stockValues[id];
                if (stock) { // Allow string so long as it parses later
                    const qty = parseInt(stock);
                    if (qty > 0) {
                        items.push({
                            product_id: parseInt(id),
                            stock: qty,
                            date: formatDate(selectedDate)
                        });
                    }
                }
            });

            if (items.length === 0) {
                alert("Nu aveți produse selectate pentru previzualizare!");
                return;
            }
            setPreviewData(items);
        } else {
            setPreviewData(null);
        }
        setIsReportOpen(true);
    };

    // --- WEEKLY HANDLERS ---
    const changeWeek = (days) => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + days);
        setWeekStart(next);
    };

    const handleWeeklyInput = (dateStr, productId, val) => {
        setWeeklyData(prev => ({
            ...prev,
            [dateStr]: {
                ...prev[dateStr],
                [productId]: val === '' ? null : parseInt(val)
            }
        }));
    };

    const saveWeekly = async () => {
        setSaving(true);

        // Prepare range deletion
        const startStr = formatDate(weekStart);
        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endStr = formatDate(endDate);

        const allInserts = [];
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            weekDates.push(formatDate(d));
        }

        // Delete existing for this week
        await supabase.from('daily_menu_items').delete().gte('date', startStr).lte('date', endStr);

        weekDates.forEach(date => {
            const dayData = weeklyData[date] || {};
            Object.entries(dayData).forEach(([prodId, stock]) => {
                if (stock !== null && stock !== undefined && !isNaN(stock)) {
                    if (stock > 0) {
                        allInserts.push({
                            date: date,
                            product_id: parseInt(prodId),
                            stock: parseInt(stock),
                            is_available: true
                        });
                    }
                }
            });
        });

        if (allInserts.length > 0) {
            const { error } = await supabase.from('daily_menu_items').insert(allInserts);
            if (error) alert("Eroare: " + error.message);
            else alert("Săptămână salvată cu succes!");
        } else {
            alert("Săptămână salvată (Goală)!");
        }

        setSaving(false);
        fetchWeekly(); // Refresh
    };

    // --- SHARED RENDER VARS ---
    const standardProducts = products.filter(p => {
        const cat = categories.find(c => c.name === p.category);
        return !cat || cat.type !== 'catering';
    });
    const displayProducts = filterCategory === "Toate" ? standardProducts : standardProducts.filter(p => p.category === filterCategory);

    // --- RENDER WEEKLY GRID ---
    const renderWeeklyGrid = () => {
        const days = [];
        const dateLabels = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            days.push(formatDate(d));
            dateLabels.push(d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' }));
        }

        return (
            <div className="weekly-grid-container" style={{ overflowX: 'auto' }}>
                <table className="weekly-table">
                    <thead>
                        <tr>
                            <th style={{ minWidth: '200px', textAlign: 'left' }}>Produs</th>
                            {dateLabels.map((lbl, idx) => (
                                <th key={idx} className={idx > 4 ? 'weekend-col' : ''}>{lbl}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayProducts.map(p => (
                            <tr key={p.id}>
                                <td className="product-cell">
                                    <div className="prod-name">{p.name}</div>
                                    <div className="prod-cat">{p.category}</div>
                                </td>
                                {days.map((dateStr, idx) => {
                                    const val = weeklyData[dateStr]?.[p.id] ?? '';
                                    return (
                                        <td key={dateStr} className={idx > 4 ? 'weekend-col' : ''}>
                                            <input
                                                type="number"
                                                className="stock-input"
                                                placeholder="-"
                                                value={val}
                                                onChange={(e) => handleWeeklyInput(dateStr, p.id, e.target.value)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <style>{`
                    .weekly-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                    .weekly-table th { padding: 10px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; }
                    .weekly-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; }
                    .weekly-table .product-cell { text-align: left; border-right: 1px solid #e2e8f0; }
                    .weekly-table .weekend-col { background: #fef2f2; }
                    .prod-name { font-weight: 600; color: #1e293b; }
                    .prod-cat { font-size: 0.75rem; color: #94a3b8; }
                    .stock-input { width: 60px; padding: 6px; border: 1px solid #cbd5e1; borderRadius: 4px; text-align: center; font-weight: 600; }
                    .stock-input:focus { border-color: #990000; outline: none; background: #fff1f2; }
                `}</style>
            </div>
        );
    };

    return (
        <div className="admin-planner-container" style={{ padding: '1rem' }}>
            {/* HDR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={28} className="text-primary" /> Planificator Meniu
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Gestionează meniul zilnic și necesarul de producție.</p>
                </div>

                {/* View Switcher */}
                <div className="view-switcher" style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setViewMode('daily')}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'daily' ? 'white' : 'transparent', fontWeight: '600', color: viewMode === 'daily' ? '#0f172a' : '#64748b', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                        <List size={16} /> Zilnic
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: viewMode === 'weekly' ? 'white' : 'transparent', fontWeight: '600', color: viewMode === 'weekly' ? '#0f172a' : '#64748b', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', boxShadow: viewMode === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                        <Grid size={16} /> Săptămânal
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Period Navigator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <button className="icon-btn" onClick={() => viewMode === 'daily' ? changeDate(-1) : changeWeek(-7)}><ChevronLeft size={20} /></button>
                        <span style={{ fontWeight: 'bold', fontSize: '1.05rem', minWidth: '200px', textAlign: 'center' }}>
                            {viewMode === 'daily'
                                ? selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })
                                : `Săpt: ${weekStart.toLocaleDateString('ro-RO')} - ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('ro-RO')}`
                            }
                        </span>
                        <button className="icon-btn" onClick={() => viewMode === 'daily' ? changeDate(1) : changeWeek(7)}><ChevronRight size={20} /></button>
                    </div>

                    <select
                        className="form-control"
                        style={{ width: '200px' }}
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="Toate">Toate Categoriile</option>
                        {categories.filter(c => c.type !== 'catering').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleGenerateReport}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#FFF7ED', color: '#C2410C',
                                border: '1px solid #FED7AA', borderRadius: '8px',
                                padding: '10px 16px', fontWeight: '600', fontSize: '0.9rem',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#FFEDD5'}
                            onMouseOut={e => e.currentTarget.style.background = '#FFF7ED'}
                        >
                            <FileText size={18} /> Generare Necesar
                        </button>

                        {viewMode === 'daily' && (
                            <button
                                onClick={copyFromYesterday}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: '#F8FAFC', color: '#475569',
                                    border: '1px solid #CBD5E1', borderRadius: '8px',
                                    padding: '10px 16px', fontWeight: '600', fontSize: '0.9rem',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'}
                                onMouseOut={e => e.currentTarget.style.background = '#F8FAFC'}
                            >
                                <Copy size={18} /> Copiază Ieri
                            </button>
                        )}

                        <button
                            onClick={viewMode === 'daily' ? saveDaily : saveWeekly}
                            disabled={saving}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: saving ? '#94a3b8' : '#16a34a', color: 'white',
                                border: 'none', borderRadius: '8px',
                                padding: '10px 24px', fontWeight: '600', fontSize: '0.95rem',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
                                opacity: saving ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !saving && (e.currentTarget.style.background = '#15803d')}
                            onMouseOut={(e) => !saving && (e.currentTarget.style.background = '#16a34a')}
                        >
                            {saving ? 'Se salvează...' : <><Save size={18} /> Salvează Tot</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            {loading || menuLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Se încarcă datele...</div>
            ) : (
                viewMode === 'daily' ? (
                    // --- RE-USE EXISTING DAILY GRID RENDER ---
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {displayProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => toggleItem(product.id)}
                                style={{
                                    padding: '1rem',
                                    background: activeItems.has(product.id) ? '#f0fdf4' : 'white',
                                    border: activeItems.has(product.id) ? '2px solid #16a34a' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '4px',
                                    border: `2px solid ${activeItems.has(product.id) ? '#16a34a' : '#cbd5e1'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {activeItems.has(product.id) && <div style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '2px' }} />}
                                </div>
                                {product.image && <img src={product.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />}
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                                </div>
                                {activeItems.has(product.id) && (
                                    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Porții</span>
                                        <input
                                            type="number" placeholder="∞" min="0"
                                            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                                            value={stockValues[product.id] ?? ''}
                                            onChange={(e) => setStockValues({ ...stockValues, [product.id]: e.target.value })}
                                        />
                                        <button
                                            onClick={(e) => handleOpenExtras(e, product)}
                                            title="Configurează Extra / Cross-sell"
                                            style={{
                                                width: '100%',
                                                padding: '4px', border: '1px solid #bbf7d0',
                                                background: '#dcfce7', borderRadius: '4px', cursor: 'pointer',
                                                color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginTop: '2px'
                                            }}
                                        >
                                            <Settings size={14} />
                                            <span style={{ marginLeft: '4px', fontSize: '0.7rem', fontWeight: '600' }}>Extra</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    renderWeeklyGrid()
                )
            )}
            {/* Modal */}
            <ConsumptionReportModal
                isOpen={isReportOpen}
                onClose={() => { setIsReportOpen(false); setPreviewData(null); }}
                dateRange={viewMode === 'daily'
                    ? { start: formatDate(selectedDate), end: formatDate(selectedDate) }
                    : {
                        start: formatDate(weekStart),
                        end: formatDate(new Date(weekStart.getTime() + 6 * 86400000))
                    }
                }
                categoryFilter={filterCategory}
                previewData={previewData}
            />

            {/* EXTRAS MODAL */}
            {isExtrasModalOpen && editingExtrasProduct && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Produse Extra: {editingExtrasProduct.name}</h3>
                            <button className="close-btn" onClick={() => setIsExtrasModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', background: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                                <Settings size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                Configurează produsele complementare pentru <strong>{editingExtrasProduct.name}</strong>.
                                <br/>
                                <span style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                                    Notă: Modificările se aplică DOAR pentru ziua selectată ({formatDate(selectedDate)}), suprascriind setările globale.
                                </span>
                            </p>

                            {/* Current Extras List */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', display: 'block', color: '#475569' }}>PRODUSE EXTRA ACTIVE ({currentExtras.length})</label>
                                {currentExtras.length === 0 ? (
                                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                                        Niciun produs extra selectat.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {currentExtras.map(extra => (
                                            <div key={extra.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {extra.image ? (
                                                        <img src={extra.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={16} color="#cbd5e1" /></div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{extra.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{extra.price} Lei</div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveExtra(extra.id)} 
                                                    style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                                                    title="Șterge"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search & Add */}
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#475569' }}>ADAUGĂ PRODUS NOU</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', background: 'white', focusWithin: { borderColor: '#2563eb', boxShadow: '0 0 0 2px rgba(37,99,235,0.1)' } }}>
                                    <Search size={18} color="#94a3b8" />
                                    <input
                                        type="text"
                                        placeholder="Caută produs (ex: Ardei, Smântână)..."
                                        value={extraSearchTerm}
                                        onChange={(e) => setExtraSearchTerm(e.target.value)}
                                        style={{ border: 'none', padding: '10px', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                                    />
                                    {extraSearchTerm && <button onClick={() => setExtraSearchTerm('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16}/></button>}
                                </div>
                                
                                {/* Results Dropdown */}
                                {extraSearchTerm.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                        maxHeight: '250px', overflowY: 'auto', zIndex: 100,
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                        marginTop: '4px'
                                    }}>
                                        {products
                                            .filter(p => p.id !== editingExtrasProduct.id)
                                            .filter(p => !currentExtras.some(e => e.id === p.id))
                                            .filter(p => p.name.toLowerCase().includes(extraSearchTerm.toLowerCase()))
                                            .map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectExtra(p)}
                                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <Plus size={16} color="#16a34a" />
                                                        <span style={{ fontWeight: '500' }}>{p.name}</span>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{p.price} Lei</span>
                                                </div>
                                            ))}
                                        {products.filter(p => p.name.toLowerCase().includes(extraSearchTerm.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '12px', color: '#64748b', textAlign: 'center', fontSize: '0.9rem' }}>Nu am găsit produse.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenuPlanner;
