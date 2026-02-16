
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Package, ChefHat, AlertTriangle, CheckCircle, XCircle, Download, Users, UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventProduction = ({ eventId }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [recipes, setRecipes] = useState([]);         // defined_recipes with ingredients
    const [refPrices, setRefPrices] = useState({});      // ingredient_id -> price_per_unit
    const [batchPrices, setBatchPrices] = useState({});   // item_id -> latest purchase_price
    const [inventoryStock, setInventoryStock] = useState({}); // item_id -> total stock
    const [guestCount, setGuestCount] = useState(0);
    const [portions, setPortions] = useState(1);          // editable portions count
    const [loading, setLoading] = useState(true);
    const [costMode, setCostMode] = useState('ref');     // 'ref' | 'reception'
    const [activeMenuType, setActiveMenuType] = useState('invitati');

    useEffect(() => { loadAll(); }, [eventId]);

    const loadAll = async () => {
        setLoading(true);

        // 1. Fetch event menu items (products added in Menu tab)
        const { data: items } = await supabase
            .from('event_menu_items')
            .select('*, products(id, name, price, category, weight)')
            .eq('event_id', eventId);
        setMenuItems(items || []);

        // 2. Fetch guest count
        const { data: guests } = await supabase
            .from('event_guests')
            .select('id')
            .eq('event_id', eventId);
        const gc = guests?.length || 0;
        setGuestCount(gc);
        setPortions(gc > 0 ? gc : 1); // Default to guest count, min 1

        // 3. Get unique product IDs from menu
        const productIds = [...new Set((items || []).map(i => i.product_id).filter(Boolean))];

        // 4. Fetch defined_recipes for those products
        let recipesData = [];
        if (productIds.length > 0) {
            const { data } = await supabase
                .from('defined_recipes')
                .select(`
                    id, name, linked_product_id,
                    recipes (
                        id, ingredient_id, quantity_required,
                        inventory_items (id, name, unit, stock)
                    )
                `)
                .in('linked_product_id', productIds);
            recipesData = data || [];
        }
        console.log('🍽️ Produse meniu:', productIds.length, 'Rețete găsite:', recipesData.length);
        recipesData.forEach(r => {
            console.log(`  Rețetă "${r.name}" (product ${r.linked_product_id}):`, r.recipes?.length, 'ingrediente');
            r.recipes?.forEach(ing => {
                console.log(`    - ${ing.inventory_items?.name}: qty=${ing.quantity_required} ${ing.inventory_items?.unit}`);
            });
        });
        setRecipes(recipesData);

        // 5. Fetch reference prices
        const { data: refData } = await supabase
            .from('recipe_ref_prices')
            .select('ingredient_id, price_per_unit');
        const refMap = {};
        (refData || []).forEach(r => { refMap[r.ingredient_id] = parseFloat(r.price_per_unit) || 0; });
        setRefPrices(refMap);

        // 6. Fetch latest batch prices (reception cost)
        const { data: batchData } = await supabase
            .from('inventory_batches')
            .select('item_id, purchase_price, quantity')
            .gt('quantity', 0)
            .order('created_at', { ascending: false });

        const batchMap = {};
        const stockMap = {};
        (batchData || []).forEach(b => {
            if (!batchMap[b.item_id]) {
                batchMap[b.item_id] = parseFloat(b.purchase_price) || 0; // Latest price
            }
            stockMap[b.item_id] = (stockMap[b.item_id] || 0) + (parseFloat(b.quantity) || 0);
        });
        setBatchPrices(batchMap);
        setInventoryStock(stockMap);

        setLoading(false);
    };

    // Build aggregated ingredient list
    const getAggregatedIngredients = (menuType) => {
        const relevantItems = menuItems.filter(i => i.menu_type === menuType);
        const aggregated = {}; // ingredient_id -> { name, unit, totalQty, stock, refPrice, batchPrice }

        relevantItems.forEach(menuItem => {
            const recipe = recipes.find(r => r.linked_product_id === menuItem.product_id);
            if (!recipe || !recipe.recipes) return;

            const portionMultiplier = portions * (parseFloat(menuItem.quantity_per_guest) || 1);

            recipe.recipes.forEach(ing => {
                const ingId = ing.ingredient_id;
                if (!ingId) return;

                const qtyNeeded = (parseFloat(ing.quantity_required) || 0) * portionMultiplier;
                const invItem = ing.inventory_items;

                if (!aggregated[ingId]) {
                    aggregated[ingId] = {
                        id: ingId,
                        name: invItem?.name || 'Necunoscut',
                        unit: invItem?.unit || '',
                        totalQty: 0,
                        stock: parseFloat(invItem?.stock) || 0,
                        batchStock: inventoryStock[ingId] || 0,
                        refPrice: refPrices[ingId] || 0,
                        batchPrice: batchPrices[ingId] || 0,
                        usedIn: []
                    };
                }
                aggregated[ingId].totalQty += qtyNeeded;
                const productName = menuItem.products?.name || '—';
                if (!aggregated[ingId].usedIn.includes(productName)) {
                    aggregated[ingId].usedIn.push(productName);
                }
            });
        });

        return Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name));
    };

    // Cost calculation
    const calculateTotalCost = (menuType) => {
        const ingredients = getAggregatedIngredients(menuType);
        return ingredients.reduce((sum, ing) => {
            const price = costMode === 'ref' ? ing.refPrice : ing.batchPrice;
            return sum + (ing.totalQty * price);
        }, 0);
    };

    const getCostPerPerson = (menuType) => {
        if (portions === 0) return 0;
        return calculateTotalCost(menuType) / portions;
    };

    // Get products per menu type with their recipe status
    const getMenuProducts = (menuType) => {
        const items = menuItems.filter(i => i.menu_type === menuType);
        const grouped = {};
        items.forEach(item => {
            const cat = item.category || 'Fără categorie';
            if (!grouped[cat]) grouped[cat] = [];
            const recipe = recipes.find(r => r.linked_product_id === item.product_id);
            grouped[cat].push({
                ...item,
                hasRecipe: !!recipe,
                ingredientCount: recipe?.recipes?.length || 0
            });
        });
        return grouped;
    };

    // Stock status
    const getStockStatus = (ing) => {
        const available = Math.max(ing.stock, ing.batchStock);
        if (available >= ing.totalQty) return { status: 'ok', label: 'În stoc', color: '#16a34a' };
        if (available > 0) return { status: 'partial', label: 'Parțial', color: '#f59e0b' };
        return { status: 'missing', label: 'Lipsă', color: '#ef4444' };
    };

    // Sanitize Romanian characters for PDF
    const sanitize = (str) => {
        if (!str) return '-';
        return str.toString()
            .replace(/ă/g, 'a').replace(/Ă/g, 'A')
            .replace(/â/g, 'a').replace(/Â/g, 'A')
            .replace(/î/g, 'i').replace(/Î/g, 'I')
            .replace(/ș/g, 's').replace(/Ș/g, 'S')
            .replace(/ț/g, 't').replace(/Ț/g, 'T')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
    };

    // Export PDF
    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFont('helvetica');

            // Header
            doc.setFontSize(16);
            doc.text(sanitize('Raport Productie Eveniment'), 14, 18);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const menuLabel = activeMenuType === 'invitati' ? 'Meniu Invitati' : 'Personal Chianti';
            doc.text(`${sanitize(menuLabel)} | Portii: ${portions} | Mod cost: ${costMode === 'ref' ? 'Preturi Referinta' : 'Cost Receptii'}`, 14, 26);
            doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 14, 32);
            doc.setTextColor(0, 0, 0);

            const ingredients = getAggregatedIngredients(activeMenuType);
            const tableData = ingredients.map(ing => {
                const price = costMode === 'ref' ? ing.refPrice : ing.batchPrice;
                const stock = Math.max(ing.stock, ing.batchStock);
                return [
                    sanitize(ing.name),
                    `${ing.totalQty.toFixed(2)} ${sanitize(ing.unit)}`,
                    `${stock.toFixed(2)} ${sanitize(ing.unit)}`,
                    stock >= ing.totalQty ? 'DA' : 'NU',
                    price > 0 ? `${price.toFixed(2)} RON/${sanitize(ing.unit)}` : '-',
                    price > 0 ? `${(price * ing.totalQty).toFixed(2)} RON` : '-'
                ];
            });

            const result = autoTable(doc, {
                head: [['Ingredient', 'Necesar', 'Stoc', 'Ok?', sanitize('Pret/U'), 'Cost Total']],
                body: tableData,
                startY: 38,
                styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
                headStyles: { fillColor: [153, 0, 0] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    3: { halign: 'center' },
                    4: { halign: 'right' },
                    5: { halign: 'right', fontStyle: 'bold' }
                }
            });

            const finalY = (result?.finalY || doc.lastAutoTable?.finalY || 50) + 12;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Cost Total: ${calculateTotalCost(activeMenuType).toFixed(2)} RON`, 14, finalY);
            doc.text(`Cost / Persoana: ${getCostPerPerson(activeMenuType).toFixed(2)} RON`, 14, finalY + 8);

            doc.save(`productie_eveniment_${eventId}.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Eroare la generarea PDF: ' + err.message);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Se calculează...</div>;

    const ingredients = getAggregatedIngredients(activeMenuType);
    const menuProducts = getMenuProducts(activeMenuType);
    const totalCost = calculateTotalCost(activeMenuType);
    const costPerPerson = getCostPerPerson(activeMenuType);

    const okCount = ingredients.filter(i => getStockStatus(i).status === 'ok').length;
    const warnCount = ingredients.filter(i => getStockStatus(i).status === 'partial').length;
    const missCount = ingredients.filter(i => getStockStatus(i).status === 'missing').length;

    return (
        <div>
            {/* Menu Type Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                    { key: 'invitati', label: 'Meniu Invitați', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
                    { key: 'personal', label: 'Personal Chianti', icon: UtensilsCrossed, color: '#f59e0b', bg: '#fffbeb' }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveMenuType(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px',
                            border: activeMenuType === t.key ? `2px solid ${t.color}` : '1px solid #e5e7eb',
                            background: activeMenuType === t.key ? t.bg : 'white',
                            cursor: 'pointer', fontWeight: activeMenuType === t.key ? '700' : '500',
                            color: activeMenuType === t.key ? t.color : '#6b7280',
                            fontSize: '0.9rem'
                        }}
                    >
                        <t.icon size={18} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase' }}>Porții</div>
                    <input
                        type="number"
                        min="1"
                        value={portions}
                        onChange={e => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                            width: '80px', textAlign: 'center', fontSize: '1.4rem', fontWeight: '800',
                            color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '8px',
                            padding: '4px', background: 'white', marginTop: '4px'
                        }}
                    />
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                        {guestCount > 0 ? `(${guestCount} invitați)` : 'Fără invitați'}
                    </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', textTransform: 'uppercase' }}>În Stoc</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#166534' }}>{okCount} / {ingredients.length}</div>
                </div>
                <div style={{ background: '#fefce8', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ca8a04', fontWeight: '600', textTransform: 'uppercase' }}>Parțial / Lipsă</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#a16207' }}>{warnCount + missCount}</div>
                </div>
                <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600', textTransform: 'uppercase' }}>Produse Meniu</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#5b21b6' }}>{menuItems.filter(i => i.menu_type === activeMenuType).length}</div>
                </div>
            </div>

            {/* Cost Summary */}
            <div style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                padding: '20px', marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>💰 Cost Estimat</h3>
                    <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
                        <button
                            onClick={() => setCostMode('ref')}
                            style={{
                                padding: '6px 14px', borderRadius: '6px', border: 'none',
                                background: costMode === 'ref' ? '#111827' : 'transparent',
                                color: costMode === 'ref' ? 'white' : '#6b7280',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                            }}
                        >
                            Prețuri Referință
                        </button>
                        <button
                            onClick={() => setCostMode('reception')}
                            style={{
                                padding: '6px 14px', borderRadius: '6px', border: 'none',
                                background: costMode === 'reception' ? '#111827' : 'transparent',
                                color: costMode === 'reception' ? 'white' : '#6b7280',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                            }}
                        >
                            Cost Recepții
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>Cost Total Ingrediente</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111827' }}>
                            {totalCost.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                        </div>
                    </div>
                    <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>Cost / Persoană</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#166534' }}>
                            {costPerPerson.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                        </div>
                    </div>
                </div>
            </div>

            {/* Products from Menu */}
            <div style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                padding: '20px', marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📋 Produse din Meniu</h3>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {guestCount > 0 ? `(${guestCount} invitați)` : `${portions} porții`}
                    </span>
                </div>

                {Object.keys(menuProducts).length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                        Niciun produs în meniu. Adăugați produse din tab-ul Meniu.
                    </div>
                )}

                {Object.entries(menuProducts).map(([category, prods]) => (
                    <div key={category} style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '0.8rem', fontWeight: '700', color: '#6b7280',
                            textTransform: 'uppercase', padding: '6px 0', borderBottom: '1px solid #f3f4f6'
                        }}>
                            {category}
                        </div>
                        {prods.map(p => (
                            <div key={p.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 0', borderBottom: '1px solid #f9fafb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: '500' }}>{p.products?.name || '—'}</span>
                                    {p.hasRecipe ? (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                                            background: '#f0fdf4', color: '#166534', fontWeight: '600'
                                        }}>
                                            {p.ingredientCount} ingrediente
                                        </span>
                                    ) : (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                                            background: '#fef2f2', color: '#dc2626', fontWeight: '600'
                                        }}>
                                            Fără rețetă
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {portions} porții
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Ingredients Table */}
            <div style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                padding: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>🧾 Necesar Ingrediente</h3>
                    <button
                        onClick={exportPDF}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', background: '#990000', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.85rem'
                        }}
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </div>

                {ingredients.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                        Niciun ingredient calculat. Verificați că produsele din meniu au rețete definite.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151' }}>Ingredient</th>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151' }}>Necesar</th>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151' }}>Stoc</th>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151' }}>Status</th>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151' }}>
                                        Preț / {costMode === 'ref' ? 'Ref' : 'Recepție'}
                                    </th>
                                    <th style={{ padding: '10px 12px', fontWeight: '600', color: '#374151', textAlign: 'right' }}>Cost Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map(ing => {
                                    const stockInfo = getStockStatus(ing);
                                    const price = costMode === 'ref' ? ing.refPrice : ing.batchPrice;
                                    const total = ing.totalQty * price;
                                    const availableStock = Math.max(ing.stock, ing.batchStock);

                                    return (
                                        <tr key={ing.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ fontWeight: '500', color: '#111827' }}>{ing.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                                                    Folosit în: {ing.usedIn.join(', ')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                                                {ing.totalQty.toFixed(2)} {ing.unit}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {availableStock.toFixed(2)} {ing.unit}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: stockInfo.status === 'ok' ? '#f0fdf4' : stockInfo.status === 'partial' ? '#fefce8' : '#fef2f2',
                                                    color: stockInfo.color
                                                }}>
                                                    {stockInfo.status === 'ok' && <CheckCircle size={12} />}
                                                    {stockInfo.status === 'partial' && <AlertTriangle size={12} />}
                                                    {stockInfo.status === 'missing' && <XCircle size={12} />}
                                                    {stockInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                                                {price > 0 ? `${price.toFixed(2)} RON/${ing.unit}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>
                                                {price > 0 ? `${total.toFixed(2)} RON` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#f9fafb', fontWeight: '700' }}>
                                    <td colSpan="5" style={{ padding: '12px', textAlign: 'right' }}>Total:</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '1rem', color: '#111827' }}>
                                        {totalCost.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventProduction;
