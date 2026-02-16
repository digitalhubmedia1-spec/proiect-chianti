import React, { createContext, useContext, useState, useEffect } from 'react';
import { logAction } from '../utils/adminLogger';
import { supabase } from '../supabaseClient';

const RecipeContext = createContext();

export const useRecipes = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            // Attempt 1: Fetch WITH category (Ideal state)
            let { data, error } = await supabase
                .from('defined_recipes')
                .select(`
                    id,
                    name,
                    category,
                    preparation_method,
                    linked_product_id,
                    products (name),
                    recipes (
                        id,
                        ingredient_id,
                        quantity_required,
                        inventory_items (name, unit)
                    )
                `)
                .order('name');

            if (error) {
                // If error implies column missing, try fallback
                console.warn("Fetch with category failed, attempting fallback...", error.message);

                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('defined_recipes')
                    .select(`
                        id,
                        name,
                        preparation_method,
                        linked_product_id,
                        products (name),
                        recipes (
                            id,
                            ingredient_id,
                            quantity_required,
                            inventory_items (name, unit)
                        )
                    `)
                    .order('name');

                if (fallbackError) throw fallbackError;
                data = fallbackData;
            }

            console.log("Fetched Recipes Data:", data);

            // Accessing nested data might require mapping depending on how PostgREST returns it.
            // data structure: [{ id, name, recipes: [{ ...inventory_items... }] }]

            const formatted = data.map(row => ({
                id: row.id, // This is the Recipe Header ID
                name: row.name,
                category: row.category || '', // Mapped category (might be undefined in fallback)
                preparation_method: row.preparation_method,
                linked_product_id: row.linked_product_id,
                linked_product_name: row.products?.name,
                ingredients: row.recipes?.map(r => ({
                    id: r.id,
                    ingredient_id: r.ingredient_id,
                    itemName: r.inventory_items?.name || 'Unknown Item',
                    qty: r.quantity_required,
                    unit: r.inventory_items?.unit || ''
                })) || []
            }));

            setRecipes(formatted);
        } catch (err) {
            console.error("Error fetching recipes:", err);
        } finally {
            setLoading(false);
        }
    };

    const addRecipe = async (recipeData) => {
        // recipeData: { name, preparation_method, linked_product_id (opt), ingredients: [] }
        try {
            // 1. Create Header
            const headerPayload = {
                name: recipeData.name,
                category: recipeData.category || null,
                preparation_method: recipeData.preparation_method,
                linked_product_id: recipeData.linked_product_id || null
            };

            let headerResult = await supabase
                .from('defined_recipes')
                .insert([headerPayload])
                .select()
                .single();

            if (headerResult.error) {
                console.warn("Insert with category failed, retrying without...", headerResult.error.message);
                const fallbackPayload = { ...headerPayload };
                delete fallbackPayload.category;
                headerResult = await supabase
                    .from('defined_recipes')
                    .insert([fallbackPayload])
                    .select()
                    .single();

                if (headerResult.error) throw headerResult.error;
            }
            const header = headerResult.data;

            // 2. Insert Ingredients
            if (recipeData.ingredients && recipeData.ingredients.length > 0) {
                const ingredientsPayload = recipeData.ingredients.map(ing => ({
                    recipe_id: header.id,
                    ingredient_id: ing.ingredient_id,
                    quantity_required: ing.qty
                }));

                const { error: ingErr } = await supabase
                    .from('recipes') // This is the ingredient link table
                    .insert(ingredientsPayload);

                if (ingErr) throw ingErr;
            }

            logAction('REȚETAR', `Creat rețetă "${recipeData.name}"`);
            fetchRecipes();
            return { success: true };
        } catch (err) {
            console.error("Error adding recipe:", err);
            if (err.code === '23505') {
                alert("Există deja o rețetă cu acest nume! Vă rugăm să alegeți alt nume.");
            } else {
                alert("Eroare la salvarea rețetei: " + err.message);
            }
            return { success: false, error: err };
        }
    };

    const updateRecipe = async (recipeId, updatedData) => {
        // recipeId is defined_recipes.id
        try {
            // 1. Update Header
            // 1. Update Header
            let headerErr = await supabase
                .from('defined_recipes')
                .update({
                    name: updatedData.name,
                    category: updatedData.category || null,
                    preparation_method: updatedData.preparation_method,
                    linked_product_id: updatedData.linked_product_id || null
                })
                .eq('id', recipeId);

            if (headerErr.error) {
                console.warn("Update with category failed, retrying without...", headerErr.error.message);
                headerErr = await supabase
                    .from('defined_recipes')
                    .update({
                        name: updatedData.name,
                        preparation_method: updatedData.preparation_method,
                        linked_product_id: updatedData.linked_product_id || null
                    })
                    .eq('id', recipeId);

                if (headerErr.error) throw headerErr.error;
            }

            // 2. Update Ingredients (Delete Old -> Insert New)
            // Delete existing ingredients for this recipe
            const { error: delErr } = await supabase
                .from('recipes')
                .delete()
                .eq('recipe_id', recipeId);

            if (delErr) throw delErr;

            // Insert new
            if (updatedData.ingredients && updatedData.ingredients.length > 0) {
                const ingredientsPayload = updatedData.ingredients.map(ing => ({
                    recipe_id: recipeId,
                    ingredient_id: ing.ingredient_id,
                    quantity_required: ing.qty
                }));

                const { error: ingErr } = await supabase
                    .from('recipes')
                    .insert(ingredientsPayload);

                if (ingErr) throw ingErr;
            }

            logAction('REȚETAR', `Actualizat rețetă "${updatedData.name}"`);
            fetchRecipes();
            return { success: true };
        } catch (err) {
            console.error("Error updating recipe:", err);
            if (err.code === '23505') {
                alert("Există deja o rețetă cu acest nume! Vă rugăm să alegeți alt nume.");
            } else {
                alert("Eroare update: " + err.message);
            }
            return { success: false };
        }
    };

    const deleteRecipe = async (recipeId) => {
        try {
            // Delete header, cascade should handle ingredients
            const { error } = await supabase
                .from('defined_recipes')
                .delete()
                .eq('id', recipeId);

            if (error) throw error;

            setRecipes(recipes.filter(r => r.id !== recipeId));
            logAction('REȚETAR', `Șters rețetă #${recipeId}`);
        } catch (err) {
            console.error("Error deleting recipe:", err);
            alert("Eroare ștergere: " + err.message);
        }
    };

    const approveRecipeAsProduct = async (recipe) => {
        try {
            if (recipe.linked_product_id) {
                // Verify if the product actually exists
                const { data: existing, error: checkErr } = await supabase
                    .from('products')
                    .select('id')
                    .eq('id', recipe.linked_product_id)
                    .maybeSingle();

                if (existing) {
                    // Update and Reactivate existing product
                    const { error: updateErr } = await supabase
                        .from('products')
                        .update({
                            name: recipe.name,
                            category: recipe.category || 'Meniu',
                            description: recipe.preparation_method || '',
                            is_active: true
                        })
                        .eq('id', existing.id);

                    if (updateErr) throw updateErr;

                    alert("Produsul existent a fost actualizat și reactivat!");
                    fetchRecipes(); // Refresh locally
                    return { success: true };
                }
                // If not found, it's a broken link, so we allow proceeding to re-create
            }

            // 1. Create Product
            const { data: product, error: prodErr } = await supabase
                .from('products')
                .insert([{
                    name: recipe.name,
                    category: recipe.category || 'Meniu', // Fallback
                    price: 0,
                    description: recipe.preparation_method || '',
                    is_active: true // Active by default so it shows up
                }])
                .select()
                .single();

            if (prodErr) throw prodErr;

            // 2. Link Recipe to Product
            const { error: linkErr } = await supabase
                .from('defined_recipes')
                .update({ linked_product_id: product.id })
                .eq('id', recipe.id);

            if (linkErr) throw linkErr;

            logAction('REȚETAR', `Aprobat rețetă "${recipe.name}" ca produs #${product.id}`);

            // Refresh
            fetchRecipes();
            return { success: true };
        } catch (err) {
            console.error("Error approving product:", err);
            alert("Eroare aprobare: " + err.message);
            return { success: false, error: err };
        }
    };

    return (
        <RecipeContext.Provider value={{
            recipes,
            loading,
            addRecipe,
            updateRecipe,
            deleteRecipe,
            approveRecipeAsProduct, // Exposed
            refreshRecipes: fetchRecipes
        }}>
            {children}
        </RecipeContext.Provider>
    );
};
