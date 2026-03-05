import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRecipes } from '../../../context/RecipeContext';
import { useInventory } from '../../../context/InventoryContext';
import { useMenu } from '../../../context/MenuContext';
import { Plus, Trash2, Edit2, Copy, Calculator, Save, CheckCircle, AlertTriangle, BookOpen, X, Settings, Check, FileDown } from 'lucide-react';
import InventorySearch from '../../../components/common/InventorySearch';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminRecipes = () => {
    const { recipes, addRecipe, updateRecipe, deleteRecipe, approveRecipeAsProduct } = useRecipes();
    const { items: inventoryItems, addItem } = useInventory();
    const { products, categories, addCategory, updateCategory, deleteCategory } = useMenu();

    const [activeTab, setActiveTab] = useState('manage');
    const [selectedCategory, setSelectedCategory] = useState('');

    // --- ROLE & PERMISSIONS ---
    const [adminRole, setAdminRole] = useState(null);
    useEffect(() => {
        const rawRole = localStorage.getItem('admin_role') || '';
        const role = rawRole.toLowerCase().trim();
        setAdminRole(role);
        
        if (role === 'cost_productie') {
            setActiveTab('cost_calculator');
        } else if (role === 'bucatar' || role === 'bucătar' || role === 'chef') {
            setActiveTab('manage');
        }
    }, []);

    // --- MOBILE CHECK ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


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

    // --- PRODUCT SEARCH STATE ---
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // --- RECIPE LIST SEARCH STATE ---
    const [recipeListSearchTerm, setRecipeListSearchTerm] = useState('');

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
            category: 'Materii Prime', // Was 'Ingrediente' - must match existing category
            stock: 0,
            unit: newItemUnit
        });
        setNewItemName('');
        setIsItemModalOpen(false);
    };

    // --- CALCULATOR STATE ---
    const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
    const [productionRows, setProductionRows] = useState([{ recipeId: '', portions: 1 }]); // Multiple recipes for production
    const [costRows, setCostRows] = useState([{ recipeId: '', portions: 1 }]); // Multiple recipes for cost calculation
    const [calculationResult, setCalculationResult] = useState(null);
    const [recipeCostResult, setRecipeCostResult] = useState(null); // For Cost Calculator
    const [refPrices, setRefPrices] = useState({}); // { ingredient_id: price }
    const [searchTermRef, setSearchTermRef] = useState('');
    const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
    const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);

    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchRefPrices();
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('id, name').order('name');
        if (data) setSuppliers(data);
    };

    const fetchRefPrices = async () => {
        const { data, error } = await supabase.from('recipe_ref_prices').select('*');
        if (data) {
            const map = {};
            data.forEach(item => {
                map[item.ingredient_id] = {
                    price: item.price_per_unit || 0,
                    vat: item.vat_rate || 0,
                    supplier_id: item.supplier_id || null,
                    updated_at: item.updated_at
                };
            });
            setRefPrices(map);
        }
    };

    const handlePriceChange = (ingredientId, field, value) => {
        setRefPrices(prev => {
            const current = prev[ingredientId] || { price: 0, vat: 0, supplier_id: null };
            let newPrice = current.price;
            let newVat = current.vat;
            let newSupplierId = current.supplier_id;

            if (field === 'price') newPrice = parseFloat(value) || 0;
            else if (field === 'vat') newVat = parseInt(value) || 0;
            else if (field === 'supplier') newSupplierId = value ? parseInt(value) : null;
            else if (field === 'total') {
                const total = parseFloat(value) || 0;
                newPrice = total / (1 + newVat / 100);
            }

            return { ...prev, [ingredientId]: { ...current, price: newPrice, vat: newVat, supplier_id: newSupplierId } };
        });
    };

    const saveRefPrice = async (ingredientId) => {
        const current = refPrices[ingredientId] || { price: 0, vat: 0, supplier_id: null };
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('recipe_ref_prices')
            .upsert({
                ingredient_id: ingredientId,
                price_per_unit: current.price,
                vat_rate: current.vat,
                supplier_id: current.supplier_id,
                updated_at: now
            }, { onConflict: 'ingredient_id' });

        if (error) {
            console.error(error);
            alert("Eroare la salvare! Verificați conexiunea.");
        } else {
            setRefPrices(prev => ({
                ...prev,
                [ingredientId]: { ...current, updated_at: now }
            }));
        }
    };

    const toggleRecipeSelection = (id) => {
        const newSet = new Set(selectedRecipeIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRecipeIds(newSet);
        setRecipeCostResult(null);
    };

    const getFilteredIngredients = () => {
        if (selectedRecipeIds.size === 0) return inventoryItems;
        const allowedIds = new Set();
        recipes.forEach(r => {
            if (selectedRecipeIds.has(r.id)) {
                r.ingredients.forEach(i => allowedIds.add(i.ingredient_id));
            }
        });
        return inventoryItems.filter(item => allowedIds.has(item.id));
    };

    const handleCostRowChange = (index, field, value) => {
        const newRows = [...costRows];
        if (field === 'recipeId') {
            newRows[index].recipeId = value;
        } else if (field === 'portions') {
            newRows[index].portions = value === '' ? 0 : (parseInt(value) || 0);
        }
        setCostRows(newRows);
        setRecipeCostResult(null);
    };

    const addCostRow = () => {
        setCostRows([...costRows, { recipeId: '', portions: 1 }]);
    };

    const removeCostRow = (index) => {
        if (costRows.length > 1) {
            const newRows = costRows.filter((_, i) => i !== index);
            setCostRows(newRows);
            setRecipeCostResult(null);
        }
    };

    const calculateRecipeCost = () => {
        const validRows = costRows.filter(row => row.recipeId && row.portions > 0);
        if (validRows.length === 0) return;

        let grandTotalNoVat = 0;
        let grandTotalWithVat = 0;
        const combinedIngredients = {}; // For aggregate view

        const recipesResult = validRows.map(row => {
            const recipe = recipes.find(r => r.id === parseInt(row.recipeId));
            if (!recipe) return null;

            const ingredientsCost = recipe.ingredients.map(ing => {
                if (!ing.ingredient_id) return null;
                const refData = refPrices[ing.ingredient_id] || { price: 0, vat: 0 };
                const price = parseFloat(refData.price) || 0;
                const vat = parseInt(refData.vat) || 0;

                const qtyForPortions = parseFloat(ing.qty) * row.portions;
                const costNoVat = qtyForPortions * price;
                const priceWithVat = price * (1 + vat / 100);
                const costWithVat = qtyForPortions * priceWithVat;

                // Aggregate for the "all ingredients" view
                if (!combinedIngredients[ing.ingredient_id]) {
                    const itemDef = inventoryItems.find(i => i.id === ing.ingredient_id);
                    combinedIngredients[ing.ingredient_id] = {
                        name: itemDef ? itemDef.name : 'N/A',
                        unit: itemDef ? itemDef.unit : '',
                        totalQty: 0,
                        totalCostNoVat: 0,
                        totalCostWithVat: 0,
                        refPrice: price,
                        refVat: vat
                    };
                }
                combinedIngredients[ing.ingredient_id].totalQty += qtyForPortions;
                combinedIngredients[ing.ingredient_id].totalCostNoVat += costNoVat;
                combinedIngredients[ing.ingredient_id].totalCostWithVat += costWithVat;

                return {
                    ...ing,
                    portions: row.portions,
                    qtyForPortions,
                    refPrice: price,
                    refVat: vat,
                    totalCostNoVat: costNoVat,
                    totalCostWithVat: costWithVat
                };
            }).filter(Boolean);

            const totalNoVat = ingredientsCost.reduce((acc, curr) => acc + curr.totalCostNoVat, 0);
            const totalWithVat = ingredientsCost.reduce((acc, curr) => acc + curr.totalCostWithVat, 0);

            grandTotalNoVat += totalNoVat;
            grandTotalWithVat += totalWithVat;

            return {
                id: recipe.id,
                name: recipe.name,
                portions: row.portions,
                ingredients: ingredientsCost,
                totalNoVat,
                totalWithVat
            };
        }).filter(Boolean);

        setRecipeCostResult({ 
            recipes: recipesResult, 
            aggregatedIngredients: Object.values(combinedIngredients),
            grandTotalNoVat, 
            grandTotalWithVat, 
            expandedId: null 
        });
    };

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

            // Pre-fill product search term
            if (recipe.linked_product_id) {
                const linkedProd = products.find(p => p.id === recipe.linked_product_id);
                setProductSearchTerm(linkedProd ? linkedProd.name : '');
            } else {
                setProductSearchTerm('');
            }
        } else {
            setEditingId(null);
            setRecipeForm({ name: '', category: '', linked_product_id: '', ingredients: [], preparation_method: '' }); // Reset category
            setProductSearchTerm('');
        }
        setIsModalOpen(true);
    };

    const duplicateRecipe = async (recipe) => {
        const data = {
            name: recipe.name + ' (copie)',
            category: recipe.category || null,
            linked_product_id: null,
            preparation_method: recipe.preparation_method || '',
            ingredients: recipe.ingredients.map(ing => ({
                ingredient_id: ing.ingredient_id,
                qty: ing.qty
            }))
        };
        const result = await addRecipe(data);
        if (result && result.success) {
            alert('Rețeta a fost duplicată cu succes! O puteți edita din listă.');
        }
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
        const validRows = productionRows.filter(row => row.recipeId && row.portions > 0);
        if (validRows.length === 0) return;

        const combinedIngredients = {}; // { ingredient_id: { needed, itemName, unit, item_id } }

        for (const row of validRows) {
            const recipe = recipes.find(r => r.id === parseInt(row.recipeId));
            if (!recipe) continue;

            for (const ing of recipe.ingredients) {
                if (!ing.ingredient_id) continue;

                const itemDef = inventoryItems.find(i => i.id === ing.ingredient_id);
                const itemName = itemDef ? itemDef.name : (ing.itemName || 'N/A');
                const unit = itemDef ? itemDef.unit : (ing.unit || '');
                const neededForThisRecipe = parseFloat(ing.qty) * row.portions;

                if (!combinedIngredients[ing.ingredient_id]) {
                    combinedIngredients[ing.ingredient_id] = {
                        needed: 0,
                        itemName: itemName,
                        unit: unit,
                        item_id: ing.ingredient_id
                    };
                }
                combinedIngredients[ing.ingredient_id].needed += neededForThisRecipe;
            }
        }

        const results = [];

        for (const ingredientId in combinedIngredients) {
            const ing = combinedIngredients[ingredientId];

            // Fetch batches FIFO
            const { data: batches } = await supabase
                .from('inventory_batches')
                .select('*')
                .eq('item_id', ingredientId)
                .gt('quantity', 0)
                .order('expiration_date', { ascending: true }) // FIFO
                .order('created_at', { ascending: true });

            const totalAvailable = batches ? batches.reduce((acc, b) => acc + b.quantity, 0) : 0;

            results.push({
                itemName: ing.itemName,
                item_id: parseInt(ingredientId),
                needed: ing.needed,
                unit: ing.unit,
                available: totalAvailable,
                batches: batches || [],
                isSufficient: totalAvailable >= (ing.needed - 0.0001)
            });
        }

        setCalculationResult(results);
    };

    const handleDeductStock = async () => {
        const validRows = productionRows.filter(row => row.recipeId && row.portions > 0);
        if (!calculationResult || validRows.length === 0) return;

        const recipeNames = validRows.map(row => {
            const r = recipes.find(rec => rec.id === parseInt(row.recipeId));
            return `${row.portions} x ${r?.name || 'N/A'}`;
        }).join(', ');

        if (!window.confirm(`Sigur doriți să scădeți ingredientele pentru următoarele rețete: ${recipeNames}?`)) return;

        const adminName = localStorage.getItem('admin_name') || 'Admin';

        try {
            for (const res of calculationResult) {
                let remainingNeeded = res.needed;

                for (const batch of res.batches) {
                    if (remainingNeeded <= 0.0001) break;

                    const currentStock = batch.quantity;
                    let take = 0;

                    if (currentStock >= remainingNeeded) {
                        take = remainingNeeded;
                        remainingNeeded = 0;
                    } else {
                        take = currentStock;
                        remainingNeeded -= currentStock;
                    }

                    const { error: batchErr } = await supabase
                        .from('inventory_batches')
                        .update({ quantity: currentStock - take })
                        .eq('id', batch.id);

                    if (batchErr) throw batchErr;

                    await supabase.from('inventory_transactions').insert([{
                        transaction_type: 'OUT',
                        batch_id: batch.id,
                        item_id: res.item_id,
                        quantity: take,
                        reason: `Producție Multi-Rețetă: ${recipeNames}`,
                        operator_name: adminName
                    }]);
                }
            }

            await supabase.from('admin_logs').insert([{
                admin_name: adminName,
                action: 'PRODUCTIE',
                details: `S-au produs: ${recipeNames}. Stocul a fost scăzut (FIFO).`,
                created_at: new Date().toISOString()
            }]);

            alert("Stocul a fost actualizat cu succes!");
            setCalculationResult(null);
            setProductionRows([{ recipeId: '', portions: 1 }]);
        } catch (error) {
            console.error(error);
            alert("Eroare la actualizarea stocului: " + error.message);
        }
    };

    // Helper to get unique ingredient names for Select
    const uniqueInventoryNames = [...new Set(inventoryItems.map(i => i.name))].sort();

    const removeDiacritics = (str) => {
        if (!str) return "";
        return str.toString()
            .replace(/ă/g, 'a').replace(/Ă/g, 'A')
            .replace(/â/g, 'a').replace(/Â/g, 'A')
            .replace(/î/g, 'i').replace(/Î/g, 'I')
            .replace(/ș/g, 's').replace(/Ș/g, 'S')
            .replace(/ț/g, 't').replace(/Ț/g, 'T')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ţ/g, 't').replace(/Ţ/g, 'T')
            .replace(/[^\x00-\x7F]/g, ''); // Remove any remaining non-ASCII (emojis, etc.)
    }

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica');

        // Title
        doc.setFontSize(18);
        doc.setTextColor(153, 0, 0); // #990000
        doc.text(removeDiacritics("Prețuri Referință Ingrediente"), 14, 22);

        // Subtitle (Date + Filter Info)
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString('ro-RO');
        let filterText = "Toate ingredientele";
        if (selectedRecipeIds.size > 0) {
            filterText = `${selectedRecipeIds.size} retete selectate`;
        }
        doc.text(removeDiacritics(`Data: ${dateStr} | Filtru: ${filterText}`), 14, 30);

        // Table Data
        const filteredItems = getFilteredIngredients();
        const tableData = filteredItems.map(item => {
            const refData = refPrices[item.id] || { price: 0, vat: 0, supplier_id: null, updated_at: null };
            const supplier = suppliers.find(s => s.id === refData.supplier_id);
            const price = parseFloat(refData.price) || 0;
            const vat = parseInt(refData.vat) || 0;
            const priceWithVat = price * (1 + vat / 100);

            return [
                removeDiacritics(item.name || ''),
                removeDiacritics(item.unit || ''),
                `${price.toFixed(2)} RON`,
                `${vat}%`,
                `${priceWithVat.toFixed(2)} RON`,
                refData.updated_at ? new Date(refData.updated_at).toLocaleDateString('ro-RO') : '-',
                removeDiacritics(supplier ? supplier.name : '-')
            ];
        });

        // Generate Table
        autoTable(doc, {
            startY: 35,
            head: [['Ingredient', 'UM', 'Pret FARA TVA', 'TVA', 'Pret CU TVA', 'Actualizat', 'Furnizor']],
            body: tableData,
            headStyles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold' }, // #990000
            alternateRowStyles: { fillColor: [248, 250, 252] }, // #f8fafc
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Ingredient
                1: { cellWidth: 15 }, // UM
                2: { cellWidth: 25, halign: 'right' }, // Net
                3: { cellWidth: 15, halign: 'center' }, // TVA
                4: { cellWidth: 25, halign: 'right' }, // Brut
                5: { cellWidth: 25, halign: 'center' }, // Date
                6: { cellWidth: 'auto' } // Supplier
            }
        });

        doc.save(`Preturi_Referinta_${dateStr.replace(/\./g, '-')}.pdf`);
    };

    const exportProductionToPDF = () => {
        if (!calculationResult) return;
        const doc = new jsPDF();
        doc.setFont('helvetica');

        // Title
        doc.setFontSize(18);
        doc.setTextColor(153, 0, 0); // #990000
        doc.text(removeDiacritics("Necesar Productie (FIFO)"), 14, 22);

        // Date
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString('ro-RO');
        doc.text(removeDiacritics(`Data: ${dateStr}`), 14, 30);

        // Selected Recipes
        const validRows = productionRows.filter(row => row.recipeId);
        let yPos = 40;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(removeDiacritics("Retete de produs:"), 14, yPos);
        yPos += 7;

        doc.setFontSize(10);
        validRows.forEach(row => {
            const recipe = recipes.find(r => r.id === parseInt(row.recipeId));
            doc.text(removeDiacritics(`- ${row.portions} x ${recipe?.name || 'N/A'}`), 14, yPos);
            yPos += 6;
        });

        // Ingredients Table
        const tableData = calculationResult.map(res => [
            removeDiacritics(res.itemName || ''),
            `${res.needed.toFixed(2)} ${removeDiacritics(res.unit || '')}`,
            `${res.available.toFixed(2)} ${removeDiacritics(res.unit || '')}`,
            res.isSufficient ? 'OK' : 'INSUFICIENT'
        ]);

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Ingredient', 'Necesar Total', 'Disponibil', 'Status']],
            body: tableData,
            headStyles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'right' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 30, halign: 'center' }
            }
        });

        // Preparation Methods
        let finalY = doc.lastAutoTable.finalY + 15;
        
        validRows.forEach(row => {
            const recipe = recipes.find(r => r.id === parseInt(row.recipeId));
            if (recipe?.preparation_method) {
                // Check if we need a new page
                if (finalY > 250) {
                    doc.addPage();
                    finalY = 20;
                }

                doc.setFontSize(12);
                doc.setTextColor(153, 0, 0);
                doc.text(removeDiacritics(`Mod de preparare: ${recipe.name}`), 14, finalY);
                finalY += 7;

                doc.setFontSize(9);
                doc.setTextColor(0);
                const splitText = doc.splitTextToSize(removeDiacritics(recipe.preparation_method), 180);
                doc.text(splitText, 14, finalY);
                finalY += (splitText.length * 5) + 10;
            }
        });

        doc.save(`Necesar_Productie_${dateStr.replace(/\./g, '-')}.pdf`);
    };

    const exportCostCalculatorToPDF = () => {
        if (!recipeCostResult) return;
        const doc = new jsPDF();
        doc.setFont('helvetica');

        // Title
        doc.setFontSize(18);
        doc.setTextColor(153, 0, 0); // #990000
        doc.text(removeDiacritics("Necesar Consum si Costuri"), 14, 22);

        // Date
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString('ro-RO');
        doc.text(removeDiacritics(`Data: ${dateStr}`), 14, 30);

        // Totals
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(removeDiacritics(`TOTAL FARA TVA: ${recipeCostResult.grandTotalNoVat.toFixed(2)} RON`), 14, 40);
        doc.text(removeDiacritics(`TOTAL CU TVA: ${recipeCostResult.grandTotalWithVat.toFixed(2)} RON`), 14, 47);

        // Selected Recipes
        let yPos = 57;
        doc.setFontSize(11);
        doc.text(removeDiacritics("Rețete incluse:"), 14, yPos);
        yPos += 6;
        doc.setFontSize(10);
        recipeCostResult.recipes.forEach(r => {
            doc.text(removeDiacritics(`- ${r.portions} x ${r.name}`), 14, yPos);
            yPos += 5;
        });

        // Aggregated Table
        const tableData = recipeCostResult.aggregatedIngredients.map(ing => [
            removeDiacritics(ing.name),
            `${ing.totalQty.toFixed(3)} ${removeDiacritics(ing.unit)}`,
            `${ing.refPrice.toFixed(2)}`,
            `${ing.refVat}%`,
            `${ing.totalCostNoVat.toFixed(2)}`,
            `${ing.totalCostWithVat.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Ingredient', 'Cantitate', 'Pret Unit', 'TVA', 'Total Net', 'Total Brut']],
            body: tableData,
            headStyles: { fillColor: [153, 0, 0], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 9, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'right' },
                2: { cellWidth: 25, halign: 'right' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' }
            }
        });

        doc.save(`Calculator_Costuri_${dateStr.replace(/\./g, '-')}.pdf`);
    };

    // Helper to check if user is a cook
    const isCook = adminRole === 'bucatar' || adminRole === 'bucătar' || adminRole === 'chef';

    return (
        <div className="admin-recipes" style={{ padding: '1rem' }}>
            {/* Header Tabs (Conditional display based on role) */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                {adminRole !== 'cost_productie' && (
                    <button
                        className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manage')}
                        style={{ padding: '1rem', border: 'none', background: 'none', borderBottom: activeTab === 'manage' ? '2px solid #990000' : 'none', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'manage' ? '#990000' : '#64748b', flex: isMobile ? '1 1 100%' : 'initial' }}
                    >
                        Gestionare Rețete
                    </button>
                )}

                {!isCook && (
                    <button
                        className={`tab-btn ${activeTab === 'cost_calculator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cost_calculator')}
                        style={{ padding: '1rem', border: 'none', background: 'none', borderBottom: activeTab === 'cost_calculator' ? '2px solid #990000' : 'none', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'cost_calculator' ? '#990000' : '#64748b', flex: isMobile ? '1 1 100%' : 'initial' }}
                    >
                        Prețuri Referință & Costuri
                    </button>
                )}

                {!isCook && adminRole !== 'cost_productie' && (
                    <button
                        className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
                        onClick={() => setActiveTab('production')}
                        style={{ padding: '1rem', border: 'none', background: 'none', borderBottom: activeTab === 'production' ? '2px solid #990000' : 'none', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'production' ? '#990000' : '#64748b', flex: isMobile ? '1 1 100%' : 'initial' }}
                    >
                        Producție (Scădere Stoc)
                    </button>
                )}
            </div>

            {/* --- TAB 1: MANAGE RECIPES --- */}
            {
                activeTab === 'manage' && (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => openModal()}>
                                    <Plus size={18} /> Adaugă Rețetă Nouă
                                </button>
                                <button className="btn btn-secondary" onClick={() => setIsCatManagerOpen(true)}>
                                    <Settings size={18} /> Gestionare Categorii
                                </button>
                            </div>

                            {/* SEARCH & CATEGORY FILTER */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
                                    <input
                                        type="text"
                                        placeholder="Caută rețetă..."
                                        value={recipeListSearchTerm}
                                        onChange={(e) => setRecipeListSearchTerm(e.target.value)}
                                        style={{ padding: '0.5rem', paddingLeft: '2rem', width: '100%', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    />
                                    <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                                </div>
                                <div style={{ minWidth: '200px' }}>
                                    <select
                                        className="form-control"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                    >
                                        <option value="">Toate Categoriile</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="recipes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {recipes
                                .filter(r => {
                                    const matchesCategory = !selectedCategory || r.category === selectedCategory;
                                    const matchesSearch = r.name.toLowerCase().includes(recipeListSearchTerm.toLowerCase());
                                    return matchesCategory && matchesSearch;
                                })
                                .map(recipe => (
                                    <div key={recipe.id} className="recipe-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0 }}>{recipe.name}</h3>
                                            <div>
                                                <button className="btn-icon" onClick={() => duplicateRecipe(recipe)} title="Duplică" style={{ marginRight: '0.5rem', color: '#2563eb' }}><Copy size={16} /></button>
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
                                        <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => approveRecipeAsProduct(recipe)}
                                                disabled={!!recipe.linked_product_id && products.some(p => p.id === recipe.linked_product_id)}
                                                style={{
                                                    width: '100%',
                                                    background: (recipe.linked_product_id && products.some(p => p.id === recipe.linked_product_id)) ? '#e2e8f0' : '#16a34a',
                                                    color: (recipe.linked_product_id && products.some(p => p.id === recipe.linked_product_id)) ? '#94a3b8' : 'white',
                                                    cursor: (recipe.linked_product_id && products.some(p => p.id === recipe.linked_product_id)) ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                {(recipe.linked_product_id && products.some(p => p.id === recipe.linked_product_id)) ? (
                                                    <>
                                                        <CheckCircle size={16} /> Produs Aprobat
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={16} /> {recipe.linked_product_id ? 'Refă Produs (Link Spart)' : 'Aprobă ca Produs'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )
            }

            {/* --- TAB 2: COST CALCULATOR & REF PRICES --- */}
            {
                activeTab === 'cost_calculator' && !isCook && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* RECIPE MULTI-SELECTOR (SHARED) */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h3>Filtrare Rețete</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Selectați una sau mai multe rețete pentru a filtra lista de ingrediente (mai jos) și pentru a calcula costurile cumulate.
                            </p>

                            <div style={{ position: 'relative' }}>
                                <div
                                    className="form-control"
                                    onClick={() => setShowRecipeDropdown(!showRecipeDropdown)}
                                    style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <span>
                                        {selectedRecipeIds.size === 0
                                            ? 'Selectează Rețete...'
                                            : `${selectedRecipeIds.size} rețete selectate (${Array.from(selectedRecipeIds).map(id => recipes.find(r => r.id === id)?.name).join(', ').slice(0, 50)}${selectedRecipeIds.size > 2 ? '...' : ''})`}
                                    </span>
                                    <span style={{ fontSize: '0.8rem' }}>▼</span>
                                </div>

                                {showRecipeDropdown && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                        maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '5px'
                                    }}>
                                        <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Caută rețetă..."
                                                value={recipeSearchTerm}
                                                onChange={(e) => setRecipeSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                                            <button
                                                className="btn-text"
                                                onClick={(e) => { e.stopPropagation(); setSelectedRecipeIds(new Set(recipes.map(r => r.id))); }}
                                                style={{ fontSize: '0.8rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Selectează Tot
                                            </button>
                                            <button
                                                className="btn-text"
                                                onClick={(e) => { e.stopPropagation(); setSelectedRecipeIds(new Set()); }}
                                                style={{ fontSize: '0.8rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Deselectează Tot
                                            </button>
                                        </div>
                                        {recipes
                                            .filter(r => r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()))
                                            .map(r => (
                                                <div
                                                    key={r.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRecipeSelection(r.id);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        background: selectedRecipeIds.has(r.id) ? '#f0f9ff' : 'white'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #cbd5e1',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: selectedRecipeIds.has(r.id) ? '#0284c7' : 'white',
                                                        borderColor: selectedRecipeIds.has(r.id) ? '#0284c7' : '#cbd5e1'
                                                    }}>
                                                        {selectedRecipeIds.has(r.id) && <Check size={12} color="white" />}
                                                    </div>
                                                    <span>{r.name}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* REFERENCE PRICES SECTION (FILTERED) */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h3>Prețuri de Referință (Ingrediente)</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {selectedRecipeIds.size > 0
                                            ? `Se afișează ingredientele pentru cele ${selectedRecipeIds.size} rețete selectate.`
                                            : 'Se afișează TOATE ingredientele din sistem.'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Caută în listă..."
                                            value={searchTermRef}
                                            onChange={e => setSearchTermRef(e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    <button
                                        className="btn"
                                        onClick={exportToPDF}
                                        style={{ background: '#990000', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                                    >
                                        <FileDown size={18} /> Export PDF
                                    </button>
                                </div>
                            </div>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Ingredient</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Unitate</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Preț Unit. (FĂRĂ TVA)</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>TVA</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Preț Unit. (CU TVA)</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Furnizor</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Ultima Actualizare</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredIngredients()
                                            .filter(item => item.name.toLowerCase().includes(searchTermRef.toLowerCase()))
                                            .map(item => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: 'white' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.name}</td>
                                                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{item.unit}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={refPrices[item.id]?.price || ''}
                                                                onChange={(e) => handlePriceChange(item.id, 'price', e.target.value)}
                                                                onBlur={() => saveRefPrice(item.id)}
                                                                style={{ width: '90px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>RON</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <select
                                                            value={refPrices[item.id]?.vat || 0}
                                                            onChange={(e) => handlePriceChange(item.id, 'vat', e.target.value)}
                                                            onBlur={() => saveRefPrice(item.id)}
                                                            style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
                                                        >
                                                            <option value="0">0%</option>
                                                            <option value="11">11%</option>
                                                            <option value="21">21%</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={refPrices[item.id] ? (refPrices[item.id].price * (1 + (refPrices[item.id].vat || 0) / 100)).toFixed(2) : ''}
                                                                onChange={(e) => handlePriceChange(item.id, 'total', e.target.value)}
                                                                onBlur={() => saveRefPrice(item.id)}
                                                                style={{ width: '90px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }}
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>RON</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <select
                                                            value={refPrices[item.id]?.supplier_id || ''}
                                                            onChange={(e) => {
                                                                handlePriceChange(item.id, 'supplier', e.target.value);
                                                                // Trigger save on change for supplier (better UX or onBlur? onBlur consistent but select often changes immediately)
                                                            }}
                                                            onBlur={() => saveRefPrice(item.id)}
                                                            style={{ maxWidth: '150px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                                                        >
                                                            <option value="">Fără Furnizor</option>
                                                            {suppliers.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                        {refPrices[item.id]?.updated_at ? new Date(refPrices[item.id].updated_at).toLocaleDateString('ro-RO') : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        {getFilteredIngredients().length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    Niciun ingredient găsit. Încercați să selectați alte rețete sau ștergeți filtrul.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* COST CALCULATOR SECTION (MULTI) - HIDDEN FOR COST_PRODUCTIE */}
                        {adminRole !== 'cost_productie' && (
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>Calculator Necesar Consum & Costuri</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Selectează rețetele și numărul de porții pentru a calcula necesarul agregat.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {recipeCostResult && (
                                            <button
                                                className="btn"
                                                onClick={exportCostCalculatorToPDF}
                                                style={{ background: '#990000', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <FileDown size={18} /> Export PDF Rezultat
                                            </button>
                                        )}
                                        <button className="btn btn-primary" onClick={calculateRecipeCost} disabled={costRows.every(r => !r.recipeId)}>
                                            <Calculator size={18} /> Calculează Costuri
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    {costRows.map((row, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Alege Rețeta</label>
                                                <select
                                                    className="form-control"
                                                    value={row.recipeId}
                                                    onChange={(e) => handleCostRowChange(index, 'recipeId', e.target.value)}
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                >
                                                    <option value="">-- Selectează --</option>
                                                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ width: '120px' }}>
                                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Nr. Porții</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={row.portions === 0 ? '' : row.portions}
                                                    onChange={(e) => handleCostRowChange(index, 'portions', e.target.value)}
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => removeCostRow(index)}
                                                disabled={costRows.length === 1}
                                                style={{ marginBottom: '5px', padding: '8px' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addCostRow}
                                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.5rem' }}
                                    >
                                        <Plus size={16} /> Adaugă o altă rețetă
                                    </button>
                                </div>

                                {recipeCostResult && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                            <div style={{ background: '#f0fdf4', padding: '1.2rem', borderRadius: '8px', border: '1px solid #bbf7d0', flex: 1 }}>
                                                <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold', marginBottom: '0.2rem' }}>TOTAL GENERAL (FĂRĂ TVA)</div>
                                                <div style={{ fontSize: '1.8rem', color: '#16a34a', fontWeight: 'bold' }}>{recipeCostResult.grandTotalNoVat?.toFixed(2)} RON</div>
                                            </div>
                                            <div style={{ background: '#fef2f2', padding: '1.2rem', borderRadius: '8px', border: '1px solid #fecaca', flex: 1 }}>
                                                <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold', marginBottom: '0.2rem' }}>TOTAL GENERAL (CU TVA)</div>
                                                <div style={{ fontSize: '1.8rem', color: '#dc2626', fontWeight: 'bold' }}>{recipeCostResult.grandTotalWithVat?.toFixed(2)} RON</div>
                                            </div>
                                        </div>

                                        <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Ingrediente Agregate (Total Consum)</h4>
                                        <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                                        <th style={{ padding: '0.8rem', textAlign: 'left' }}>Ingredient</th>
                                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Cantitate Totală</th>
                                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Preț Unit. Ref</th>
                                                        <th style={{ padding: '0.8rem', textAlign: 'center' }}>TVA</th>
                                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Total Net</th>
                                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Total Brut</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recipeCostResult.aggregatedIngredients.map((ing, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                                                            <td style={{ padding: '0.8rem', fontWeight: '500' }}>{ing.name}</td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{ing.totalQty.toFixed(3)} {ing.unit}</td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{ing.refPrice.toFixed(2)}</td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'center' }}>{ing.refVat}%</td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{ing.totalCostNoVat.toFixed(2)}</td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold' }}>{ing.totalCostWithVat.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Defalcare pe Rețete</h4>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Rețetă</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Porții</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Nr. Ingrediente</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Cost (FĂRĂ TVA)</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Cost (CU TVA)</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Acțiuni</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recipeCostResult.recipes.map((res, idx) => (
                                                        <React.Fragment key={res.id}>
                                                            <tr
                                                                style={{ borderBottom: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                                                                onClick={() => setRecipeCostResult(prev => ({ ...prev, expandedId: prev.expandedId === res.id ? null : res.id }))}
                                                            >
                                                                <td style={{ padding: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    {recipeCostResult.expandedId === res.id ? '▼' : '▶'} {res.name}
                                                                </td>
                                                                <td style={{ padding: '1rem', textAlign: 'right' }}>{res.portions}</td>
                                                                <td style={{ padding: '1rem', textAlign: 'right' }}>{res.ingredients.length}</td>
                                                                <td style={{ padding: '1rem', textAlign: 'right' }}>{res.totalNoVat.toFixed(2)} RON</td>
                                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{res.totalWithVat.toFixed(2)} RON</td>
                                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                                    <button className="btn-text" style={{ color: '#2563eb' }}>Detalii</button>
                                                                </td>
                                                            </tr>
                                                            {recipeCostResult.expandedId === res.id && (
                                                                <tr style={{ background: '#f8fafc' }}>
                                                                    <td colSpan="6" style={{ padding: '1rem' }}>
                                                                        <table style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white' }}>
                                                                            <thead>
                                                                                <tr style={{ background: '#f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
                                                                                    <th style={{ padding: '0.5rem' }}>Ingredient</th>
                                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cantitate / Rețetă</th>
                                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cantitate x {res.portions} porții</th>
                                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Preț Unit</th>
                                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Net</th>
                                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total Brut</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {res.ingredients.map((ing, i) => (
                                                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                                                                                        <td style={{ padding: '0.5rem' }}>{inventoryItems.find(x => x.id === ing.ingredient_id)?.name}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{ing.qty} {ing.unit}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{ing.qtyForPortions.toFixed(3)} {ing.unit}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{ing.refPrice.toFixed(2)}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{ing.totalCostNoVat.toFixed(2)}</td>
                                                                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{ing.totalCostWithVat.toFixed(2)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div >
                )
            }

            {/* --- TAB 3: PRODUCTION --- */}
            {
                activeTab === 'production' && !isCook && (
                    <div>
                        <div className="calculator-panel" style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3>Calculator Producție (FIFO)</h3>
                            
                            {productionRows.map((row, index) => (
                                <div key={index} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: index < productionRows.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '1rem' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Alege Produsul / Rețeta</label>
                                        <select
                                            className="form-control"
                                            value={row.recipeId}
                                            onChange={(e) => {
                                                const newRows = [...productionRows];
                                                newRows[index].recipeId = e.target.value;
                                                setProductionRows(newRows);
                                                setCalculationResult(null);
                                            }}
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
                                            value={row.portions === 0 ? '' : row.portions}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newRows = [...productionRows];
                                                newRows[index].portions = val === '' ? 0 : (parseInt(val) || 0);
                                                setProductionRows(newRows);
                                                setCalculationResult(null);
                                            }}
                                            min="1"
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {productionRows.length > 1 && (
                                            <button 
                                                className="btn btn-danger" 
                                                onClick={() => {
                                                    const newRows = productionRows.filter((_, i) => i !== index);
                                                    setProductionRows(newRows);
                                                    setCalculationResult(null);
                                                }}
                                                style={{ padding: '0.6rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                title="Elimină"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {index === productionRows.length - 1 && (
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => setProductionRows([...productionRows, { recipeId: '', portions: 1 }])}
                                                style={{ padding: '0.6rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                title="Adaugă Rețetă"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={calculateRequirements} 
                                    disabled={productionRows.some(row => !row.recipeId || row.portions <= 0)}
                                    style={{ padding: '0.8rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#990000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    <Calculator size={20} /> CALCULEAZĂ NECESAR
                                </button>
                            </div>

                            {calculationResult && (
                                <div style={{ marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0 }}>Rezultat Necesar Agregat:</h4>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={exportProductionToPDF}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <FileDown size={18} /> Export PDF
                                        </button>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        {productionRows.filter(row => row.recipeId).map(row => {
                                            const recipe = recipes.find(r => r.id === parseInt(row.recipeId));
                                            if (!recipe?.preparation_method) return null;
                                            return (
                                                <div key={recipe.id} style={{ background: '#f8fafc', padding: '1rem', borderLeft: '4px solid #990000', borderRadius: '4px' }}>
                                                    <h5 style={{ marginTop: 0, color: '#990000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <BookOpen size={18} /> {recipe.name} - Mod de preparare:
                                                    </h5>
                                                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                                        {recipe.preparation_method}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                                <th style={{ padding: '1rem' }}>Ingredient</th>
                                                <th style={{ padding: '1rem' }}>Necesar Total</th>
                                                <th style={{ padding: '1rem' }}>Disponibil Total</th>
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
                                            style={{ 
                                                background: calculationResult.every(r => r.isSufficient) ? '#990000' : '#cbd5e1', 
                                                color: 'white', 
                                                cursor: calculationResult.every(r => r.isSufficient) ? 'pointer' : 'not-allowed',
                                                padding: '0.6rem 1.2rem',
                                                border: 'none',
                                                borderRadius: '6px'
                                            }}
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
                )
            }

            {/* CATEGORY MANAGER MODAL */}
            {
                isCatManagerOpen && (
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
                )
            }

            {/* --- MODAL --- */}
            {
                isModalOpen && (
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

                                <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Asociază cu Produs din Meniu (Opțional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        placeholder="Caută și selectează produs..."
                                        value={productSearchTerm}
                                        onChange={(e) => {
                                            setProductSearchTerm(e.target.value);
                                            setShowProductDropdown(true);
                                            if (e.target.value === '') {
                                                setRecipeForm({ ...recipeForm, linked_product_id: '' });
                                            }
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                    />
                                    {showProductDropdown && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
                                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px',
                                            maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}>
                                            <div
                                                onClick={() => {
                                                    setRecipeForm({ ...recipeForm, linked_product_id: '' });
                                                    setProductSearchTerm('');
                                                    setShowProductDropdown(false);
                                                }}
                                                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}
                                            >
                                                -- Niciunul (Elimină Asocierea) --
                                            </div>
                                            {products
                                                .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                                .map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            setRecipeForm({
                                                                ...recipeForm,
                                                                linked_product_id: p.id,
                                                                name: (recipeForm.name === '' && p) ? p.name : recipeForm.name
                                                            });
                                                            setProductSearchTerm(p.name);
                                                            setShowProductDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '0.5rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            background: recipeForm.linked_product_id === p.id ? '#f0f9ff' : 'white'
                                                        }}
                                                    >
                                                        {p.name} <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>({p.category})</span>
                                                    </div>
                                                ))}
                                            {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                                                <div style={{ padding: '0.5rem', color: '#94a3b8' }}>Niciun rezultat.</div>
                                            )}
                                        </div>
                                    )}
                                    {/* Overlay to close dropdown when clicking outside */}
                                    {showProductDropdown && (
                                        <div
                                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 55, background: 'transparent' }}
                                            onClick={() => setShowProductDropdown(false)}
                                        />
                                    )}
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
                )
            }
        </div >
    );
};

export default AdminRecipes;
