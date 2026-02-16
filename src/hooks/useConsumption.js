import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useConsumption = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateNeeds = useCallback(async ({ startDate, endDate, categoryFilter = null, customItems = null }) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Daily Menu Items OR Use Custom Items
            let menuItems = [];

            if (customItems) {
                // Use provided preview data
                menuItems = customItems;
            } else {
                // Fetch from DB
                let menuQuery = supabase
                    .from('daily_menu_items')
                    .select('product_id, stock, date');

                if (startDate && endDate) {
                    menuQuery = menuQuery.gte('date', startDate).lte('date', endDate);
                } else if (startDate) {
                    menuQuery = menuQuery.eq('date', startDate);
                }

                const { data, error: menuError } = await menuQuery;
                if (menuError) throw menuError;
                menuItems = data || [];
            }

            if (!menuItems || menuItems.length === 0) {
                return [];
            }

            // Optional: Filter by Category (requires fetching product details first or using a join if schema allows)
            // Ideally, we fetch product details for all items to get names and categories.
            const uniqueProductIds = [...new Set(menuItems.map(m => m.product_id))];

            let productQuery = supabase
                .from('products')
                .select('id, name, category')
                .in('id', uniqueProductIds);

            const { data: productDetails, error: prodError } = await productQuery;
            if (prodError) throw prodError;

            // Apply Category Filter in-memory
            let filteredProductIds = uniqueProductIds;
            if (categoryFilter && categoryFilter !== 'Toate') {
                filteredProductIds = productDetails
                    .filter(p => p.category === categoryFilter)
                    .map(p => p.id);
            }

            // Filter menu items based on filtered products
            const relevantMenuItems = menuItems.filter(m => filteredProductIds.includes(m.product_id));
            if (relevantMenuItems.length === 0) return [];

            // 2. Get Recipes for these products
            // Step 2a: Get Recipe Headers (link product -> recipe_id)
            const { data: recipeHeaders, error: headerError } = await supabase
                .from('defined_recipes')
                .select('id, linked_product_id')
                .in('linked_product_id', filteredProductIds);

            if (headerError) throw headerError;
            if (!recipeHeaders || recipeHeaders.length === 0) return [];

            // Map recipe_id -> product_id
            const recipeIdMap = {};
            recipeHeaders.forEach(h => { recipeIdMap[h.id] = h.linked_product_id; });
            const recipeIds = recipeHeaders.map(h => h.id);

            // Step 2b: Get Ingredients
            const { data: ingredients, error: recipeError } = await supabase
                .from('recipes')
                .select('recipe_id, ingredient_id, quantity_required')
                .in('recipe_id', recipeIds);

            if (recipeError) throw recipeError;

            // Map back to expected format for aggregation
            const recipes = ingredients?.map(ing => ({
                ...ing,
                product_id: recipeIdMap[ing.recipe_id]
            })) || [];

            // 3. Aggregate Needs
            const totals = {}; // ingredient_id -> needed_qty

            relevantMenuItems.forEach(menuItem => {
                const portions = menuItem.stock ?? 0; // Default to 0 if null/undefined, do not fallback to 20 on 0
                const productRecipes = recipes.filter(r => r.product_id === menuItem.product_id);

                productRecipes.forEach(rec => {
                    const totalForProduct = parseFloat(rec.quantity_required) * portions;
                    totals[rec.ingredient_id] = (totals[rec.ingredient_id] || 0) + totalForProduct;
                });
            });

            // 4. Get Current Stock & Item Details
            const ingredientIds = Object.keys(totals);
            if (ingredientIds.length === 0) return [];

            // Fetch Item Details (Name, Unit, VAT) - REMOVED purchase_price
            const { data: items, error: itemsError } = await supabase
                .from('inventory_items')
                .select('id, name, unit, vat_rate')
                .in('id', ingredientIds);

            if (itemsError) throw itemsError;

            // Fetch Batches for Stock & Price
            const { data: stocks, error: stockError } = await supabase
                .from('inventory_batches')
                .select('item_id, quantity, purchase_price')
                .in('item_id', ingredientIds);

            if (stockError) throw stockError;

            // Calculate Total Stock & Avg Price per Item
            const stockMap = {};
            const priceMap = {};

            stocks.forEach(s => {
                stockMap[s.item_id] = (stockMap[s.item_id] || 0) + parseFloat(s.quantity);

                // Use purchase_price from batch
                if (s.purchase_price) {
                    priceMap[s.item_id] = s.purchase_price;
                }
            });

            // 5. Construct Result
            const needs = [];
            for (const [ingId, requiredQty] of Object.entries(totals)) {

                const itemDef = items.find(i => i.id == ingId);
                const current = stockMap[ingId] || 0;
                const price = priceMap[ingId] || 0;

                if (itemDef) {
                    needs.push({
                        id: ingId,
                        name: itemDef.name,
                        unit: itemDef.unit,
                        required: requiredQty,
                        stock: current,
                        to_buy: Math.max(0, requiredQty - current),
                        purchase_price: price, // Now using batch price
                        vat_rate: itemDef.vat_rate || 0,
                        estimated_cost: Math.max(0, requiredQty - current) * price
                    });
                }
            }

            return needs;

        } catch (err) {
            console.error("Consumption Calc Error:", err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { calculateNeeds, loading, error };
};
