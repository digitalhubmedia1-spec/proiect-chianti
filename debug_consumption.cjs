
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atzmcflvnzezfumbmgiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0em1jZmx2bnplemZ1bWJtZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzExMjcsImV4cCI6MjA4MzY0NzEyN30.LSiuLKxi_PEdD6eMxk691JpN6OjS4jmiNuJXkD4MYtk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = '2026-01-27';
    const endDate = '2026-01-27';
    const categoryFilter = 'Toate';

    console.log(`Running Simulation for ${startDate} to ${endDate}, Filter: ${categoryFilter}`);

    // 1. Fetch Daily Menu Items
    let menuQuery = supabase.from('daily_menu_items').select('product_id, stock, date').gte('date', startDate).lte('date', endDate);
    const { data: menuItems, error: menuError } = await menuQuery;

    if (menuError) { console.error("Menu Err", menuError); return; }
    console.log(`1. Menu Items: ${menuItems.length}`, menuItems);

    if (menuItems.length === 0) return;

    const uniqueProductIds = [...new Set(menuItems.map(m => m.product_id))];
    console.log(`2. Unique Products:`, uniqueProductIds);

    // Filter by Category
    let filteredProductIds = uniqueProductIds;
    // Skipping product detail fetch for brevity as Filter IS Toate
    console.log(`3. Filtered Products:`, filteredProductIds);

    const relevantMenuItems = menuItems.filter(m => filteredProductIds.includes(m.product_id));
    console.log(`4. Relevant Items: ${relevantMenuItems.length}`);

    if (relevantMenuItems.length === 0) return;

    // Defines Recipes
    const { data: recipeHeaders } = await supabase.from('defined_recipes').select('id, linked_product_id').in('linked_product_id', filteredProductIds);
    console.log(`5. Recipe Headers:`, recipeHeaders);

    if (!recipeHeaders || recipeHeaders.length === 0) return;

    // Recipe Ingredients
    const recipeIds = recipeHeaders.map(h => h.id);
    const { data: ingredients } = await supabase.from('recipes').select('recipe_id, ingredient_id, quantity_required').in('recipe_id', recipeIds);
    console.log(`6. Ingredients Lines: ${ingredients.length}`);

    // Aggregate
    const recipeIdMap = {};
    recipeHeaders.forEach(h => { recipeIdMap[h.id] = h.linked_product_id; });
    const recipes = ingredients.map(ing => ({ ...ing, product_id: recipeIdMap[ing.recipe_id] }));

    const totals = {};
    relevantMenuItems.forEach(menuItem => {
        const portions = menuItem.stock || 20;
        const productRecipes = recipes.filter(r => r.product_id === menuItem.product_id);
        productRecipes.forEach(rec => {
            const totalForProduct = parseFloat(rec.quantity_required) * portions;
            totals[rec.ingredient_id] = (totals[rec.ingredient_id] || 0) + totalForProduct;
        });
    });

    console.log(`7. Totals Keys:`, Object.keys(totals));

    // Get Stock
    const ingredientIds = Object.keys(totals);
    if (ingredientIds.length === 0) return;

    const { data: items } = await supabase.from('inventory_items').select('id, name, unit').in('id', ingredientIds);
    console.log(`8. Inventory Items found: ${items.length}`);

    const needs = [];
    for (const [ingId, requiredQty] of Object.entries(totals)) {
        const itemDef = items.find(i => i.id == ingId); // LOOSE EQUALITY CHECK
        if (itemDef) {
            console.log(`   - Need ${itemDef.name}: ${requiredQty} (Matched ID: ${itemDef.id})`);
            needs.push(itemDef);
        } else {
            console.log(`   - WARNING: Item ${ingId} not found in inventory_items.`);
        }
    }
    console.log(`9. Final Needs Count: ${needs.length}`);
}

checkData();
