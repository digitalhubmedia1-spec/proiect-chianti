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
            // Fetch all recipe lines
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                    id,
                    product_id,
                    ingredient_id,
                    quantity_required,
                    products (name),
                    inventory_items (name, unit),
                    preparation_method
                `);

            if (error) throw error;

            // Group by product_id to create "Recipe Objects"
            const groups = {};
            data.forEach(row => {
                if (!groups[row.product_id]) {
                    groups[row.product_id] = {
                        id: row.product_id, // Use product_id as the Recipe ID
                        name: row.products?.name || 'Unknown Product',
                        product_id: row.product_id,
                        preparation_method: row.preparation_method,
                        ingredients: []
                    };
                }
                groups[row.product_id].ingredients.push({
                    id: row.id, // Row ID
                    ingredient_id: row.ingredient_id,
                    itemName: row.inventory_items?.name || 'Unknown Item',
                    qty: row.quantity_required,
                    unit: row.inventory_items?.unit || ''
                });
            });

            setRecipes(Object.values(groups));
        } catch (err) {
            console.error("Error fetching recipes:", err);
        } finally {
            setLoading(false);
        }
    };

    const addRecipe = async (recipeData) => {
        // recipeData expects: { product_id, preparation_method, ingredients: [{ ingredient_id, qty }] }
        try {
            // 1. Prepare Inserts
            const inserts = recipeData.ingredients.map(ing => ({
                product_id: recipeData.product_id,
                ingredient_id: ing.ingredient_id,
                quantity_required: ing.qty,
                preparation_method: recipeData.preparation_method // We store this on every row redundancy or need a separate table? 
                // Wait, if I add preparation_method column to recipes table, it repeats for every ingredient. 
                // Ideally it should be on 'products' or a 'recipe_meta' table.
                // For now, let's assume we update it on all rows or it's just one row needed.
                // Actually, the previous 'add_recipe_instructions.sql' added it to 'recipes'.
                // So we will just include it in every row for simplicity now, or just the first.
            }));

            // To ensure consistency, let's just save it on all loops.
            const payload = inserts.map(i => ({ ...i, preparation_method: recipeData.preparation_method }));

            const { error } = await supabase.from('recipes').insert(payload);
            if (error) throw error;

            logAction('REȚETAR', `Creat rețetă pentru produsul #${recipeData.product_id}`);
            fetchRecipes();
        } catch (err) {
            console.error("Error adding recipe:", err);
            alert("Eroare la salvarea rețetei: " + err.message);
        }
    };

    const updateRecipe = async (productId, updatedData) => {
        try {
            // 1. Delete old ingredients for this product
            const { error: delError } = await supabase.from('recipes').delete().eq('product_id', productId);
            if (delError) throw delError;

            // 2. Insert new
            await addRecipe({ ...updatedData, product_id: productId });
            logAction('REȚETAR', `Actualizat rețetă pentru produsul #${productId}`);
        } catch (err) {
            console.error("Error updating recipe:", err);
            alert("Eroare update: " + err.message);
        }
    };

    const deleteRecipe = async (productId) => {
        try {
            const { error } = await supabase.from('recipes').delete().eq('product_id', productId);
            if (error) throw error;

            setRecipes(recipes.filter(r => r.product_id !== productId));
            logAction('REȚETAR', `Șters rețetă produs #${productId}`);
        } catch (err) {
            console.error("Error deleting recipe:", err);
            alert("Eroare ștergere: " + err.message);
        }
    };

    return (
        <RecipeContext.Provider value={{
            recipes,
            loading,
            addRecipe,
            updateRecipe,
            deleteRecipe,
            refreshRecipes: fetchRecipes
        }}>
            {children}
        </RecipeContext.Provider>
    );
};
